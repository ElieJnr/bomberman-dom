import VDOM from '../../core/dom.mjs';
import EventHandler from '../../core/events.js';
import { ws } from '../app.js';

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

export function changeScreen() {

    const eventHandler = new EventHandler()

    function onEnterPressed(data) {
        document.getElementById("app").innerHTML = data
    }

    eventHandler.once("enterkey", onEnterPressed)

    document.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            playerName = document.getElementById('inputfield').value.trim();
            if (playerName) {
                ws.send(JSON.stringify({ type: 'join', name: playerName }));
                eventHandler.trigger("enterkey", "")
            } else {
                let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, "Please use a valid pseudo")
                if (!document.getElementById("errorName")) {
                    VDOM.appendChildToElementById("app", errorName)
                    setTimeout(() => (
                        document.getElementById("errorName").remove()
                    ), 2000)
                }
            }
        }
    })
}
