import { SAVE_MANAGER } from "./save_system.js";

/**
 * Singleton to manage easter eggs.
 */
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
		const parts = line.trim().split(",");
		
		for (let i = 0; i < parts.length; i++) {
			let part = parts[i];
			if (part.startsWith('"')) {
				while (!part.endsWith('"')) {
					i++;
					part += parts[i];
				};
				part = part.slice(1, -1); // On enlève les guillemets
			};
			result.push(part);
		}
		
		return result;
	}
	
	/**
	 * Lit les lignes pour créer les easter eggs.
	 * @param {Array<string>} lines Les ligne à lire.
	 */
	parseCSV(lines) {
		// lines = this.trimCSV(lines); // Inutile depuis `.split("\r\n")` au lieu de `.split("\n")`
		
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

	/**
	 * Débloque les easter eggs sauvegardés comme déjà débloqués.
	 */
	searchUnlocked() {
		const pairs = this.save.value.split("|")
		for (const pair of pairs) {
			const [id, unlockedDate] = pair.split("@");
			const easterEgg = this.easterEggs.get(id);
			if (easterEgg) {
				easterEgg.unlockedDate = new Date(parseInt(unlockedDate));
			}
		}
	}
	
	/**
	 * @deprecated Peut-être devnu inutile depuis que les lignes sont séparés par \r\n plutôt que \n
	 * @param {Array<string>} lines Les ligne dont il faut enlever les caractères transparents.
	 * @returns Les lignes tronquées
	 */
	trimCSV(lines) {
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
		const easterEggsData = await fetch("./easter_eggs.csv").then((response) => response.text())
		let lines = easterEggsData.split("\r\n")
		
		if (lines.length < 10) { // Seuil d'erreur arbitraire
			// Sur la version web, les lignes sont séparées par \n plutôt que \r\n comme avec l'extension LiveServer
			lines = easterEggsData.split("\n")
		}
		
		this.parseCSV(lines);
		this.searchUnlocked();
	}

	/**
	 * @param {string} id L'ID de l'easter egg à débloquer, sous la forme `bidule_machin`
	 */
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
				this.save.value += "|" + result;
			} else {
				this.save.value += result;
			}
		}
	}
}
const EASTER_EGGS_MANAGER = new EasterEggsManager();

/**
 * Un easter egg, qui stocke les informations qui lui sont relatives.
 */
class EasterEgg {
	/**
	 * @param {Map<string, string>} informations Informations of the easter egg
	 */
	constructor(informations) {
		this.unlockedDate = false;

		for (let [key, value] of informations.entries()) {
			switch (key) {
				case "difficulty":
					value = parseInt(value); break;
				case "hidden":
					value = value == "1"; break;
			}
			
			this[key] = value;
		}

		EASTER_EGGS_MANAGER.addEasterEgg(this);
	}

	/**
	 * Appelée par EasterEggManager.unlock(), ne pas utiliser directement dans la page.
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

// On charge les easter eggs et on les attend.
await EASTER_EGGS_MANAGER.loadEasterEggs();

// On rend disponible le gestionnaire d'easter egg
window.unlock = (id) => EASTER_EGGS_MANAGER.unlock(id); // Bad pratice, should find something better.

export { EASTER_EGGS_MANAGER };