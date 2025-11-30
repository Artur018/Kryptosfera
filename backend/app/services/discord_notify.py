"""Integracja z Discord webhookiem.

Oddzieliłem logikę wyciągania sekretu (`_get_webhook`) od funkcji
wysyłających, żeby można je było mockować podczas testów i łatwo
przekierować w przyszłości na inny kanał. Staram się też nie logować
wrażliwych danych – funkcje informują jedynie o statusach i kodach HTTP.
"""

import os
import requests
from dotenv import load_dotenv




def _get_webhook() -> str | None:
    """Pobiera URL webhooka z env. Nie loguje wartości sekretu."""
    # Dopuszczamy .env tylko lokalnie / dev; w produkcji ustaw przez env/secrets.
    load_dotenv(override=False)
    url = os.getenv("DISCORD_WEBHOOK")
    return url




def send_discord_message(content: str) -> None:
    url = _get_webhook()
    if not url:
        print("⚠️ Brak zmiennej środowiskowej DISCORD_WEBHOOK – pomijam wysyłkę.")
        return
    try:
        resp = requests.post(url, json={"content": content}, timeout=10)
        if resp.status_code not in (200, 204):
            print(f"❌ Błąd Discord ({resp.status_code}): {resp.text[:200]}")
    except Exception as e:
        print(f"⚠️ Błąd połączenia z Discordem: {e}")




def send_discord_file(file_path: str, content: str | None = None, filename: str | None = None) -> None:
    url = _get_webhook()
    if not url:
        print("⚠️ Brak zmiennej środowiskowej DISCORD_WEBHOOK – pomijam wysyłkę pliku.")
        return
    if not os.path.exists(file_path):
        print(f"⚠️ Plik nie istnieje: {file_path}")
        return
    try:
        with open(file_path, "rb") as f:
            files = {"file": (filename or os.path.basename(file_path), f)}
            data = {"content": content} if content else {}
            resp = requests.post(url, data=data, files=files, timeout=20)
        if resp.status_code not in (200, 204):
            print(f"❌ Błąd Discord ({resp.status_code}): {resp.text[:200]}")
    except Exception as e:
        print(f"⚠️ Błąd wysyłki pliku do Discorda: {e}")