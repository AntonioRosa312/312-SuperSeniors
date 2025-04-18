FROM python:3.8-slim

# Update packages (optional but recommended)
#RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
# Install build tools and required system packages
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies. Ensure that requirements.txt is in the same folder.
#COPY ../requirements.txt /app/
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django entrypoint and project files.
COPY manage.py /app/
COPY backend/ /app/backend/

EXPOSE 8000

# Download the wait script to ensure MongoDB is ready.
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

# Start the wait script then run gunicorn (adjust the WSGI path if needed)
CMD /wait && daphne -b 0.0.0.0 -p 8000 backend.asgi:application
