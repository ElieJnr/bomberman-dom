class StateManager {
    constructor(initialState) {
        this.state = initialState;
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = newState ;
    }
}

export default StateManager;
