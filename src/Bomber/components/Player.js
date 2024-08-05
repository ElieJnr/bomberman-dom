import VDOM from '../../core/dom.mjs';
import { mapWidth, tileMap, mapClass } from '../maps.js';
const playerElements = {};
export const playerPositions = {};
const bombElements = [];
var boxplaced = {}
var powerUp = {};
export const playerLives = {};
export function updatePlayerAction(playerName, action) {
    console.log(`${playerName} action: ${action}`);
    let playerElement = playerElements[playerName];
    if (!boxplaced.hasOwnProperty(playerName)) {
        boxplaced[playerName] = false;
    }
    if (!powerUp.hasOwnProperty(playerName)) {
        powerUp[playerName] = false;
    }
    if (!playerLives.hasOwnProperty(playerName)) {
        playerLives[playerName] = 3; // Assuming players start with 3 lives
    }
    var map = document.getElementById('mapDiv')
    if (!playerElement) {
        playerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'absolute',
                left: '45px',  // Start at the first empty cell (1,1)
                top: '45px'
            }
        });
        document.getElementById('mapDiv').appendChild(playerElement.render());
        playerElements[playerName] = playerElement;
        playerPositions[playerName] = { row: 1, col: 1 };
    }
    let { row, col } = playerPositions[playerName];
    let newRow = row;
    let newCol = col;
    switch (action) {
        case 'move_left':
            newCol = Math.max(1, col - 1);
            CollisionPowerup(newRow, newCol, playerName)
            break;
        case 'move_right':
            newCol = Math.min(tileMap.columns - 2, col + 1);
            CollisionPowerup(newRow, newCol, playerName)
            break;
        case 'move_up':
            newRow = Math.max(1, row - 1);
            CollisionPowerup(newRow, newCol, playerName)
            break;
        case 'move_down':
            newRow = Math.min(tileMap.rows - 2, row + 1);
            CollisionPowerup(newRow, newCol, playerName)
            break;
        case 'place_bomb':
            if (!boxplaced[playerName]) {
                boxplaced[playerName] = true;
                placeBomb(row, col, playerName);
                setTimeout(() => {
                    boxplaced[playerName] = false;
                }, 3000);
            } else {
                console.log(`${playerName} a déjà placé une bombe.`);
            }
            break;
        default:
            break;
    }
    if (canMoveTo(newRow, newCol)) {
        playerPositions[playerName] = { row: newRow, col: newCol };
        const updatedPlayerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'absolute',
                left: `${newCol * tileMap.tileSize}px`,
                top: `${newRow * tileMap.tileSize}px`
            }
        });
        const oldElement = document.getElementById(`player-${playerName}`);
        oldElement.replaceWith(updatedPlayerElement.render());
        playerElements[playerName] = updatedPlayerElement;
    }
}
function canMoveTo(row, col) {
    return tileMap.getTile(col, row) === tileMap.tileTypes.EMPTY || tileMap.getTile(col, row) === tileMap.tileTypes.POWERUP;
}

// function collision with the powerup
function CollisionPowerup(row, col, playername) {
    const tileType = tileMap.getTile(col, row);
    
    if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP && row == playerPositions[playername].row && col == playerPositions[playername].col) {
        tileMap.map[row][col] = tileMap.tileTypes.EMPTY
        console.log("je suis en collision avec un powerup");
        powerUp[playername] = true
    }
}


function placeBomb(row, col, playername) {
    const bombElement = VDOM.createElement('div', {
        class: 'bomb',
        style: {
            position: 'absolute',
            left: `${col * tileMap.tileSize}px`,
            top: `${row * tileMap.tileSize}px`,
            width: `${tileMap.tileSize}px`,
            height: `${tileMap.tileSize}px`
        }
    });
    document.getElementById('mapDiv').appendChild(bombElement.render());
    bombElements.push(bombElement)
    setTimeout(() => {
        var b = document.querySelector(".bomb");
        if (b) {
            document.getElementById('mapDiv').removeChild(b);
        }
        destroyBrick(row, col, playername)
    }, 3000)
}

export function removePlayer(playerName) {
    const playerElement = document.getElementById(`player-${playerName}`)
    var map = document.getElementById("mapDiv")
    map.removeChild(playerElement)
    alert("GameOver")
    // const playerVDOM = playerElements[playerName];
    // if (playerVDOM) {
    //     const playerElement = playerVDOM.render();
    //     // Vous pouvez ajouter ici la logique pour retirer visuellement le joueur
    //     playerElement.style.display = 'none';
    //     delete playerElements[playerName];
    //     delete playerPositions[playerName];
    // }

}


// Destroy brick in the diagonal
function destroyBrick(row, col, playername) {
    const tileType = tileMap.getTile(col, row);
    const tileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${row}-${col}`);


    if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP) {
        tileMap.map[row][col] = tileMap.tileTypes.POWERUP;
        // Remove the brick image
        tileDiv.querySelector('img').remove();

        // Show the powerup
        const powerupDiv = tileDiv.querySelector(`.${mapClass.POWERUP_CLASS}`);
        powerupDiv.style.display = 'block';

        // Change the class and ID of the tileDiv
        tileDiv.className = mapClass.POWERUP_CLASS;
        tileDiv.id = `${mapClass.POWERUP_CLASS}-${row}-${col}`;

        // Remove this brick from the list of bricks with powerup
        tileMap.bricksWithPowerup = tileMap.bricksWithPowerup.filter(brick => brick.row !== row || brick.col !== col);
    } else if (tileType === tileMap.tileTypes.BRICK) {
        tileMap.map[row][col] = tileMap.tileTypes.EMPTY;
        // Completely remove the brick element
        tileDiv.remove();
    }

    // Check and replace surrounding tiles
    var directions = {}
    if (!powerUp[playername]){
         directions = [
            { rowOffset: -1, colOffset: 0 }, // Up
            { rowOffset: 1, colOffset: 0 },  // Down
            { rowOffset: 0, colOffset: -1 }, // Left
            { rowOffset: 0, colOffset: 1 },  // Right
        ];    
    }else{
        directions = [
            { rowOffset: -2, colOffset: 0 }, // Up
            { rowOffset: 2, colOffset: 0 },  // Down
            { rowOffset: 0, colOffset: -2 }, // Left
            { rowOffset: 0, colOffset: 2 },  // Right
        ];
    
    }

    console.log(playername);

    // const playerElement = document.getElementById(`player-${playername}`); // Assuming player has ID 'player'

    directions.forEach(direction => {
        const newRow = row + direction.rowOffset;
        const newCol = col + direction.colOffset;

        // Ensure the new coordinates are within map boundaries
        if (newRow >= 0 && newRow < tileMap.map.length && newCol >= 0 && newCol < tileMap.map[0].length) {
            const adjacentTileType = tileMap.getTile(newCol, newRow);
            if (adjacentTileType === tileMap.tileTypes.BRICK) {
                tileMap.map[newRow][newCol] = tileMap.tileTypes.EMPTY;
                const adjacentTileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${newRow}-${newCol}`);
                if (adjacentTileDiv) {
                    adjacentTileDiv.remove();
                }
            }
        }
        // Check for player collision with the bomb (if it exists)
        for (const playername in playerPositions) {
            const playerRow = playerPositions[playername].row; // Assuming player element has data attributes for position
            const playerCol = playerPositions[playername].col;
            console.log(playerCol, playerRow);

            if (parseInt(playerRow) === newRow && parseInt(playerCol) === newCol) {
                // Reduce player's life by 1

                console.log("en Contact avec la bombe");
                playerLives[playername] -= 1;

                console.log(playerLives[playername]);
                // Update the player's life display (assuming there's a function or element for this)
                // updatePlayerLivesDisplay(gameState.playerLives);

                // Handle game over if lives are 0
                if (playerLives[playername] <= 0) {
                    removePlayer(playername)
                }
            }
        }
        // Check if player is on the same tile as the bomb
    });


}