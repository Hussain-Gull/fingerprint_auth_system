// src/pages/FingerprintPage.tsx
import React, {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import Player from "lottie-react";
import axios from "axios";

import fingerprintScan from "../assets/animations/fingerprint-scanning.json";
import processingAnim from "../assets/animations/processing.json";
import successAnim from "../assets/animations/success.json";

export const FingerprintPage = () => {
    const [stage, setStage] = useState<"scanning" | "processing" | "done">("scanning");
    const [studentDetails, setStudentDetails] = useState<any>(null);

    useEffect(() => {
        const data = sessionStorage.getItem("studentDetails");
        if (!data) {
            window.location.href = "/"; // redirect if missing
        } else {
            setStudentDetails(JSON.parse(data));
        }
    }, []);

    const handleStartScan = async () => {
        setStage("processing");

        try {
            const fingerprintData = "FAKE_FINGERPRINT_BYTES"; // replace with actual backend data
            await axios.post("/api/students/register-fingerprint", {
                ...studentDetails,
                fingerprintTemplate: fingerprintData,
            });

            setStage("done");
            sessionStorage.removeItem("studentDetails");
        } catch (err) {
            console.error(err);
            alert("Error saving fingerprint");
            setStage("scanning"); // retry
        }
    };

    if (!studentDetails) return null;

    // Helper to render animations consistently
    const renderAnimation = (animation: any, height = 250, width = 250) => (
        <div className="flex justify-center items-center w-full">
            <Player
                autoplay
                loop={stage !== "done"} // success animation plays once
                src={animation}
                style={{height, width}} animationData={animation}/>
        </div>
    );

    return (
        <div
            className="min-h-screen font-arial flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md flex flex-col items-center space-y-6">
                <h2 className="font-spartan text-2xl font-bold text-gray-800">Fingerprint Authentication</h2>

                {stage === "scanning" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-xl shadow-inner w-full flex justify-center">
                            {renderAnimation(fingerprintScan)}
                        </div>
                        <p className="text-lg font-medium text-gray-700 text-center">
                            Place your finger on the scanner and click Start Scan
                        </p>
                        <Button className="w-full" onClick={handleStartScan}>
                            Start Scan
                        </Button>
                    </div>
                )}

                {stage === "processing" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-xl shadow-inner w-full flex justify-center">
                            {renderAnimation(processingAnim, 200, 200)}
                        </div>
                        <p className="text-lg font-medium text-gray-700 text-center">
                            Processing fingerprint...
                        </p>
                    </div>
                )}

                {stage === "done" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-xl shadow-inner w-full flex justify-center">
                            {renderAnimation(successAnim, 200, 200)}
                        </div>
                        <p className="text-green-600 text-xl font-bold text-center">
                            Fingerprint registered successfully!
                        </p>
                        <Button className="w-full" onClick={() => (window.location.href = "/")}>
                            Go Back Home
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
