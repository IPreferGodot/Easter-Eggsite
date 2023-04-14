import { SAVE_MANAGER } from "./save_system.js";

class EasterEggsManager {
	constructor() {
		this.easterEggs = new Map();
		this.save = SAVE_MANAGER.get("easter-eggs");
	}

	addEasterEgg(easterEgg) {
		this.easterEggs.set(easterEgg.id, easterEgg);
	}

	/**
	 * Lit une ligne CSV, en ne séparant pas aux niveaux des virgules incluses dans des chaînes de caractères.
	 * @param {string} line La ligne à lire.
	 * @returns {Array<string>} Les valeurs de la ligne
	 */
	parseLine(line) {
		let result = [];
		const parts = line.split(",");
		
		for (let i = 0; i < parts.length; i++) {
			let part = parts[i]
			if (part.startsWith('"')) {
				do {
					i++;
					part += parts[i];
				} while (!part.endsWith('"'));
				part = part.slice(1, -1) // On enlève les guillemets
			}
			result.push(part)
		}
		
		return result;
	}
	
	parse_csv_lines(lines) {
		lines = this.trim_csv_lines(lines);
		
		const header = this.parseLine(lines.shift()); // shift() = pop(-1) en python

		let argumentMapper = new Map(); // bidouillage pour remplacer **kwargs

		line_loop: for (const [lineIdx, line] of lines.entries()) {
			let values = this.parseLine(line);
			for (let [columnIdx, value] of values.entries()) {
				value = value.trim();
				if (value == "" || value == "\r") {
					console.warn(`Incomplete easter egg info at line ${lineIdx + 2} of the csv configuration file.`) // +2 because header was removed
					continue line_loop;
				}
				argumentMapper.set(header[columnIdx], value);
			}
			new EasterEgg(argumentMapper);
		}
	}

	searchUnlocked() {
		const pairs = this.save.value.split("|")
		for (const pair of pairs) {
			const [id, unlockedDate] = pair.split("@")
			const easterEgg = this.easterEggs.get(id)
			if (easterEgg) {
				easterEgg.unlockedDate = new Date(parseInt(unlockedDate))
			}
		}
	}
	
	trim_csv_lines(lines) {
		return lines.reduce(
			(accumulator, currentValue) => {
				accumulator.push(currentValue.trim());
				return accumulator;
			},
			[]
		);
	}
	
	/**
	 * Should be called when the manager is created
	 * @async
	 * @returns {EasterEggsManager} this
	 */
	async loadEasterEggs() {
		console.log(this)
		this.parse_csv_lines(
			(
				await fetch("/easter_eggs.csv").then((response) =>
					response.text()
				)
			).split("\r\n")
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
			if (this.save.value) {
				this.save.value += "|" + result
			} else {
				this.save.value += result
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

		for (let [key, value] of informations.entries()) {
			switch (key) {
				case "difficulty":
					value = parseInt(value); break;
				case "hidden":
					value = value == "1"; break;
			}
			
			// if (key == "difficulty") {
			// 	value = parseInt(value);
			// } else if (key) {
				
			// }
			this[key] = value;
			console.log(this);
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
// 	new Save(easterEggId, "1");
// }

await EASTER_EGGS_MANAGER.loadEasterEggs();

window.unlock = (id) => EASTER_EGGS_MANAGER.unlock(id); // Bad pratice, should find something better.
