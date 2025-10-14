# Hybrid Docker + Windows USB Detection System

A hybrid fingerprint enrollment system that combines Docker containerization with Windows-native USB device detection. The backend runs in a Linux Docker container while communicating with a Windows-native USB detection service via HTTP.

## 🏗️ Project Structure

```
.
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Backend container definition
├── requirements.txt            # Python dependencies
├── main.py                     # FastAPI backend entry point
├── backend/                    # Backend application
│   ├── app/
│   │   ├── main.py            # Original FastAPI app
│   │   ├── usb_service_client.py  # USB service HTTP client
│   │   ├── routes/
│   │   │   └── usb.py         # USB detection routes
│   │   └── ...                # Other backend files
│   ├── Dockerfile             # Backend-specific Dockerfile
│   └── requirements.txt       # Backend dependencies
└── usb_service/               # Windows-native USB service
    ├── usb_service.py         # Flask USB detection service
    └── requirements.txt       # USB service dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Windows 10/11** (required for USB detection)
- **Docker Desktop** with WSL2 backend
- **Python 3.11+** (for USB service)
- **Git**

### Step 1: Start the USB Service (Windows Host)

The USB service must run natively on Windows to access WMI for USB device detection.

```bash
# Navigate to the project directory
cd auth-biometric

# Install USB service dependencies
pip install flask flask-cors wmi pywin32

# Start the USB service
python usb_service/usb_service.py
```

The USB service will start on `http://localhost:6000` and provide the following endpoints:
- `GET /health` - Health check
- `GET /usb-devices` - List all USB devices
- `GET /usb-devices/{id}` - Get specific USB device
- `POST /usb-devices/refresh` - Refresh device list

### Step 2: Start the Backend (Docker)

In a separate terminal, start the Docker backend:

```bash
# Build and start the backend with Docker Compose
docker-compose up --build
```

This will start:
- **PostgreSQL database** on port 5432
- **FastAPI backend** on port 8000

### Step 3: Access the System

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **USB Devices**: http://localhost:8000/usb
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### USB Detection Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/usb` | Get list of USB devices from Windows service |
| `GET` | `/usb/health` | Check USB service health |
| `GET` | `/usb/status` | Get comprehensive USB service status |
| `GET` | `/usb/{device_id}` | Get specific USB device by ID |
| `POST` | `/usb/refresh` | Refresh USB device list |

### Example API Calls

```bash
# Get all USB devices
curl http://localhost:8000/usb

# Check USB service health
curl http://localhost:8000/usb/health

# Get specific USB device
curl http://localhost:8000/usb/E:

# Refresh USB devices
curl -X POST http://localhost:8000/usb/refresh
```

### Example Response

```json
{
  "status": "success",
  "count": 2,
  "devices": [
    {
      "device_id": "E:",
      "volume_name": "USB_DRIVE",
      "size_gb": 16.0,
      "free_gb": 12.5,
      "used_gb": 3.5,
      "usage_percent": 21.9,
      "file_system": "FAT32",
      "device_type": "USB"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/fingerprintdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=fingerprintdb

# SecuGen SDK Configuration
SECUGEN_SDK_PATH=C:/secugen_sdk/bin/x64

# USB Service Configuration
USB_SERVICE_URL=http://host.docker.internal:6000
```

### Docker Configuration

The `docker-compose.yml` defines two services:

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fingerprintdb
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - db
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+psycopg2://postgres:postgres@db:5432/fingerprintdb
```

## 🔍 How It Works

### Architecture Overview

```
┌─────────────────┐    HTTP     ┌─────────────────┐
│   Windows Host  │◄───────────►│  Docker Backend │
│                 │             │                 │
│  USB Service    │             │  FastAPI App    │
│  (Port 6000)    │             │  (Port 8000)    │
│                 │             │                 │
│  WMI USB        │             │  HTTP Client    │
│  Detection      │             │  WebSockets     │
└─────────────────┘             └─────────────────┘
```

### Communication Flow

1. **USB Detection**: Windows USB service uses WMI to detect connected USB devices
2. **HTTP Communication**: Docker backend communicates with USB service via `host.docker.internal:6000`
3. **API Exposure**: Backend exposes USB data through REST API endpoints
4. **Real-time Updates**: WebSocket connections provide real-time USB device status

### Key Components

#### USB Service (`usb_service/usb_service.py`)
- **Platform**: Windows-native Flask application
- **Purpose**: USB device detection using WMI
- **Dependencies**: `flask`, `wmi`, `pywin32`
- **Port**: 6000

#### Backend (`main.py` & `backend/app/`)
- **Platform**: Linux Docker container
- **Purpose**: FastAPI application with USB service integration
- **Dependencies**: `fastapi`, `uvicorn`, `requests`
- **Port**: 8000

#### USB Service Client (`backend/app/usb_service_client.py`)
- **Purpose**: HTTP client for communicating with Windows USB service
- **Features**: Error handling, timeout management, health checks

## 🛠️ Development

### Running in Development Mode

1. **Start USB Service** (Windows):
   ```bash
   python usb_service/usb_service.py
   ```

2. **Start Backend** (Docker with live reload):
   ```bash
   docker-compose up --build
   ```

3. **Monitor Logs**:
   ```bash
   # Backend logs
   docker logs fingerprint_backend -f
   
   # Database logs
   docker logs fingerprint_db -f
   ```

### Testing USB Detection

```bash
# Test USB service directly
curl http://localhost:6000/usb-devices

# Test backend USB endpoint
curl http://localhost:8000/usb

# Test health check
curl http://localhost:8000/usb/health
```

### Debugging

#### USB Service Issues
- Ensure Windows OS and WMI access
- Check if `wmi` and `pywin32` packages are installed
- Verify no firewall blocking port 6000

#### Backend Issues
- Check Docker container logs: `docker logs fingerprint_backend`
- Verify `host.docker.internal` resolution
- Ensure USB service is running on Windows host

#### Communication Issues
- Test USB service directly: `curl http://localhost:6000/health`
- Check Docker network connectivity
- Verify port 6000 is accessible from Docker container

## 📦 Dependencies

### USB Service Dependencies (`usb_service/requirements.txt`)
```
flask==2.3.3
flask-cors==4.0.0
wmi==1.5.1
pywin32==306
```

### Backend Dependencies (`requirements.txt`)
```
fastapi
uvicorn
requests
psycopg2-binary
```

### Backend Full Dependencies (`backend/requirements.txt`)
```
fastapi==0.95.2
uvicorn[standard]==0.22.0
psycopg2-binary==2.9.7
SQLAlchemy==1.4.49
alembic==1.11.1
python-jose==3.3.0
passlib[bcrypt]==1.7.4
pydantic==1.10.9
python-multipart==0.0.6
python-dotenv==1.0.0
pytest==7.4.0
httpx==0.24.1
python-socketio==5.8.0
websockets==11.0.3
requests==2.31.0
```

## 🔒 Security Considerations

- USB service runs on Windows host without authentication
- Backend API endpoints are publicly accessible
- Consider implementing authentication for production use
- USB service should be restricted to localhost access only

## 🚨 Troubleshooting

### Common Issues

#### USB Service Won't Start
```
Error: USB detection service requires Windows OS
```
**Solution**: Ensure you're running on Windows and have WMI access.

#### Backend Can't Connect to USB Service
```
HTTPException: USB service unavailable
```
**Solution**: 
1. Verify USB service is running on Windows host
2. Check `host.docker.internal` resolution
3. Ensure port 6000 is not blocked by firewall

#### No USB Devices Detected
```
"count": 0, "devices": []
```
**Solution**:
1. Connect a USB device to Windows host
2. Check Windows Device Manager for USB devices
3. Verify WMI permissions

#### Docker Build Fails
```
ModuleNotFoundError: No module named 'requests'
```
**Solution**: Ensure `requirements.txt` includes all necessary dependencies.

### Performance Optimization

- USB service polls devices on each request
- Consider implementing device caching for better performance
- Use WebSocket connections for real-time updates
- Implement connection pooling for HTTP requests

## 📝 License

This project is part of the IK Group of Companies fingerprint authentication system.

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Architecture**: Hybrid Docker + Windows