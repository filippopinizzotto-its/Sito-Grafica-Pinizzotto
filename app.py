"""
Backend Principale - Sito Grafica Pinizzotto
Gestisce il routing delle pagine web e le API REST del chatbot basato su Google Gemini.
"""
from flask import Flask, render_template, request, jsonify
import os
import urllib.request
import json
from dotenv import load_dotenv

# Caricamento delle variabili d'ambiente segrete
load_dotenv()

app = Flask(__name__)

# ==========================================
# CONFIGURAZIONE CHATBOT & INTELLIGENZA ARTIFICIALE
# ==========================================
# Cerca la chiave nel file segreto ".env" nascosto a GitHub
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERRORE: Variabile d'ambiente GEMINI_API_KEY non trovata. Controlla il file .env.")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={API_KEY}"




# Prompt di sistema centrale: definisce identità, conoscenze e limiti del bot.
SYSTEM_PROMPT = """Sei l'assistente AI ufficiale della Grafica Pinizzotto - Azienda Grafica. 
Rispondi in italiano, in modo professionale, amichevole e sintetico (max 3-4 frasi).
Informazioni chiave:
- Sede: Via Nazionale 406/A, Piantedo (SO).
- Telefono: +39 0342 683265.
- Email: info@pinizzotto.it.
- Servizi principali: Stampa offset e digitale, grande formato, packaging, brand identity, depliant, locandine, biglietti da visita.
- Obiettivo: Risolvere i dubbi dei clienti e guidarli verso la richiesta di un preventivo o contatto.
Se non conosci una risposta tecnica specifica improvvisa ma plausibile e invita l'utente a contattare Marcello Pinizzotto via email o telefono."""

# Sistema di memorizzazione locale delle chat. In un sistema multi-nodo, andrebbe sostituito con Redis o database.
chat_memories = {}

# ==========================================
# RUTIND DELLE PAGINE WEB
# ==========================================
@app.route("/")
def home():
    return render_template("index.html")

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
# ENDPOINT API DEL CHATBOT
# ==========================================
# endpoint principale per la comunicazione col bot
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")

        if not message:
            return jsonify({"success": False, "error": "Messaggio vuoto"}), 400

        # Se la sessione non esiste (utente nuovo), prepariamo il contesto e il messaggio iniziale di benvenuto
        if session_id not in chat_memories:
            chat_memories[session_id] = [
                {"role": "user", "parts": [{"text": "Ciao e presentati brevissimamente."}]},
                {"role": "model", "parts": [{"text": "Certamente! Sono l'assistente virtuale di Pinizzotto. Come posso aiutarti oggi?"}]}
            ]

        # Aggiungiamo il nuovo messaggio della richiesta allo storico della conversazione
        history = chat_memories[session_id]
        history.append({"role": "user", "parts": [{"text": message}]})

        # Strutturazione dei dati nel formato JSON corretto per Gemini v1/v1beta
        payload = {
            "systemInstruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": history,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 400
            }
        }

        # Chiamata HTTP asincrona
        req = urllib.request.Request(
            GEMINI_URL, 
            data=json.dumps(payload).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    bot_message = result['candidates'][0]['content']['parts'][0]['text']
                    history.append({"role": "model", "parts": [{"text": bot_message}]})
                    return jsonify({"success": True, "response": bot_message})
                else:
                    return jsonify({"success": False, "error": "Risposta IA vuota o non valida."}), 500
                    
        except urllib.error.HTTPError as he:
            error_msg = he.read().decode('utf-8')
            print(f"--- ERRORE API GEMINI ({he.code}) ---")
            print(f"Dettagli: {error_msg}")
            
            # Gestione specifica per chiavi invalide o disabilitate
            if he.code == 403:
                return jsonify({"success": False, "error": "Chiave API non autorizzata o disabilitata. Controlla Google AI Studio."}), 403
            elif he.code == 404:
                return jsonify({"success": False, "error": "Modello IA non trovato. Verificare configurazione."}), 404
                
            return jsonify({"success": False, "error": f"Errore server API: {he.code}"}), 500

    except Exception as e:
        print(f"Chatbot Exception: {str(e)}")
        return jsonify({"success": False, "error": "Servizio momentaneamente non disponibile."}), 500

# API per cancellare la memoria del Chatbot lato server
@app.route("/api/reset", methods=["POST"])
def reset_chat():
    session_id = request.json.get("session_id", "default")
    if session_id in chat_memories:
        del chat_memories[session_id]
    return jsonify({"success": True})

# ==========================================
# AVVIO DEL SERVER FLASK
# ==========================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
