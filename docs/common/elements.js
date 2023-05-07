import { EASTER_EGGS_MANAGER } from "../common/easter_eggs.js";
import { clamp, stopDefault, isTouchDevice, EASTER_EGG_INFOS } from "./utility.js";

const HTML_TO_LOAD = [
    "footer",
    "topbar",
    "right_pannel",
    "easter_egg",
    "popup_container",
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
		let sheets = [...this.root.adoptedStyleSheets, noTranisition];
		this.root.adoptedStyleSheets = sheets;
		this.root.innerHTML = INNERS.get(name);
		
		setTimeout(
			() => {
				sheets.splice(this.root.adoptedStyleSheets.indexOf(noTranisition), 1);
				this.root.adoptedStyleSheets = sheets;
			},
			3000 // Enough for slow 3G (tested with devtool's throttling)
		);
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

class EasterEgg extends HTMLElementHelper {
	constructor() {
		super("easter_egg");
	}

	static get observedAttributes() {
		return EASTER_EGG_INFOS;
	}
	
	// Sync EasterEgg instance with tag
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
	get unlocked() {
		return this.getAttribute("description");
	}
	set unlocked(newValue) {
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

		const easterEggListHeightObserver = this.root.querySelector("#easter-eggs-list .scroll-height-observer");
		for (const [id, easterEgg] of EASTER_EGGS_MANAGER.easterEggs) {
			const tag = easterEgg.buildTag();

			easterEgg.onUnlockedDateChanged.bind((event) => {tag.setAttribute("unlocked", event.unlockedDate ? event.unlockedDate : "false");});
			
			easterEggListHeightObserver.appendChild(tag);
		}
		
		const easterEggList = this.root.querySelector("#easter-eggs-list");
		const scrollBar = this.root.querySelector("#scroll-bar");
		this.cursor = this.root.querySelector("#scroll-cursor");
		this.cursor.addEventListener('selectstart', stopDefault);
		const pseudoThis = this
		function onMouseMove(event) {
			const newCursorPos = clamp(
				pseudoThis.scrollStartCursorY + event.clientY - pseudoThis.scrollStartMouseY,
				0,
				easterEggList.clientHeight - pseudoThis.cursor.clientHeight
			);
			pseudoThis.cursor.style.top = newCursorPos + "px";
			easterEggList.scroll(0, easterEggList.scrollHeight * newCursorPos / scrollBar.clientHeight);
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
				// console.log('list : ' + easterEggList.clientHeight + " cursor : " + this.cursor.clientHeight);
				// console.log(this.scrollStartCursorY);
				this.cursor.style.backgroundColor = "var(--grey)";
				window.addEventListener("mousemove", onMouseMove);
				// window.addEventListener('selectstart', stopDefault);
			}
		);
		window.addEventListener('selectstart', stopDefault);

		window.addEventListener("mouseup", () => {
			window.removeEventListener("mousemove", onMouseMove);
			this.cursor.style.backgroundColor = "";
			// window.removeEventListener('selectstart', stopDefault);
		});
		
		window.addEventListener(
			"wheel",
			(event) => {
				if (event.ctrlKey) {
					return;	
				}
				
				if (
					easterEggListHeightObserver.getBoundingClientRect().top <= event.clientY
					&& event.clientY <= easterEggListHeightObserver.getBoundingClientRect().bottom
				) {
					easterEggList.scroll(0, easterEggList.scrollTop + event.deltaY * (event.altKey?4:(event.shiftKey?1.5:0.5)))
					this.cursor.style.top = easterEggList.scrollTop / easterEggList.scrollHeight * (scrollBar.clientHeight) + "px"
				}
			}
		);
		
		// Timeout sinon les propriétés ne sont pas à jour
		// setTimeout(() => {this.updateScroll()}, 500);
		
		new ResizeObserver(
			(entries) => {
				this.updateScroll();
			}
		).observe(easterEggListHeightObserver ,{ "box": "content-box" });
		
		if (isTouchDevice()) {
			easterEggList.style.pointerEvents = "auto";
			easterEggList.classList.remove("no-scroll-bar");
			scrollBar.classList.add("disabled");
		}
	}
	
	updateScroll() {
		const list = this.root.querySelector("#easter-eggs-list");
		const scrollBar = this.root.querySelector("#scroll-bar");
		
		if (list.scrollHeight == list.clientHeight) {
			scrollBar.classList.add("unnecessary-scroll");
		} else {
			scrollBar.classList.remove("unnecessary-scroll");
		}
		
		const newHeight = (list.clientHeight / list.scrollHeight) * scrollBar.clientHeight;
		if (!newHeight) {
			setTimeout(() => {this.updateScroll()}, 500);
			return;
		}
		
		this.cursor.style.height = (list.clientHeight / list.scrollHeight) * scrollBar.clientHeight + "px";
		this.cursor.style.top = (list.scrollTop / list.scrollHeight) * scrollBar.clientHeight + "px";
	}
}

class CommonPopupContainer extends HTMLElementHelper {
	constructor() {
		super("popup_container");
		
		EASTER_EGGS_MANAGER.unlockedEasterEgg.bind(
			(event) => {
				const tag = event.easterEgg.buildTag();
				tag.root.querySelector("#main-container").classList.add("show-desc");
				tag.addEventListener(
					"animationend",
					(event) => {
						if (event.animationName == "fade-out") {
							tag.remove();
						}
					}
				);
				this.root.querySelector("#notification-flex").appendChild(tag);
			}
		)
	}
}


customElements.define("common-footer", CommonFooter);
customElements.define("common-topbar", CommonTopbar);
customElements.define("common-right-pannel", CommonRightPannel);
customElements.define("easter-egg", EasterEgg);
customElements.define("common-popup-container", CommonPopupContainer);
