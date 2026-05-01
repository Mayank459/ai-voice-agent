from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.context_service import parse_resume
from app.core.db import get_db
import uuid

router = APIRouter()

@router.post("/upload-context")
async def upload_context(
    email: str = Form(...),
    resume: UploadFile = File(None),
    job_description: str = Form(None),
    company_info: str = Form(None)
):
    """
    Uploads user context (resume, JD) before the interview starts.
    Stores it in a temporary 'contexts' collection or updates the session.
    """
    resume_text = ""
    if resume:
        content = await resume.read()
        resume_text = parse_resume(content, resume.filename)

    context_id = str(uuid.uuid4())
    
    db = get_db()
    await db["user_contexts"].update_one(
        {"email": email.lower().strip()},
        {
            "$set": {
                "email": email.lower().strip(),
                "resume_text": resume_text,
                "job_description": job_description,
                "company_info": company_info,
                "updated_at": context_id # token to ensure we use the latest
            }
        },
        upsert=True
    )

    return {
        "status": "success",
        "message": "Context uploaded and parsed successfully",
        "context_id": context_id
    }
