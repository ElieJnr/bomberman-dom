import VDOM from '../../core/dom.mjs';
import { mapWidth } from '../maps.js';
const playerElements = {};
const playerPositions = {};
const bombElements = [];
var boxplaced = {} 
export function updatePlayerAction(playerName, action ) {
    console.log(`${playerName} action: ${action}`);
    let playerElement = playerElements[playerName];
    if (!boxplaced.hasOwnProperty(playerName)) {
        boxplaced[playerName] = false; // Initialisez si le joueur n'a pas encore d'entrée
    }
    var map = document.getElementById('mapDiv')
    if (!playerElement) {
        playerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'relative',
                left: '0%',
                top: '0%'
            }
        });
        document.getElementById('mapDiv').appendChild(playerElement.render());
        playerElements[playerName] = playerElement;
        playerPositions[playerName] = { x: 0, y: 0 };
    }

    var obstacles = getObstacles()
    console.log(obstacles);

    const player_stats = document.querySelector(".player")
    const mapRect = map.getBoundingClientRect()
    const playerRect = player_stats.getBoundingClientRect()
    const Playerleft = playerRect.x
    const PlayerRight = Playerleft + playerRect.width
    const Playertop = playerRect.top
    const Playerbottom = playerRect.bottom


    var pp = getPlayerpos()
    var [bool, direction] = isCollidingWithObstacle(pp[0].x, pp[0].y, pp[0].w)
   // Switch case for handling player actions
switch (action) {
    case 'move_left':
        let newXLeft = playerPositions[playerName].x - 1;
        if (Playerleft - 10 < mapRect.left + mapWidth || (direction == "left" && bool)) {
            break;
        }
            playerPositions[playerName].x = newXLeft;
        break;
    case 'move_right':
        let newXRight = playerPositions[playerName].x + 1;
        if (PlayerRight + 10 > mapRect.right - mapWidth || (direction == "right" && bool)) {
            break;
        }
            playerPositions[playerName].x = newXRight;
        break;
    case 'move_up':
        let newYUp = playerPositions[playerName].y - 1;
        if (Playertop - 5 < mapRect.top + mapWidth || (direction == "bottom" && bool)) {
            break
        }
            playerPositions[playerName].y = newYUp;
        break;
    case 'move_down':
        let newYDown = playerPositions[playerName].y + 1;
        if (Playerbottom + 7 > mapRect.bottom - mapWidth || (direction == "top" && bool)){
            break
        } 
            playerPositions[playerName].y = newYDown;
        break;
    case 'place_bomb':
        if (!boxplaced[playerName]) { // Vérifier si le joueur n'a pas encore placé une bombe
            boxplaced[playerName] = true;
            placeBomb(playerPositions[playerName]);
            setTimeout(() => {
                boxplaced[playerName] = false; // Réinitialiser après 4 secondes
            }, 4000);
        } else {
            console.log(`${playerName} a déjà placé une bombe.`);
        } 
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

function placeBomb(position ) {
    const bombElement = VDOM.createElement('div', {
        class: 'bomb',
        style: {
            left: `${position.x + 0.7}%`,
            top: `${position.y + 0.7}%`
        }
    }
    );
    document.getElementById('mapDiv').appendChild(bombElement.render());
    bombElements.push(bombElement)
    setTimeout(() => {
        var b = document.querySelector(".bomb");
        if (b) {
            document.getElementById('mapDiv').removeChild(b);
        }
    }, 4000)
}

export function removePlayer(playerName) {
    const playerVDOM = playerElements[playerName];
    if (playerVDOM) {
        const playerElement = playerVDOM.render();

        // UnmountComponent('#game-content', playerElement);
        // display none le player 
        
        delete playerElements[playerName];
        delete playerPositions[playerName];
    }
}

// Function to get obstacle positions and sizes from 'tile' div elements
function getObstacles() {
    const tiles = document.querySelectorAll('.pillar-border');
    const obstacles = [];
    tiles.forEach(tile => {
        const rect = tile.getBoundingClientRect();
        obstacles.push({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        });
    });
    return obstacles;
}

function getPlayerpos(){
    const player = document.querySelector(".player")
    console.log("this is player",player);
    const pos = []
    var t = player.getBoundingClientRect()
    pos.push({
        x: t.x, 
        y: t.y,
        w: t.width
    })
    return pos
}

// Function to check collision between the player and obstacles
function isCollidingWithObstacle(playerX, playerY, playerwidth) {
    const obstacles = getObstacles(); // Get current obstacle data
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        console.log(`Checking collision with obstacle ${i}: `, obstacle);
        console.log("playerX", playerX);
        console.log("playerwidth", playerX+ playerwidth);
        console.log("playerY", playerY);

        const playerRight = playerX + playerwidth  ;
        const playerBottom = playerY + playerwidth  ;
        const playerLeft = playerX ;
        const playerTop = playerY ;
        
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleTop = obstacle.y ;
        const obstacleBottom = obstacle.y + obstacle.height
        const obstacleLeft = obstacle.x

        const obstacleAndPlayerSameVAxis =
        (obstacleLeft <= playerLeft && playerLeft <= obstacleRight) || // Le joueur dépasse l'obstacle sur la droite
        (obstacleLeft <= playerRight && playerRight <= obstacleRight) || // Le joueur dépasse l'obstacle sur la gauche
        (playerLeft <= obstacleLeft && obstacleRight <= playerRight); // L'obstacle est entre la gauche et la droite du joueur

      const obstacleAndPlayerSameHAxis =
        (obstacleBottom <= playerBottom && playerBottom <= obstacleTop) || // La tête du joueur dépasse l'obstacle
        (obstacleBottom <= playerTop && playerTop <= obstacleTop) || // L'obstacle dépasse la tête du joueur
        (playerBottom <= obstacleBottom && obstacleTop <= playerTop); // L'obstacle est entre la tête et les pieds du joueur

      // Est en dessous de l'obstacle
      const playerUnderObstacle =
        obstacleAndPlayerSameVAxis &&
        (playerBottom >= obstacleBottom && obstacleBottom >= playerTop);

      // Est au dessus de l'obstacle
      const playerOverObstacle =
        obstacleAndPlayerSameVAxis &&
        (playerBottom  >= obstacleTop && obstacleTop >= playerTop);

      // Est avant l'obstacle
      const playerBeforeObstacle =
        obstacleAndPlayerSameHAxis &&
        (playerLeft < obstacleLeft && obstacleLeft <= playerRight);

      // Est après l'obstacle
      const playerAfterObstacle =
        obstacleAndPlayerSameHAxis &&
        (playerLeft <= obstacleRight && obstacleRight <= playerRight);


        /////////////////////////////////////////////////////////////////////////////////////////////:
            // Determine the direction of the collision
            if (playerOverObstacle) {
                console.log(obstacleTop);
                console.log(obstacleLeft);
                console.log(obstacleRight);
                console.log('Collision detected at the top');
                return [true, "top"];
            } else if (playerUnderObstacle) {
                console.log(obstacleBottom);
                console.log('Collision detected at the bottom');
                return [true, "bottom"];
            } else if (playerAfterObstacle) {
                console.log(obstacleLeft);
                console.log(obstacleRight);
                console.log('Collision detected on the left');
                return [true, "left"];
            } else if (playerBeforeObstacle) {
                console.log(obstacleRight);
                console.log('Collision detected on the right');

                return [true, "right"];
            }
        }
    console.log('No collision detected');
    return [false, "no"]; // No collision
}

