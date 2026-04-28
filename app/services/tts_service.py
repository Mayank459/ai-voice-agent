import asyncio
import tempfile
import os
import edge_tts
from app.core.config import TTS_VOICE_EN, TTS_VOICE_HI


async def text_to_speech(text: str, language: str = "en") -> bytes:
    """
    Converts text to speech using edge-tts (Microsoft's free neural voices).
    Automatically selects Hindi or English voice based on the `language` param.
    Returns the audio as mp3 bytes.
    """
    voice = TTS_VOICE_HI if language == "hi" else TTS_VOICE_EN

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
        tmp_path = tmp_file.name

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(tmp_path)

        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()

        print(f"[TTS] Generated {len(audio_bytes)} bytes of audio (voice={voice})")
        return audio_bytes

    except Exception as e:
        print(f"[TTS] Error generating speech: {e}")
        return b""
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
