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
            return `${remainingTime} seconds remaining, waiting for players... ${globalPlayerCount}/4`;
        } else {
            return `Waiting for players... ${globalPlayerCount}/4`;
        }
    }

    const intervalId = setInterval(() => {
        if (globalPlayerCount >= 2 && !countdownStarted20) {
            countdownStarted20 = true;
            remainingTime = 20;
        }

        if (countdownStarted20 && globalPlayerCount >= 3 && !countdownStarted10) {
            countdownStarted10 = true;
            remainingTime = 10;
        }

        if (countdownStarted20 || countdownStarted10) {
            remainingTime--;
        }

        const updatedContent = renderCountdown();
        countdownElement.innerHTML = updatedContent;
    }, 1000);

    return countdownElement;
}
