const EASTER_EGG_INFOS = ["name", "difficulty", "description", "unlocked", "hidden", "implemented"];

/**
 * 
 * @param {number} num 
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
}

// Prevent default behavior, for example when selecting text
function stopDefault(e) {
    e.preventDefault();
    return false;
}

// Détecte si l'écran est tactile
function isTouchDevice() {
    return (
        ('ontouchstart' in window)
        || (navigator.maxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0)
    );
}

class EventInstance {
    constructor() {
        this.callbacks = [];
    }
    
    bind(func) {
        this.callbacks.push(func);
    }
    unBind(func) {
        this.callbacks.splice(this.callbacks.find(func), 1);
    }
    fire(args = {}) {
        for (const func of this.callbacks) {
            func(args);
        }
    }
}

export { EASTER_EGG_INFOS, clamp, stopDefault, isTouchDevice, EventInstance };