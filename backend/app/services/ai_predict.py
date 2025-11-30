"""Integracja z OpenAI odpowiedzialna za prognozę rynku.

Zostawiłem moduł maksymalnie prosty: importuję klienta raz na poziomie
modułu i konfiguruję go z `.env`, aby uniknąć kosztownego tworzenia
instancji przy każdym żądaniu. Wymuszam markdown-owy raport wejściowy,
bo taki układ najlepiej radzi sobie z danymi tabelarycznymi w modelach
GPT i pozwala zachować spójny kontekst niezależnie od ilości kolumn.
"""

from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def predict_market(report_df):
    """Analiza raportu i przewidywania AI."""
    prompt = f"""
Przeanalizuj poniższą tabelę kryptowalut i przewidź, które mogą wzrosnąć w ciągu 7 dni:
{report_df.to_markdown(index=False)}
Zwróć krótkie podsumowanie w języku polskim.
"""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content
