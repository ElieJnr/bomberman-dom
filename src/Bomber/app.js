import { createChat, displayMessage } from './components/Chat.js';
import { updatePlayerAction } from './components/Player.js';
// import { HomeComponent } from './components/Home.js';
import { playerName } from './components/PlayerForm.js';
import { removePlayer } from './components/Player.js';
import { createGame } from './components/GameBoard.js';
// import { createCountdown } from './components/waitingRoom.js';
import { insertMap } from './maps.js';
import { initGame } from './initGame.js';
import { waitingRoom } from './components/waitingRoom.js';
import VDOM from '../core/dom.mjs';

export const tabImageOfPlayer = ["../assets/player1.svg", "../assets/player2.svg", "../assets/player3.svg", "../assets/player4.svg"]
export let objetOfPlayer = []

export let seconds
export let playerCount
export let timerOn = false
export const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket connection established');
    initGame();

    // MountComponent('#app', HomeComponent)
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
        console.log('test');
        displayMessage(data.name, data.content);
    } else if (data.type === 'action') {
        updatePlayerAction(data.name, data.action);
    } else if (data.type === 'playerJoined') {

        // displayMessage(`${data.name} has joined the game.\n`, false);

        seconds = data.seconds;
        playerCount = data.playerCount;


        objetOfPlayer = data.playerOrder

        console.log("objetofplayer", objetOfPlayer);

        waitingRoom(playerCount);

        if (playerCount >= 2) {
            let timer = document.getElementById("timer")
            createCountdown(seconds, timer, "searching for other players...", () => (console.log("hello world")))
        }

        if (!document.querySelector(".gamemessage")) {
            VDOM.appendChildToElementById("part3", createChat())
        }


    } else if (data.type === 'playerDisconnected') {

        seconds = data.seconds;
        playerCount = data.playerCount;

        objetOfPlayer = data.playerOrder

        waitingRoom(playerCount);

        displayMessage(`${data.name} has left the game.\n`, false);
        // removePlayer(data.name);




    } else if (data.type === 'startPreparation') {
        console.log("je suis la");
        // displayMessage('Game will start in 10 seconds...', false);

        let timer = document.getElementById("timer")
        let seconds = 10
        createCountdown(seconds, timer, " seconds left before start", () => (console.log("hello world")))

        // Additional logic for 10-second countdown can be added here
    } else if (data.type === 'startGame') {
        startGame();
    } else if (data.type === 'notEnoughPlayers') {
        displayMessage('Not enough players to start the game.', false);
    } else if (data.type === 'gameStarted') {
        alert(data.content);
        ws.close();
    }
};

export function startGame() {
    MountComponent('#app', createGame);
    VDOM.appendChildToElementById('part2', powerUpContainer())
    VDOM.appendChildToElementById('part1', lifeNcounter())
    // insertMap();
}

export function showGameNotStarting(seconds, playerCount) {
    MountComponent('#app', createGame, createChat);
    // MountComponent('#maps', createCountdown(seconds, playerCount));
}

export function MountComponent(target, ...components) {
    const container = document.querySelector(target);
    if (!container) {
        console.error(`Target container '${target}' not found.`);
        return;
    }

    container.innerHTML = '';

    components.forEach(component => {
        let element;

        if (typeof component === 'function') {
            element = component().render();
        } else if (typeof component === 'string') {
            element = document.getElementById(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else if (component && typeof component.render === 'function') {
            element = component.render();
        } else {
            console.error('Invalid component, ID, or element:', component);
            return;
        }

        if (element) {
            container.appendChild(element);
        }
    });
}

function createCountdown(seconds, displayElement, message, onComplete,) {
    let remainingSeconds = seconds;

    const updateDisplay = () => {
        displayElement.textContent = "00:" + remainingSeconds.toString() + " " + message;
    };

    const countdown = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateDisplay();
        } else {
            clearInterval(countdown);
            if (onComplete) {
                onComplete();
            }
        }
    }, 1000);

    // Initial display
    updateDisplay();
}

function powerUpContainer() {
    return VDOM.createElement('div', { class: 'gamepowerup' },
        VDOM.createElement('div', { class: 'power', id: 'bomb' },
            VDOM.createElement('img', { src: '../assets/bomb.svg', alt: '' })
        ),
        VDOM.createElement('div', { class: 'power', id: 'speed' },
            VDOM.createElement('img', { src: '../assets/power2.svg', alt: '' })
        ),
        VDOM.createElement('div', { class: 'power', id: 'flame' },
            VDOM.createElement('img', { src: '../assets/power3.svg', alt: '' })
        ),
        VDOM.createElement('div', { class: 'power', id: 'special' },
            VDOM.createElement('img', { src: '../assets/power4.svg', alt: '' })
        )
    )
}

function lifeNcounter() {
    return VDOM.createElement('div', { class: 'gamerightpart' },
        VDOM.createElement('div', { class: 'lifecounter' },
            VDOM.createElement('img', { src: '../assets/lifecounter.svg', alt: '' })
        ),
        VDOM.createElement('div', { class: 'gametimer' }, 'Time: 00:30')
    )
}