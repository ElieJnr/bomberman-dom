import { createChat, displayMessage } from './components/Chat.js';
import { updatePlayerAction, removePlayer } from './components/Player.js';
import { createGame } from './components/GameBoard.js';
import { playerName } from './components/PlayerForm.js';
import { allpos, insertMap } from './components/maps.js';
import { initGame } from './initGame.js';
import { waitingRoom } from './components/waitingRoom.js';
import VDOM from '../core/dom.mjs';

export const tabImageOfPlayer = [
  "../assets/player1.svg",
  "../assets/player2.svg",
  "../assets/player3.svg",
  "../assets/player4.svg"
];

export let objetOfPlayer = [];
export let seconds;
export let playerCount;
export let timerOn = false;
export const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('WebSocket connection established');
  initGame();
};

ws.onerror = () => console.log('WebSocket error');

ws.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'message':
      displayMessage(data.name, data.content);
      break;
    case 'action':
      handlePlayerAction(data);
      break;
    case 'playerJoined':
      handlePlayerJoined(data);
      break;
    case 'playerDisconnected':
      handlePlayerDisconnected(data);
      break;
    case 'startPreparation':
      startPreparation();
      break;
    case 'startGame':
      startGame(objetOfPlayer);
      break;
    case 'notEnoughPlayers':
      displayMessage('Not enough players to start the game.', false);
      break;
    case 'gameStarted':
      alert(data.content);
      ws.close();
      break;
    default:
      console.error('Unknown WebSocket message type:', data.type);
  }
}

function handlePlayerAction(data) {
  const playerPosition = allpos[data.name];
  updatePlayerAction(data.name, data.action, playerPosition.x, playerPosition.y);
}

function handlePlayerJoined(data) {
  seconds = data.seconds;
  playerCount = data.playerCount;
  objetOfPlayer = data.playerOrder;

  requestFullScreen()
  waitingRoom(playerCount);

  if (playerCount >= 2) {
    const timer = document.getElementById("timer");
    createCountdown(seconds, timer, "searching for other players...");
  }

  if (!document.querySelector(".gamemessage")) {
    VDOM.appendChildToElementById("part3", createChat());
  }
}

function handlePlayerDisconnected(data) {
  seconds = data.seconds;
  playerCount = data.playerCount;
  objetOfPlayer = data.playerOrder;

  waitingRoom(playerCount);
  displayMessage(`${data.name} has left the game.`, false);
}

function startPreparation() {
  const timer = document.getElementById("timer");
  createCountdown(10, timer, " seconds left before start");
}

export function startGame(objetOfPlayer) {
  MountComponent('#app', createGame);
  VDOM.appendChildToElementById('part2', createPowerUpContainer());
  VDOM.appendChildToElementById('part1', createLifeCounter());
  insertMap(objetOfPlayer);
}

export function MountComponent(target, ...components) {
  const container = document.querySelector(target);
  if (!container) {
    console.error(`Target container '${target}' not found.`);
    return;
  }

  container.innerHTML = '';
  components.forEach(component => {
    let element = resolveComponent(component);
    if (element) container.appendChild(element);
  });
}

function resolveComponent(component) {
  if (typeof component === 'function') {
    return component().render();
  } else if (typeof component === 'string') {
    return document.getElementById(component);
  } else if (component instanceof HTMLElement) {
    return component;
  } else if (component && typeof component.render === 'function') {
    return component.render();
  } else {
    console.error('Invalid component:', component);
    return null;
  }
}

export function createCountdown(seconds, displayElement, message, onComplete) {
  let remainingSeconds = seconds;

  const updateDisplay = () => {
    displayElement.textContent = `00:${remainingSeconds} ${message}`;
  };

  const countdown = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
    } else {
      clearInterval(countdown);
      if (onComplete) onComplete();
    }
  }, 1000);

  updateDisplay();
}

function createPowerUpContainer() {
  return VDOM.createElement('div', { class: 'gamepowerup' },
    VDOM.createElement('div', { class: 'power', id: 'bomb' },
      VDOM.createElement('img', { src: '../assets/bomb.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'speed' },
      VDOM.createElement('img', { src: '../assets/speed.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'flame' },
      VDOM.createElement('img', { src: '../assets/flame.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'special' },
      VDOM.createElement('img', { src: '../assets/power4.svg', alt: '' })
    )
  );
}

function createLifeCounter() {
  return VDOM.createElement('div', { class: 'gamerightpart' },
    VDOM.createElement('div', { class: 'lifecounter' },
      VDOM.createElement('img', { src: '../assets/lifecounter.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'gametimer' }, 'Time: 00:30')
  );
}

function requestFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { 
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { 
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { 
    elem.msRequestFullscreen();
  }
}

