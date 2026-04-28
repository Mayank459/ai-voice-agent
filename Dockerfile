FROM python:3.11-slim

WORKDIR /app

# install system dependencies needed for faster-whisper and audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# copy requirements first (for docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the code
COPY . .

# expose port
EXPOSE 8000

# start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
