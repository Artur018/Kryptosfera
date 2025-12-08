"""Warstwa analityczna zbierająca i transformująca dane z Binance.

W tym module łączę kilka kroków w jednym miejscu:
1. pobieranie świeżych świec, bo zależy mi na pełnej kontroli nad
   parametrami (okres, interwał),
2. wyliczanie wskaźników zmienności (ATR) – przydaje się do oceny ryzyka,
3. konsekwentne zapisywanie raportów CSV oraz scalanie historycznych
   wyników, by reszta systemu mogła bazować na gotowych plikach.

Wszystkie katalogi tworzę zawczasu, by wyeliminować błędy IO i pozwolić
na uruchomienia w świeżym środowisku CI/CD bez dodatkowych kroków.
"""
import os
from pathlib import Path
from typing import List, Dict
import pandas as pd
import numpy as np
import glob
from datetime import datetime, timedelta
from binance.client import Client
from dotenv import load_dotenv


os.makedirs("data/reports", exist_ok=True)
os.makedirs("data/charts", exist_ok=True)

# --- Konfiguracja Binance ---
load_dotenv()
client = Client(
    api_key=os.getenv("BINANCE_API_KEY"),
    api_secret=os.getenv("BINANCE_API_SECRET")
)


# ============================================================
# Pobieranie danych z Binance
# ============================================================
def get_historical_data(symbol, interval=Client.KLINE_INTERVAL_1HOUR, days=30):
    """Pobiera dane historyczne dla symbolu z Binance."""
    klines = client.get_historical_klines(symbol, interval, f"{days} day ago UTC")
    df = pd.DataFrame(klines, columns=[
        "time","open","high","low","close","volume",
        "_","_","_","_","_","_"
    ])
    df["time"] = pd.to_datetime(df["time"], unit='ms')
    df[["open","high","low","close","volume"]] = df[["open","high","low","close","volume"]].astype(float)
    return df[["time","open","high","low","close","volume"]]

# ============================================================
# Obliczanie ATR (Average True Range)
# ============================================================
def atr(df, period=14):
    df = df.copy()
    df.loc[:, 'H-L'] = df['high'] - df['low']
    df.loc[:, 'H-PC'] = abs(df['high'] - df['close'].shift(1))
    df.loc[:, 'L-PC'] = abs(df['low'] - df['close'].shift(1))
    df.loc[:, 'TR'] = df[['H-L','H-PC','L-PC']].max(axis=1)
    df.loc[:, 'ATR'] = df['TR'].rolling(window=period).mean()
    return df['ATR'].iloc[-1]

# ============================================================
# Generowanie raportu
# ============================================================
def generate_report(symbols):
    rows = []
    for sym in symbols:
        try:
            print(f"🔍 Pobieram dane dla {sym}...")
            df = get_historical_data(f"{sym}USDT", days=30)
            print(f"✅ Dane OK: {len(df)} rekordów dla {sym}")

            close = df['close'].iloc[-1]
            pct_24h = (df['close'].iloc[-1] - df['close'].iloc[-25]) / df['close'].iloc[-25] * 100
            pct_3d = (df['close'].iloc[-1] - df['close'].iloc[-73]) / df['close'].iloc[-73] * 100
            pct_7d = (df['close'].iloc[-1] - df['close'].iloc[-169]) / df['close'].iloc[-169] * 100
            atr_3d = atr(df.tail(72))
            atr_7d = atr(df.tail(168))
            atr_3d_pct = (atr_3d / close) * 100
            atr_7d_pct = (atr_7d / close) * 100

            rows.append({
                "Symbol": sym,
                "Close": f"{close:.2f}",
                "24h%": f"{pct_24h:.2f}%",
                "3D%": f"{pct_3d:.2f}%",
                "7D%": f"{pct_7d:.2f}%",
                "ATR(3D)%": f"{atr_3d_pct:.2f}%",
                "ATR(7D)%": f"{atr_7d_pct:.2f}%"
            })
        except Exception as e:
            print(f"❌ Błąd dla {sym}: {e}")

    print(f"📊 Zebrano {len(rows)} wierszy.")
    df = pd.DataFrame(rows)
    df = df.sort_values(by="24h%", ascending=False)
    print(df)
    return df


# ============================================================
# Zapis raportu
# ============================================================
def save_report_csv(df):
    folder_path = os.path.join("data", "reports")
    os.makedirs(folder_path, exist_ok=True)

    today = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    df["report_date"] = today

    filename = f"report_{today}.csv"
    file_path = os.path.join(folder_path, filename)
    df.to_csv(file_path, index=False)

    print(f"✅ Raport zapisany: {file_path}")

# ============================================================
# Scalanie raportów
# ============================================================
def merge_all_reports():
    """
    Merge all CSV reports from data/reports into a single all_reports.csv file.

    - Normalizes column names (Symbol -> symbol).
    - Ensures a 'report_date' column exists (based on filename if missing).
    - Drops duplicates based on available keys.
    - Sorts in a reasonable order for analysis.
    """
    reports_dir = "data/reports"
    pattern = os.path.join(reports_dir, "report_*.csv")
    files = glob.glob(pattern)

    if not files:
        print("⚠️ Brak plików raportów do połączenia.")
        return

    frames = []

    for path in files:
        try:
            df = pd.read_csv(path)

            # Normalizacja nazwy kolumny z symbolem
            if "symbol" not in df.columns and "Symbol" in df.columns:
                df["symbol"] = df["Symbol"]

            # Ustal report_date – jeśli nie ma, użyj stempla z nazwy pliku
            if "report_date" not in df.columns:
                # np. report_2025-12-01-20-08-00.csv -> 2025-12-01-20-08-00
                base = os.path.basename(path)
                ts = base.replace("report_", "").replace(".csv", "")
                df["report_date"] = ts

            frames.append(df)

        except Exception as e:
            print(f"⚠️ Problem z plikiem {path}: {e}")

    if not frames:
        print("⚠️ Nie udało się wczytać żadnego raportu.")
        return

    merged_df = pd.concat(frames, ignore_index=True)

    # Dedup tylko po kolumnach, które faktycznie istnieją
    subset_cols = []
    for col in ["symbol", "report_date"]:
        if col in merged_df.columns:
            subset_cols.append(col)

    if subset_cols:
        merged_df.drop_duplicates(subset=subset_cols, inplace=True)

    # Sortuj też tylko po istniejących kolumnach
    sort_cols = [col for col in ["report_date", "symbol"] if col in merged_df.columns]
    if sort_cols:
        merged_df.sort_values(by=sort_cols, inplace=True)

    # Zapisz wynik
    out_path = "data/all_reports.csv"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    merged_df.to_csv(out_path, index=False)
    print(f"✅ Połączono {len(files)} raportów -> {out_path}")
    
REPORTS_DIR = Path("data/reports")


def get_latest_report_df() -> pd.DataFrame:
    """
    Zwraca DataFrame z najnowszego pliku raportu w data/reports/.
    Zakładamy nazewnictwo report_YYYY-MM-DD-HH-MM-SS.csv
    """
    if not REPORTS_DIR.exists():
        raise FileNotFoundError("Katalog data/reports nie istnieje")

    report_files = sorted(REPORTS_DIR.glob("report_*.csv"))
    if not report_files:
        raise FileNotFoundError("Brak plików raportów w data/reports")

    latest = report_files[-1]
    df = pd.read_csv(latest)

    # opcjonalnie dorzucamy kolumnę z timestampem pliku
    df["generated_at"] = latest.stem.replace("report_", "")
    return df


def df_to_latest_report_payload(df: pd.DataFrame) -> Dict:
    """
    Konwertuje DataFrame z raportem na JSON gotowy pod API.
    Oczekiwane kolumny:
    Symbol, Close, 24h%, 3D%, 7D%, ATR(3D)%, ATR(7D)%
    """
    generated_at = str(df["generated_at"].iloc[0]) if "generated_at" in df.columns else None

    payload = {
        "generated_at": generated_at,
        "symbols": []
    }

    for _, row in df.iterrows():
        payload["symbols"].append(
            {
                "symbol": row.get("Symbol"),
                "close": row.get("Close"),
                "change_24h": row.get("24h%"),
                "change_3d": row.get("3D%"),
                "change_7d": row.get("7D%"),
                "atr_3d": row.get("ATR(3D)%"),
                "atr_7d": row.get("ATR(7D)%"),
            }
        )

    return payload


def detect_signals_from_df(
    df: pd.DataFrame,
    change_24h_threshold: float = 8.0,
    atr_7d_threshold: float = 7.0,
) -> List[Dict]:
    """
    Bardzo prosta logika sygnałów:
    - big_move_24h: |24h%| >= change_24h_threshold
    - high_atr_7d: ATR(7D)% >= atr_7d_threshold
    """
    signals: List[Dict] = []

    for _, row in df.iterrows():
        reasons = []

        change_24h = row.get("24h%")
        atr_7d = row.get("ATR(7D)%")

        if change_24h is not None and abs(change_24h) >= change_24h_threshold:
            reasons.append("big_move_24h")

        if atr_7d is not None and atr_7d >= atr_7d_threshold:
            reasons.append("high_atr_7d")

        if not reasons:
            continue

        signals.append(
            {
                "symbol": row.get("Symbol"),
                "reasons": reasons,
                "change_24h": change_24h,
                "change_3d": row.get("3D%"),
                "change_7d": row.get("7D%"),
                "atr_3d": row.get("ATR(3D)%"),
                "atr_7d": atr_7d,
            }
        )

    return signals
