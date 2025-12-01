FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Warsaw

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY nginx ./nginx
COPY cleanup.sh ./cleanup.sh

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

