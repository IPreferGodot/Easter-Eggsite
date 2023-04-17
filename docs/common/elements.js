const HTML_TO_LOAD = [
    "footer"
]

const INNERS = await HTML_TO_LOAD.reduce(
    async (accumulator, currentValue) => {
        accumulator.set(currentValue, await fetch("common/"+currentValue+".html").then(response=>response.text()));
        return accumulator;
    },
    new Map()
)

class CommonFooter extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: "open"});
        // shadowRoot.append(document.)
        // let div = document.createElement("div");
        // div.innerHTML = INNERS.get("footer")
        
        // shadowRoot.append(div);
        console.log(INNERS.get("footer"))
        console.log(INNERS.get("footer").innerHTML)
        shadowRoot.innerHTML = INNERS.get("footer");
    }
}

customElements.define("common-footer", CommonFooter)