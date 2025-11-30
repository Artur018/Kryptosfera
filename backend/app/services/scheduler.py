"""Harmonogram raportów wykorzystujący APScheduler.

Dwa zadania dziennie, bez ręcznego pisania pętli. AsyncIOScheduler
działa z FastAPI, więc trzymamy jedną instancję na poziomie modułu
i sterujemy start/stop z poziomu aplikacji.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from zoneinfo import ZoneInfo
from datetime import datetime
import os

from services.analytics import generate_report, save_report_csv, merge_all_reports
from services.charts import generate_chart
from services.discord_notify import send_discord_message, send_discord_file

scheduler: AsyncIOScheduler | None = None


def _fmt_table(df):
    """Zwięzła tabelka do Discorda."""
    cols = ["Symbol", "Close", "24h%", "3D%", "7D%", "ATR(3D)%", "ATR(7D)%"]
    cols = [c for c in cols if c in df.columns]
    return df[cols].to_string(index=False)


def _generate_top3_chart(df):
    """Tworzy wykres dla top-3 tokenów wg wzrostu 24h."""
    try:
        top3 = df.sort_values(by="24h%", ascending=False).head(3)
        symbols = top3["Symbol"].tolist()
        chart_path = generate_chart(symbols, column="24h%")
        return chart_path
    except Exception as e:
        print(f"⚠️ Nie udało się utworzyć wykresu: {e}")
        return None


def _job_daily_report(symbols: list[str], label: str):
    """Główna funkcja wykonywana o 6:00 i 16:00."""
    try:
        df = generate_report(symbols)
        save_report_csv(df)
        merge_all_reports()

        chart_path = _generate_top3_chart(df)

        now_pl = datetime.now(ZoneInfo("Europe/Warsaw")).strftime("%Y-%m-%d %H:%M")
        msg = f"📊 **{label} raport Binance ({now_pl})**\n```{_fmt_table(df)}```"

        # Tekst raportu
        send_discord_message(msg)

        # Wykres top 3 – jeśli udało się go wygenerować
        if chart_path and os.path.exists(chart_path):
            send_discord_message("📈 **Wykres top 3 wzrostów 24h:**")
            # używamy gotowej funkcji z services.discord_notify
            send_discord_file(chart_path)

        print(f"✅ {label} raport wygenerowany i wysłany o {now_pl}.")
        return True

    except Exception as e:
        print(f"❌ Błąd podczas generowania raportu ({label}): {e}")


def start_scheduler(symbols: list[str]):
    """Uruchamia dwa harmonogramy dziennie (06:00 i 16:00)."""
    global scheduler
    if scheduler is not None:
        return scheduler

    scheduler = AsyncIOScheduler(timezone=ZoneInfo("Europe/Warsaw"))

    scheduler.add_job(
        _job_daily_report,
        "cron",
        hour=6,
        minute=0,
        args=[symbols, "Poranny"],
    )
    scheduler.add_job(
        _job_daily_report,
        "cron",
        hour=16,
        minute=0,
        args=[symbols, "Popołudniowy"],
    )

    scheduler.start()
    print("🕘 Harmonogram uruchomiony: raporty o 06:00 i 16:00 Europe/Warsaw")
    return scheduler


def shutdown_scheduler():
    """Bezpieczne zatrzymanie harmonogramu przy zamykaniu aplikacji."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        scheduler = None
        print("🛑 Harmonogram zatrzymany.")
