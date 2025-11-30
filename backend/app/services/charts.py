"""Generowanie wykresów z raportów CSV.

Moduł został odseparowany od warstwy API, aby obsłużyć zarówno
automatyczne wykresy (scheduler) jak i ręczne zapytania użytkownika.
Najpierw szukamy zbiorczego `all_reports.csv`, a gdy go brakuje, sięgamy
po najnowszy raport jednostkowy – to eliminuje zaskoczenia w świeżych
instancjach. Dane zawsze trafiają do katalogu `data/charts`, żeby panel
Streamlit i wysyłka na Discorda korzystały z tej samej lokalizacji.
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
os.makedirs("data/reports", exist_ok=True)
os.makedirs("data/charts", exist_ok=True)

# =========================
# Ustawienia ścieżek
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
REPORTS_DIR = os.path.join(DATA_DIR, "reports")
CHARTS_DIR = os.path.join(DATA_DIR, "charts")
ALL_REPORTS_FILE = os.path.join(DATA_DIR, "all_reports.csv")

# =========================
# Pomocnicze: znajdź najnowszy raport dzienny
# =========================
def get_latest_daily_report():
    if not os.path.exists(REPORTS_DIR):
        return None
    files = [f for f in os.listdir(REPORTS_DIR) if f.startswith("report_") and f.endswith(".csv")]
    if not files:
        return None
    files.sort(reverse=True)
    latest = os.path.join(REPORTS_DIR, files[0])
    return latest

# =========================
# Główna funkcja wykresu
# =========================
def generate_chart(symbols=None, column="close", scale="linear"):
    """
    Tworzy wykres dla wybranych kryptowalut.
    Jeśli brak all_reports.csv, używa najnowszego raportu dziennego.
    Dostępne skale: 'linear' (domyślna), 'log'
    """
    os.makedirs(CHARTS_DIR, exist_ok=True)
    df = None

    # 1️⃣ próbujemy all_reports.csv
    if os.path.exists(ALL_REPORTS_FILE):
        try:
            df = pd.read_csv(ALL_REPORTS_FILE)
        except Exception as e:
            print(f"⚠️ Błąd wczytywania all_reports.csv: {e}")

    # 2️⃣ jeśli nie ma all_reports, weź najnowszy raport
    if df is None or df.empty:
        latest_file = get_latest_daily_report()
        if latest_file:
            print(f"ℹ️ Używam najnowszego raportu: {latest_file}")
            df = pd.read_csv(latest_file)
        else:
            print("❌ Brak danych raportów do wykresu.")
            return None

    # 3️⃣ sprawdź kolumny
    if column not in df.columns:
        column = column.capitalize()
        print(f"⚠️ Kolumna '{column}' nie istnieje w danych.")
        print(f"📄 Dostępne kolumny: {list(df.columns)}")
        return None

    # ✅ Naprawa daty — obsługuje format z godziną
    if "report_date" in df.columns:
        try:
            df["report_date"] = pd.to_datetime(df["report_date"], format="%Y-%m-%d-%H-%M-%S", errors="coerce")
        except Exception:
            df["report_date"] = pd.to_datetime(df["report_date"], errors="coerce")
    else:
        df["report_date"] = datetime.now()

    df = df.dropna(subset=["report_date"])

    # ✅ Konwersja kolumny do liczbowej (usuwa znaki % itp.)
    df[column] = (
        df[column]
        .astype(str)
        .str.replace("%", "", regex=False)
        .astype(float)
    )

    # 4️⃣ filtr symboli
    if symbols:
        symbols = [s.strip().upper() for s in symbols]
        df = df[df["symbol"].isin(symbols)]
    else:
        symbols = df["symbol"].unique().tolist()

    if df.empty:
        print("⚠️ Brak danych dla wybranych symboli.")
        return None

    # 5️⃣ generowanie wykresu
    plt.figure(figsize=(10, 5))
    for symbol in symbols:
        token_df = df[df["symbol"] == symbol]
        if not token_df.empty:
            plt.plot(token_df["report_date"], token_df[column], label=symbol, marker='o')

    plt.title(f"{column} dla {', '.join(symbols)}")
    plt.xlabel("Data")
    plt.ylabel(column)
    plt.legend()
    plt.grid(True)

    # 🧠 Skala logarytmiczna
    if scale == "log":
        plt.yscale("log")

    filename = f"chart_{'_'.join(symbols)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    chart_path = os.path.join(CHARTS_DIR, filename)
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()

    print(f"✅ Wykres zapisany: {chart_path}")
    return chart_path
