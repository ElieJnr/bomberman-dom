import VDOM from '../../core/dom.mjs';

const playerElements = {};
const playerPositions = {};
const bombElements = [];

export function updatePlayerAction(playerName, action) {
    console.log(`${playerName} action: ${action}`);

    let playerElement = playerElements[playerName];
    if (!playerElement) {
        playerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: { position: 'absolute', left: '0%', top: '0%' }
        });
        document.getElementById('game-content').appendChild(playerElement.render());
        playerElements[playerName] = playerElement;
        playerPositions[playerName] = { x: 0, y: 0 }; 
    }

    switch (action) {
        case 'move_left':
            playerPositions[playerName].x -= 1; 
            break;
        case 'move_right':
            playerPositions[playerName].x += 1; 
            break;
        case 'move_up':
            playerPositions[playerName].y -= 1; 
            break;
        case 'move_down':
            playerPositions[playerName].y += 1; 
            break;
        case 'place_bomb':
            placeBomb(playerPositions[playerName]);
            break;
        default:
            break;
    }

    const updatedPlayerElement = VDOM.createElement('div', {
        class: 'player',
        id: `player-${playerName}`,
        style: { 
            position: 'absolute',
            left: `${playerPositions[playerName].x}%`,
            top: `${playerPositions[playerName].y}%`
        }
    });

    const oldElement = document.getElementById(`player-${playerName}`);
    oldElement.replaceWith(updatedPlayerElement.render());
    playerElements[playerName] = updatedPlayerElement;
}


function placeBomb(position) {
    const bombElement = VDOM.createElement('div', {
        class: 'bomb',
        style: {
            left: `${position.x}%`,
            top: `${position.y}%`
        }
    }
    );
    document.getElementById('game-content').appendChild(bombElement.render());
    bombElements.push(bombElement);
}

export function removePlayer(playerName) {
    const playerElement = playerElements[playerName];
    if (playerElement) {
        playerElement.remove();
        delete playerElements[playerName];
        delete playerPositions[playerName];
    }
}