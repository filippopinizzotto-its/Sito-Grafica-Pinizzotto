"""
Backend Principale - Sito Grafica Pinizzotto
Gestisce il routing delle pagine web e le API REST del chatbot basato su Google Gemini.
"""
from flask import Flask, render_template, request, jsonify
import os
from pathlib import Path
import urllib.request
import json
import time
import re
import secrets
from functools import wraps
from dotenv import load_dotenv
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", secrets.token_hex(32))

# ── Rate limiting ──
rate_limit_store = {}

def rate_limit(requests_per_minute=20):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or "unknown"
            now = time.time()
            window = 60.0
            key = f"{ip}:{f.__name__}"
            if key not in rate_limit_store:
                rate_limit_store[key] = []
            rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < window]
            if len(rate_limit_store[key]) >= requests_per_minute:
                return jsonify({"success": False, "error": "Troppe richieste. Riprova tra un minuto."}), 429
            rate_limit_store[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ── Security headers ──
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.headers.get("X-Forwarded-Proto", "").startswith("https"):
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "frame-src https://www.google.com; "
        "connect-src 'self' https://generativelanguage.googleapis.com; "
        "form-action 'self' https://formsubmit.co; "
        "base-uri 'self'"
    )
    response.headers["Content-Security-Policy"] = csp
    return response

# ── CORS ──
def get_cors_origins():
    origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000").split(",")
    return [o.strip() for o in origins if o.strip()]

CORS(app, resources={r"/api/*": {"origins": get_cors_origins()}, r"/health": {"origins": get_cors_origins()}})

# ── Gemini config ──
def get_gemini_config():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}" if key else None
    return key, model, url

SYSTEM_PROMPT = """Sei l'assistente AI ufficiale della Grafica Pinizzotto - Azienda Grafica. 
Rispondi in italiano, in modo professionale, amichevole e sintetico (max 3-4 frasi).
Informazioni chiave:
- Sede: Via Nazionale 406/A, Piantedo (SO).
- Telefono: +39 0342 683265.
- Email: info@pinizzotto.it.
- Servizi principali: Stampa offset e digitale, grande formato, packaging, brand identity, depliant, locandine, biglietti da visita.
- Obiettivo: Risolvere i dubbi dei clienti e guidarli verso la richiesta di un preventivo o contatto.
Se non conosci una risposta tecnica specifica improvvisa ma plausibile e invita l'utente a contattare Marcello Pinizzotto via email o telefono."""

MAX_SESSIONS = 1000
MAX_MESSAGES_PER_SESSION = 50
MAX_MESSAGE_LENGTH = 2000
chat_memories = {}

# ==========================================
# ROUTING PAGINE WEB
# ==========================================
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/health")
def health():
    key, model, _ = get_gemini_config()
    gemini_online = False
    if key:
        try:
            check_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
            with urllib.request.urlopen(check_url, timeout=5) as resp:
                gemini_online = resp.status == 200
        except Exception:
            gemini_online = False
    return jsonify({
        "success": True,
        "api_key_loaded": bool(key),
        "gemini_online": gemini_online,
        "model": model,
        "env": os.getenv("FLASK_ENV", "production")
    })

@app.route("/servizi")
def servizi():
    return render_template("servizi.html")

@app.route("/preventivo")
def preventivo():
    return render_template("preventivo.html")

@app.route("/contatti")
def contatti():
    return render_template("contatti.html")

# ==========================================
# ENDPOINT API CHATBOT
# ==========================================
@app.route("/api/chat", methods=["POST"])
@rate_limit(20)
def chat():
    try:
        api_key, model_name, gemini_url = get_gemini_config()

        if not api_key or not gemini_url:
            return jsonify({"success": False, "error": "Chiave API Gemini mancante."}), 500

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "Richiesta non valida"}), 400

        message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")

        if not message:
            return jsonify({"success": False, "error": "Messaggio vuoto"}), 400

        if len(message) > MAX_MESSAGE_LENGTH:
            return jsonify({"success": False, "error": f"Messaggio troppo lungo (max {MAX_MESSAGE_LENGTH} caratteri)"}), 400

        if not re.match(r'^[\w\-]+$', session_id):
            return jsonify({"success": False, "error": "Session ID non valido"}), 400

        if len(chat_memories) >= MAX_SESSIONS and session_id not in chat_memories:
            for sid in list(chat_memories):
                del chat_memories[sid]
                break

        if session_id not in chat_memories:
            chat_memories[session_id] = [
                {"role": "user", "parts": [{"text": "Ciao e presentati brevissimamente."}]},
                {"role": "model", "parts": [{"text": "Certamente! Sono l'assistente virtuale di Pinizzotto. Come posso aiutarti oggi?"}]}
            ]

        history = chat_memories[session_id]

        if len(history) >= MAX_MESSAGES_PER_SESSION * 2:
            history[:2] = []

        history.append({"role": "user", "parts": [{"text": message}]})

        payload = {
            "systemInstruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": history[-MAX_MESSAGES_PER_SESSION:],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 400
            }
        }

        req = urllib.request.Request(
            gemini_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))

                if 'candidates' in result and len(result['candidates']) > 0:
                    bot_message = result['candidates'][0]['content']['parts'][0]['text']
                    history.append({"role": "model", "parts": [{"text": bot_message}]})
                    return jsonify({"success": True, "response": bot_message})
                else:
                    return jsonify({"success": False, "error": "Risposta IA vuota o non valida."}), 500

        except urllib.error.HTTPError as he:
            error_body = he.read().decode('utf-8', errors='replace')
            if he.code == 403:
                return jsonify({"success": False, "error": "Chiave API non autorizzata."}), 403
            elif he.code == 404:
                return jsonify({"success": False, "error": "Modello IA non trovato."}), 404
            elif he.code == 429:
                return jsonify({"success": False, "error": "Quota superata. Riprova tra un minuto."}), 429
            return jsonify({"success": False, "error": f"Errore API: {he.code}"}), 500
        except urllib.error.URLError:
            return jsonify({"success": False, "error": "Servizio momentaneamente non disponibile."}), 500

    except Exception as e:
        return jsonify({"success": False, "error": "Servizio momentaneamente non disponibile."}), 500

@app.route("/api/reset", methods=["POST"])
@rate_limit(10)
def reset_chat():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Richiesta non valida"}), 400
    session_id = data.get("session_id", "")
    if session_id in chat_memories:
        del chat_memories[session_id]
    return jsonify({"success": True})

# ==========================================
# AVVIO SERVER
# ==========================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    is_dev = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=is_dev)
