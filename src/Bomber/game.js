import VDOM from "../core/dom.mjs";
import { createGame } from "./components/GameBoard.js";
import { insertMap } from "./components/maps.js";
import { createPowerUpContainer } from "./UI.js";
import { createLifeCounter } from "./components/Player.js";
import { createCountdown, MountComponent } from "./utils.js";
import { objetOfPlayer } from "./websocket.js";

export let life = [];

export function startGame(life, objetOfPlayer) {
  // console.log('Starting game with life:', life);
  // console.log('Players:', objetOfPlayer);
  MountComponent('#app', createGame);
  VDOM.appendChildToElementById('part2', createPowerUpContainer());
  objetOfPlayer.forEach((player, index) => {
    VDOM.appendChildToElementById('part1', createLifeCounter(player, life[index]));
  });
  insertMap(objetOfPlayer);
}

export function startPreparation(data) {
  // console.log('startPreparation:', data);
  life = data.playerOrder.map(player => player.Lives);
  const timer = document.getElementById("timer");
  createCountdown(10, timer, " seconds left before start", () => {
    startGame(life, objetOfPlayer);
  });
}

export function updatePlayerLives(playerName) {
  const remainingLives = playerLives[playerName];
  
  const lifeCounterDiv = document.querySelector(`.lifecounter-${playerName}`);
  if (lifeCounterDiv) {
    lifeCounterDiv.innerHTML = ''; 
    const hearts = Array.from({ length: remainingLives }).map((_, index) =>
      VDOM.createElement('img', { class: `lifecounter-${playerName}-${index}`, src: '../assets/heart.svg', alt: 'heart life' })
    );
    hearts.forEach(heart => lifeCounterDiv.appendChild(heart.render()));
  }
}

export function playerLoseLife(playerName) {
  if (playerLives[playerName] > 0) {
    playerLives[playerName]--;  
    updatePlayerLives(playerName);  
  } 
  if (playerLives[playerName] === 0) {
    removePlayer(playerName);  
  }
}