import React, { useState } from "react";
import StudentForm from "../components/StudentForm";
import FingerprintCapture from "../components/FingerprintCapture";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "/api";

export default function Enrollment() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>(null);
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitMetadata(data: any) {
    setFormData(data);
    setStep(2);
    setError(null);
  }

  async function onFingerprintCaptured(captureResult: string) {
    if (captureResult === "template_captured") {
      // Call backend to finalize enrollment with the captured template
      const payload = { ...formData };
      try {
        const res = await axios.post(`${API_URL}/enroll/`, payload);
        setEnrollmentResult(res.data);
        setError(null);
        setStep(3); // Show success step
      } catch (e: any) {
        console.error("Enrollment failed:", e);
        setError(e.response?.data?.detail || "Enrollment failed. Please try again.");
      }
    }
  }

  const resetEnrollment = () => {
    setStep(1);
    setFormData(null);
    setEnrollmentResult(null);
    setError(null);
  };

  return (
    <div className="enrollment-container">
      <h2>Student Enrollment</h2>
      
      {step === 1 && (
        <div className="step-form">
          <h3>Step 1: Student Information</h3>
          <StudentForm onSubmit={submitMetadata} />
        </div>
      )}
      
      {step === 2 && (
        <div className="step-capture">
          <h3>Step 2: Fingerprint Capture</h3>
          <div className="student-summary">
            <h4>Student Information:</h4>
            <p><strong>Name:</strong> {formData?.name}</p>
            <p><strong>CNIC:</strong> {formData?.cnic_number}</p>
            <p><strong>Age:</strong> {formData?.age || 'Not provided'}</p>
            <p><strong>Country:</strong> {formData?.country || 'Not provided'}</p>
          </div>
          
          <FingerprintCapture 
            onCaptured={onFingerprintCaptured}
          />
          
          <button onClick={() => setStep(1)} className="back-button">
            Back to Form
          </button>
        </div>
      )}
      
      {step === 3 && enrollmentResult && (
        <div className="step-success">
          <h3>Step 3: Enrollment Complete!</h3>
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h4>Student Successfully Enrolled</h4>
            <div className="enrollment-details">
              <p><strong>Student ID:</strong> {enrollmentResult.id}</p>
              <p><strong>Name:</strong> {enrollmentResult.name}</p>
              <p><strong>CNIC:</strong> {enrollmentResult.cnic_number}</p>
              <p><strong>Enrolled:</strong> {new Date(enrollmentResult.created_at).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={resetEnrollment} className="enroll-another">
              Enroll Another Student
            </button>
            <button onClick={() => window.location.href = '/admin'} className="view-admin">
              View Admin Dashboard
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <h4>Error:</h4>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
