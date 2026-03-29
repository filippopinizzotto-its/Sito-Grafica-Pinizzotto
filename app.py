from flask import Flask, render_template
import os

app = Flask(__name__)

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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
