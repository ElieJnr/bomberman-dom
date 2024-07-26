import VDOM from '../../core/dom.mjs';
import { playerName } from './PlayerForm.js';
import { createChat } from './Chat.js';
// import { HomeComponent } from './Home.js';
import { MountComponent } from '../app.js';
import { ws } from '../app.js';

export function createGame() {
    document.addEventListener('keydown', handleKeyDown);
    return VDOM.createElement('div', { id: 'game-content' },
        VDOM.createElement('div', { id: 'power-ups-container' },
            VDOM.createElement('button', { id: 'logout-button', onclick: handleLogout }, 'Quit Game')
        ),
        VDOM.createElement('div', { id: 'maps' }),
    )
}

function handleLogout() {
    ws.send(JSON.stringify({ type: 'logout', name: playerName }));

    MountComponent('#app', HomeComponent);
    window.location.reload()

    ws.close();
}

function handleKeyDown(event) {
    const action = getActionFromKey(event.key);
    if (action) {
        ws.send(JSON.stringify({ type: 'action', name: playerName, action: action }));
    }
}

function getActionFromKey(key) {
    switch (key) {
        case 'ArrowLeft':
            return 'move_left';
        case 'ArrowRight':
            return 'move_right';
        case 'ArrowUp':
            return 'move_up';
        case 'ArrowDown':
            return 'move_down';
        case ' ':
            return 'place_bomb';
        default:
            return null;
    }
}