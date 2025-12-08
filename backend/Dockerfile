FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# 1. Zależności
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Kod aplikacji – tylko katalog app z backendu
COPY app ./app

# 3. Start serwera – pakiet "app" = katalog /app/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
