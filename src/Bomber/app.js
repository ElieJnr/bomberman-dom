import { displayMessage } from './components/Chat.js';
import { updatePlayerAction } from './components/Player.js';
import { HomeComponent } from './components/Home.js';
import { playerName } from './components/PlayerForm.js';

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
        displayMessage(`${data.name}: ${data.content}`, data.name === playerName);
    } else if (data.type === 'action') {
        updatePlayerAction(data.name, data.action);
    } else if (data.type === 'join') {
        displayMessage(`${data.name} has joined the game.\n`, false);
        updatePlayerAction(data.name, 'move_down');
    } else if (data.type === 'playerDisconnected') {
        displayMessage(`${data.name} has left the game.\n`, false);
        removePlayer(data.name);
    }
};

MountComponent('#app', HomeComponent)

export function MountComponent(target, ...components) {
    const container = document.querySelector(target);
    if (!container) {
        console.error(`Target container '${target}' not found.`);
        return;
    }

    container.innerHTML = '';

    components.forEach(component => {
        const element = component().render();
        if (element) {
            container.appendChild(element);
        }
    });
}


/* export function UnmountComponent(...components) {
    const app = document.querySelector('#app');
    components.forEach(component => {
        const element = component().render();
        if (app.contains(element)) {
            app.removeChild(element);
        }
    });
}
 */
export function UnmountComponent(target, ...components) {
    const container = document.querySelector(target);
    if (!container) {
        console.error(`Target container '${target}' not found.`);
        return;
    }

    components.forEach(component => {
        const element = component().render();
        if (element && container.contains(element)) {
            container.removeChild(element);
        }
    });
}
