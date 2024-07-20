import VDOM from '../../core/dom.mjs';
import { UnmountComponent } from '../app.js';

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
            style: {
                position: 'absolute',
                left: '0%',
                top: '0%'
            }
        });
        document.getElementById('maps').appendChild(playerElement.render());
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
            left: `${position.x + 0.7}%`,
            top: `${position.y + 0.7}%`
        }
    }
    );
    document.getElementById('maps').appendChild(bombElement.render());
    bombElements.push(bombElement)
}

export function removePlayer(playerName) {
    const playerVDOM = playerElements[playerName];
    if (playerVDOM) {
        // Convertir l'objet VDOM en élément DOM
        const playerElement = playerVDOM.render();
        
        // Debugging pour vérifier l'élément rendu
        console.log(playerElement);

        // Utiliser UnmountComponent pour retirer l'élément
        UnmountComponent('#game-content', playerElement);
        
        // Nettoyer les références des éléments du joueur
        delete playerElements[playerName];
        delete playerPositions[playerName];
    }
}
