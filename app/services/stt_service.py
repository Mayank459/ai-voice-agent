import tempfile
import os
from faster_whisper import WhisperModel
from app.core.config import WHISPER_MODEL_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE

# Load the model once at startup
print(f"[STT] Loading Whisper model ({WHISPER_MODEL_SIZE}) on {WHISPER_DEVICE}...")
model = WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
print("[STT] Whisper model loaded!")

# Only accept these languages — anything else is a hallucination and gets re-run as English
ALLOWED_LANGUAGES = {"en", "hi"}

# Minimum meaningful transcript length — single chars/punctuation are almost certainly noise
MIN_TRANSCRIPT_LENGTH = 2


def transcribe_audio(audio_bytes: bytes) -> tuple[str, str]:
    """
    Takes raw audio bytes (webm from browser), transcribes with faster-whisper.

    - Auto-detects language, but ONLY accepts English or Hindi.
    - If Whisper hallucinates a random language, it re-transcribes forcing English.
    - Filters out pure noise/silence responses.
    - Returns (transcribed_text, detected_language_code).
    """
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        transcript, lang = _transcribe(tmp_path, language=None)

        # If Whisper picked a language we didn't ask for, it hallucinated — force English
        if lang not in ALLOWED_LANGUAGES:
            print(f"[STT] Hallucinated language '{lang}', re-running as English...")
            transcript, lang = _transcribe(tmp_path, language="en")

        # Strip common Whisper noise hallucinations (it outputs these for silence)
        noise_phrases = {
            "", ".", "..", "...", "thank you", "thanks", "bye", "you",
            "[blank_audio]", "[silence]", "[music]", "[noise]", "[BLANK_AUDIO]"
        }
        if transcript.lower().strip(".! ") in noise_phrases:
            print(f"[STT] Filtered noise transcript: '{transcript}'")
            return "", lang

        # Reject suspiciously short transcripts
        if len(transcript.strip()) < MIN_TRANSCRIPT_LENGTH:
            print(f"[STT] Transcript too short (noise?): '{transcript}'")
            return "", lang

        return transcript, lang

    except Exception as e:
        print(f"[STT] Error during transcription: {e}")
        return "", "en"
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _transcribe(audio_path: str, language: str | None) -> tuple[str, str]:
    """
    Internal helper — runs Whisper on the given file.
    `language=None` = auto-detect, `language="en"` = force English, etc.
    """
    segments, info = model.transcribe(
        audio_path,
        language=language,
        beam_size=5,
        vad_filter=True,                   # strips silence/noise before transcribing
        vad_parameters=dict(
            threshold=0.5,                 # VAD sensitivity (0–1, higher = less sensitive)
            min_speech_duration_ms=200,    # ignore speech bursts shorter than 200ms
            min_silence_duration_ms=300,   # ignore pauses shorter than 300ms
            speech_pad_ms=100,             # padding around speech segments
        ),
        no_speech_threshold=0.7,           # if >70% chance of no speech, output nothing
        log_prob_threshold=-1.0,           # filter low-confidence segments
        compression_ratio_threshold=2.4,   # filter repetitive/hallucinated outputs
        condition_on_previous_text=False,  # prevents hallucination carry-over
    )

    text = " ".join(seg.text for seg in segments).strip()
    detected_lang = info.language if language is None else language

    print(f"[STT] Transcribed (lang={detected_lang}, prob={info.language_probability:.2f}): '{text}'")
    return text, detected_lang
