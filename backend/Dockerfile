# ---------- Stage: Backend (FastAPI + Python 3.11) ----------
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Disable Python cache and buffering
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency file first for cache efficiency
COPY requirements.txt .

# Install dependencies using BuildKit caching
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy the entire backend source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Default run command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
