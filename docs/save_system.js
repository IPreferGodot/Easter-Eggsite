class Save {
	/**
	 * 
	 * @param {string} key The key of the save
	 * @param {string} value The initial value of the save (saved value takes priority)
	 */
	constructor(key, value = "") {
		this.key = key;
		this.value = localStorage.getItem(key) || value;
		this.save();
	}

	get value() {
		return this._value;
	}
	set value(new_value) {
		this._value = new_value;
		this.save();
	}

	save() {
		localStorage.setItem(this.key, this.value)
		// document.save = this.key + "=" + this.value + "; max-age=3153600000; path=/";
	}
}


/**
 *
 * @property {Map} saves List of all saves
 */
class SaveManager {
	constructor() {
		this.saves = new Map();
		this.keys = [];
		this.keysSave = this.get("keys");
		this.loadSaves();
	}

	_addKey(key) {
		if (key != "keys" && !(key in this.keys)) {
			this.keys.push(key)
			this.keysSave.value = this.keys.join(";")
		}
	}
	
	add(save) {
		this.saves.set(save.key, save);
		this._addKey(save.key)
	}
	
	get(key) {
		let save = this.saves.get(key);
		if (!save) {
			save = new Save(key, "");
			this.add(save);
		}
		return save;
	}
	
	set(key, value) {
		this.get(key).value = value
	}
	
	loadSaves() {
		console.log("Loading saves :");
		const keys = this.keysSave.value;
		if (keys == "") {
			return;
		}
		for (const key of keys.split(";")) {
			console.log(`\t${key} → ${this.get(key).value || "`empty`"}`) // `get()` will load the Save
		}
	}
}
const SAVE_MANAGER = new SaveManager();

export { SAVE_MANAGER };