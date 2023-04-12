/**
 *
 * @property {Map} cookies List of all cookies
 */
class CookieManager {
	constructor() {
		this.cookies = new Map();
	}

	add(cookie) {
		this.cookies.set(cookie.key, cookie);
	}
	
	get(key) {
		let cookie = this.cookies.get(key)
		if (!cookie) {
			cookie = new Cookie(key, "")
		}
		return cookie
	}
	
	load_cookies() {
		console.log("Cookies are :" + document.cookie);
		for (let pair of document.cookie.split(";")) {
			new Cookie(...pair.split("="));
			console.log("Loaded " + pair);
		}
	}
}
const COOKIE_MANAGER = new CookieManager();

class Cookie {
	constructor(key, value = "") {
		this.key = key;
		this.value = value;
		COOKIE_MANAGER.add(this);
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
		document.cookie = this.key + "=" + this.value + "; max-age=3153600000; path=/";
	}
}

COOKIE_MANAGER.load_cookies();

export { Cookie, COOKIE_MANAGER };
