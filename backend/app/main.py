import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.services.analytics import (
    generate_report,
    save_report_csv,
    merge_all_reports,
    get_latest_report_df,
    df_to_latest_report_payload,
    detect_signals_from_df,
)

from app.services.ai_predict import predict_market
from app.services.discord_notify import send_discord_message
from app.services.charts import generate_chart
from app.services.scheduler import start_scheduler, shutdown_scheduler


app = FastAPI(title="ChainLogic API")

# 💰 Lista kryptowalut do analizy
SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "TAO", "DASH", "HEMI", "PYTH"]

# CORS – frontend na Vercel + lokalnie
origins = [
    "http://localhost:3000",
    "https://dashboard.chainlogic.pl",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "OK", "service": "chainlogic-api"}


@app.get("/report")
def get_report():
    df = generate_report(SYMBOLS)
    save_report_csv(df)
    merge_all_reports()
    send_discord_message(f"📊 **Dzienny raport Binance**\n```{df.to_string(index=False)}```")
    return df.to_dict(orient="records")


@app.get("/predict")
def get_prediction():
    df = generate_report(SYMBOLS)
    summary = predict_market(df)
    send_discord_message(f"🤖 **Prognoza AI:**\n{summary}")
    return {"prediction": summary}


@app.get("/chart")
def get_chart(symbols: str = "BTC,ETH", column: str = "close", scale: str = "linear"):
    symbols_list = [s.strip().upper() for s in symbols.split(",")]
    chart_path = generate_chart(symbols_list, column, scale)
    if not chart_path:
        return {"error": "Brak danych lub nie udało się utworzyć wykresu."}
    return FileResponse(chart_path)



@app.post("/schedule/run-now")
def run_scheduled_now():
    from app.services.scheduler import _job_daily_report

    _job_daily_report(SYMBOLS, "Ręczny")
    return {"status": "Ręczne uruchomienie raportu OK"}


@app.get("/reports/latest")
async def get_latest_report():
    try:
        df = get_latest_report_df()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    payload = df_to_latest_report_payload(df)
    return payload


@app.get("/signals")
async def get_signals(
    change_24h_threshold: float = 8.0,
    atr_7d_threshold: float = 7.0,
):
    try:
        df = get_latest_report_df()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    signals = detect_signals_from_df(
        df,
        change_24h_threshold=change_24h_threshold,
        atr_7d_threshold=atr_7d_threshold,
    )
    return {"count": len(signals), "signals": signals}


# 🔄 Harmonogram (uruchamia się przy starcie serwera)
@app.on_event("startup")
def _on_startup():
    start_scheduler(SYMBOLS)


@app.on_event("shutdown")
def _on_shutdown():
    shutdown_scheduler()
