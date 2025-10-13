# === BUILD STAGE ===
FROM python:3.11-slim AS builder
WORKDIR /app

# Install build dependencies for psycopg2 and other compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and build wheels
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip wheel --wheel-dir=/wheels -r requirements.txt

# === FINAL STAGE ===
FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels
COPY --from=builder /wheels /wheels
COPY requirements.txt .

# Install all dependencies from wheels (faster and reproducible)
RUN pip install --no-cache-dir --find-links=/wheels -r requirements.txt

# Copy application source code
COPY . /app

# Expose port and start server
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
