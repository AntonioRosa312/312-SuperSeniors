FROM python:3.8-slim

# Install system packages
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Node.js for frontend build ----
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# ---- Build frontend ----
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Set up backend ----
WORKDIR /app
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY manage.py /app/
COPY backend/ /app/backend/

# Wait-for script
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

EXPOSE 8000

CMD /wait && \
    python manage.py makemigrations lobby core && \
    python manage.py migrate && \
    daphne -b 0.0.0.0 -p 8000 backend.asgi:application

