import VDOM from "../../core/dom.mjs";
import { ws } from "../globals.js";
import { gameover, youthewinner } from "./endgame.js";
import { tileMap, mapClass } from "./maps.js";
import { CurrentJoueur } from "./PlayerForm.js";

const playerElements = {};
export const playerPositions = {};
const bombElements = [];
var boxplaced = {};
var powerUp = {};
var whichpowerup;
var speed;
var lastmove = {};
export const playerLives = {};
const actionThrottleTime = 100;
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

export function updatePlayerAction(playerName, action, ix, iy, lives) {
  console.log(`${playerName} action: ${action} ix ${ix} yi ${iy}`);
  // Initialize player states if not already set
  if (!boxplaced.hasOwnProperty(playerName)) boxplaced[playerName] = 1;
  if (!powerUp.hasOwnProperty(playerName)) powerUp[playerName] = false;
  playerLives[playerName] = lives;

  playerPositions[playerName] = playerPositions[playerName] || {
    row: ix,
    col: iy,
  };
  let { row, col } = playerPositions[playerName];
  let newRow = row;
  let newCol = col;

  console.log("xxxxxxxxxxxxxxxxxxxxx",newCol, newRow);
  

  if (whichpowerup == "bomb" && powerUp[playerName]) {
    boxplaced[playerName] = 2;
  }

  console.log("powerup",powerUp[playerName]);
  

  if (whichpowerup === "speed" && powerUp[playerName]) {
    speed = 2;
    setTimeout(() => {
      powerUp[playerName] = false;
      SelectCurrentPowerupImage(whichpowerup, "inactive");
      whichpowerup = "";
      speed = 1;
    }, 5000);
  } else {
    speed = 1;
  }

  switch (action) {
    case "move_left":
      if (canPerformAction(playerName)) {
        newCol = Math.max(1, col - speed);
        ws.send(JSON.stringify({ type: 'updatePosition', name: playerName, col: newCol, row: newRow }));
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "L";
        // console.log("newRow", newRow, "newCol", newCol);

        // updatePlayerPosition(playerName, newRow, newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_right":
      if (canPerformAction(playerName)) {
        newCol = Math.min(tileMap.columns - 2, col + speed);
        ws.send(JSON.stringify({ type: 'updatePosition', name: playerName, col: newCol, row: newRow }));
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "R";

        // updatePlayerPosition(playerName, newRow, newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_up":
      if (canPerformAction(playerName)) {
        newRow = Math.max(1, row - speed);
        ws.send(JSON.stringify({ type: 'updatePosition', name: playerName, col: newCol, row: newRow }));
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "U";

        // updatePlayerPosition(playerName, newRow, newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_down":
      if (canPerformAction(playerName)) {
        newRow = Math.min(tileMap.rows - 2, row + speed);
        ws.send(JSON.stringify({ type: 'updatePosition', name: playerName, col: newCol, row: newRow }));
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "D";
        // updatePlayerPosition(playerName, newRow, newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "place_bomb":
      if (canPerformAction(playerName)) {
        if (boxplaced[playerName] !== 0) {
          if (boxplaced[playerName] === 1) {
            boxplaced[playerName]--;
            placeBomb(row, col, playerName);
            setTimeout(() => (boxplaced[playerName] = 1), 3000);
          } else {
            boxplaced[playerName]--;
            placeBomb(row, col, playerName);
            powerUp[playerName] = false;
            SelectCurrentPowerupImage(whichpowerup, "inactive");
          }
        } else {
          console.log(`${playerName} already placed a bomb.`);
        }
      } else {
        console.log(`${playerName} is placing bombs too fast. Please wait.`);
      }
      break;

    default:
      return;
  }

  // Utility to update player position and synchronize across players
}
export function updatePlayerPosition(playerName, newRow, newCol) {
  // Check if the movement is allowed
  if (speed === 1) {
    if (canMoveTo(newRow, newCol)) {
      // Update local player position

      // Update the DOM to reflect the new position
      const playerElement = document.getElementById(`player-${playerName}`);
      playerPositions[playerName] = { row: newRow, col: newCol };
      if (playerElement) {
        playerElement.style.left = `${newCol * tileMap.tileSize}px`;
        playerElement.style.top = `${newRow * tileMap.tileSize}px`;
      }

      // Broadcast the new position to all players
      // ws.send(JSON.stringify({
      //   type: 'updatePosition',
      //   name: playerName,
      //   row: newRow,
      //   col: newCol
      // }));
    }
  } else if (speed === 2) {
    // Double-speed movement logic
    var tempcol, temprow;

    if (lastmove === 'D') {
      temprow = newRow - 1;
      tempcol = newCol;
    } else if (lastmove === "U") {
      temprow = newRow + 1;
      tempcol = newCol;
    } else if (lastmove === "L") {
      tempcol = newCol + 1;
      temprow = newRow;
    } else if (lastmove === "R") {
      tempcol = newCol - 1;
      temprow = newRow;
    }

    if (canMoveTo(newRow, newCol) && canMoveTo(temprow, tempcol)) {
      playerPositions[playerName] = { row: newRow, col: newCol };
    } else if (canMoveTo(temprow, tempcol)) {
      playerPositions[playerName] = { row: temprow, col: tempcol };
    }

    // Update the DOM for fast movement
    const playerElement = document.getElementById(`player-${playerName}`);
    if (playerElement) {
      playerElement.style.left = `${playerPositions[playerName].col * tileMap.tileSize}px`;
      playerElement.style.top = `${playerPositions[playerName].row * tileMap.tileSize}px`;
    }

    // Broadcast fast movement
    // ws.send(JSON.stringify({
    //   type: 'updatePosition',
    //   name: playerName,
    //   row: playerPositions[playerName].row,
    //   col: playerPositions[playerName].col
    // }));
  }
}

function canMoveTo(row, col) {
  return (
    tileMap.getTile(col, row) === tileMap.tileTypes.EMPTY ||
    tileMap.getTile(col, row) === tileMap.tileTypes.POWERUP
  );
}
// function collision with the powerup
function CollisionPowerup(row, col, playername) {
  const tileType = tileMap.getTile(col, row);
  console.log("Checking collision at", row, col, "Tile type:", tileType);

  if (tileType === tileMap.tileTypes.POWERUP) {
    const tileDiv = document.getElementById(`${mapClass.POWERUP_CLASS}-${row}-${col}`);
    if (tileDiv) {
      const powerupDiv = tileDiv.querySelector(`:scope > div[class^="powerup-"]:not(.hidden)`);
      if (powerupDiv && !powerUp[playername]) {
        console.log("Collision with a powerup");
        powerUp[playername] = true;
        whichpowerup = powerupDiv.className.split("-")[1];
        console.log("Powerup type:", whichpowerup);
        SelectCurrentPowerupImage(whichpowerup, "active");
        removePowerUp(row, col);
      }
    }
  }
}

function placeBomb(row, col, playername) {
  const bombElement = VDOM.createElement("div", {
    class: "bomb",
    style: {
      position: "absolute",
      left: `${col * tileMap.tileSize}px`,
      top: `${row * tileMap.tileSize}px`,
      width: `${tileMap.tileSize}px`,
      height: `${tileMap.tileSize}px`,
    },
  });

  // Add the SVG image for the bomb
  const bombImageElement = VDOM.createElement("img", {
    src: "../assets/bomb-assets.svg",  // Path to your bomb SVG
    style: {
      width: "100%",
      height: "100%",
    },
  });

  // First, render bombElement and bombImageElement if necessary
  const renderedBombElement = bombElement.render();
  const renderedBombImageElement = bombImageElement.render();

  // Append the image element to the bomb div
  renderedBombElement.appendChild(renderedBombImageElement);

  // Append the bomb element to the mapDiv
  document.getElementById("mapDiv").appendChild(renderedBombElement);

  bombElements.push(renderedBombElement);

  // Remove the bomb after 3 seconds and trigger brick destruction
  setTimeout(() => {
    var b = document.querySelector(".bomb");
    if (b) {
      document.getElementById("mapDiv").removeChild(b);
    }
    destroyBrick(row, col, playername);
  }, 3000);
}


export function removePlayer(playerName) {

  if (playerName !== CurrentJoueur) {
    console.log("here1");
    
    const playerElement = document.getElementById(`player-${playerName}`);
    const map = document.getElementById("mapDiv");
    
    if (playerElement) {
      map.removeChild(playerElement);
      
      delete playerElements[playerName];
      delete playerPositions[playerName];
      delete playerLives[playerName];
      
      
    } else {
      console.warn(`Player element with name ${playerName} not found.`);
    }
  }else{
    console.log("here12");
    document.body.innerHTML = "";
    document.body.appendChild(gameover.render());
  }
}


function destroyBrick(row, col, playername) {
  var directions = {};
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

  // Destroy the brick at the center of the explosion
  destroySingleBrick(row, col);

  // Destroy adjacent bricks
  directions.forEach(direction => {
    const newRow = row + direction.rowOffset;
    const newCol = col + direction.colOffset;

    if (newRow >= 0 && newRow < tileMap.rows && newCol >= 0 && newCol < tileMap.columns) {
      destroySingleBrick(newRow, newCol);
    }

    if (Math.abs(direction.rowOffset) === 2 || Math.abs(direction.colOffset) === 2) {
      // Check for adjacent tiles in the extended direction
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
            break;
            break; // Exit the inner loop, continue with the next direction
          }
        }
      }
      powerUp[playername] = false;
      SelectCurrentPowerupImage(whichpowerup, "inactive");
    }
  });

  // Check collisions with players
  const playersToRemove = [];


  for (const playerName in playerPositions) {
    const playerRow = playerPositions[playerName].row;
    const playerCol = playerPositions[playerName].col;

    // Check if the player is in the affected area of the bomb
    if ((playerRow === row && (playerCol === col || playerCol === col - 1 || playerCol === col + 1)) ||
      (playerCol === col && (playerRow === row - 1 || playerRow === row + 1))) {

      // Send the subtractLife message only for the player who has been hit
      ws.send(JSON.stringify({ type: 'subtractLife', name: playerName }));
      retriveLive(playerName, playerLives[playerName] - 1)

      console.log(`${playerName} a été touché, il lui reste ${playerLives[playerName]} vies`);

      // Handle the case when the player's lives reach 0
      // if (playerLives[playerName] == 1 && playerName != CurrentJoueur) {
      //   playersToRemove.push(playerName); // Collect player for removal later
      // }

      // Special case when the current player has 0 lives
      // if (CurrentJoueur == playerName && playerLives[playerName] == 1) {
        // document.body.innerHTML = "";
        // document.body.appendChild(gameover.render());
      // }
    }
  }



  // Safely remove the players collected in the array
  // playersToRemove.forEach(playerName => {
  //   removePlayer(playerName); // Now it's safe to delete
  // });

}

// function retriveLive(playerName, life) {
//   // Select the correct life counter container based on the player's name
//   const lifecounterContainer = document.querySelector(`.lifecounter-${playerName}`);

//   if (lifecounterContainer) {
//     // Assuming the hearts are inside a deeper div, adjust to target the actual container holding the hearts
//     const heartsContainer = lifecounterContainer.querySelector('.lifecounter');

//     if (heartsContainer) {
//       const hearts = heartsContainer.querySelectorAll('img'); // Target heart images

//       if (hearts.length > life) {
//         const lastHeart = hearts[hearts.length - 1];

//         if (lastHeart && heartsContainer.contains(lastHeart)) {
//           console.log("lifecounter", heartsContainer, "lastHeart", lastHeart);

//           heartsContainer.removeChild(lastHeart);  // Remove the heart from the container
//         } else {
//           console.warn('The heart to be removed is not a child of the hearts container.');
//         }
//       } else {
//         console.warn(`Hearts count (${hearts.length}) does not exceed life (${life}). No heart to remove.`);
//       }
//     } else {
//       console.warn('Hearts container not found within the lifecounter.');
//     }
//   } else {
//     console.warn(`Life counter for player ${playerName} not found.`);
//   }
// }

function retriveLive(playerName) {
  // Sélectionne directement le conteneur des cœurs pour le joueur donné
  const heartsContainer = document.querySelector(`.lifecounter-${playerName} .lifecounter`);
  
  // Supprime directement le dernier cœur (image)
  if (heartsContainer) {
    const hearts = heartsContainer.querySelectorAll('img');
    if (hearts.length > 0) {
      heartsContainer.removeChild(hearts[hearts.length - 1]);
    }
  }
}

export function createLifeCounter(playerName, life) {
  console.log('playerName', playerName, "life", life)
  const hearts = Array.from({ length: life }).map((_, index) =>
    VDOM.createElement('img', { class: `lifecounter-${playerName}-${index}`, src: '../assets/heart.svg', alt: 'heart life' })
  );
  return VDOM.createElement('div', { class: `gamerightpart lifecounter-${playerName}` },
    VDOM.createElement('div', { class: 'lifecounter' }, VDOM.createElement('p', { class: 'playerlife' }, playerName),
      ...hearts
    ),
  );
}

function destroySingleBrick(brickRow, brickCol) {
  const tileType = tileMap.getTile(brickCol, brickRow);
  const tileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${brickRow}-${brickCol}`);

  if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP) {
    tileMap.map[brickRow][brickCol] = tileMap.tileTypes.POWERUP;

    // Remove the brick image
    const brickImage = tileDiv.querySelector(`img[src="${tileMap.svgMap[tileMap.tileTypes.BRICK]}"]`);
    if (brickImage) brickImage.remove();

    // Show the powerup
    const powerupDiv = tileDiv.querySelector('.hidden');
    if (powerupDiv) {
      powerupDiv.classList.remove('hidden');
      powerupDiv.style.display = 'block';
    }

    // Change the class and ID of the tileDiv
    tileDiv.className = mapClass.POWERUP_CLASS;
    tileDiv.id = `${mapClass.POWERUP_CLASS}-${brickRow}-${brickCol}`;

    // Remove this brick from the list of bricks with powerup
    tileMap.bricksWithPowerup = tileMap.bricksWithPowerup.filter(brick => brick.row !== brickRow || brick.col !== brickCol);
  } else if (tileType === tileMap.tileTypes.BRICK) {
    tileMap.map[brickRow][brickCol] = tileMap.tileTypes.EMPTY;
    if (tileDiv) tileDiv.remove();
  }
}

function removePowerUp(row, col) {
  const tileType = tileMap.getTile(col, row);
  if (tileType !== tileMap.tileTypes.POWERUP) {
    console.log("There is no power-up at this position.");
    return;
  }
  tileMap.map[row][col] = tileMap.tileTypes.EMPTY;
  const tileDiv = document.getElementById(`${mapClass.POWERUP_CLASS}-${row}-${col}`);
  if (tileDiv) {
    tileDiv.remove();
  } else {
    console.log("Unable to find the div corresponding to the power-up.");
  }
}

function SelectCurrentPowerupImage(whichpowerup, state) {
  // console.log("PLAYER", playerName);

  if (state === "active") {
    addActivePowerupImage(whichpowerup);
  } else {
    delActivePowerupImage(whichpowerup);
  }
}

function addActivePowerupImage(whichpowerup) {
  const powerupElement = document.querySelector(`#${whichpowerup} img`);
  if (powerupElement) {
    powerupElement.src = `../assets/selectpower${whichpowerup}.svg`;
  }
}

function delActivePowerupImage(whichpowerup) {
  const powerupElement = document.querySelector(`#${whichpowerup} img`);
  if (powerupElement) {
    powerupElement.src = `../assets/${whichpowerup}.svg`;
  }
}