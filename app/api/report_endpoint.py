"""
report_endpoint.py
------------------
REST endpoints for fetching AI-generated interview evaluation reports.

GET /api/report/{session_id}  — generate (or retrieve cached) report for a session
GET /api/sessions             — list all past sessions (lightweight, no full transcript)
"""
from fastapi import APIRouter, HTTPException
from app.services.report_service import generate_report, finalize_session
from app.core.db import get_db

router = APIRouter()


@router.get("/report/{session_id}")
async def get_report(session_id: str):
    """
    Generate and return the interview evaluation report for the given session.
    The report is also cached in MongoDB on the session document.
    """
    # Check if report is already cached
    db = get_db()
    session = await db["sessions"].find_one({"session_id": session_id})

    if session and session.get("report") and session["report"].get("score"):
        # Return cached report
        return session["report"]

    # Finalize session and generate report
    await finalize_session(session_id)
    report = await generate_report(session_id)

    if "error" in report and not report.get("score"):
        raise HTTPException(status_code=404, detail=report["error"])

    return report


@router.get("/sessions")
async def list_sessions():
    """
    Return a list of all past interview sessions (summary only).
    Useful for building a history dashboard.
    """
    db = get_db()
    cursor = db["sessions"].find(
        {},
        {
            "session_id": 1,
            "started_at": 1,
            "ended_at": 1,
            "status": 1,
            "report.score": 1,
            "report.recommendation": 1,
            "report.summary": 1,
            "_id": 0
        }
    ).sort("started_at", -1).limit(50)

    sessions = []
    async for doc in cursor:
        sessions.append(doc)

    return {"sessions": sessions}


@router.get("/history/{email}")
async def get_user_history(email: str):
    """
    Return all past interview sessions associated with a specific email.
    """
    db = get_db()
    cursor = db["sessions"].find(
        {"user_email": email.lower().strip(), "report": {"$exists": True}},
        {
            "session_id": 1,
            "started_at": 1,
            "report.score": 1,
            "report.recommendation": 1,
            "report.summary": 1,
            "_id": 0
        }
    ).sort("started_at", -1)

    history = []
    async for doc in cursor:
        history.append(doc)

    return {"history": history}

