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
        // this.style = "--hover-transition: none !important"
        shadowRoot.innerHTML = INNERS.get("footer");
        // shadowRoot.addEventListener("DOMContentLoaded", () => this.style = "")
        // this.addEventListener("loadeddata", this.enableTransition)
        // this.enableTransition()
        // setTimeout(this.enableTransition, 0, this)
        // console.log(document.getElementsByClassName("stop-transition"))
        // this.getElementsByClassName("stop-transition").array.forEach(element => {
        //     element.classList.remove("stop-transition")
        // });
    }
    
    // connectedCallback() {
    //     this.style = ""
    // }
    
    // enableTransition(bidule) {
    //     // yield 2
    //     console.log("zejhrbzeh,rb")
    //     console.log(this)
    //     bidule.style = ""
    // }
}

customElements.define("common-footer", CommonFooter)