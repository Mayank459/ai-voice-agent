import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.websocket_endpoint import router as ws_router
from app.api.report_endpoint import router as report_router
from app.api.context_endpoint import router as context_router
from app.api.auth_endpoint import router as auth_router

app = FastAPI(
    title="AI Mock Interviewer",
    description="A voice-based AI recruiter that conducts mock technical phone screens",
    version="1.0.0"
)

# API routes (must be registered BEFORE the static file catch-all)
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(ws_router, prefix="/ws")
app.include_router(report_router, prefix="/api")
app.include_router(context_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "AI Interviewer is running!"}


# Serve React build — only mount if the static directory exists
STATIC_DIR = "static"
if os.path.isdir(STATIC_DIR):
    # Serve JS/CSS/image assets
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    # Catch-all: serve index.html for every unmatched path so React Router works
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        index = os.path.join(STATIC_DIR, "index.html")
        return FileResponse(index)
