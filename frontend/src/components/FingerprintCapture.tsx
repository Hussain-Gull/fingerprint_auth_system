import React, { useEffect, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface FingerprintCaptureProps {
  onCaptured: (templateHex: string) => void;
}

export default function FingerprintCapture({ onCaptured }: FingerprintCaptureProps) {
  const [status, setStatus] = useState("idle");
  const [attempt, setAttempt] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const wsUrl = `ws://localhost:5173/ws/enrollment`;
  
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      console.log('WebSocket message received:', message);
      
      switch (message.type) {
        case 'capture_started':
          setStatus("capturing");
          setError(null);
          break;
          
        case 'capture_success':
          setStatus("success");
          setAttempt(prev => prev + 1);
          onCaptured("template_captured");
          break;
          
        case 'capture_failed':
          setStatus("failed");
          setError(message.message || "Capture failed");
          break;
          
        case 'device_status':
          setDeviceStatus(message.data);
          break;
          
        case 'status_update':
          setDeviceStatus(message.data);
          break;
      }
    },
    onOpen: () => {
      console.log('WebSocket connected');
      // Request initial device status
      sendMessage({ action: 'get_status' });
    },
    onClose: () => {
      console.log('WebSocket disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    }
  });

  const startCapture = () => {
    if (!isConnected) {
      setError("Not connected to device");
      return;
    }
    
    setError(null);
    sendMessage({ action: 'start_capture' });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle': return '#6c757d';
      case 'capturing': return '#ffc107';
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="fingerprint-capture-container">
      <div className="capture-header">
        <h3>Fingerprint Capture</h3>
        <div className="connection-status">
          <span 
            className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
          >
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </div>
      </div>

      <div className="capture-status">
        <div className="status-display">
          <span 
            className="status-text"
            style={{ color: getStatusColor() }}
          >
            Status: {status.toUpperCase()}
          </span>
          <span className="attempt-counter">Attempts: {attempt}</span>
        </div>
        
        {deviceStatus && (
          <div className="device-info">
            <p>Device: {deviceStatus.secugen_connected ? 'Connected' : 'Disconnected'}</p>
            {deviceStatus.device_info && (
              <p>Device ID: {deviceStatus.device_info.DeviceID || 'Unknown'}</p>
            )}
          </div>
        )}
      </div>

      <div className="capture-controls">
        <button 
          onClick={startCapture}
          disabled={!isConnected || status === 'capturing'}
          className="capture-button"
        >
          {status === 'capturing' ? 'Capturing...' : 'Start Capture'}
        </button>
        
        <button 
          onClick={() => sendMessage({ action: 'get_status' })}
          className="refresh-button"
        >
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Ensure the SecuGen device is connected and powered on</li>
          <li>Place your finger firmly on the sensor</li>
          <li>Hold still until capture is complete</li>
          <li>If capture fails, try again with a different finger</li>
        </ul>
      </div>
    </div>
  );
}
