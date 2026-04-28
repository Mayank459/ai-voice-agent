from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.websocket_endpoint import router as ws_router

app = FastAPI(
    title="AI Mock Interviewer",
    description="A voice-based AI recruiter that conducts mock technical phone screens",
    version="1.0.0"
)

# include the websocket routes
app.include_router(ws_router, prefix="/ws")

# serve the static frontend files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Serve the main interview page"""
    return FileResponse("static/index.html")


@app.get("/health")
async def health_check():
    """Simple health check endpoint - useful for deployment platforms"""
    return {"status": "ok", "message": "AI Interviewer is running!"}
