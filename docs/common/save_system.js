import { EventInstance } from "./utility.js";

/**
 * Une sauvegarde sous la forme clé/valeur
 * Changer sa valeur sauvgarde la paire automatiquement
 * @property {string} value La valeur de la
 */
class Save {
	/**
	 * @param {string} key The key of the save
	 * @param {string} value The initial value of the save (saved value takes priority)
	 */
	constructor(key, value = "") {
		this.key = key;
		this.value = localStorage.getItem(key) || value;
		this.save();
		
		this.valueChanged = new EventInstance();
		
		window.addEventListener(
			"storage",
			(event) => {
				if (event.key == key) {
					this._value = localStorage.getItem(key);
					this.valueChanged.fire({ "newValue":this.value });
				}
			}
		)
	}

	/**
	 * @returns {string}
	 */
	get value() {
		return this._value;
	}
	/**
	 * @param {string} new_value
	 */
	set value(new_value) {
		this._value = new_value;
		this.save();
	}

	save() {
		localStorage.setItem(this.key, this.value);
	}
}


/**
 * Un singleton pour gérer les données sauvegardes
 * @property {Map} saves List of all saves
 */
class SaveManager {
	constructor() {
		this.saves = new Map();
		this.keys = [];
		this.keysSave = this.get("keys");
		this.loadSaves();
	}

	/**
	 * 
	 * @param {string} key 
	 */
	_addKey(key) {
		if (key != "keys" && !(key in this.keys)) {
			this.keys.push(key);
			this.keysSave.value = this.keys.join(";");
		}
	}
	
	/**
	 * 
	 * @param {Save} save The save added to th SaveManager
	 */
	add(save) {
		this.saves.set(save.key, save);
		this._addKey(save.key);
	}
	
	/**
	 * Create a save if none exists for this key
	 * 
	 * @param {string} key The key of the save
	 * @param {string} defaultValue The default value used if there is nothing saved
	 * 
	 * @returns {Save}
	 */
	create(key, defaultValue) {
		let save = this.saves.get(key);
		if (!save) {
			save = new Save(key, defaultValue);
			this.add(save);
		}
		return save;
	}
	
	/**
	 * Renvoie la sauvegarde demandée, en crée une si elle est inexistante
	 * @param {string} key La clé de la sauvegarde demandée
	 * @returns {Save}
	 */
	get(key) {
		let save = this.saves.get(key);
		if (!save) {
			save = new Save(key, "");
			this.add(save);
		}
		return save;
	}
	
	/**
	 * 
	 * @param {string} key 
	 * @param {string} value 
	 */
	set(key, value) {
		this.get(key).value = value
	}
	
	/**
	 * @param {boolean} verbose
	 */
	loadSaves(verbose = false) {
		if (verbose) {console.log("Loading saves :");}
		const keys = this.keysSave.value;
		if (keys == "") {
			return;
		}
		for (const key of keys.split(";")) {
			// WARNING loading is triggered by taking `this.get(key).value` with the getter !
			let value = this.get(key).value;
			if (verbose) {
				console.log(`\t${key} → ${this.get(key).value || "`empty`"}`); // `get()` will load the Save
			}
		}
	}
}
const SAVE_MANAGER = new SaveManager();

export { SAVE_MANAGER };