# Kryptosfera / Chainsignal / Chainlogic – Project Context

## 1. Nazwy i branding

- **Chainlogic Systems** – “firma-matka” / organizacja parasolowa.
- **Chainsignal** – pierwszy produkt:
  - SaaS / dashboard do analizy rynku krypto,
  - raporty, alerty, przyszłościowo: rekomendacje grid-botów, token-gating, smart kontrakty.
- **Kryptosfera** – nazwa serwera / projektu technicznego (VPS + backend).

Domeny:
- `chainsignal.solutions` – główna domena produktu (docelowo frontend + API).
- `chainlogic.systems` – domena dla warstwy “organizacyjnej” / ekosystemu (na później).

---

## 2. Backend – stack i funkcje

### 2.1. Technologia

- **Język**: Python 3.11
- **Framework**: FastAPI + Uvicorn
- **Uruchamianie**: w kontenerze Dockera
- **Moduły kluczowe**:
  - `app/main.py` – główna aplikacja FastAPI
  - `app/services/binance_client.py` – integracja z Binance (pobieranie danych OHLC etc.)
  - `app/services/analytics.py` – obliczenia analityczne:
    - zmiany procentowe 24h / 3D / 7D,
    - ATR (3D, 7D),
    - generowanie raportów jako CSV.
  - `app/services/scheduler.py` – harmonogram raportów (APScheduler).
  - `app/services/discord_notify.py` – wysyłanie raportów / predykcji na Discord webhook.
  - `app/services/ai_predict.py` – integracja z **Groq API** (LLaMA) do generowania podsumowań rynku.

### 2.2. Endpoints (API)

Aktualne kluczowe endpointy FastAPI:

- `GET /`  
  Prosty endpoint informacyjny / health-check.

- `GET /report`  
  - Generuje nowy raport:
    - pobiera dane z Binance dla wybranych symboli (BTC, ETH, SOL, BNB, TAO, DASH, HEMI, PYTH),
    - liczy zmiany procentowe i ATR,
    - zapisuje raport do `data/reports/report_YYYY-MM-DD-HH-MM-SS.csv`,
    - aktualizuje `data/all_reports.csv` (merge wszystkich raportów).
  - Zwraca aktualny raport w JSON (w tym tabelę zbiorczą z kolumnami typu:
    - `Symbol`, `Close`, `24h%`, `3D%`, `7D%`, `ATR(3D)%`, `ATR(7D)%`).

- `GET /predict`  
  - Generuje **AI podsumowanie rynku** na podstawie aktualnego raportu.
  - Wykorzystuje Groq (model LLaMA) do wygenerowania krótkiej analizy w języku polskim:
    - trend,
    - zmienność,
    - potencjalne sygnały rynkowe.
  - Wysyła tę predykcję na **Discord webhook**.
  - Docelowo ta sekcja będzie rozbudowana o:
    - propozycje par do grid-botów,
    - wskazanie najlepszych okazji tradingowych w momencie wywołania,
    - możliwość automatycznego wysyłania powiadomień, gdy rynek zaczyna się “ruszać”.

### 2.3. Scheduler

- W `scheduler.py` użyty jest **APScheduler**.
- Aktualne czasy:
  - raporty odpalane **dwa razy dziennie**: o `06:00` i `16:00` czasu `Europe/Warsaw`.
- Scheduler startuje razem z backendem (log:  
  `🕘 Harmonogram uruchomiony: raporty o 06:00 i 16:00 Europe/Warsaw`).

---

## 3. VPS / Docker / Infrastrukturа

### 3.1. VPS

- Dostawca: **Hetzner**
- Plan: **CX23** (2 vCPU, 4 GB RAM – wystarczające na backend + nginx + certbot).
- System: Ubuntu (22.04 / 24.04 – stabilna wersja LTS).
- Użytkownik:
  - `root` – tylko do administracji.
  - `kryptosfera` – główny użytkownik roboczy.
- Lokalizacja projektu na VPS:
  - `/opt/kryptosfera`
  - w środku:
    - `backend/`
    - `README.md`
    - (opcjonalnie dalsze podkatalogi w przyszłości: `frontend/` itd.)

### 3.2. Docker / docker-compose

- Docker jest zainstalowany na VPS.
- Używany jest **docker-compose v2** (`docker-compose` dostępne jako plugin).
- Projekt backendu:
  - Katalog: `/opt/kryptosfera/backend`
  - Pliki:
    - `Dockerfile`
    - `docker-compose.yml`
    - `nginx/nginx.conf`
    - `app/…`
    - `requirements.txt`
    - `data/` (raporty, dane wyjściowe).

#### Obecny `docker-compose.yml` (stan bazowy)

- Serwis `backend`:
  - `container_name: kryptosfera-backend`
  - `build: .`
  - `restart: always`
  - `ports: "8000:8000"`
  - `environment`:
    - `TZ=Europe/Warsaw`
    - `BINANCE_API_KEY` (z systemowego env)
    - `BINANCE_API_SECRET`
    - `DISCORD_WEBHOOK`
    - `GROQ_API_KEY`
  - `volumes`:
    - `./data:/app/data` (raporty są trwałe na VPS).

- Serwis `nginx`:
  - `image: nginx:1.27-alpine`
  - `container_name: kryptosfera-nginx`
  - `restart: unless-stopped`
  - `depends_on: backend`
  - `ports: "80:80"`
  - `volumes`:
    - `./nginx/nginx.conf:/etc/nginx/nginx.conf:ro`

### 3.3. Aktualny stan backendu

- Backend w kontenerze działa, logi pokazują:
  - start Uvicorna na `0.0.0.0:8000`,
  - poprawne działanie schedulera,
  - pobieranie danych z Binance,
  - generowanie raportów,
  - działający endpoint `/report`,
  - działający endpoint `/predict` z Groq (`llama-3.1-8b-instant`).

---

## 4. Sekrety i zmienne środowiskowe

Sekrety **nie są trzymane w `.env`** (ze względów bezpieczeństwa).  
Zamiast tego:

- Na VPS zmienne są ustawione w środowisku powłoki (np. `~/.bashrc` lub `/etc/environment`):

  - `BINANCE_API_KEY`
  - `BINANCE_API_SECRET`
  - `DISCORD_WEBHOOK`
  - `GROQ_API_KEY`
  - `TZ=Europe/Warsaw`

- Docker używa ich przez sekcję `environment` w `docker-compose.yml`:
  - np. `BINANCE_API_KEY: ${BINANCE_API_KEY}`

Klucze:
- nie są commitowane do GitHuba,
- są widoczne lokalnie tylko przez komendy typu `echo $ENVVAR`.

---

## 5. SSH i bezpieczeństwo VPS (stan)

- Dostęp do VPS:
  - użytkownik `kryptosfera` loguje się przez **SSH kluczem**, bez hasła.
- W pliku `/etc/ssh/sshd_config`:
  - `PasswordAuthentication` jest wyłączone (logowanie hasłem zablokowane).
- Klucz SSH:
  - para wygenerowana lokalnie (np. `id_ed25519`),
  - publiczny klucz dodany do `~/.ssh/authorized_keys` na serwerze.
- Po stronie lokalnej:
  - VS Code / terminal używa klucza automatycznie.

Hardening, który już jest:
- brak logowania hasłem,
- praca na użytkowniku nie-root (do codziennych zadań).

Hardening do zrobienia (TODO):
- `ufw` (firewall) z otwartymi tylko niezbędnymi portami (22, 80, 443),
- `fail2ban` (ochrona przed brute-force na SSH / HTTP),
- ograniczenie spam-botów w nginx (widoczne próby dostępu do `/cgi-bin` itd.).

---

## 6. Domena i DNS

Domena główna:
- `chainsignal.solutions`

Plan:
1. Ustawić rekord **A**:
   - `chainsignal.solutions` → `46.224.62.108` (adres VPS).
2. (Opcjonalnie) rekord **AAAA** dla IPv6, jeśli jest potrzebny.

Po stronie serwera:
- nginx będzie obsługiwać ruch HTTP/HTTPS na tej domenie.
- backend będzie ukryty za reverse-proxy (dostęp tylko z sieci dockerowej).

---

## 7. Decyzja architektoniczna – nginx + certbot w Docker (Opcja B)

Wybrana strategia:

> **Nginx + certbot będą działały w kontenerach Docker (docker-compose).**

Cele:
- pełen stack (backend + reverse proxy + certbot) kontrolowany przez `docker-compose`,
- automatyczne odnawianie certyfikatów Let’s Encrypt,
- HTTPS na `chainsignal.solutions`,
- backend nadal na porcie 8000, niewystawiony na zewnątrz bezpośrednio.

Planowana struktura usług w `docker-compose.yml` (docelowo):

- `backend` – FastAPI + Uvicorn (już działa).
- `nginx` – reverse proxy:
  - nasłuch na portach `80` i `443`,
  - obsługa domeny `chainsignal.solutions`,
  - przekazywanie ruchu do `backend:8000`,
  - HTTP → redirect na HTTPS.
- `certbot` – kontener do:
  - uzyskania certyfikatu Let’s Encrypt (metoda `webroot`),
  - odnawiania certyfikatów.

Planowane wolumeny dla TLS:
- `./certbot/conf:/etc/letsencrypt`
- `./certbot/www:/var/www/certbot`
- konfiguracja nginx tak, aby:
  - `location /.well-known/acme-challenge/` wskazywała na `/var/www/certbot`.

---

## 8. Następne kroki (Etap 6 – wdrożenie ciąg dalszy)

1. **DNS**
   - Ustawić rekord `A` na `chainsignal.solutions` → `46.224.62.108`.

2. **Rozszerzenie `docker-compose.yml`**
   - Dodać wolumeny dla certbot.
   - Dostosować serwis `nginx` do pracy jako TLS terminator.
   - Dodać serwis `certbot` (jednorazowe pobranie certyfikatu + przyszłe odnowienia).

3. **Konfiguracja nginx**
   - Dodać konfigurację serwera dla:
     - `server_name chainsignal.solutions;`
     - `listen 80;` (redirect do HTTPS)
     - `listen 443 ssl;` (certyfikaty z `/etc/letsencrypt/...`).
   - Skonfigurować `proxy_pass` do `http://backend:8000`.

4. **Certyfikat Let’s Encrypt**
   - Użyć certbota (webroot) do uzyskania certyfikatu dla `chainsignal.solutions`.

5. **Hardening HTTP**
   - Ustawić:
     - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` itd. w nginx.
   - Wprowadzić rate-limiting / podstawowe blokady botów.

6. **Frontend (Etap 7 – Next.js PWA)** – przyszły etap
   - Postawić Next.js (np. na Vercel lub również w Dockerze),
   - Skonfigurować komunikację z backendem przez HTTPS (API pod np. `https://api.chainsignal.solutions`).

---
