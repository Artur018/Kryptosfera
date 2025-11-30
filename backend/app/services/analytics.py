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

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from binance.client import Client
from dotenv import load_dotenv
import os

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
    folder_path = os.path.join("data", "reports")
    merged_file = os.path.join("data", "all_reports.csv")

    if not os.path.exists(folder_path):
        print("⚠️ Folder 'data/reports' nie istnieje — brak plików do połączenia.")
        return

    files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith(".csv")]
    if not files:
        print("⚠️ Brak plików raportów do połączenia.")
        return

    df_list = []
    for file in files:
        try:
            df = pd.read_csv(file)
            df_list.append(df)
        except Exception as e:
            print(f"❌ Błąd wczytywania {file}: {e}")

    if not df_list:
        print("⚠️ Nie udało się połączyć raportów (puste pliki?).")
        return

    merged_df = pd.concat(df_list, ignore_index=True)
    merged_df.drop_duplicates(subset=["symbol", "report_date"], inplace=True)
    merged_df.sort_values(by=["report_date", "symbol"], inplace=True)

    merged_df.to_csv(merged_file, index=False)
    print(f"✅ Połączono {len(files)} raportów -> {merged_file}")
