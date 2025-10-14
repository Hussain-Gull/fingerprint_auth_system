import React, { useEffect, useState } from "react";
import axios from "axios";
import { useWebSocket } from "../hooks/useWebSocket";

const API_URL = process.env.REACT_APP_API_URL || "/api";

interface Student {
    id: string;
    name: string;
    cnic_number: string;
    country: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { isConnected, lastMessage } = useWebSocket("ws://localhost:5173/ws/admin", {
        onMessage: (message) => {
            console.log('Admin WebSocket message:', message);
            
            if (message.type === 'status_update') {
                setStatus(message.data);
            }
        },
        onOpen: () => {
            console.log('Admin WebSocket connected');
        },
        onClose: () => {
            console.log('Admin WebSocket disconnected');
        }
    });

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/status`);
            setStatus(res.data);
        } catch (err) {
            console.error('Failed to fetch status:', err);
            setStatus({ secugen_connected: false, usb_dataset_present: false });
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/students`);
            setStudents(res.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setError('Failed to load student data');
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            // This would trigger the USB writer script
            await axios.post(`${API_URL}/admin/export-usb`);
            alert("Export initiated successfully");
        } catch (err) {
            console.error('Export failed:', err);
            alert("Export failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirmation !== `DELETE-${id}`) {
            alert(`Type DELETE-${id} to proceed`);
            return;
        }
        
        try {
            await axios.delete(`${API_URL}/admin/students/${id}?confirm=DELETE-${id}`);
            await fetchStudents();
            setConfirmation("");
            alert("Student deleted successfully");
        } catch (err) {
            console.error('Delete failed:', err);
            alert("Delete failed");
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchStudents();
    }, []);

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <div className="connection-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '● Live Updates' : '● Offline'}
                    </span>
                </div>
            </div>

            <section className="status-section">
                <h3>Device Status</h3>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">Fingerprint Device:</span>
                        <span className={`status-value ${status?.secugen_connected ? 'connected' : 'disconnected'}`}>
                            {status?.secugen_connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">USB Dataset:</span>
                        <span className={`status-value ${status?.usb_dataset_present ? 'available' : 'unavailable'}`}>
                            {status?.usb_dataset_present ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Total Students:</span>
                        <span className="status-value">{students.length}</span>
                    </div>
                </div>
                
                <button onClick={fetchStatus} className="refresh-button">
                    Refresh Status
                </button>
            </section>

            <section className="students-section">
                <div className="section-header">
                    <h3>Student Records</h3>
                    <button onClick={fetchStudents} className="refresh-button">
                        Refresh List
                    </button>
                </div>
                
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                <div className="table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>CNIC</th>
                                <th>Country</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.cnic_number}</td>
                                    <td>{s.country || 'N/A'}</td>
                                    <td>{new Date(s.created_at).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            onClick={() => handleDelete(s.id)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {students.length === 0 && (
                    <div className="empty-state">
                        <p>No students enrolled yet.</p>
                        <button onClick={() => window.location.href = '/enroll'}>
                            Enroll First Student
                        </button>
                    </div>
                )}
            </section>

            <section className="export-section">
                <h3>Data Export</h3>
                <div className="export-controls">
                    <button 
                        disabled={loading || students.length === 0} 
                        onClick={handleExport}
                        className="export-button"
                    >
                        {loading ? "Exporting..." : "Export to USB"}
                    </button>
                    <p className="export-info">
                        Exports all student data to USB drive for offline access
                    </p>
                </div>
            </section>

            <section className="delete-section">
                <h3>Delete Confirmation</h3>
                <div className="delete-controls">
                    <input
                        placeholder="Type DELETE-{student_id} to confirm deletion"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        className="confirmation-input"
                    />
                    <p className="confirmation-info">
                        This confirmation is required for all student deletions
                    </p>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
