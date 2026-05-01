import json
import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services import stt_service, tts_service
from app.services.llm_service import get_ai_response, start_interview
from app.services.report_service import save_turn, generate_report
from app.core.db import get_db


router = APIRouter()


@router.websocket("/interview")
async def interview_websocket(websocket: WebSocket, email: str = None):

    """
    Main WebSocket endpoint for the mock interview.

    Supports:
    - Continuous VAD conversation (no button holding)
    - Interrupt handling: user can speak while Alex is talking
    - Multilingual: auto-switches Hindi <-> English per turn
    
    Message types from client:
      bytes  -> audio recording to transcribe
      text   -> JSON {"type": "interrupt"} to cut Alex mid-speech

    Message types to client:
      {"type": "transcript", "speaker": "...", "text": "..."}
      {"type": "language", "lang": "en"|"hi"}
      {"type": "speaking_start"}   -> Alex started speaking, client should mute mic
      {"type": "speaking_done"}    -> Alex finished, client should resume listening
      {"type": "interrupted"}      -> Alex was interrupted, client should resume listening
      bytes  -> mp3 audio chunk for Alex's voice
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())
    print(f"[WS] New interview session started! ID: {session_id}")

    # Send session_id to client immediately so they can fetch report later
    await websocket.send_text(json.dumps({
        "type": "session_id",
        "session_id": session_id
    }))


    # shared flag: set to True when the frontend sends an interrupt
    interrupted = asyncio.Event()
    # current language context (updated per user turn)
    current_language = "en"

    async def send_ai_speech(text: str, language: str):
        """
        Converts text to speech and streams it to the client.
        Checks interrupted flag between operations so the user can cut in.
        Returns True if completed fully, False if interrupted.
        """
        interrupted.clear()

        # notify frontend: Alex is about to speak (mute VAD mic)
        await websocket.send_text(json.dumps({"type": "speaking_start"}))

        # send transcript so the text appears immediately
        await websocket.send_text(json.dumps({
            "type": "transcript",
            "speaker": "recruiter",
            "text": text
        }))

        # check interrupt before TTS generation
        if interrupted.is_set():
            await websocket.send_text(json.dumps({"type": "interrupted"}))
            return False

        audio_bytes = await tts_service.text_to_speech(text, language)

        if interrupted.is_set():
            await websocket.send_text(json.dumps({"type": "interrupted"}))
            return False

        if audio_bytes:
            await websocket.send_bytes(audio_bytes)

        # small yield so the interrupt can be checked
        await asyncio.sleep(0)

        if interrupted.is_set():
            await websocket.send_text(json.dumps({"type": "interrupted"}))
            return False

        # notify frontend: Alex finished speaking (resume VAD mic)
        await websocket.send_text(json.dumps({"type": "speaking_done"}))

        # Persist recruiter's turn to DB
        await save_turn(session_id, "recruiter", text, language, user_email=email)
        
        return True



    # --- Fetch User Context (Resume/JD) ---
    db = get_db()
    context_doc = await db["user_contexts"].find_one({"email": email.lower().strip()}) if email else None
    user_context = None
    if context_doc:
        user_context = {
            "resume": context_doc.get("resume_text"),
            "job_description": context_doc.get("job_description"),
            "company_info": context_doc.get("company_info")
        }

    # --- Opening greeting ---
    conversation_history, opening_message = start_interview(context=user_context)
    await send_ai_speech(opening_message, "en")


    try:
        while True:
            data = await websocket.receive()

            # ---- Text messages from frontend ----
            if "text" in data:
                try:
                    msg = json.loads(data["text"])

                    if msg.get("type") == "interrupt":
                        print("[WS] Interrupt received from user!")
                        interrupted.set()

                    elif msg.get("type") == "end_interview":
                        print("[WS] End interview signal received — generating report...")
                        await websocket.send_text(json.dumps({"type": "generating_report"}))
                        report = await generate_report(session_id)
                        await websocket.send_text(json.dumps({
                            "type": "report",
                            "report": report
                        }))
                        print("[WS] Report sent to client.")
                        break  # Close the WebSocket loop cleanly

                except Exception as e:
                    print(f"[WS] Error handling text message: {e}")
                continue

            # ---- Audio bytes from user ----
            if "bytes" in data:
                audio_bytes = data["bytes"]
                print(f"[WS] Received {len(audio_bytes)} bytes of audio from user")

                if len(audio_bytes) < 1000:
                    print(f"[WS] Audio too small ({len(audio_bytes)} bytes) — likely silence or bad recording, skipping.")
                    continue

                # Transcribe user voice + detect language
                user_text, detected_lang = stt_service.transcribe_audio(audio_bytes)
                current_language = detected_lang  # remember for this turn

                if not user_text:
                    # couldn't understand - respond in current language
                    sorry = "समझ नहीं आया, क्या आप दोबारा बोल सकते हैं?" if current_language == "hi" else "Sorry, I didn't catch that. Could you repeat?"
                    await send_ai_speech(sorry, current_language)
                    continue

                # Tell the frontend which language was detected (for UI indicator)
                await websocket.send_text(json.dumps({
                    "type": "language",
                    "lang": current_language
                }))

                # Show user's transcript
                await websocket.send_text(json.dumps({
                    "type": "transcript",
                    "speaker": "candidate",
                    "text": user_text
                }))

                # Persist candidate's turn to DB
                await save_turn(session_id, "candidate", user_text, current_language, user_email=email)

                # Get AI response (language-aware + context-aware)
                ai_response = get_ai_response(conversation_history, user_text, current_language, context=user_context)

                # Speak the AI response (interruptible)
                await send_ai_speech(ai_response, current_language)




    except (WebSocketDisconnect, RuntimeError):
        print("[WS] Interview session ended - client disconnected")
