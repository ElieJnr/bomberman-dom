import VDOM from '../../core/dom.mjs';

export function createEndScreen(imageFileName) {
    return VDOM.createElement('div', { id: 'endScreen' },
        VDOM.createElement('div', { id: 'gameOverSide' },
            //imagefilename : soit gameover.svg ou youarethewinner.svg
            VDOM.createElement('img', { src: `../assets/${imageFileName}`, alt: '' })
        ),
        VDOM.createElement('div', { id: 'goBackHome', style: { fontFamily: "'Press Start 2P'", borderBottom: 'solid 2px' } },
            VDOM.createElement('p', {}, 
                VDOM.createElement('a', {href: "/src/Bomber/public/"}, "go to home")
            )
        )
    );
}

export const gameover = createEndScreen('gameover.svg');
export const youthewinner = createEndScreen('youarethewinner.svg');