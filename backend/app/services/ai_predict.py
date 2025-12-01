"""
AI Prediction Module for Kryptosfera
------------------------------------

This module integrates the project with the GROQ API (LLaMA model)
to generate natural-language summaries and predictions based on 
market analytics DataFrames.

Functions:
- predict_market(df): Accepts an analytics DataFrame and returns
  a natural-language interpretation using LLaMA (via GROQ API).

Environment Variables Required:
- GROQ_API_KEY – your authentication key for GROQ API.

Notes:
- This module intentionally avoids using OpenAI client. 
  GROQ client is faster, cheaper (or free), and well-suited 
  for production forecasts and summaries.
"""

import os
from groq import Groq


def predict_market(df):
    """
    Generate a natural-language summary based on market data.

    Parameters
    ----------
    df : pandas.DataFrame
        A DataFrame that contains computed analytics for multiple symbols.
        Typically includes columns such as:
        - Close
        - 24h%
        - 3D%
        - 7D%
        - ATR(3D)%
        - ATR(7D)%

    Returns
    -------
    str
        A natural-language explanation produced by the LLaMA model.
        If API key is missing, returns an error dictionary instead.

    Description
    -----------
    The function transforms a DataFrame into a readable textual prompt
    and sends it to the LLaMA model hosted on GROQ's inference API.

    The model responds with:
    - trend detection
    - volatility analysis
    - directional insights
    - a compact, Polish-language summary
    
    Examples
    --------
    >>> predict_market(df)
    "Rynek wykazuje umiarkowaną zmienność..."

    """
    api_key = os.getenv("GROQ_API_KEY")

    # Validate API key presence
    if not api_key:
        return {"error": "Missing GROQ_API_KEY"}

    # Initialize GROQ client
    client = Groq(api_key=api_key)

    # Convert DataFrame to string for cleaner prompt injection
    df_string = df.to_string()

    # LLaMA prompt construction
    prompt = f"""
    Oto dane rynkowe kryptowalut (ostatnie wartości i zmiany):
    {df_string}

    Na podstawie danych:
    - wykryj trend,
    - oceń zmienność,
    - podaj potencjalne sygnały rynkowe,
    - zwięźle podsumuj sytuację.

    Odpowiedź proszę sformułować w języku polskim, krótko i rzeczowo.
    """

    # GROQ LLaMA inference call
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "Jesteś profesjonalnym analitykiem rynku kryptowalut."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500
    )

    # Return generated text output
    return completion.choices[0].message["content"]
