import { appendMessage } from './components/Chat.js';
import { updatePlayer } from './components/Player.js';
import { HomeComponent } from './components/Home.js';

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
        appendMessage(`${data.name}: ${data.content}`);
    } else if (data.type === 'action') {
        updatePlayer(data.name, data.action);
    } else if (data.type === 'join') {
        appendMessage(`${data.name} has joined the game.\n`);
        // updatePlayer(data.name, '')
    } else if (data.type === 'playerDisconnected') {
        appendMessage(`${data.name} has left the game.\n`);
    }
};

// =================================GESTION DES ROUTES=====================================

// const app = document.querySelector('#app');
// app.appendChild(createForm().render());
// app.appendChild(createChat().render());


MountComponent(HomeComponent)


export function MountComponent(...components) {
    const app = document.querySelector('#app');
    app.innerHTML = '';
    components.forEach(component => {
        app.appendChild(component().render());
    });
}

export function UnmountComponent(...components) {
    const app = document.querySelector('#app');
    components.forEach(component => {
        const element = component().render();
        if (app.contains(element)) {
            app.removeChild(element);
        }
    });
}
