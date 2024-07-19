import VDOM from '../../core/dom.mjs';

const ws = new WebSocket('ws://localhost:8080/');

export function createGame() {
    document.addEventListener('keydown', handleKeyDown);

    return VDOM.createElement('div', { id: 'game-content' })
}

function handleKeyDown(event) {
    const action = getActionFromKey(event.key);
    if (action) {
        ws.send(JSON.stringify({ type: 'action', name: playerName, action }));
    }
}

function getActionFromKey(key) {
    switch (key) {
        case 'ArrowLeft':
            return 'move_left';
        case 'ArrowRight':
            return 'move_right';
        case 'ArrowUp':
            return 'jump';
        default:
            return null;
    }
}