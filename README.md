# 🧠 A_N_A_L – Algorytmiczna Nowoczesna Analiza Łańcucha

System analizy i raportowania kryptowalut z wykorzystaniem **FastAPI**, **Binance API**, **Discord Webhooków**, **AI (OpenAI GPT)** i **automatycznych harmonogramów**.

---

## 📊 Opis projektu

**A_N_A_L** to nowoczesny system do analizy rynku kryptowalut:
- pobiera dane z **Binance API**
- generuje raporty z ostatnich 24h / 3 dni / 7 dni / 30 dni
- oblicza zmienność (ATR)
- automatycznie wysyła raporty i wykresy na **Discorda**
- generuje prognozy rynkowe przy pomocy **AI (OpenAI GPT-4o-mini)**
- posiada prosty interfejs webowy w **Streamlit (Crypto HUD)**
- obsługuje automatyczne raporty o **06:00 i 16:00 (Europe/Warsaw)**

---

## 🧩 Architektura

📁 projekt/
├── main.py ← serwer FastAPI (backend API)
├── app.py ← frontend Streamlit (dashboard webowy)
├── services/
│ ├── analytics.py ← generowanie raportów, obliczenia ATR
│ ├── ai_predict.py ← analiza AI z OpenAI GPT
│ ├── binance_client.py ← integracja z API Binance
│ ├── charts.py ← generowanie wykresów z raportów
│ ├── discord_notify.py ← powiadomienia na Discord
│ └── scheduler.py ← automatyczny harmonogram raportów
├── data/
│ ├── reports/ ← raporty dzienne CSV
│ ├── charts/ ← zapisane wykresy PNG
│ └── all_reports.csv ← scalenie wszystkich raportów
├── .env ← klucze i konfiguracja
├── requirements.txt ← zależności Pythona
└── README.md


---

## ⚙️ Instalacja

### 1️⃣ Klonowanie projektu
```bash
git clone https://github.com/twoje_repo/A_N_A_L.git
cd A_N_A_L

2️⃣ Utworzenie środowiska

python -m venv venv
source venv/bin/activate      # Linux / macOS
venv\Scripts\activate         # Windows
pip install -r requirements.txt


3️⃣ Konfiguracja .env

Uzupełnij swoje dane w pliku .env:

BINANCE_API_KEY=twoj_klucz
BINANCE_API_SECRET=twoj_secret
DISCORD_WEBHOOK=https://discord.com/api/webhooks/xxx
OPENAI_API_KEY=sk-xxx

🚀 Uruchomienie
Backend FastAPI
uvicorn main:app --reload --port 8000

➡️ Dokumentacja API: http://127.0.0.1:8000/docs

Frontend Streamlit (Crypto HUD)
streamlit run app.py

➡️ Dashboard: http://localhost:8501

⏰ Harmonogram raportów

Plik scheduler.py
 uruchamia automatyczne raporty o:

06:00 (poranny raport)

16:00 (popołudniowy raport)

Każdy raport:

pobiera dane z Binance

generuje plik CSV

aktualizuje all_reports.csv

tworzy wykres Top 3 wzrostów

wysyła raport i wykres na Discord

Można też uruchomić ręcznie:
curl -X POST http://127.0.0.1:8000/schedule/run-now

🧠 Prognoza AI

Endpoint /predict generuje analizę rynku:
curl http://127.0.0.1:8000/predict
Bot wysyła prognozę trendów kryptowalut (po polsku) na Discorda.

📈 Przykładowy workflow

1️⃣ Uruchom serwer FastAPI
2️⃣ Otwórz dashboard Streamlit
3️⃣ Kliknij „Generuj raport” lub „Prognoza AI”
4️⃣ Wyniki pojawią się na ekranie i na Discordzie
5️⃣ Codzienne raporty wysyłane są automatycznie o 06:00 i 16:00

🧱 Zależności
Wymagane pakiety (z requirements.txt):
fastapi
uvicorn
python-binance
pandas
requests
streamlit
openai
python-dotenv
ta


📦 Plan rozwoju (kolejne etapy)

 Docker + Docker Compose (FastAPI + DB)

 Baza danych PostgreSQL

 Frontend Next.js (PWA / mobile)

 Dashboard AI (LangChain / Chat z danymi)

 Publiczne demo (Render + Vercel)

 Dokumentacja i prezentacja portfolio


💬 Autor

Artur [A_N_A_L Project Lead]
Projekt edukacyjno-analityczny 2025
Integracja: Binance + Discord + OpenAI
Tech stack: FastAPI · Python · Streamlit · APScheduler · OpenAI API

🧾 Licencja

Projekt udostępniony na licencji MIT.
Możesz swobodnie korzystać, modyfikować i prezentować w portfolio.

---

Czy chcesz, żebym od razu zapisał ten plik jako `README.md` w Twoim katalogu projektu (gotowy do commitowania na GitHub)?


Docker + docker-compose,

Nginx jako reverse proxy,

Let’s Encrypt (webroot),

auto-renew przez certbot-renew,

ścieżkę uruchomienia na czystym VPS (punkty typu: sklonuj repo, ustaw env, docker-compose up -d, certy, firewall).