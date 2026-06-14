/**
 * Logica Lato Client - Chatbot AI Pinizzotto
 * Gestisce l'interfaccia asincrona, le animazioni UI e le chiamate alle API REST.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === SELETTORI ===
    const bubble = document.getElementById('chatbotBubble');
    const window = document.getElementById('chatbotWindow');
    const messagesContainer = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const closeBtn = document.getElementById('chatCloseBtn');

    // =====================================
    //          STATE & CONFIG
    // =====================================
    // Identificatore univoco per mantenere il "filo" della conversazione col server
    let sessionId = localStorage.getItem('chatbot_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substr(2, 9));
        localStorage.setItem('chatbot_session_id', sessionId);
    }

    // Stato della UI
    const state = {
        isOpen: false,
        isTyping: false
    };

    const statusDot = document.querySelector('.status-dot');
    const statusLabel = document.querySelector('.chat-header-info p');

    const checkHealth = async () => {
        try {
            const res = await fetch('/health');
            const data = await res.json();
            if (data.gemini_online) {
                if (statusDot) statusDot.style.background = '#10b981';
                if (statusLabel) statusLabel.innerHTML = '<span class="status-dot"></span> Online';
            } else {
                if (statusDot) statusDot.style.background = '#ef4444';
                if (statusLabel) statusLabel.innerHTML = '<span class="status-dot"></span> Non disponibile';
            }
        } catch {
            if (statusDot) statusDot.style.background = '#ef4444';
            if (statusLabel) statusLabel.innerHTML = '<span class="status-dot"></span> Non disponibile';
        }
    };

    // =====================================
    //             UI HANDLERS
    // =====================================
    // Gestisce l'apertura e la chiusura della finestra chat
    const toggleChat = () => {
        state.isOpen = !state.isOpen;
        window.classList.toggle('active', state.isOpen);
        bubble.classList.toggle('active', state.isOpen);
        
        if (state.isOpen) {
            chatInput.focus();
            // Invia messaggio di benvenuto se vuoto
            if (messagesContainer.children.length === 0) {
                appendMessage('bot', "Ciao! Sono l'assistente virtuale di Pinizzotto. Come posso aiutarti oggi?");
            }
            checkHealth();
        }
    };

    const appendMessage = (role, text) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerText = text;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    };

    const showTypingIndicator = () => {
        if (state.isTyping) return;
        state.isTyping = true;
        
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'chat-message bot';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    };

    const hideTypingIndicator = () => {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        state.isTyping = false;
    };

    // Auto-scroll in fondo per mantenere l'ultimo messaggio visibile
    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // =====================================
    //         COMUNICAZIONE API
    // =====================================
    // Invia il messaggio scritto e processa in modo asincrono la risposta del motore IA
    const sendMessage = async (text) => {
        if (!text.trim() || state.isTyping) return;

        // UI: Messaggio utente
        appendMessage('user', text);
        chatInput.value = '';
        
        // UI: Indicatore bot
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    session_id: sessionId 
                })
            });

            const data = await response.json();
            
            hideTypingIndicator();

            if (data.success) {
                appendMessage('bot', data.response);
            } else {
                appendMessage('bot', "Scusa, ho avuto un problema tecnico. Riprova più tardi.");
            }

        } catch (error) {
            hideTypingIndicator();
            appendMessage('bot', "Errore di connessione. Controlla la tua rete.");
            console.error("Chat Error:", error);
        }
    };

    // =====================================
    //           EVENT LISTENERS
    // =====================================
    // Apertura al click del bubble
    bubble.addEventListener('click', toggleChat);

    // Chiusura al click della X nell'header
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChat();
        });
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(chatInput.value);
    });

    // Supporto invio rapido tramite tasto Enter sulla tastiera
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });
});
