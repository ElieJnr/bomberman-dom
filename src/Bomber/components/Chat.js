import VDOM from '../../core/dom.mjs';
import { playerName } from './PlayerForm.js';

const ws = new WebSocket('ws://localhost:8080/');

export function createChat() {
    return VDOM.createElement('div', { id: 'chat-container' },
        VDOM.createElement('div', { id: 'messages' }),
        VDOM.createElement('form', { id: 'chatForm', onsubmit: sendMessage },
            VDOM.createElement('input', { type: 'text', id: 'chatMessage', placeholder: 'Type your message...', required: true }),
            VDOM.createElement('button', { type: 'submit' }, 'Send')
        )
    );
}

function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById('chatMessage').value;
    if (message) {
        ws.send(JSON.stringify({ type: 'message', name: playerName, content: message }));
        document.getElementById('chatMessage').value = '';
    }
}

export function displayMessage(message, isSent = false) {
    console.log('message to append', message);
    const messagesContainer = document.getElementById('messages');
    const messageElement = VDOM.createElement('div', {
        class: `message ${isSent ? 'sent' : 'received'}`
    }, message);
    messagesContainer.appendChild(messageElement.render());
}