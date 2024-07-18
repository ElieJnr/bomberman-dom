export default class VDOM {
    constructor(tagName, attrs = {}, children = []) {
        this.tagName = tagName;
        this.attrs = attrs;
        this.children = children;
    }
  
    static createElement(tagName, attrs = {}, ...children) {
        return new VDOM(tagName, attrs, children);
    }
   
    render() {
        const element = document.createElement(this.tagName);
        // içi on va ajouter les attribut qui sont dans attrs 
        for (let [key, value] of Object.entries(this.attrs)) {
            if (key.startsWith('on') && typeof value === 'function') {
                // Gérer les événements: on recupere ce qui ce trouve apres le on ex: Click
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'style' && typeof value === 'object') {
                // Gestion des styles
                Object.assign(element.style, value);
            } else {
                // Gérer les attributs
                element.setAttribute(key, value);
            }
        }

        // içi on va ajouter les children de l'element 
        this.children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (typeof child === 'number') {
                console.warn('Ignoring number child:', child);
            } else if (typeof child.render === 'function') {
                element.appendChild(child.render());
            } else {
                console.error('Invalid child type:', child);
            }
        });

        return element;
    }
}

