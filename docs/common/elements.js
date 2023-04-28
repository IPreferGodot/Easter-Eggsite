import { EASTER_EGGS_MANAGER } from "../easter_eggs.js";

const HTML_TO_LOAD = [
    "footer",
    "topbar",
    "right_pannel",
    "easter_egg",
];

const INNERS = await HTML_TO_LOAD.reduce(
    async (accumulator, currentValue) => {
        accumulator = await accumulator; // Corrige le fait que la fonction renvoie un Promise comme accumulator parce qu'elle est async
        accumulator.set(currentValue, await fetch("common/" + currentValue + ".html").then((response) => response.text()));
        return accumulator;
    },
    new Map()
);

class CommonFooter extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = INNERS.get("footer");
	}
}

class CommonTopbar extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = INNERS.get("topbar");
	}
}

const EASTER_EGG_INFOS = ["name", "difficulty", "description", "unlocked"];
class EasterEgg extends HTMLElement {
	constructor() {
		super();
		this.root = this.attachShadow({ mode: "open" });
		this.root.innerHTML = INNERS.get("easter_egg");
	}

	static get observedAttributes() {
		return EASTER_EGG_INFOS;
	}
	get name() {
		return this.getAttribute("name");
	}
	set name(newValue) {
		this.setAttribute("name", newValue);
	}
	get difficulty() {
		return this.getAttribute("difficulty");
	}
	set difficulty(newValue) {
		this.setAttribute("difficulty", newValue);
	}
	get description() {
		return this.getAttribute("description");
	}
	set description(newValue) {
		this.setAttribute("description", newValue);
	}

	attributeChangedCallback(attribute, oldValue, newValue) {
		switch (attribute) {
			case "difficulty":
				for (let element of this.root.querySelectorAll(".difficulty-container")) {
					element.style.setProperty("--difficulty", parseInt(newValue));
				}
                break;
			case "unlocked":
				if (newValue == "false") {
					newValue = "";
				} else {
                    for (const element of this.root.querySelectorAll("." + attribute + ", .unlocked-check-box, .check-mark")) {
                        element.setAttribute("title", newValue)
                    }
					const date = new Date(newValue);
					const elapsedTime = Date.now() - date.getTime();
					newValue = elapsedTime < 1000 * 60 * 60 * 5 ? date.toLocaleTimeString() : date.toLocaleDateString();
				}
                break;
		}

		if (EASTER_EGG_INFOS.includes(attribute)) {
			for (const element of this.root.querySelectorAll("." + attribute)) {
				element.innerHTML = newValue;
			}
		}
	}
}

class CommonRightPannel extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		shadowRoot.innerHTML = INNERS.get("right_pannel");

		const easterEggList = shadowRoot.querySelector("#easter-eggs-list");
		for (const [id, easterEgg] of EASTER_EGGS_MANAGER.easterEggs) {
			const tag = document.createElement("easter-egg");

			tag.id = id;
			for (const info of EASTER_EGG_INFOS) {
				if (info == "unlocked") {
					const date = easterEgg["unlockedDate"];
					tag.setAttribute("unlocked", date ? date : "false");
				} else {
					tag.setAttribute(info, easterEgg[info]);
				}
			}

			easterEggList.appendChild(tag);
		}
	}
}

customElements.define("common-footer", CommonFooter);
customElements.define("common-topbar", CommonTopbar);
customElements.define("common-right-pannel", CommonRightPannel);
customElements.define("easter-egg", EasterEgg);
