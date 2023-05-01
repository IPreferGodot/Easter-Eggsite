function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
}

// Prevent default behavior, for example when selecting text
function stopDefault(e) {
    e.preventDefault()
    return false;
}


export { clamp, stopDefault };