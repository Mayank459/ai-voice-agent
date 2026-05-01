import os
from dotenv import load_dotenv

load_dotenv()

# Groq API key - loaded from .env file
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Using llama3 because it's fast and free on groq's free tier
GROQ_MODEL = "llama-3.1-8b-instant"

# Whisper model size - "base" is a good balance of speed vs accuracy
# using "small" for better Hindi/multilingual support
WHISPER_MODEL_SIZE = "medium"

# which device to run whisper on - "cuda" for nvidia gpu, "cpu" otherwise
WHISPER_DEVICE = "cpu"
WHISPER_COMPUTE_TYPE = "int8"  # int8 is best for CPU performance

# edge-tts voices
# English voice for Alex
TTS_VOICE_EN = "en-US-GuyNeural"
# Hindi voice for Alex (switches when user speaks Hindi)
TTS_VOICE_HI = "hi-IN-MadhurNeural"

# Kept for backward compat
TTS_VOICE = TTS_VOICE_EN

# MongoDB - for storing interview sessions and generating reports
# Set MONGO_URI in your .env file. Defaults to local MongoDB instance.
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ai_interviewer")
