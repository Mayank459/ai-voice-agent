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
            "report": 1,
            "_id": 0
        }
    ).sort("started_at", -1)

    history = []
    async for doc in cursor:
        history.append(doc)

    return {"history": history}


@router.get("/session/{session_id}")
async def get_session_detail(session_id: str):
    """Return full session: transcript + report."""
    db = get_db()
    session = await db["sessions"].find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Permanently delete a session by session_id."""
    db = get_db()
    result = await db["sessions"].delete_one({"session_id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}


@router.get("/analytics/{email}")
async def get_user_analytics(email: str):
    """
    Returns aggregated analytics for a specific user.
    """
    db = get_db()
    email_clean = email.lower().strip()
    
    # Fetch all reports with scores
    cursor = db["sessions"].find(
        {"user_email": email_clean, "report": {"$exists": True}},
        {"report.score": 1, "report.recommendation": 1, "started_at": 1}
    ).sort("started_at", 1)

    reports = []
    async for doc in cursor:
        reports.append(doc)

    if not reports:
        return {
            "total_interviews": 0,
            "average_score": 0,
            "trend": [],
            "recommendation_rate": 0
        }

    scores = []
    recommended_count = 0
    trend = []

    for r in reports:
        report_data = r.get("report", {})
        score_str = report_data.get("score", "0/10").split("/")[0]
        try:
            score = float(score_str)
        except:
            score = 0
        
        scores.append(score)
        if "YES" in report_data.get("recommendation", "").upper():
            recommended_count += 1
            
        trend.append({
            "date": r.get("started_at"),
            "score": score
        })

    avg_score = sum(scores) / len(scores) if scores else 0
    rec_rate = (recommended_count / len(reports)) * 100

    return {
        "total_interviews": len(reports),
        "average_score": round(avg_score, 1),
        "recommendation_rate": round(rec_rate, 1),
        "trend": trend,
        "latest_score": scores[-1] if scores else 0
    }


