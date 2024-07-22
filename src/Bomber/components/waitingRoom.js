import VDOM from '../../core/dom.mjs';
import { startGame } from '../app.js';

export function createCountdown(initialSeconds, playerCount) {
    let remainingTime = initialSeconds;
    let countdownStarted20 = false;
    let countdownStarted10 = false;
    let globalPlayerCount = playerCount;

    const countdownElement = VDOM.createElement('div', { id: 'countdown-container', className: 'waiting' }, renderCountdown());

    function renderCountdown() {
        if (countdownStarted10) {
            countdownElement.className = 'game-starting';
            if (remainingTime <= 0) {
                clearInterval(intervalId);
                startGame();
                return 'Game starting!';
            } else {
                return `Game starts in ${remainingTime} seconds...`;
            }
        } else if (countdownStarted20) {
            console.log("remainingTime0", remainingTime);
            return `${remainingTime} seconds remaining, waiting for players... ${globalPlayerCount}/4`;
        } else if (!countdownStarted20 && !countdownStarted10){
            console.log("remainingTime1", remainingTime);
            return `Waiting for players... ${globalPlayerCount}/4`;
        }
    }

    const intervalId = setInterval(() => {
        if (globalPlayerCount >= 2 && !countdownStarted20) {
            countdownStarted20 = true;
            remainingTime = 20;
        }

        if ((countdownStarted20 && globalPlayerCount === 4 && !countdownStarted10) ||
            (countdownStarted20 && globalPlayerCount >= 2 && remainingTime <= 0)) {
            countdownStarted10 = true;
            countdownStarted20 = false;
            remainingTime = 10;
        }

        if (countdownStarted10 || countdownStarted20) {
            if (remainingTime > 0) {
                remainingTime--;
            }
        }

        countdownElement.innerHTML = renderCountdown();
    }, 1000);

    return countdownElement;
}
