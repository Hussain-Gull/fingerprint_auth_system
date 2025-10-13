FROM python:3.11-slim AS builder
WORKDIR /app

# install dependencies needed to build psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# build wheels
RUN pip install --upgrade pip setuptools wheel && \
    pip wheel --wheel-dir=/wheels -r requirements.txt


# === FINAL STAGE ===
FROM python:3.11-slim
WORKDIR /app

# install runtime dependencies (not dev tools)
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
COPY requirements.txt .

# Allow pip to use wheels and, if one is missing, fall back to PyPI
RUN pip install --no-cache-dir --find-links=/wheels -r requirements.txt

COPY . /app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
