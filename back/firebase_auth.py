import os
from typing import Any, Dict
from pathlib import Path

import httpx
from fastapi import HTTPException, status
from dotenv import load_dotenv

# Load .env from the same directory as this file if present, otherwise fall back
# to the default loader (which checks the working directory and environment).
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")

IDENTITY_BASE_URL = "https://identitytoolkit.googleapis.com/v1"


async def _request(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if not FIREBASE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_API_KEY is not configured",
        )

    url = f"{IDENTITY_BASE_URL}/{path}?key={FIREBASE_API_KEY}"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=resp.json().get("error", {}).get("message", "Firebase auth error"),
            )
        return resp.json()


async def register_user(email: str, password: str) -> Dict[str, Any]:
    data = await _request(
        "accounts:signUp",
        {
            "email": email,
            "password": password,
            "returnSecureToken": True,
        },
    )
    await send_verification_email(data["idToken"])
    return data


async def login_user(email: str, password: str) -> Dict[str, Any]:
    return await _request(
        "accounts:signInWithPassword",
        {
            "email": email,
            "password": password,
            "returnSecureToken": True,
        },
    )


async def send_verification_email(id_token: str) -> Dict[str, Any]:
    return await _request(
        "accounts:sendOobCode",
        {
            "requestType": "VERIFY_EMAIL",
            "idToken": id_token,
        },
    )

