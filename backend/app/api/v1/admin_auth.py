from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.db import get_db
from app.models.models import Admin
from app.schemas.schemas import AdminLogin
from app.core.security import verify_password
from app.core.jwt_handler import create_access_token

router = APIRouter(prefix="/admin", tags=["Admin Auth"])

@router.post("/login")
async def admin_login(request: AdminLogin, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Admin).where(Admin.username == request.username)
        result = await db.execute(query)
        admin = result.scalar_one_or_none()

        if not admin:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        if not verify_password(request.password, admin.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token = create_access_token({"sub": admin.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal server error: {str(e)}")
