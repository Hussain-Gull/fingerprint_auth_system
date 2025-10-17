import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from pydantic import constr
from app.schemas import ApplicationCreate, ApplicationResponse
from app.db import database
from app.models import models
from app.utils.logger import logger
from app.core.config import settings
import os
import asyncpg

router = APIRouter()

# helper to store files on filesystem (you can replace with S3 later)
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/applications", response_model=ApplicationResponse)
async def create_application(
    fullName: constr(min_length=1, max_length=15) = Form(...),
    fatherName: constr(min_length=1, max_length=15) = Form(...),
    dateOfBirth: str = Form(...),
    gender: constr(min_length=1, max_length=10) = Form(...),
    country: constr(min_length=1, max_length=10) = Form(...),
    identityNumber: constr(min_length=13, max_length=13) = Form(...),
    address: constr(min_length=1, max_length=100) = Form(...),
    subject: str = Form(...),
    cnicFront: UploadFile = File(None),
    cnicBack: UploadFile = File(None),
    studentImage: UploadFile = File(None)
):
    # Save files to disk (if provided)
    def save_upload(file: UploadFile, name_prefix: str):
        if not file or not file.filename:
            return None
        path = os.path.join(UPLOAD_DIR, f"{name_prefix}_{file.filename}")
        with open(path, "wb") as f:
            f.write(file.file.read())
        return path

    cfront = save_upload(cnicFront, identityNumber + "_cnic_front") if cnicFront else None
    cback = save_upload(cnicBack, identityNumber + "_cnic_back") if cnicBack else None
    pimg = save_upload(studentImage, identityNumber + "_student") if studentImage else None

    try:
        query = models.applications.insert().values(
            full_name=fullName,
            father_name=fatherName,
            date_of_birth=dateOfBirth,
            gender=gender,
            country=country,
            identity_number=identityNumber,
            address=address,
            subject=subject,
            cnic_front_path=cfront,
            cnic_back_path=cback,
            student_image_path=pimg,
        )
        rec_id = await database.execute(query)
        logger.info("Application stored id=%s identity=%s", rec_id, identityNumber)

        return ApplicationResponse(identityNumber=identityNumber, fullName=fullName)
    
    except asyncpg.exceptions.UniqueViolationError as e:
        logger.warning("Duplicate CNIC attempt: %s", identityNumber)
        raise HTTPException(
            status_code=409, 
            detail=f"Application with CNIC {identityNumber} already exists"
        )
    except Exception as e:
        logger.error("Error storing application: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to store application")

@router.get("/applications/{identity_number}", response_model=ApplicationResponse)
async def get_application(identity_number: str):
    query = models.applications.select().where(models.applications.c.identity_number == identity_number)
    rec = await database.fetch_one(query)
    if not rec:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return ApplicationResponse(identityNumber=rec["identity_number"], fullName=rec["full_name"])