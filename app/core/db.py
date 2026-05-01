"""
MongoDB async client using Motor.
Call `get_db()` anywhere in the app to get the database handle.
The client is created once at module load and reused (connection pooling).
"""
import motor.motor_asyncio
import certifi
from app.core.config import MONGO_URI, MONGO_DB_NAME

_client: motor.motor_asyncio.AsyncIOMotorClient | None = None


def get_client() -> motor.motor_asyncio.AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URI,
            tlsCAFile=certifi.where()
        )
    return _client



def get_db() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    return get_client()[MONGO_DB_NAME]
