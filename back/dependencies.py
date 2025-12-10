from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from auth_services import verify_id_token
from crud import get_user_by_email, create_user_in_db
from database.models import User


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> User:
    """Получает текущего пользователя по токену из заголовка Authorization"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
            )
        
        id_token = authorization.replace("Bearer ", "")
        firebase_user = await verify_id_token(id_token)
        
        if not firebase_user or "users" not in firebase_user or len(firebase_user["users"]) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        email = firebase_user["users"][0].get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in token",
            )
        
        user = await get_user_by_email(email)
        if not user:
            user = await create_user_in_db(email=email)
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )
