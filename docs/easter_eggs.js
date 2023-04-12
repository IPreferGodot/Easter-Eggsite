import { COOKIE_MANAGER } from "./cookies.js";

console.log(parseInt(105));

class EasterEggsManager {
	constructor() {
		this.easterEggs = new Map();
		this.cookie = COOKIE_MANAGER.get("easter-eggs");
	}

	addEasterEgg(easterEgg) {
		this.easterEggs.set(easterEgg.id, easterEgg);
	}

	parse_csv_lines(lines) {
		const header = lines.shift().split(","); // comme pop_front()

		let argument_mapper = new Map(); // bidouillage pour remplacer **kwargs

		line_loop: for (const [lineIdx, line] of lines.entries()) {
			let values = line.split(",");
			for (let [columnIdx, value] of values.entries()) {
				value = value.trim();
				if (value == "" || value == "\r") {
					console.warn(`Incomplete easter egg info at line ${lineIdx + 2} of the csv configuration file.`) // +2 because header was removed
					continue line_loop;
				}
				argument_mapper.set(header[columnIdx], value);
			}
			new EasterEgg(argument_mapper);
		}
	}

	searchUnlocked() {
		const pairs = this.cookie.value.split("|")
		for (const pair of pairs) {
			const [id, unlockedDate] = pair.split("@")
			const easterEgg = this.easterEggs.get(id)
			if (easterEgg) {
				easterEgg.unlockedDate = new Date(parseInt(unlockedDate))
			}
		}
	}

	/**
	 * Should be called when the manager is created
	 * @async
	 * @returns {EasterEggsManager} this
	 */
	async loadEasterEggs() {
		this.parse_csv_lines(
			(
				await fetch("/easter_eggs.csv").then((response) =>
					response.text()
				)
			).split("\n")
		);
		this.searchUnlocked();
	}

	unlock(id) {
		let easterEgg = this.easterEggs.get(id);
		if (!easterEgg) {
			console.warn(
				`Tried to unlock inexistent easter egg with id "${id}".`
			);
		}

		let result = easterEgg.unlock();
		if (result) {
			if (this.cookie.value) {
				this.cookie.value += "|" + result
			} else {
				this.cookie.value += result
			}
		}
	}
}
const EASTER_EGGS_MANAGER = new EasterEggsManager();

class EasterEgg {
	/**
	 * @param {Map<string, string>} informations Informations of the easter egg
	 */
	constructor(informations) {
		console.log(informations);

		this.unlockedDate = false;

		console.log(informations.entries());

		for (const [key, value] of informations.entries()) {
			if (key == "difficulty") {
				value = parseInt(value);
			}
			this[key] = value;
		}

		console.log(this);
		// 	this.id = id;
		// 	this.name = name;
		// 	this.description = description;

		EASTER_EGGS_MANAGER.addEasterEgg(this);
	}
	// constructor(id, name = "Unnamed", description = "No description") {
	// 	this.id = id;
	// 	this.name = name;
	// 	this.description = description;

	// 	EASTER_EGGS_MANAGER.add_easter_egg(this);
	// }

	/**
	 *
	 * @returns {false|string} Renvoie faux si déjà débloqué, sinon la chaîne à sauvegarder
	 */
	unlock() {
		if (this.unlockedDate) {
			// Already unlocked
			return false;
		}
		this.unlockedDate = new Date();
		return this.id + "@" + this.unlockedDate.getTime();
	}
}

// export function unlock(easterEggId) {
// 	console.log("Unlocked " + easterEggId);
// 	new Cookie(easterEggId, "1");
// }

await EASTER_EGGS_MANAGER.loadEasterEggs();

window.unlock = (id) => EASTER_EGGS_MANAGER.unlock(id); // Bad pratice, should find something better.
