PROJECT_CONTEXT_CHAINLOGIC.md

Pełny kontekst projektu Chainlogic / Chainsignal / Kryptosfera

Stan na: grudzień 2025 (po wdrożeniu frontendu na Vercel i API pod api.chainsignal.solutions)

1. Nazwy, role i ogólny cel

Ekosystem (umbrella): Chainlogic Systems

Produkt #1 (aplikacja analityczna): Chainsignal

Backend / API projektu: Kryptosfera
(nazwa robocza backendu, nie używana w UI dla użytkownika)

Główny cel projektu (obecny etap)

Zbudować produkcyjną, portfolio-ready aplikację analityczną dla rynku krypto, która:

Codziennie generuje raporty dla wybranych par (BTC, ETH, SOL, BNB, DASH, TAO, PYTH, HEMI itd.).

Liczy:

zmiany: 24h / 3D / 7D

ATR(3D) i ATR(7D) w procentach

wykrywa ruchy > 8% w 24h i sygnały „big move”.

Wystawia REST API:

/report, /reports/latest, /signals, /predict, /chart, /schedule/run-now.

Ma ładny frontend (Next.js + Tailwind):

dashboard z tabelą raportu,

listą sygnałów,

podstawowym przełącznikiem języka (EN / PL).

Działa w produkcji:

API: https://api.chainsignal.solutions

Frontend: https://chainsignal.solutions (Vercel)

Dalszy cel (roadmapa):
Dodać kalkulator inwestycji + funkcje “pro” dla zalogowanych użytkowników (z użyciem API giełdy i kluczy użytkownika), ale dopiero po ustabilizowaniu obecnych etapów.

2. Architektura high-level
Backend (Kryptosfera)

Stack: Python, FastAPI, APScheduler, pandas, Groq API (LLM), Docker, Nginx, Certbot (Let’s Encrypt).

Hosting: VPS (Hetzner), katalog: /opt/kryptosfera/backend.

Uruchamianie w produkcji: docker-compose (backend + nginx + certbot).

API wystawione przez Nginx pod: https://api.chainsignal.solutions.

Frontend (Chainsignal Dashboard)

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS.

Folder w repo: frontend/

Komunikacja z API: przez NEXT_PUBLIC_API_BASE_URL:

w produkcji: https://api.chainsignal.solutions

lokalnie: zwykle http://localhost:8000 (bez HTTPS).

Hosting frontu: Vercel, spięty z repo GitHub Artur018/Kryptosfera.

3. Backend / Kryptosfera – szczegóły techniczne
3.1. Repo i struktura

Repo: Artur018/Kryptosfera

Kluczowe ścieżki backendu:

backend/app/main.py
Główny plik FastAPI:

definicja aplikacji app = FastAPI(...)

endpointy:

/ – prosty healthcheck: {"status": "OK", "service": "chainlogic-api"}

/report – tekstowy JSON raportu (lista symboli z metrykami).

/reports/latest – najnowszy raport w nowym, ładnym formacie:

{
  "generated_at": "2025-12-09-16-00-06",
  "symbols": [
    {
      "symbol": "TAO",
      "close": 304.8,
      "change_24h": 4.67,
      "change_3d": 8.74,
      "change_7d": 6.83,
      "atr_3d": 1.64,
      "atr_7d": 1.64
    },
    ...
  ]
}


/signals – sygnały > 8% w 24h itd.:

{
  "count": 2,
  "signals": [
    {
      "symbol": "DASH",
      "reasons": ["big_move_24h"],
      "change_24h": 11.87,
      ...
    }
  ]
}


/predict – endpoint wykorzystujący Groq LLM do krótkiej analizy.

/chart – przygotowany endpoint wykresowy (np. do dalszej integracji).

/schedule/run-now – uruchomienie schedulera „na żądanie”.

backend/app/services/analytics.py
Zawiera logikę:

pobieranie danych (póki co mockowane / uproszczone),

przetwarzanie pandas DataFrame,

liczenie:

zmian procentowych 24h / 3D / 7D,

ATR(3D), ATR(7D),

generowanie i zapisywanie raportów do CSV,

funkcja get_latest_report_df() – używana do /reports/latest.

Inne ważne pliki (wg tego, co już robiliśmy w repo):

backend/app/services/ai_predict.py – integracja z Groq.

backend/app/services/discord_notify.py – webhook Discord (powiadomienia).

backend/app/services/scheduler.py – definicja zadań dla APScheduler.

3.2. Scheduler (raporty cykliczne)

Ustawiony APScheduler uruchamiany przy starcie aplikacji.

Harmonogram (log w kontenerze):

🕘 Harmonogram uruchomiony: raporty o 06:00 i 16:00 Europe/Warsaw

Strefa czasowa: Europe/Warsaw

Raporty generowane automatycznie, zapisywane do:

indywidualnych CSV (np. w backend/reports/…)

pliku zbiorczego all_reports.csv (mergowane).

3.3. Docker & uruchamianie backendu
Lokalnie / na VPS (produkcyjnie)

W VPS:

cd /opt/kryptosfera/backend
docker-compose up -d backend nginx


Sprawdzenie logów backendu:

docker-compose logs backend --tail=50


Test API z VPS:

curl -k https://api.chainsignal.solutions/
curl -k https://api.chainsignal.solutions/reports/latest
curl -k "https://api.chainsignal.solutions/signals"

Kluczowe komponenty docker-compose

backend:

image: backend-backend

komenda: uvicorn app.main:app --host 0.0.0.0 --port 8000

nginx:

image: nginx:1.27-alpine

montuje backend/nginx/nginx.conf do /etc/nginx/nginx.conf

wystawia porty:

80 i 443 na hosta

certbot:

do generowania / odnawiania certyfikatów Let’s Encrypt,

webroot: /var/www/certbot.

3.4. Nginx + HTTPS (Let’s Encrypt)

Aktualny koncept konfiguracji (zapisany w backend/nginx/nginx.conf):

Upstream do backendu:

upstream backend_upstream {
    server backend:8000;
}


Server 80 (HTTP) dla api.chainsignal.solutions:

obsługuje ścieżkę /.well-known/acme-challenge/ dla Certbota:

location /.well-known/acme-challenge/ {
    root /var/www/certbot;
    try_files $uri =404;
}


przekierowuje całą resztę na HTTPS:

location / {
    return 301 https://$host$request_uri;
}


Server 443 (HTTPS) dla api.chainsignal.solutions:

certyfikaty:

ssl_certificate     /etc/letsencrypt/live/chainsignal.solutions/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/chainsignal.solutions/privkey.pem;


nagłówki bezpieczeństwa (X-Frame-Options, HSTS itd.).

proxy do backendu:

location / {
    proxy_pass         http://backend_upstream;
    proxy_http_version 1.1;

    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}


Certbot w kontenerze:

cd /opt/kryptosfera/backend
docker-compose run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d api.chainsignal.solutions


Przy odnowieniu system pytał, czy:

Zostawić istniejący certyfikat,

Wymusić odnowienie.

Aktualnie cert jest ważny, więc trzymamy (1).

4. Frontend / Chainsignal – szczegóły techniczne
4.1. Struktura projektu frontend

W repo: frontend/

Kluczowe pliki:

frontend/package.json

frontend/tsconfig.json

frontend/eslint.config.mjs

frontend/next.config.ts

frontend/postcss.config.mjs

frontend/tailwind.config (pośrednio)

frontend/.env.local – lokalne zmienne środowiskowe

frontend/src/app/layout.tsx

frontend/src/app/page.tsx – wrapper strony głównej

frontend/src/app/ChainsignalDashboard.tsx – główny komponent UI (client)

frontend/src/app/globals.css

frontend/src/lib/api.ts – klient do API backendu

4.2. Uruchamianie lokalnie
cd frontend
npm install        # przy pierwszym razie
npm run dev


Dev server:

standardowo: http://localhost:3000

jeśli port zajęty: np. http://localhost:3001 (Next sam zgłasza).

4.3. Integracja z API (src/lib/api.ts)

Typy:

export type ReportSymbolRow = {
  symbol: string;
  close: number;
  change_24h: number;
  change_3d: number;
  change_7d: number;
  atr_3d: number;
  atr_7d: number;
};

export type LatestReport = {
  generated_at: string;
  symbols: ReportSymbolRow[];
};

export type Signal = {
  symbol: string;
  reasons: string[];
  change_24h: number;
  change_3d: number;
  change_7d: number;
  atr_3d: number;
  atr_7d: number;
};


Adres API:

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


Ważne:
Jeśli API_BASE_URL nie jest ustawione (np. na Vercel), front zwraca błąd
Failed to fetch data from API.

Funkcje:

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 60 }, // cache SSR na 60s
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function getLatestReport(): Promise<LatestReport> {
  return fetchJson<LatestReport>("/reports/latest");
}

export async function getSignals(): Promise<Signal[]> {
  const data = await fetchJson<{ count: number; signals: Signal[] }>("/signals");
  return data.signals;
}

4.4. Dashboard i komponenty
page.tsx

Bardzo cienki wrapper (server component) renderujący:

import ChainsignalDashboard from "./ChainsignalDashboard";

export default function Page() {
  return <ChainsignalDashboard />;
}


Dzięki temu:

unikamy problemów typu useSearchParams() w server component bez Suspense,

cała logika UI i klienta jest w ChainsignalDashboard.tsx oznaczonym jako "use client".

ChainsignalDashboard.tsx

Główne rzeczy, które tam są / były:

Pobieranie danych z API (SSR + client / async):

użycie getLatestReport() i getSignals() z lib/api.

Tabela raportu:

kolumny: symbol, cena, 24h%, 3D%, 7D%, ATR(3D), ATR(7D).

highlight dla dużych ruchów.

Lista sygnałów:

bazuje na danych zwróconych z /signals,

pokazuje reasons (np. big_move_24h).

UI:

Tailwind: karty, gradient w tle, layout centralny, responsywny.

Ikony:

docelowo lucide-react (np. Zap dla sygnałów).

4.5. i18n (EN/PL) – aktualny stan

Cel: prosty przełącznik języka EN / PL, bez frameworków i18n.

Koncepcja:

obiekt STRINGS:

const STRINGS = {
  en: { ... },
  pl: { ... },
} as const;


typ języka:

type Lang = "en" | "pl";


stan w komponencie client:

const [lang, setLang] = useState<Lang>("en");
const t = STRINGS[lang];


przycisk przełączający:

<button onClick={() => setLang(lang === "en" ? "pl" : "en")}>
  {lang === "en" ? "PL" : "EN"}
</button>


Problem obecny:
W części UI tłumaczenia działają, ale:

nie wszystkie teksty używają t.*,

część stringów w sekcji „signals” nadal jest na sztywno w EN,

w wersjach, gdzie używany był useSearchParams do odczytania ?lang=pl, Vercel krzyczał:

useSearchParams() should be wrapped in a suspense boundary at page "/"

Kierunek docelowy (do poprawy):

cała treść UI ma czytać z t.*,

można użyć czysto useState + localStorage:

przy initialrender: sprawdzać localStorage.getItem("lang") || "en",

przy zmianie: zapisywać do localStorage,

unikać useSearchParams() w SSR, albo zamknąć w <Suspense> jeśli koniecznie.

5. Domeny i routing

Aktualne założenia:

API (backend):
https://api.chainsignal.solutions
→ trafia na Nginx na VPS → proxy do backend:8000 w Dockerze.

Frontend (dashboard):
https://chainsignal.solutions
→ Vercel projekt powiązany z repo Artur018/Kryptosfera → Next.js frontend.

Powiązanie w frontendzie:

NEXT_PUBLIC_API_BASE_URL pokazuje na:

lokalnie: np. http://localhost:8000

produkcyjnie: https://api.chainsignal.solutions.

6. Git / repo i to, co się działo

Repo: https://github.com/Artur018/Kryptosfera
Branch główny: main

Najważniejsze fakty:

Backend i frontend są w jednym repo:

backend/ – FastAPI + Docker + Nginx

frontend/ – Next.js + Tailwind

Były robione:

commity typu:

Etap 06: HTTPS, nginx reverse proxy, /reports/latest & /signals API

Etap 07: Chainsignal dashboard (Next.js + Tailwind)

próby git pull --rebase origin main, co wywołało konflikty w:

backend/app/services/analytics.py

backend/docker-compose.yml

backend/nginx/nginx.conf

Konflikty zostały ręcznie rozwiązywane, z priorytetem:

zachować:

/reports/latest i /signals w backendzie,

aktualną konfigurację Docker + Nginx + Certbot,

nowy frontend (Next.js + Tailwind) w katalogu frontend/.

Stan, do którego chcemy zawsze wrócić:

git status czysty (brak unmerged paths),

main jest zsynchronizowany z origin/main:

git pull

git push po każdym logicznym kroku.

7. Co działa TERAZ (stan docelowy tego kontekstu)

Backend / API:

Podnosi się w Dockerze na VPS.

Scheduler działa: raporty o 06:00 i 16:00 (Europe/Warsaw).

/reports/latest zwraca poprawny JSON z danymi.

/signals działa i zwraca sygnały zgodnie z logiką (np. ruch > 8%).

Nginx + HTTPS z Let’s Encrypt są skonfigurowane i przetestowane:

curl -k https://api.chainsignal.solutions/ → {"status": "OK", "service": "chainlogic-api"}

Frontend lokalnie:

npm run dev w frontend/ działa,

dashboard ładuje dane z API przy:

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

przełącznik języka działa lokalnie (stan jest w komponencie client).

Frontend produkcyjnie (Vercel):

Projekt spięty z repo Kryptosfera.

Build przechodzi, jeśli:

NEXT_PUBLIC_API_BASE_URL jest ustawione w ustawieniach Vercel na:
https://api.chainsignal.solutions

Strona ładuje się pod domeną (docelowo) https://chainsignal.solutions.

W przypadku złej konfiguracji ENV:

użytkownik widzi komunikat: Failed to fetch data from API.

8. Rzeczy do poprawy / TODO (ważne punkty do powrotu)
8.1. i18n (języki EN / PL)

Problem:

przełącznik języka działa tylko częściowo,

część tekstów (szczególnie w sekcji „Signals”) nie korzysta jeszcze z t.*,

użycie useSearchParams na Vercel powodowało błędy builda.

Plan:

Uprościć mechanizm:

użyć useState<Lang> + localStorage,

zrezygnować z useSearchParams (chyba że będzie potrzebne).

Wszystkie napisy w ChainsignalDashboard.tsx przepiąć na t.*:

nagłówki,

opisy sekcji,

labelki przy wartościach,

komunikaty błędów (Failed to fetch data from API -> EN/PL),

opisy sygnałów (big_move_24h -> np. mapowanie na „ruch > 8% w 24h”).

Dodać prosty mapping reasons → tekst:

np. w lib/api albo w dashboardzie:

const REASONS_LABELS = {
  big_move_24h: {
    en: "24h move > 8%",
    pl: "Ruch 24h > 8%",
  },
  // przyszłe flagi można dopisać
};

8.2. Stabilizacja lokalnego dev dla Next.js

Zdarzały się błędy typu:

Cannot find module '../chunks/ssr/[turbopack]_runtime.js'

problemy z .next/dev/lock itd.

Plan:

w razie problemów:

cd frontend
rm -rf .next
npm run dev


dopisać to w README jako „known issue / fix”.

8.3. Uporządkowanie .gitignore (szczególnie frontend)

Był moment, kiedy:

src/lib/api.ts był przypadkiem ignorowany,

co powodowało brak pliku na GitHubie / Vercelu i błąd:
Module not found: Can't resolve '@/lib/api'.

Plan:

dopilnować, żeby:

frontend/src/lib/api.ts NIE był w .gitignore,

node_modules/ i .next/ były ignorowane,

zrobić commit, który jednoznacznie utrwali strukturę frontu.

8.4. Kalkulator inwestycji (feature na później)

Przypis projektowy (ważne):

Założenie:
„Aplikacja ma mieć funkcję kalkulatora inwestycji, który informuje użytkownika, jak jego inwestycje rozkładają się na osi czasu i podaje średni zysk na dzień.”

Decyzja:
Ten kalkulator będzie:

dostępny tylko dla zarejestrowanych użytkowników,

korzystał z API giełdy + API key użytkownika (np. Binance),

wdrażany po ustabilizowaniu:

API (raporty, sygnały),

frontu (dashboard, i18n),

deployu (Vercel + VPS).

Wstępny zakres kalkulatora (do realizacji w przyszłym etapie):

Integracja z API giełdy (np. Binance) per user.

Zaciągnięcie historii transakcji / PnL.

Agregacja w czasie:

zysk/strata na dzień / tydzień / miesiąc,

wykres wartości portfela.

Obliczenie:

średni zysk na dzień,

ROI,

max drawdown itd.

UI w osobnej zakładce / karcie dashboardu.

9. Etapy (ETAP 01–07) i status

Plan ogólny, który stosujemy (z wcześniejszych ustaleń):

ETAP 01 – Docker i środowisko uruchomieniowe

Dockerfile, docker-compose dla backendu

lokalne dev + produkcja na VPS
Status: ✅ zrobione, backend śmiga w kontenerze.

ETAP 02 – Dane & PostgreSQL

docelowo: baza PostgreSQL + ORM

na razie raporty są trzymane w CSV / pamięci
Status: ⏳ do realizacji później.

ETAP 03 – API produkcyjne i testy

czyste REST API, testy (pytest itp.)
Status: 🟡 częściowo:

API działa w produkcji,

testy automatyczne jeszcze nie wprowadzone.

ETAP 04 – Frontend (Next.js, web + PWA)

nowoczesny interfejs Chainsignal
Status: 🟡 pierwszy dashboard zrobiony, PWA i dalsze widoki – później.

ETAP 05 – AI i interaktywny dashboard

integracja z Groq / LLM,

wyświetlanie predykcji / opisów.
Status: 🟡 backendowy endpoint /predict istnieje, UI jeszcze nie spięte.

ETAP 06 – Wdrożenie (VPS + Nginx + HTTPS + Vercel)

backend na VPS (Hetzner),

HTTPS z Let’s Encrypt,

frontend na Vercel, domeny spięte.
Status: ✅ działa, choć wymaga dopieszczenia ENV / i18n.

ETAP 07 – Dokumentacja i portfolio

README,

opisy architektury,

screeny, demo itd.
Status: 🔄 w toku, ten plik jest częścią tego etapu.

10. Z czym wchodzimy do „nowego okna”

Kiedy w nowym czacie wkleimy ten plik, traktujemy to jako:

Backend jest stabilny:

API działa na api.chainsignal.solutions,

scheduler generuje raporty,

główne endpointy /reports/latest i /signals są naszym „źródłem prawdy”.

Frontend jest działający, ale wymagający dopieszczenia:

dashboard ładuje dane,

w produkcji wszystko działa, pod warunkiem poprawnych ENV na Vercel,

i18n (EN/PL) częściowo zrobione, do dokończenia.

Deploy jest ustawiony:

backend: VPS + Docker + Nginx + Certbot,

frontend: Vercel + repo Kryptosfera + domena chainsignal.solutions.

Następne logiczne kroki w dowolnym nowym oknie:

dokończenie i18n (EN/PL),

dopieszczenie UI (ikonki, mobile view, drobne szczegóły),

przygotowanie krótkiego opisu produktu do README / portfolio,

zaplanowanie i późniejsze wdrażanie kalkulatora inwestycji i funkcji PRO.
