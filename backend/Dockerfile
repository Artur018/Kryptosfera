FROM python:3.11-slim

WORKDIR /app

# systemowe zale¿noœci (matplotlib, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# kopiujemy kod
COPY app ./app
COPY services ./services
COPY data ./data

# ¿eby mieæ katalogi na raporty / wykresy
RUN mkdir -p data/reports data/charts

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]