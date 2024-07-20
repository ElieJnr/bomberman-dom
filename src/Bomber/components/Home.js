import VDOM from '../../core/dom.mjs';
import { createForm } from './PlayerForm.js';
import { createGame } from './GameBoard.js';
import { createChat } from './Chat.js';

export function HomeComponent() {
    return VDOM.createElement('div', { id: 'home-container' },
        createForm(),
    );
}
