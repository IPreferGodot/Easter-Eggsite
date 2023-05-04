import { EASTER_EGGS_MANAGER } from "../easter_eggs.js";
import { clamp, stopDefault, isTouchDevice } from "./utility.js";

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

const noTranisition = (() => {
	let sheet = new CSSStyleSheet();
	sheet.replaceSync("* {transition: none !important}");
	return sheet;
})();


class HTMLElementHelper extends HTMLElement {
	constructor(name) {
		super();
		this.root = this.attachShadow({ mode: "open" });
		let sheets = [...this.root.adoptedStyleSheets, noTranisition]
		this.root.adoptedStyleSheets = sheets;
		this.root.innerHTML = INNERS.get(name);
		
		setTimeout(
			() => {
				sheets.splice(this.root.adoptedStyleSheets.indexOf(noTranisition), 1);
				this.root.adoptedStyleSheets = sheets;
			},
			3000 // Enough for slow 3G (tested with devtool's throttling)
		)
	}
}

class CommonFooter extends HTMLElementHelper {
	constructor() {
		super("footer");
	}
}

class CommonTopbar extends HTMLElementHelper {
	constructor() {
		super("topbar");
	}
}

const EASTER_EGG_INFOS = ["name", "difficulty", "description", "unlocked"];
class EasterEgg extends HTMLElementHelper {
	constructor() {
		super("easter_egg");
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
					this.root.querySelector("#main-container").classList.remove("is-unlocked")
					newValue = "";
				} else {
					this.root.querySelector("#main-container").classList.add("is-unlocked")
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

class CommonRightPannel extends HTMLElementHelper {
	constructor() {
		super("right_pannel");

		const easterEggList = this.root.querySelector("#easter-eggs-list");
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

			easterEgg.onUnlockedDateChanged.bind((event) => {tag.setAttribute("unlocked", event.unlockedDate ? event.unlockedDate : "false")})
			
			easterEggList.appendChild(tag);
		}
		
		const list = this.root.querySelector("#easter-eggs-list");
		const scrollBar = this.root.querySelector("#scroll-bar");
		this.cursor = this.root.querySelector("#scroll-cursor");
		this.cursor.addEventListener('selectstart', stopDefault);
		const pseudoThis = this
		function onMouseMove(event) {
			const newCursorPos = clamp(
				pseudoThis.scrollStartCursorY + event.clientY - pseudoThis.scrollStartMouseY,
				0,
				list.clientHeight - pseudoThis.cursor.clientHeight
				)
			pseudoThis.cursor.style.top = newCursorPos + "px"
			list.scroll(0, list.scrollHeight * newCursorPos / scrollBar.clientHeight)
			// const newScroll = pseudoThis.scrollStartScrollY + event.clientY - pseudoThis.scrollStartMouseY
			// list.scroll(0, newScroll);
			// pseudoThis.cursor.style.top = newScroll / list.scrollHeight * (scrollBar.clientHeight - pseudoThis.cursor.clientHeight) + "px"
		}

		this.cursor.addEventListener(
			"mousedown",
			(event) => {
				window.getSelection().removeAllRanges();
				this.scrollStartMouseY = event.clientY;
				this.scrollStartCursorY = this.cursor.offsetTop;
				console.log('list : ' + list.clientHeight + " cursor : " + this.cursor.clientHeight)
				console.log(this.scrollStartCursorY)
				this.cursor.style.backgroundColor = "var(--grey)"
				window.addEventListener("mousemove", onMouseMove);
				// window.addEventListener('selectstart', stopDefault);
			}
			);
			window.addEventListener('selectstart', stopDefault);

		window.addEventListener("mouseup", () => {
			window.removeEventListener("mousemove", onMouseMove);
			this.cursor.style.backgroundColor = ""
			// window.removeEventListener('selectstart', stopDefault);
		});
		
		window.addEventListener(
			"wheel",
			(event) => {
				if (event.ctrlKey) {
					return;	
				}
				
				if (easterEggList.getBoundingClientRect().top <= event.clientY && event.clientY <= easterEggList.getBoundingClientRect().bottom) {
				list.scroll(0, list.scrollTop + event.deltaY * (event.altKey?4:(event.shiftKey?1.5:0.5)))
				this.cursor.style.top = list.scrollTop / list.scrollHeight * (scrollBar.clientHeight) + "px"
			}
			}
		);
		
		// Timeout sinon les propriétés ne sont pas à jour
		setTimeout(() => {this.updateScroll()}, 500);
		
		if (isTouchDevice()) {
			easterEggList.style.pointerEvents = "auto";
			easterEggList.classList.remove("no-scroll-bar");
			scrollBar.style.display = "none"
		}
	}
	
	updateScroll() {
		const list = this.root.querySelector("#easter-eggs-list");
		const scrollBar = this.root.querySelector("#scroll-bar");
		const newHeight = (list.clientHeight / list.scrollHeight) * scrollBar.clientHeight
		if (!newHeight) {
			setTimeout(() => {this.updateScroll()}, 500);
			return;
		}
		console.log((list.clientHeight / list.scrollHeight) * scrollBar.clientHeight + "px")
		this.cursor.style.height = (list.clientHeight / list.scrollHeight) * scrollBar.clientHeight + "px";
	}
}

customElements.define("common-footer", CommonFooter);
customElements.define("common-topbar", CommonTopbar);
customElements.define("common-right-pannel", CommonRightPannel);
customElements.define("easter-egg", EasterEgg);
