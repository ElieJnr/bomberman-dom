import VDOM from '../../core/dom.mjs';
import EventHandler from '../../core/events.js';
import { ws } from '../globals.js';

export let playerName = "";

// export function createForm() {
//     return VDOM.createElement('div', { id: 'form-container' },
//         VDOM.createElement('form', { id: 'nameForm', onsubmit: handleSubmit },
//             VDOM.createElement('label', { for: "playerName" }, 'Enter Your Name'),
//             VDOM.createElement('input', { type: 'text', id: 'playerName', placeholder: 'Enter your name', required: true }),
//             VDOM.createElement('button', { type: 'submit' }, 'Start Game')
//         )
//     );
// }

// function handleSubmit(event) {
//     event.preventDefault();
//     playerName = document.getElementById('playerName').value.trim();

//     if (playerName) {
//         ws.send(JSON.stringify({ type: 'join', name: playerName }));
//     } else {
//         alert('Please enter a valid name.');
//     }
// }

// export function changeScreen() {

//     const eventHandler = new EventHandler()

//     function onEnterPressed(data) {
//         document.getElementById("app").innerHTML = data
//     }

//     eventHandler.once("enterkey", onEnterPressed)

//     document.addEventListener("keydown", (event) => {
//         if (event.key == "Enter") {
//             playerName = document.getElementById('inputfield').value.trim();
//             if (playerName) {

//                 ws.send(JSON.stringify({ type: 'join', name: playerName }));
//                 eventHandler.trigger("enterkey", "")

//             } else {
//                 let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, "Please use a valid pseudo")


//                 if (!document.getElementById("errorName")) {
//                     VDOM.appendChildToElementById("app", errorName)
//                     setTimeout(() => (
//                         document.getElementById("errorName").remove()
//                     ), 2000)
//                 }
//             }
//         }
//     })
// }


// export function changeScreen() {
//     const eventHandler = new EventHandler();

//     function onEnterPressed() {
//         document.getElementById("app").innerHTML = "Welcome!";
//         // Remove the keydown event listener here
//         document.removeEventListener("keydown", handleKeyDown);
//     }

//     eventHandler.once("enterkey", onEnterPressed);

//     function handleKeyDown(event) {
//         if (event.key === "Enter") {
//             const playerName = document.getElementById('inputfield').value.trim();
//             if (playerName) {

//                 console.log("playername", playerName);

//                 ws.send(JSON.stringify({ type: 'join', name: playerName }));
//                 eventHandler.trigger("enterkey");
//             } else {
//                 showError("Please use a valid pseudo");
//             }
//         }
//     }

//     function showError(message) {
//         let errorElement = document.getElementById("errorName");
//         if (!errorElement) {
//             errorElement = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, message);
//             VDOM.appendChildToElementById("app", errorElement);
//         } else {
//             errorElement.textContent = message;
//         }
//         setTimeout(() => {
//             if (errorElement) {
//                 errorElement.remove();
//             }
//         }, 2000);
//     }

//     // Add the keydown event listener
//     document.addEventListener("keydown", handleKeyDown);
// }

export function changeScreen() {

    const eventHandler = new EventHandler()

    function onEnterPressed(data) {
        document.getElementById("app").innerHTML = data
    }

    eventHandler.once("enterkey", onEnterPressed)

    const keydownHandler = (event) => {
        if (event.key == "Enter") {
            playerName = document.getElementById('inputfield').value.trim();
            if (playerName) {
                if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                    console.warn("WebSocket is in CLOSING or CLOSED state. Reloading page...");
                    // Recharger la page
                    window.location.reload();
                } else {
                    ws.send(JSON.stringify({ type: 'join', name: playerName }));
                    eventHandler.trigger("enterkey", "");
                }

                // Supprimer l'écouteur d'événement après envoi du message
                document.removeEventListener("keydown", keydownHandler);
            } else {
                let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, "Please use a valid pseudo");

                if (!document.getElementById("errorName")) {
                    VDOM.appendChildToElementById("app", errorName);
                    setTimeout(() => (
                        document.getElementById("errorName").remove()
                    ), 2000);
                }
            }
        }
    }

    document.addEventListener("keydown", keydownHandler);
}
