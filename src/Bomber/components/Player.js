import VDOM from '../../core/dom.mjs';

export function updatePlayer(name, action) {
    console.log('Updating player', name, 'with action', action);
    const player = document.getElementById(`player-${name}`) || createPlayerElement(name);
    switch (action) {
        case 'move_left':
            player.style.left = `${parseInt(player.style.left || '0') - 10}px`;
            break;
        case 'move_right':
            player.style.left = `${parseInt(player.style.left || '0') + 10}px`;
            break;
        case 'jump':
            //  jumping logic j'ajouterai du code apres
            break;
    }
}

function createPlayerElement(name) {
    const player = VDOM.createElement('div', { id: `player-${name}`, class: 'player' }, name);
    document.getElementById('game').appendChild(player.render());
    return player;
}