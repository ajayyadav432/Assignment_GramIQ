FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for asyncpg
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Make start script executable (handle both LF and CRLF)
COPY start.sh .
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

EXPOSE 8000

# Use start script for proper startup sequencing
ENTRYPOINT ["./start.sh"]
