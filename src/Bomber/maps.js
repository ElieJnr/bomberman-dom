import VDOM from '../core/dom.mjs';
import EventHandler from '../core/events.js';
import StateManager from '../core/state.js';
export {
    mapWidth
}

var mapWidth
const tileMap = {
    columns: 21,
    rows: 13,
    tileSize: 0,
    tileTypes: {
        EMPTY: 0,
        WALL: 1,
        BRICK: 2,
        POWERUP: 3
    },
    colors: {
        WALL: "black",
        BRICK: "white"
    },
    gameConfig: {
        BRICK_COUNT: 60,
        MAIN_DIV_HEIGHT_PERCENTAGE: 95
    },
    map: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],

    getTile(col, row) {
        return this.map[row][col];
    },

    getColor(tileType) {
        switch (tileType) {
            case this.tileTypes.WALL:
                return this.colors.WALL;
            case this.tileTypes.BRICK:
                return this.colors.BRICK;
            default:
                return "transparent";
        }
    },

    placeRandomBricks(count) {
        let placed = 0;
        while (placed < count) {
            const randomRow = Math.floor(Math.random() * (this.rows - 2)) + 1;
            const randomCol = Math.floor(Math.random() * (this.columns - 2)) + 1;

            if (
                (randomRow <= 3 && (randomCol <= 3 || randomCol >= this.columns - 4)) ||
                (randomRow >= this.rows - 4 && (randomCol <= 3 || randomCol >= this.columns - 4))
            ) {
                continue;
            }

            if (this.map[randomRow][randomCol] === this.tileTypes.EMPTY) {
                this.map[randomRow][randomCol] = this.tileTypes.BRICK;
                placed++;
            }
        }
    },

    calculateTileSize(gameBodyWidth, gameBodyHeight) {
        const gameBodyAspectRatio = gameBodyWidth / gameBodyHeight;
        const mapAspectRatio = this.columns / this.rows;

        if (mapAspectRatio > gameBodyAspectRatio) {
            this.tileSize = gameBodyWidth / this.columns;
            mapWidth = this.tileSize
        } else {
            this.tileSize = gameBodyHeight / this.rows;
            mapWidth = this.tileSize   
        }
    }
};

class GameRenderer {
    constructor(gameBody, eventHandler) {
        this.gameBody = gameBody;
        this.eventHandler = eventHandler;
        this.stateManager = new StateManager({ mapDiv: null });
    }

    createDivs() {
        const mapDiv = this.createDiv('mapDiv', '100%', '95%');
        this.gameBody.append(mapDiv.render());
        this.stateManager.setState({ mapDiv });
    }

    createDiv(id, width, height) {
        return VDOM.createElement('div', { id, style: { width, height } });
    }

    renderMap() {
        const gameBodyWidth = this.gameBody.offsetWidth;
        const gameBodyHeight = this.gameBody.offsetHeight * (tileMap.gameConfig.MAIN_DIV_HEIGHT_PERCENTAGE / 100);

        tileMap.calculateTileSize(gameBodyWidth, gameBodyHeight);

        const gridWidth = tileMap.tileSize * tileMap.columns;
        const gridHeight = tileMap.tileSize * tileMap.rows;
        const offsetX = (gameBodyWidth - gridWidth) / 2;
        const offsetY = (gameBodyHeight - gridHeight) / 2;

        this.setupmapDiv(gridWidth, gridHeight, offsetX, offsetY);

        const fragment = VDOM.createElement('fragment');
        for (let row = 0; row < tileMap.rows; row++) {
            for (let col = 0; col < tileMap.columns; col++) {
                const tileType = tileMap.getTile(col, row);
                if (tileType !== tileMap.tileTypes.EMPTY) {
                    fragment.children.push(this.createTile(tileType, col, row));
                }
            }
        }
        this.stateManager.getState().mapDiv.children = [fragment];
        this.gameBody.querySelector('#mapDiv').replaceWith(this.stateManager.getState().mapDiv.render());
    }

    setupmapDiv(width, height, left, top) {
        Object.assign(this.stateManager.getState().mapDiv.attrs.style, {
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            left: `${left}px`,
            top: `${top}px`
        });
    }

    createTile(tileType, col, row) {
        const color = tileMap.getColor(tileType);
        let className = '';
        
        if (tileType === tileMap.tileTypes.WALL) {
            // Briques de bordure 
            if (row === 0 || row === tileMap.rows - 1 || col === 0 || col === tileMap.columns - 1) {
                className = 'border-wall';
            } else {
                // Piliers intérieurs
                className= 'pillar-border';
            }
        } else if (tileType === tileMap.tileTypes.BRICK) {
            // Briques cassables
            className = 'brittle-brick';
        }
    
        return VDOM.createElement('div', {
            class: className,
            id: `${className}-${row}-${col}`,
            style: {
                backgroundColor: color,
                position: 'absolute',
                left: `${col * tileMap.tileSize}px`,
                top: `${row * tileMap.tileSize}px`,
                width: `${tileMap.tileSize}px`,
                height: `${tileMap.tileSize}px`
            }
        });
    }

    onResize() {
        this.renderMap();
    }

    attachEventListeners() {
        this.eventHandler.on(window, 'resize', () => this.onResize());
    }

    initialize() {
        // tileMap.placeRandomBricks(tileMap.gameConfig.BRICK_COUNT);
        this.createDivs();
        this.renderMap();
        this.attachEventListeners();
    }
}

export function insertMap() {
    const gameBody = document.getElementById("maps");
    const eventHandler = new EventHandler();
    const gameRenderer = new GameRenderer(gameBody, eventHandler);
    gameRenderer.initialize();
}
