# ── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


# ── Stage 2: Python backend + built frontend ──────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# System dependencies (ffmpeg for audio processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Copy built React app → FastAPI will serve it as static files
# Since vite.config.js uses outDir: '../static', the builder outputs to /static
COPY --from=frontend-builder /static ./static

EXPOSE 8000

# Production server (no --reload in prod)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
