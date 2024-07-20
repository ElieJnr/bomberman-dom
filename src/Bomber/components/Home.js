import VDOM from '../../core/dom.mjs';
import { createForm } from './PlayerForm.js';

export function HomeComponent() {
    return VDOM.createElement('div', { id: 'home-container' },
        createForm(),
    );
}
