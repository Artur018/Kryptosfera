FROM python:3.11-slim

WORKDIR /app

# Systemowe zależności (jeśli coś kompilujemy)
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
 && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Aplikacja
COPY app ./app
COPY nginx ./nginx
COPY cleanup.sh ./cleanup.sh

ENV TZ=Europe/Warsaw

# Domyślny start: FastAPI przez Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
