from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.core.db import get_db
import datetime

router = APIRouter()

class UserAuth(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_data: UserAuth):
    db = get_db()
    email = user_data.email.lower().strip()
    
    # Check if user exists
    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_obj = {
        "email": email,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    await db["users"].insert_one(user_obj)
    
    # Generate token
    token = create_access_token(data={"sub": email})
    return {"access_token": token, "token_type": "bearer", "email": email}

@router.post("/login")
async def login(user_data: UserAuth):
    db = get_db()
    email = user_data.email.lower().strip()
    
    user = await db["users"].find_one({"email": email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": email})
    return {"access_token": token, "token_type": "bearer", "email": email}
