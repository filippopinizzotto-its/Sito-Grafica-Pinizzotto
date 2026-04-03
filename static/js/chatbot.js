/**
 * CHATBOT CLIENT LOGIC - Grafica Pinizzotto
 */

document.addEventListener('DOMContentLoaded', () => {
    // === SELETTORI ===
    const bubble = document.getElementById('chatbotBubble');
    const window = document.getElementById('chatbotWindow');
    const messagesContainer = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    // === CONFIGURAZIONE ===
    let sessionId = localStorage.getItem('chatbot_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatbot_session_id', sessionId);
    }

    const state = {
        isOpen: false,
        isTyping: false
    };

    // === FUNZIONI UI ===
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

    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // === FUNZIONI API ===
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

    // === EVENT LISTENERS ===
    bubble.addEventListener('click', toggleChat);

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(chatInput.value);
    });

    // Supporto per mobile/touch
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });
});
