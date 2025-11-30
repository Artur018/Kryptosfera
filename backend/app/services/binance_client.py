"""Pojedyncza konfiguracja klienta Binance.

Chcę mieć jedno miejsce, w którym ładuję zmienne środowiskowe i tworzę
obiekt `Client`. Dzięki temu reszta modułów może importować gotową
instancję i nie martwić się o limity API wynikające z wielokrotnego
logowania. Utrzymuję też pomocniczą funkcję `get_prices`, która zwraca
czysty słownik – to ułatwia serializację np. do JSON-a.
"""

import os
from binance.client import Client
from dotenv import load_dotenv

load_dotenv()

client = Client(
    api_key=os.getenv("BINANCE_API_KEY"),
    api_secret=os.getenv("BINANCE_API_SECRET")
)

def get_prices(symbols):
    """Pobiera aktualne ceny wybranych kryptowalut."""
    tickers = client.get_all_tickers()
    data = {t['symbol']: float(t['price']) for t in tickers if t['symbol'] in symbols}
    return data

