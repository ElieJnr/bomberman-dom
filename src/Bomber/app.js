import { createChat, displayMessage } from './components/Chat.js';
import { updatePlayerAction } from './components/Player.js';
import { HomeComponent } from './components/Home.js';
import { playerName } from './components/PlayerForm.js';
import { removePlayer } from './components/Player.js';
import { createGame } from './components/GameBoard.js';
import { createCountdown } from './components/waitingRoom.js';

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    console.log('dougou');
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
        displayMessage(`${data.name}: ${data.content}`, data.name === playerName);
    } else if (data.type === 'action') {
        updatePlayerAction(data.name, data.action);
    } else if (data.type === 'playerJoined') {
        displayMessage(`${data.name} has joined the game.\n`, false);
        showGameNotStarting(data.seconds, data.playerCount)
    } else if (data.type === 'playerDisconnected') {
        displayMessage(`${data.name} has left the game.\n`, false);
        removePlayer(data.name);
    } else if (data.type === 'gameNotStarting') {
        showGameNotStarting(data.seconds, data.playerCount)
        seconds = data.Seconds
        playerCount = data.playerCount
    }
};


MountComponent('#app', HomeComponent)

export function startGame() {
    MountComponent('#app', createGame, createChat);
}

export function showGameNotStarting(seconds, playerCount) {
    console.log('show');
    MountComponent('#app', createGame, createChat);
    MountComponent('#maps', createCountdown(seconds, playerCount));
}

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
            const componentInstance = component();
            element = componentInstance.render ? componentInstance.render() : componentInstance;
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
        }else{
            console.log(component().render());
            console.warn('element or container not found');
        }
    });
}
