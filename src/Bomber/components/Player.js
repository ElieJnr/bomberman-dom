import VDOM from '../../core/dom.mjs';
import { tileMap, mapClass } from './maps.js';

const playerElements = {};
export const playerPositions = {};
const bombElements = [];
var boxplaced = {}
var powerUp = {};
var whichpowerup;
export const playerLives = {};


const actionThrottleTime = 200; 
const lastActionTime = {}; 

function canPerformAction(playerName) {
    const now = Date.now();
    if (!lastActionTime[playerName]) {
        lastActionTime[playerName] = now;
        return true;
    }

    const elapsed = now - lastActionTime[playerName];
    if (elapsed >= actionThrottleTime) {
        lastActionTime[playerName] = now;
        return true;
    }

    return false;
}


export function updatePlayerAction(playerName, action) {
    console.log(`${playerName} action: ${action}`);
    let playerElement = playerElements[playerName];
    if (!boxplaced.hasOwnProperty(playerName)) {
        boxplaced[playerName] = 1;
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
    if (whichpowerup == "bomb" && powerUp[playerName]) {
        boxplaced[playerName] = 2
    }
    console.log(powerUp[playerName]);
    
    switch (action) {
        case 'move_left':
            if (canPerformAction(playerName)) {
                newCol = Math.max(1, col - 1);
                CollisionPowerup(newRow, newCol, playerName);
            } else {
                console.log(`${playerName} is moving too fast. Please wait.`);
            }
            break;
    
        case 'move_right':
            if (canPerformAction(playerName)) {
                newCol = Math.min(tileMap.columns - 2, col + 1);
                CollisionPowerup(newRow, newCol, playerName);
            } else {
                console.log(`${playerName} is moving too fast. Please wait.`);
            }
            break;
    
        case 'move_up':
            if (canPerformAction(playerName)) {
                newRow = Math.max(1, row - 1);
                CollisionPowerup(newRow, newCol, playerName);
            } else {
                console.log(`${playerName} is moving too fast. Please wait.`);
            }
            break;
    
        case 'move_down':
            if (canPerformAction(playerName)) {
                newRow = Math.min(tileMap.rows - 2, row + 1);
                CollisionPowerup(newRow, newCol, playerName);
            } else {
                console.log(`${playerName} is moving too fast. Please wait.`);
            }
            break;
    
        case 'place_bomb':
            if (canPerformAction(playerName)) {
                if (boxplaced[playerName] != 0) {
                    console.log("number of lives left: ", playerLives[playerName]);
                    if (boxplaced[playerName] == 1) {
                        boxplaced[playerName] -= 1;
                        placeBomb(row, col, playerName);
                        setTimeout(() => {
                            boxplaced[playerName] = 1;
                        }, 3000);
                    } else {
                        boxplaced[playerName] -= 1;
                        placeBomb(row, col, playerName);
                        powerUp[playerName] = false;
                    }
                } else {
                    console.log(`${playerName} a déjà placé une bombe.`);
                }
            } else {
                console.log(`${playerName} is placing bombs too fast. Please wait.`);
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
    console.log("this is tiletype", tileType);
    console.log("this is type powerup", tileMap.tileTypes.BRICK_WITH_POWERUP);
    // console.log("this is row", row);
    // console.log("this is col", col);
    // console.log("this is row1", playerPositions[playername].row);
    // console.log("this is col1", playerPositions[playername].col);
    if (tileType === tileMap.tileTypes.POWERUP) {
        // tileMap.map[row][col] = tileMap.tileTypes.EMPTY
        const tileDiv = document.getElementById(`powerup-${row}-${col}`);
        const children = tileDiv.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            var childclassname = child.getAttribute("class")
            if (childclassname.includes("powerup") && !powerUp[playername]) {
                console.log("je suis en collision avec un powerup");
                powerUp[playername] = true
                whichpowerup = childclassname.split("-")[1]
                console.log("this is whichpowerup", whichpowerup);
                removePowerUp(row, col)
                break; 
            }
        }


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
    if (powerUp[playername] && whichpowerup == "flame") {
        directions = [
            { rowOffset: -2, colOffset: 0 }, // Up
            { rowOffset: 2, colOffset: 0 },  // Down
            { rowOffset: 0, colOffset: -2 }, // Left
            { rowOffset: 0, colOffset: 2 },  // Right
        ];
    } else {
        directions = [
            { rowOffset: -1, colOffset: 0 }, // Up
            { rowOffset: 1, colOffset: 0 },  // Down
            { rowOffset: 0, colOffset: -1 }, // Left
            { rowOffset: 0, colOffset: 1 },  // Right
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
    
            // Handle the case for destroying bricks when the offset is 2
            if (Math.abs(direction.rowOffset) === 2 || Math.abs(direction.colOffset) === 2) {
                for (let offset = 1; offset <= 2; offset++) {
                    const extendedRow = row + (direction.rowOffset / 2) * offset;
                    const extendedCol = col + (direction.colOffset / 2) * offset;
    
                    // Ensure the extended coordinates are within map boundaries
                    if (extendedRow >= 0 && extendedRow < tileMap.map.length && extendedCol >= 0 && extendedCol < tileMap.map[0].length) {
                        const extendedTileType = tileMap.getTile(extendedCol, extendedRow);
                        console.log("this is extendedtiletype", extendedTileType);
    
                        if (extendedTileType === tileMap.tileTypes.BRICK) {
                            tileMap.map[extendedRow][extendedCol] = tileMap.tileTypes.EMPTY;
                            const extendedTileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${extendedRow}-${extendedCol}`);
                            if (extendedTileDiv) {
                                extendedTileDiv.remove();
                            }
                        } else if (extendedTileType === tileMap.tileTypes.WALL) {
                            break; // Exit the inner loop, continue with the next direction
                        }
                    }
                }
                powerUp[playername] = false;
            }
        }
    
        // Check for player collision with the bomb (if it exists)
    });
    

    for (const playername in playerPositions) {
        const playerRow = playerPositions[playername].row; // Assuming player element has data attributes for position
        const playerCol = playerPositions[playername].col;
        console.log(playerCol, playerRow);

        if (parseInt(playerRow) === row + 1 && parseInt(playerCol) === newCol ||
            parseInt(playerCol) == col && parseInt(playerRow) === row + 1 ||
            parseInt(playerCol) == col - 1 && parseInt(playerRow) == row ||
            parseInt(playerCol) == col && parseInt(playerRow) == row - 1 ||
            parseInt(playerCol) == col && parseInt(playerRow) == row) {
            // Reduce player's life by 1

            console.log("en Contact avec la bombe");
            playerLives[playername] -= 1;

            console.log("moi", playername, "il me reste", playerLives[playername], "vies");
            // Update the player's life display (assuming there's a function or element for this)
            // updatePlayerLivesDisplay(gameState.playerLives);

            // Handle game over if lives are 0
            if (playerLives[playername] <= 0) {
                removePlayer(playername);
            }
        }
    }

}

// @edieng tu peut utiliser cette fonction pour remove le powerUp avoir les avoirs utiliser  
// et aussi y'a une fonction haspowerup qui detecte si c une powerup
function removePowerUp(row, col) {
    const tileType = tileMap.getTile(col, row);
    if (tileType !== tileMap.tileTypes.POWERUP) {
        console.log("Il n'y a pas de power-up à cette position.");
        return;
    }
    tileMap.map[row][col] = tileMap.tileTypes.EMPTY;
    const tileDiv = document.getElementById(`powerup-${row}-${col}`);
    if (tileDiv) {
        const children = tileDiv.children;
        console.log("this is the children", children);
        let foundPowerUp = false;

        // Loop through all children and check their class names
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            var childclassname = child.getAttribute("class")
            if (childclassname.includes("powerup")) {
                foundPowerUp = true;
                child.remove(); // Remove the power-up element
                break; // Exit the loop once the power-up is found and removed
            }
        }

        // If a power-up was found and removed, update the tileDiv's class and id
        if (foundPowerUp) {
            tileDiv.className = mapClass.EMPTY_DIV_CLASS;
            tileDiv.id = `${mapClass.EMPTY_DIV_CLASS}-${row}-${col}`;
        }
    } else {
        console.log("Impossible de trouver le div correspondant au power-up.");
    }
}
