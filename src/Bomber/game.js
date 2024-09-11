import VDOM from "../core/dom.mjs";
import { createGame } from "./components/GameBoard.js";
import { insertMap } from "./components/maps.js";
import { createPowerUpContainer } from "./UI.js";
import { createLifeCounter } from "./components/Player.js";
import { createCountdown, MountComponent } from "./utils.js";


export function startGame(life,objetOfPlayer) {
  MountComponent('#app', createGame);
  VDOM.appendChildToElementById('part2', createPowerUpContainer());
  console.log(objetOfPlayer)
  objetOfPlayer.forEach(player => {
    VDOM.appendChildToElementById('part1', createLifeCounter(player, life));
  });
  // VDOM.appendChildToElementById('part1', createLifeCounter(objetOfPlayer,life));
  insertMap(objetOfPlayer);
}

export function startPreparation() {
  const timer = document.getElementById("timer");
  createCountdown (10, timer, " seconds left before start");
}
