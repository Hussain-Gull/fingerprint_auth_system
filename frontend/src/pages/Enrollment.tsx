import React, { useState } from "react";
import StudentForm from "../components/StudentForm";
import FingerprintCapture from "../components/FingerprintCapture";
import axios from "axios";

export default function Enrollment() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);

  async function submitMetadata(data: any) {
    setFormData(data);
    setStep(2);
  }

  async function onFingerprintCaptured(tokenOrTemplate: string) {
    // call backend to finalize enrollment
    const payload = { ...formData };
    try {
      const res = await axios.post("/api/enroll/", payload);
      alert("Enrolled: " + res.data.id);
      setStep(1);
    } catch (e) {
      alert("Enrollment failed: " + e);
    }
  }

  return (
    <div>
      {step === 1 && <StudentForm onSubmit={submitMetadata} />}
      {step === 2 && <FingerprintCapture onCaptured={onFingerprintCaptured} />}
    </div>
  );
}
