import VDOM from '../../core/dom.mjs';
import EventHandler from '../../core/events.js';
import { ws } from '../globals.js';

export let CurrentJoueur = "";


export function changeScreen() {

    const eventHandler = new EventHandler()

    function onEnterPressed(data) {
        document.getElementById("app").innerHTML = data
    }

    eventHandler.once("enterkey", onEnterPressed)

    document.addEventListener("keydown", keydownHandler);
}

export const keydownHandler = (event) => {
    if (event.key == "Enter") {
        CurrentJoueur = document.getElementById('inputfield').value.trim();
        if (CurrentJoueur) {

            if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                console.warn("WebSocket is in CLOSING or CLOSED state. Reloading page...");
                // Recharger la page
                window.location.reload();
                return
            }

            if (CurrentJoueur.length > 6) {
                let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, "Please, use less than 7 caracters");

                if (!document.getElementById("errorName")) {
                    VDOM.appendChildToElementById("app", errorName);
                    setTimeout(() => (
                        document.getElementById("errorName").remove()
                    ), 2000);
                }
                return
            }
            ws.send(JSON.stringify({ type: 'join', name: CurrentJoueur }));
            // eventHandler.trigger("enterkey", "");

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