import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    with urllib.request.urlopen(url) as response:
        result = json.loads(response.read().decode('utf-8'))
        for model in result.get('models', []):
            print(model['name'])
except Exception as e:
    print(f"Error listing models: {e}")
    if hasattr(e, 'read'):
        print(f"Details: {e.read().decode('utf-8')}")
