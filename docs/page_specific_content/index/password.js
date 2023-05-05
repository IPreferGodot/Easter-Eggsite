// This script hold the behavior of the password field to grant easter eggs

import { EASTER_EGGS_MANAGER } from "../../common/easter_eggs.js";

const STRICT_PASSWORDS = {
    // password: easter_egg_id,
    // "un mot de passe": "exempleA",
    
};
const NON_CASE_SENSITIVE_PASSWORDS = {
    // pAsSWoRd: easter_egg_id,
    // "uN mOt dE pASse": "exempleB",
    "un mot de passe": "placeholder_pwd"
};

// Holds functions that return if a given string should award the easter egg
const SPECIAL_PASSWORDS = {
    // easter_egg_id: (pwd) => {return true / return false}
    // "exempleC": (pwd) => {return pwd[2] == "z"},
};


// Format to lower case every non case sensitive password
for (const password in NON_CASE_SENSITIVE_PASSWORDS) {
    const id = NON_CASE_SENSITIVE_PASSWORDS[password];
    delete NON_CASE_SENSITIVE_PASSWORDS[password];
    NON_CASE_SENSITIVE_PASSWORDS[password.toLowerCase()] = id;
}

const submitButton = document.getElementById("submit-pwd")

function attempt(password) {
    let toUnlock = STRICT_PASSWORDS[password];
    if (toUnlock != undefined) {
        EASTER_EGGS_MANAGER.unlock(toUnlock);
    } else {
        toUnlock = NON_CASE_SENSITIVE_PASSWORDS[password.toLowerCase()];
        if (toUnlock != undefined) {
            EASTER_EGGS_MANAGER.unlock(toUnlock);
        } else {
            for (const [id, validator] in SPECIAL_PASSWORDS) {
                if (validator(password)) {
                    EASTER_EGGS_MANAGER.unlock(id);
                    return;
                }
            }
        }
    }
    
    // Si ça arrive jusque là, c'est que le mot de passe est erroné
    submitButton.classList.remove("wrong"); // remove to replay animation
    setTimeout( // Let time to previous statement to take effect
        () => {submitButton.classList.add("wrong")},
        0
    );
};


const field = document.getElementById("password-field")

submitButton.addEventListener(
    "click",
    () => {
        attempt(field.value);
    }
)