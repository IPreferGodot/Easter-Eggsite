import { SAVE_MANAGER } from "./save_system.js";
import { EventInstance, EASTER_EGG_INFOS } from "./utility.js";

/**
 * Singleton to manage easter eggs.
 */
class EasterEggsManager {
	constructor() {
		this.easterEggs = new Map();
		this.save = SAVE_MANAGER.get("easter-eggs");
		
		this.save.valueChanged.bind(() => {this.searchUnlocked()});
		
		this.unlockedEasterEgg = new EventInstance()
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
				while (((!part.endsWith('"')) || part.endsWith('""')) && !part.endsWith('"""')) {
					i++;
					part += "," + parts[i];
				};
				part = part.slice(1, -1); // On enlève les guillemets
			};
			result.push(part.replace("\n", "<br>").replace('""', '"'));
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
					console.warn(`Incomplete easter egg info at line ${lineIdx + 2} of the csv configuration file.`); // +2 because header was removed
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
	searchUnlocked(FirstLoad = false) {
		const pairs = this.save.value.split("|");
		
		let unlockeds = [];
		
		for (const pair of pairs) {
			const [id, unlockedDate] = pair.split("@");
			const easterEgg = this.easterEggs.get(id);
			if (easterEgg) {
				unlockeds.push(easterEgg);
				
				const wasUnlocked = easterEgg.unlockedDate;
				easterEgg.unlockedDate = new Date(parseInt(unlockedDate));
				if (!FirstLoad && !wasUnlocked) {
					easterEgg.onUnlock.fire();
					EASTER_EGGS_MANAGER.unlockedEasterEgg.fire({ "easterEgg": easterEgg });
				}
			}
		}
		
		// There is no reason an easterEgg would be disunlocked, but implemented just in case, for example if we add a restart option
		if (!FirstLoad) {
			for (const [id, easterEgg] of this.easterEggs) {
				if (!unlockeds.includes(easterEgg) && easterEgg.unlockedDate) {
					easterEgg.unlockedDate = false;
				}
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
		const easterEggsData = await fetch("./assets/easter_eggs.csv").then((response) => response.text());
		let lines = easterEggsData.split("EoL"); // On split sur les fins de ligne personnalisées, mais par sur les fin de ligne dans les cellules
		
		// Plus nécessaire depuis le pré-traitement du fichier
		// if (lines.length < 10) { // Seuil d'erreur arbitraire
		// 	// Sur la version web, les lignes sont séparées par \n plutôt que \r\n comme avec l'extension LiveServer
		// 	lines = easterEggsData.split("\n")
		// }
		
		this.parseCSV(lines);
		this.searchUnlocked(true);
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
			
			this.unlockedEasterEgg.fire({ "easterEgg": easterEgg })
		}
	}
	
	/**
	 * @param {string} id
	 * @returns {boolean}
	 */
	isUnlocked(id) {
		let easterEgg = this.easterEggs.get(id);
		if (!easterEgg) {
			console.warn(
				`Tried to ask if an inexistent easter egg is unlocked (id : "${id}").`
			);
			return false;
		}
		return Boolean(easterEgg.unlockedDate);
	}
	
	/**
	 * 
	 * @param {string} id 
	 */
	disUnlock(id) {
		let easterEgg = this.easterEggs.get(id);
		if (!easterEgg) {
			console.warn(
				`Tried to disunlock easter egg with id "${id}".`
			);
			return;
		}
		easterEgg.unlockedDate = false;
		
		const split = this.save.value.split("|");
		for (const [i, value] of split.entries()) {
			if (value.split("@")[0] == id) {
				split.splice(i, 1);
				break;
			}
		}
		this.save.value = split.join("|");
	}
	
	/**
	 * Cherche l'easter egg correspondant à l'id
	 * @param {string} id
	 * @returns {EasterEgg}
	 */
	get(id) {
		let easterEgg = this.easterEggs.get(id);
		if (!easterEgg) {
			console.error(
				`Inexistant easter egg with id "${id}".`
			);
		}
		return easterEgg;
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
		this._unlockedDate = false;
		
		this.onUnlock = new EventInstance(); // Not fired if unlocked in another tab
		this.onUnlockedDateChanged = new EventInstance();

		for (let [key, value] of informations.entries()) {
			switch (key) {
				case "difficulty":
					value = parseInt(value); break;
				case "hidden":
					// DON'T break
				case "implemented":
					value = value == "1"; break;
			}
			
			this[key] = value;
		}

		EASTER_EGGS_MANAGER.addEasterEgg(this);
	}
	
	get unlockedDate() { return this._unlockedDate; }
	set unlockedDate(newValue) {
		const oldValue = this._unlockedDate;
		this._unlockedDate = newValue;
		if ((oldValue || new Date(-1)).getTime() != (newValue || new Date(-1)).getTime()) {
			this.onUnlockedDateChanged.fire({ "unlockedDate": newValue, "oldValue": oldValue });
		}
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
		this.onUnlock.fire()
		return this.id + "@" + this.unlockedDate.getTime();
	}
	
	/**
	 * Crée une balise pour l'easter egg
	 * @returns {HTMLElement}
	 */
	buildTag() {
		let tag = document.createElement("easter-egg");
		
		tag.id = this.id;
		for (const info of EASTER_EGG_INFOS) {
			if (info == "unlocked") {
				const date = this.unlockedDate;
				tag.setAttribute("unlocked", date ? date : "false");
			} else {
				tag.setAttribute(info, this[info]);
			}
		}
		
		return tag;
	}
}

// On charge les easter eggs et on les attend.
await EASTER_EGGS_MANAGER.loadEasterEggs();

// On rend disponible le gestionnaire d'easter egg
window.unlock = (id) => EASTER_EGGS_MANAGER.unlock(id); // Bad pratice, should find something better.
window.EASTER_EGGS_MANAGER = EASTER_EGGS_MANAGER; // Bad pratice, should find something better.

export { EASTER_EGGS_MANAGER };