// src/pages/FingerprintAuth.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Player from "lottie-react";

import fingerprintScan from "../assets/animations/fingerprint-scanning.json";
import processingAnim from "../assets/animations/processing.json";
import successAnim from "../assets/animations/success.json";
import axiosClient from "@/utils/axiosClient.ts";

// Types for our enrollment system
interface ApplicationResponse {
    identityNumber: string;
    fullName: string;
}

interface WebSocketMessage {
    type: string;
    message: string;
    quality?: number;
    quality_level?: string;
    template_size?: number;
    attempt?: number;
    max_attempts?: number;
}

type EnrollmentStage = "idle" | "connecting" | "scanning" | "processing" | "success" | "error";

export const FingerprintPage = () => {
    // State management
    const [stage, setStage] = useState<EnrollmentStage>("idle");
    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [applicationResponse, setApplicationResponse] = useState<ApplicationResponse | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("Ready to start fingerprint enrollment");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [captureCountdown, setCaptureCountdown] = useState<number>(0);
    const [deviceBlinking, setDeviceBlinking] = useState<boolean>(false);
    const [currentAttempt, setCurrentAttempt] = useState<number>(0);
    const [maxAttempts, setMaxAttempts] = useState<number>(3);
    const [qualityScore, setQualityScore] = useState<number>(0);
    const [qualityLevel, setQualityLevel] = useState<string>("");
    
    // WebSocket management
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const heartbeatIntervalRef = useRef<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const shouldReconnectRef = useRef(true); // Flag to control reconnection
    const lastPongTimeRef = useRef<number>(Date.now());

    // Load student details from session storage
    useEffect(() => {
        const data = sessionStorage.getItem("studentDetails");
        if (!data) {
            window.location.href = "/"; // redirect if missing
        } else {
            setStudentDetails(JSON.parse(data));
        }
    }, []);

    // Cleanup WebSocket on component unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        shouldReconnectRef.current = false; // Disable reconnection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        setIsConnected(false);
    };

    // Step 1: Verify application exists (already submitted in ApplicationForm)
    const verifyApplication = async (): Promise<boolean> => {
        try {
            setStage("connecting");
            setStatusMessage("Verifying application...");
            setErrorMessage("");

            // Since application was already submitted in ApplicationForm,
            // we just need to verify it exists and get the response
            const response = await axiosClient.get(`/applications/${studentDetails.identityNumber}`);
            
            if (response.status === 200) {
                const appData: ApplicationResponse = response.data;
                setApplicationResponse(appData);
                setStatusMessage("Application verified! Connecting to fingerprint scanner...");
                return true;
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error: any) {
            console.error("Error verifying application:", error);
            
            let errorMsg = "Failed to verify application";
            if (error.response?.data?.detail) {
                errorMsg = error.response.data.detail;
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            setErrorMessage(errorMsg);
            setStage("error");
            return false;
        }
    };

    // Step 2: Connect to WebSocket
    const connectWebSocket = (identityNumber: string) => {
        try {
            // Enable reconnection for new connection
            shouldReconnectRef.current = true;
            
            // Construct WebSocket URL
            const wsUrl = `ws://localhost:8000/ws/scan/${identityNumber}`;
            console.log("Connecting to WebSocket:", wsUrl);
            
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);
                lastPongTimeRef.current = Date.now();
                setStatusMessage("Connected to fingerprint scanner. Starting capture...");
                
                // Start heartbeat mechanism to detect connection health
                heartbeatIntervalRef.current = setInterval(() => {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        // Check if we haven't received a response in too long
                        const timeSinceLastPong = Date.now() - lastPongTimeRef.current;
                        if (timeSinceLastPong > 30000) { // 30 seconds timeout
                            console.log("WebSocket appears to be stale, closing connection");
                            wsRef.current.close();
                        }
                    }
                }, 10000); // Check every 10 seconds
            };

            ws.onmessage = (event) => {
                const data: WebSocketMessage = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed: code=${event.code}, reason='${event.reason}', wasClean=${event.wasClean}`);
                setIsConnected(false);
                
                // Handle different close codes
                if (event.code === 1000) {
                    // Normal closure - don't reconnect
                    console.log("WebSocket closed normally");
                    return;
                }
                
                if (event.code === 1001) {
                    // Going away (page refresh/navigate) - don't reconnect
                    console.log("WebSocket closed due to page navigation");
                    return;
                }
                
                // Only reconnect if explicitly allowed and not in terminal states
                if (shouldReconnectRef.current && stage !== "success" && stage !== "error" && stage !== "idle") {
                    console.log(`Connection lost unexpectedly (code: ${event.code}), attempting to reconnect...`);
                    setStatusMessage("Connection lost. Attempting to reconnect...");
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (studentDetails && shouldReconnectRef.current) {
                            console.log("Attempting WebSocket reconnection...");
                            connectWebSocket(studentDetails.identityNumber);
                        }
                    }, 2000);
                } else {
                    console.log(`WebSocket closed normally or reconnection disabled (stage: ${stage})`);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setErrorMessage("WebSocket connection error");
            };

        } catch (error) {
            console.error("Error connecting to WebSocket:", error);
            setErrorMessage("Failed to connect to fingerprint scanner");
            setStage("error");
        }
    };

    // Step 3: Handle WebSocket messages and update UI accordingly
    const handleWebSocketMessage = (data: WebSocketMessage) => {
        console.log("WebSocket message received:", data);
        lastPongTimeRef.current = Date.now(); // Update last activity time

        switch (data.type) {
            case "device_init":
                setStage("connecting");
                setStatusMessage(data.message);
                break;

            case "device_configured":
                setStage("connecting");
                setStatusMessage(data.message);
                break;

            case "device_ready": {
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(true);
                // Start countdown for 20 seconds
                setCaptureCountdown(20);
                const countdownInterval = setInterval(() => {
                    setCaptureCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                break;
            }

            case "capture_attempt":
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(true);
                if (data.attempt && data.max_attempts) {
                    setCurrentAttempt(data.attempt);
                    setMaxAttempts(data.max_attempts);
                    setStatusMessage(`Attempt ${data.attempt}/${data.max_attempts}: ${data.message}`);
                }
                break;

            case "image_captured":
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(false);
                setCaptureCountdown(0);
                break;

            case "quality_check":
                setStage("scanning");
                setStatusMessage(data.message);
                if (data.quality !== undefined) {
                    setQualityScore(data.quality);
                    setQualityLevel(data.quality_level || "");
                    setStatusMessage(`${data.message} (Quality: ${data.quality}/100)`);
                }
                break;

            case "processing":
                setStage("processing");
                setStatusMessage(data.message);
                setDeviceBlinking(false);
                setCaptureCountdown(0);
                break;

            case "capture_success":
                setStage("processing");
                setStatusMessage(data.message);
                setDeviceBlinking(false);
                setCaptureCountdown(0);
                break;

            case "warning":
                setStage("scanning");
                setStatusMessage(data.message);
                // Keep scanning but show warning
                break;

            case "timeout":
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(true);
                break;

            case "capture_error":
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(true);
                break;

            case "retry":
                setStage("scanning");
                setStatusMessage(data.message);
                setDeviceBlinking(true);
                break;

            case "capture_failed":
                setStage("error");
                setErrorMessage(data.message);
                setDeviceBlinking(false);
                break;

            case "error":
                setStage("error");
                setErrorMessage(data.message);
                setDeviceBlinking(false);
                break;

            case "done":
                setStage("success");
                setStatusMessage("Fingerprint enrollment completed successfully!");
                // Clean up session storage
                sessionStorage.removeItem("studentDetails");
                // Close WebSocket connection
                cleanup();
                break;

            // Legacy message types for backward compatibility
            case "status":
                if (data.message.includes("Device connected")) {
                    setStage("scanning");
                    setStatusMessage(data.message);
                    setDeviceBlinking(true);
                } else if (data.message.includes("Fingerprint scan successful")) {
                    setStage("processing");
                    setStatusMessage(data.message);
                    setDeviceBlinking(false);
                    setCaptureCountdown(0);
                } else if (data.message.includes("Fingerprint saved")) {
                    setStage("success");
                    setStatusMessage("Fingerprint enrollment completed successfully!");
                    sessionStorage.removeItem("studentDetails");
                    cleanup();
                } else {
                    setStatusMessage(data.message);
                }
                break;

            case "prompt":
                setStage("scanning");
                setStatusMessage(data.message);
                break;

            default:
                console.log("Unknown message type:", data.type);
                setStatusMessage(data.message);
        }
    };

    // Main handler to start the enrollment process
    const handleStartEnrollment = async () => {
        if (!studentDetails) {
            setErrorMessage("Student details not found in session!");
            setStage("error");
            return;
        }

        // Step 1: Verify application exists
        const verified = await verifyApplication();
        if (!verified) return;

        // Step 2: Connect to WebSocket
        connectWebSocket(studentDetails.identityNumber);
    };

    const handleRetry = () => {
        cleanup();
        shouldReconnectRef.current = true; // Re-enable reconnection for retry
        setStage("idle");
        setErrorMessage("");
        setStatusMessage("Ready to start fingerprint enrollment");
        setCurrentAttempt(0);
        setMaxAttempts(3);
        setQualityScore(0);
        setQualityLevel("");
        setDeviceBlinking(false);
        setCaptureCountdown(0);
    };

    const handleGoHome = () => {
        cleanup();
        window.location.href = "/";
    };

    if (!studentDetails) return null;

    // Helper to render animations consistently
    const renderAnimation = (animation: any, height = 250, width = 250) => (
        <div className="flex justify-center items-center w-full">
            <Player
                autoplay
                loop={stage !== "success"} // success animation plays once
                src={animation}
                style={{ height, width }}
                animationData={animation}
            />
        </div>
    );

    return (
        <div className="min-h-screen font-arial flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md flex flex-col items-center space-y-6">
                <h2 className="font-spartan text-2xl font-bold text-gray-800">
                    Fingerprint Authentication
                </h2>

                {/* Connection Status Indicator */}
                {applicationResponse && (
                    <div className="w-full text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isConnected 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                isConnected ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            {isConnected ? 'Connected' : 'Connecting...'}
                        </div>
                    </div>
                )}

                {/* Idle State - Ready to start */}
                {stage === "idle" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-xl shadow-inner w-full flex justify-center">
                            {renderAnimation(fingerprintScan)}
                        </div>
                        <p className="text-lg font-medium text-gray-700 text-center">
                            {statusMessage}
                        </p>
                        <p className="text-sm text-gray-500 text-center">
                            Student: <strong>{studentDetails.fullName}</strong><br/>
                            CNIC: <strong>{studentDetails.identityNumber}</strong>
                        </p>
                        <Button className="w-full" onClick={handleStartEnrollment}>
                            Start Fingerprint Enrollment
                        </Button>
                    </div>
                )}

                {/* Connecting State */}
                {stage === "connecting" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-xl shadow-inner w-full flex justify-center">
                            {renderAnimation(processingAnim, 200, 200)}
                        </div>
                        <p className="text-lg font-medium text-gray-700 text-center">
                            {statusMessage}
                        </p>
                    </div>
                )}

                {/* Scanning State */}
                {stage === "scanning" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-blue-50 p-4 rounded-xl shadow-inner w-full flex justify-center border-2 border-blue-200">
                            {renderAnimation(fingerprintScan)}
                        </div>
                        <p className="text-lg font-medium text-blue-700 text-center">
                            {statusMessage}
                        </p>
                        
                        {/* Attempt Counter */}
                        {currentAttempt > 0 && (
                            <div className="bg-blue-100 p-2 rounded-lg w-full">
                                <p className="text-sm text-blue-700 text-center font-medium">
                                    Attempt {currentAttempt} of {maxAttempts}
                                </p>
                            </div>
                        )}
                        
                        {/* Quality Score Display */}
                        {qualityScore > 0 && (
                            <div className="bg-blue-100 p-2 rounded-lg w-full">
                                <p className="text-sm text-blue-700 text-center font-medium">
                                    Quality Score: {qualityScore}/100 ({qualityLevel})
                                </p>
                            </div>
                        )}
                        
                        <div className="bg-blue-50 p-3 rounded-lg w-full">
                            <p className="text-sm text-blue-600 text-center font-medium">
                                👆 Please place your THUMB on the SecuGen device scanner
                            </p>
                            <p className="text-xs text-blue-500 text-center mt-1">
                                The SecuGen GREEN light will stop blinking when thumb is detected
                            </p>
                            
                            {/* Device Blinking Indicator */}
                            {deviceBlinking && (
                                <div className="mt-3 text-center">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        deviceBlinking ? 'animate-pulse bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                            deviceBlinking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                        }`}></div>
                                        {deviceBlinking ? '🟢 SecuGen GREEN Light Blinking' : 'Device Ready'}
                                    </div>
                                </div>
                            )}
                            
                            {captureCountdown > 0 && (
                                <div className="mt-3 text-center">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {captureCountdown}
                                    </div>
                                    <p className="text-xs text-blue-500">
                                        seconds remaining...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Processing State */}
                {stage === "processing" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-green-50 p-6 rounded-xl shadow-inner w-full flex justify-center border-2 border-green-200">
                            {renderAnimation(processingAnim, 200, 200)}
                        </div>
                        <p className="text-lg font-medium text-green-700 text-center">
                            {statusMessage}
                        </p>
                        <div className="bg-green-50 p-3 rounded-lg w-full">
                            <p className="text-sm text-green-600 text-center font-medium">
                                ✅ Thumb fingerprint successfully captured and stored!
                            </p>
                            <p className="text-xs text-green-500 text-center mt-1">
                                Processing enrollment data...
                            </p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {stage === "success" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-green-50 p-6 rounded-xl shadow-inner w-full flex justify-center border-2 border-green-200">
                            {renderAnimation(successAnim, 200, 200)}
                        </div>
                        <p className="text-green-600 text-xl font-bold text-center">
                            {statusMessage}
                        </p>
                        
                        {applicationResponse && (
                            <div className="bg-green-50 p-4 rounded-lg w-full border border-green-200">
                                <h3 className="font-semibold text-green-800 text-center mb-2">
                                    Enrollment Details
                                </h3>
                                <div className="text-sm text-green-700 space-y-1">
                                    <p><strong>Name:</strong> {applicationResponse.fullName}</p>
                                    <p><strong>CNIC:</strong> {applicationResponse.identityNumber}</p>
                                    <p><strong>Status:</strong> Fingerprint enrolled successfully</p>
                                </div>
                            </div>
                        )}
                        
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleGoHome}>
                            Go Back Home
                        </Button>
                    </div>
                )}

                {/* Error State */}
                {stage === "error" && (
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <div className="bg-red-50 p-6 rounded-xl shadow-inner w-full flex justify-center border-2 border-red-200">
                            <div className="text-red-500 text-6xl">❌</div>
                        </div>
                        <p className="text-red-600 text-lg font-semibold text-center">
                            Enrollment Failed
                        </p>
                        <div className="bg-red-50 p-4 rounded-lg w-full border border-red-200">
                            <p className="text-sm text-red-700 text-center">
                                {errorMessage}
                            </p>
                        </div>
                        <div className="flex space-x-3 w-full">
                            <Button 
                                variant="outline" 
                                className="flex-1" 
                                onClick={handleRetry}
                            >
                                Try Again
                            </Button>
                            <Button 
                                className="flex-1" 
                                onClick={handleGoHome}
                            >
                                Go Home
                            </Button>
                        </div>
                    </div>
                )}

                {/* Session Info (for debugging) */}
                {applicationResponse && import.meta.env.DEV && (
                    <div className="w-full text-xs text-gray-400 bg-gray-50 p-2 rounded">
                        <p>Identity Number: {applicationResponse.identityNumber}</p>
                        <p>Full Name: {applicationResponse.fullName}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
