import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = "AIzaSyDXxQlqH40ifSAVb2Ky0jLSCrEKwWWibq0"
print(f"Testing API Key: {API_KEY[:5]}...{API_KEY[-5:] if API_KEY else 'NONE'}")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}"





payload = {
    "contents": [{"role": "user", "parts": [{"text": "Hi"}]}]
}

req = urllib.request.Request(
    GEMINI_URL, 
    data=json.dumps(payload).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("Success!")
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(f"Details: {e.read().decode('utf-8')}")
