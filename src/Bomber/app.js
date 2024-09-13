import { setupWebSocket } from './websocket.js';
import { initGame } from './initGame.js';

export const tabImageOfPlayer = [
  "../assets/icon-player1.svg",
  "../assets/icon-player2.svg",
  "../assets/icon-player3.svg",
  "../assets/icon-player4.svg"
];

setupWebSocket();
initGame();
