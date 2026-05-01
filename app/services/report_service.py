"""
report_service.py
-----------------
Handles two concerns:
1. Persisting every conversation turn to MongoDB (called from the WebSocket handler).
2. Generating an AI evaluation report from the stored session transcript.
"""
import datetime
from groq import Groq
from app.core.config import GROQ_API_KEY, GROQ_MODEL
from app.core.db import get_db

client = Groq(api_key=GROQ_API_KEY)

# Collection names
SESSIONS_COLLECTION = "sessions"

REPORT_PROMPT = """You are an expert technical recruiter evaluator. You have just reviewed a mock technical phone screen interview transcript.

Based on the conversation below, generate a detailed, structured candidate evaluation report.

Your report MUST contain the following sections using this EXACT format (so it can be parsed easily):

CANDIDATE_SCORE: [X/10]

SUMMARY:
[2-3 sentence overall summary of the candidate's performance]

STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3 if applicable]

AREAS_FOR_IMPROVEMENT:
- [area 1]
- [area 2]
- [area 3 if applicable]

COMMUNICATION_SKILLS: [Excellent / Good / Average / Poor]
TECHNICAL_DEPTH: [Excellent / Good / Average / Poor]
CONFIDENCE: [High / Medium / Low]

RECOMMENDATION: [Strong Hire / Hire / Maybe / No Hire]

DETAILED_FEEDBACK:
[3-5 sentences of specific, actionable feedback for the candidate]

Interview Transcript:
{transcript}
"""


async def save_turn(session_id: str, speaker: str, text: str, language: str = "en", user_email: str = None) -> None:
    """
    Saves a single conversation turn to MongoDB.
    speaker: "recruiter" | "candidate"
    """
    try:
        db = get_db()
        update_data = {
            "$push": {
                "turns": {
                    "speaker": speaker,
                    "text": text,
                    "language": language,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            },
            "$setOnInsert": {
                "session_id": session_id,
                "started_at": datetime.datetime.utcnow().isoformat()
            }
        }
        
        if user_email:
            update_data["$set"] = {"user_email": user_email.lower().strip()}

        await db[SESSIONS_COLLECTION].update_one(
            {"session_id": session_id},
            update_data,
            upsert=True
        )

    except Exception as e:
        print(f"[DB] Error saving turn to MongoDB: {e}")
        # We don't raise here so the voice conversation can continue even if DB is down



async def finalize_session(session_id: str) -> None:
    """Mark a session as completed."""
    db = get_db()
    await db[SESSIONS_COLLECTION].update_one(
        {"session_id": session_id},
        {"$set": {"ended_at": datetime.datetime.utcnow().isoformat(), "status": "completed"}}
    )


async def generate_report(session_id: str) -> dict:
    """
    Retrieves the session transcript from MongoDB and uses Groq to
    generate a structured evaluation report. Returns a dict with the
    parsed report fields plus the raw text.
    """
    try:
        db = get_db()
        session = await db[SESSIONS_COLLECTION].find_one({"session_id": session_id})

        if not session or not session.get("turns"):
            return {
                "session_id": session_id,
                "error": "No transcript found for this session.",
                "raw": ""
            }

        # Build a readable transcript string
        transcript_lines = []
        for turn in session["turns"]:
            label = "Recruiter (Alex)" if turn["speaker"] == "recruiter" else "Candidate"
            transcript_lines.append(f"{label}: {turn['text']}")
        transcript = "\n".join(transcript_lines)

        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": REPORT_PROMPT.format(transcript=transcript)
                    }
                ],
                max_tokens=1000,
                temperature=0.3,
            )
            raw_report = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Report] Error generating report: {e}")
            raw_report = "Error generating report. Please try again."

        # Parse the structured report into a dict for easy frontend rendering
        report = _parse_report(raw_report)
        report["session_id"] = session_id
        report["transcript"] = transcript_lines  # send structured turns to frontend

        # Persist the report back to the session document
        try:
            await db[SESSIONS_COLLECTION].update_one(
                {"session_id": session_id},
                {"$set": {"report": report}}
            )
        except Exception as e:
            print(f"[DB] Error caching report to MongoDB: {e}")

        return report
    except Exception as e:
        print(f"[DB] Error fetching session for report: {e}")
        return {
            "session_id": session_id,
            "error": "Could not connect to the database to generate the report.",
            "raw": ""
        }



def _parse_report(raw: str) -> dict:
    """Parse the structured LLM report output into a Python dict."""
    result = {"raw": raw}
    lines = raw.splitlines()

    def extract_value(prefix: str) -> str:
        for line in lines:
            if line.strip().startswith(prefix):
                return line.strip()[len(prefix):].strip()
        return ""

    def extract_block(start_marker: str, end_markers: list[str]) -> list[str]:
        """Extract bullet list items between start_marker and next section."""
        items = []
        capturing = False
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(start_marker):
                capturing = True
                continue
            if capturing:
                if any(stripped.startswith(m) for m in end_markers):
                    break
                if stripped.startswith("-"):
                    items.append(stripped[1:].strip())
        return items

    section_headers = [
        "CANDIDATE_SCORE:", "SUMMARY:", "STRENGTHS:", "AREAS_FOR_IMPROVEMENT:",
        "COMMUNICATION_SKILLS:", "TECHNICAL_DEPTH:", "CONFIDENCE:",
        "RECOMMENDATION:", "DETAILED_FEEDBACK:"
    ]

    result["score"] = extract_value("CANDIDATE_SCORE:")
    result["communication_skills"] = extract_value("COMMUNICATION_SKILLS:")
    result["technical_depth"] = extract_value("TECHNICAL_DEPTH:")
    result["confidence"] = extract_value("CONFIDENCE:")
    result["recommendation"] = extract_value("RECOMMENDATION:")

    # Multi-line blocks
    def extract_multiline(start: str) -> str:
        lines_out = []
        capturing = False
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(start):
                capturing = True
                continue
            if capturing:
                if any(stripped.startswith(h) for h in section_headers if h != start):
                    break
                if stripped:
                    lines_out.append(stripped)
        return " ".join(lines_out)

    result["summary"] = extract_multiline("SUMMARY:")
    result["detailed_feedback"] = extract_multiline("DETAILED_FEEDBACK:")
    result["strengths"] = extract_block(
        "STRENGTHS:", ["AREAS_FOR_IMPROVEMENT:", "COMMUNICATION_SKILLS:", "TECHNICAL_DEPTH:", "CONFIDENCE:", "RECOMMENDATION:", "DETAILED_FEEDBACK:"]
    )
    result["areas_for_improvement"] = extract_block(
        "AREAS_FOR_IMPROVEMENT:", ["COMMUNICATION_SKILLS:", "TECHNICAL_DEPTH:", "CONFIDENCE:", "RECOMMENDATION:", "DETAILED_FEEDBACK:"]
    )

    return result
