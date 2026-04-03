from flask import Flask, render_template, request, jsonify
import os
import urllib.request
import json

app = Flask(__name__)

# Configurazione Google Gemini REST API
API_KEY = "AIzaSyDXxQlqH40ifSAVb2Ky0jLSCrEKwWWibq0"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"

# System Prompt per definire la personalità e le conoscenze del bot
SYSTEM_PROMPT = """Sei l'assistente AI ufficiale di Pinizzotto - Azienda Grafica. 
Rispondi in italiano, in modo professionale, amichevole e sintetico (max 3-4 frasi).
Informazioni chiave:
- Sede: Via Nazionale 406/A, Piantedo (SO).
- Telefono: +39 0342 683265.
- Email: info@pinizzotto.it.
- Servizi principali: Stampa offset e digitale, grande formato, packaging, brand identity, depliant, locandine, biglietti da visita.
- Obiettivo: Risolvere i dubbi dei clienti e guidarli verso la richiesta di un preventivo o contatto.
Se non conosci una risposta tecnica specifica improvvisa ma plausibile e invita l'utente a contattare Marcello Pinizzotto via email o telefono."""

# Memoria conversazioni locale (in produzione usare Redis o DB)
chat_memories = {}

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

# Chatbot API: Invio messaggio
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")

        if not message:
            return jsonify({"success": False, "error": "Messaggio vuoto"}), 400

        # Inizializza la chat se è una nuova sessione
        if session_id not in chat_memories:
            chat_memories[session_id] = [
                {"role": "user", "parts": [{"text": "Ciao e presentati brevissimamente."}]},
                {"role": "model", "parts": [{"text": "Certamente! Sono l'assistente virtuale di Pinizzotto. Come posso aiutarti oggi?"}]}
            ]

        # Recupera storia e aggiungi nuovo messaggio
        history = chat_memories[session_id]
        history.append({"role": "user", "parts": [{"text": message}]})

        # Prepara payload per API REST
        payload = {
            "systemInstruction": {
                "role": "user",
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": history,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 300
            }
        }

        # Esegui richiesta HTTP
        req = urllib.request.Request(
            GEMINI_URL, 
            data=json.dumps(payload).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                # Estrai risposta
                if 'candidates' in result and len(result['candidates']) > 0:
                    bot_message = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # Salva risposta nella storia
                    history.append({"role": "model", "parts": [{"text": bot_message}]})
                    
                    return jsonify({
                        "success": True, 
                        "response": bot_message
                    })
                else:
                    raise Exception("Risposta vuota o formato invalido da Gemini API")
                    
        except urllib.error.HTTPError as he:
            error_msg = he.read().decode('utf-8')
            print(f"Gemini API HTTP Error {he.code}: {error_msg}")
            return jsonify({"success": False, "error": "Errore di comunicazione con il motore IA."}), 500

    except Exception as e:
        print(f"Chatbot Error: {str(e)}")
        return jsonify({"success": False, "error": "Il servizio non è disponibile al momento."}), 500

# Chatbot API: Reset sessione
@app.route("/api/reset", methods=["POST"])
def reset_chat():
    session_id = request.json.get("session_id", "default")
    if session_id in chat_memories:
        del chat_memories[session_id]
    return jsonify({"success": True})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
