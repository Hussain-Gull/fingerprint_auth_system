import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FingerprintCapture({ onCaptured }: { onCaptured: (templateHex: string) => void }) {
  const [status, setStatus] = useState("idle");
  const [attempt, setAttempt] = useState(0);

  async function capture() {
    setAttempt(a => a + 1);
    setStatus("capturing");
    try {
      const res = await axios.post("/api/auth/fingerprint"); // backend route
      if (res.data.success) {
        setStatus("success");
        onCaptured(res.data.token);
      } else {
        setStatus("no_match");
      }
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3>Fingerprint Capture</h3>
      <p>Status: {status}</p>
      <p>Attempts: {attempt}</p>
      <button onClick={capture}>Capture</button>
      <div>
        <p>Instructions: Place finger on SecuGen device (ensure it shows connected in admin).</p>
      </div>
    </div>
  );
}
