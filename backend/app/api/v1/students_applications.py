from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.db import get_db
from app.models.models import applications
from app.schemas.schemas import PaginatedApplications, ApplicationListItem
from typing import List

router = APIRouter(prefix="/applications-info", tags=["Applications Status"])


@router.get("/applications-list", response_model=PaginatedApplications)
async def get_applications(
        db: AsyncSession = Depends(get_db),
        page: int = Query(1, ge=1),
        per_page: int = Query(10, ge=1, le=100)
):
    offset = (page - 1) * per_page

    # Count total rows
    total_result = await db.execute(select(func.count()).select_from(applications))
    total = total_result.scalar()

    result = await db.execute(
        select(applications)
        .order_by(applications.c.id.desc())
        .offset(offset)
        .limit(per_page)
    )
    rows = result.fetchall()

    apps = []
    for row in rows:
        app_data = dict(row._mapping)
        status = "Enrolled" if app_data.get("fingerprint_encrypted") else "Pending"
        apps.append(
            ApplicationListItem(
                id=app_data["id"],
                full_name=app_data["full_name"],
                father_name=app_data.get("father_name"),
                identity_number=app_data["identity_number"],
                subject=app_data.get("subject"),
                status=status,
                created_at=app_data["created_at"]
            )
        )

    return PaginatedApplications(
        total=total,
        page=page,
        per_page=per_page,
        applications=apps
    )
