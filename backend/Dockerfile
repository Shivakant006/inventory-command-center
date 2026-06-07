FROM python:3.11-slim
WORKDIR /app

# Install system dependencies needed to compile PostgreSQL drivers
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install directly into the environment
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining backend source code files
COPY . .

EXPOSE 8000

# Grant execution permissions to our automated migration startup script
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]