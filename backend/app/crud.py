from sqlalchemy.orm import Session
from . import models, schemas

def create_student(db: Session, student: schemas.StudentCreate, fingerprint_template: bytes):
    s = models.Student(**student.dict(), fingerprint_template=fingerprint_template)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

def get_student_by_cnic(db: Session, cnic: str):
    return db.query(models.Student).filter(models.Student.cnic_number == cnic).first()

def list_students(db: Session, limit: int = 100):
    return db.query(models.Student).limit(limit).all()

def delete_student(db: Session, student_id):
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if s:
        db.delete(s)
        db.commit()
    return s
