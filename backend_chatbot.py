"""
Compatibilità con le istruzioni del progetto.

Questo file avvia lo stesso backend definito in app.py, così i comandi
documentati in INSTALL.bat e nella guida continuano a funzionare.
"""

from app import app


if __name__ == "__main__":
    import os

    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)