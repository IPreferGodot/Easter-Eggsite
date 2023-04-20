// This script hold the behavior of the password field to grant easter eggs

import { EASTER_EGGS_MANAGER } from "./easter_eggs.js";

const STRICT_PASSWORDS = {
    // password: easter_egg_id,
    "un mot de passe": "placeholder_pwd",
    
};


function attempt(password) {
    let toUnlock = STRICT_PASSWORDS[password];
    if (toUnlock != undefined) {
        EASTER_EGGS_MANAGER.unlock(toUnlock)
    }
    
    // TODO implémenter pour les mots de passe non strict (qui acceptent de petites erreurs)
};

function onValidation() {
    console.log("e")
}

window.onValidation = onValidation
