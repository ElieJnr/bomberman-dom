import { displayMessage } from './components/Chat.js';
import { updatePlayerAction } from './components/Player.js';
import { HomeComponent } from './components/Home.js';
import { playerName } from './components/PlayerForm.js';
import { removePlayer } from './components/Player.js';

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
        let element;

        if (typeof component === 'function') {
            element = component().render();
        } else if (typeof component === 'string') {
            element = document.getElementById(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else if (component && typeof component.render === 'function') {
            element = component.render();
        } else {
            console.error('Invalid component, ID, or element:', component);
            return;
        }

        if (element) {
            container.appendChild(element);
        }
    });
}

export function UnmountComponent(target, ...components) {
    const container = document.querySelector(target);
    if (!container) {
        console.error(`Target container '${target}' not found.`);
        return;
    }

    components.forEach(component => {
        let element;
        if (typeof component === 'function') {
            element = component().render();
        } else if (typeof component === 'string') {
            element = document.getElementById(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else if (component && typeof component.render === 'function') {
            element = component.render();
        } else {
            console.error('Invalid component, ID, or element:', component);
            return;
        }

        if (element && container.contains(element)) {
            container.removeChild(element);
        }
    });
}
