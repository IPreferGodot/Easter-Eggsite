const HTML_TO_LOAD = [
    "footer",
    "topbar",
]

const INNERS = await HTML_TO_LOAD.reduce(
    async (accumulator, currentValue) => {
        accumulator = await accumulator; // Corrige le fait que la fonction renvoie un Promise comme accumulator parce qu'elle est async
        accumulator.set(currentValue, await fetch("common/"+currentValue+".html").then(response=>response.text()));
        return accumulator;
    },
    new Map()
)

class CommonFooter extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: "open"});
        shadowRoot.innerHTML = INNERS.get("footer");
    }
}

class CommonTopbar extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: "open"});
        shadowRoot.innerHTML = INNERS.get("topbar");
    }
}

customElements.define("common-footer", CommonFooter)
customElements.define("common-topbar", CommonTopbar)