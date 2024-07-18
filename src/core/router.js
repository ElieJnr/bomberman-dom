export{
    Framework
}

// Class to initialize the framework
class Framework {
    constructor() {
        this.routes = {};
    }

    route(path, renderFunction) {
        this.routes[path] = renderFunction;
    }

    start() {
        const navigateTo = () => {
            const path = window.location.hash.slice(1) || '/';
            const renderFunction = this.routes[path] || this.routes['404']; // Handle 404
            renderFunction();
        };
        window.addEventListener('hashchange', navigateTo);
        navigateTo();
    }

    redirect(path) {
        window.location.hash = `#${path}`;
    }
}

export const NotFoundComponent = () => `
    <div>
        <h1>404</h1>
        <p>Page not found.</p>
    </div>
`;

function MagicienDoz(){
    return    `
        <div>
            <h1 style="text-align:center;"> Magicien D'OZ :) </h1> 
        </div> 
    `
}

// Instantiate the framework and define routes

const app = new Framework();
app.route('404', NotFoundComponent)
app.route('test',MagicienDoz)
app.start();

if (!window.location.hash) {
    app.redirect('/');
}
