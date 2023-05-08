// This script hold the behavior of the password field to grant easter eggs

import { EASTER_EGGS_MANAGER } from "../../common/easter_eggs.js";
import { isTouchDevice } from "../../common/utility.js";

const BLINK_DURATION = 150;

const STRICT_PASSWORDS = {
    // password: easter_egg_id,
    // "un mot de passe": "exempleA",
    
};


const NON_CASE_SENSITIVE_PASSWORDS = {
    // pAsSWoRd: easter_egg_id,
    // "uN mOt dE pASse": "exempleB",
    "un mot de passe": "placeholder_pwd",
};

const EASY_PASSWORDS = [
    "123456789",
    "9876543210",
    "02468",
    "13579",
    "azertyuiop^$",
    "qsdfghjklmù*",
    "wxcvbn,;:!",
    "qwertyuiop[]",
    "asdfghjkl;'#",
    "zxcvbnm,./",
    "AZERTYUIOP¨£",
    "QSDFGHJKLM%µ",
    "WXCVBN?./§",
    "QWERTYUIOP[]",
    "ASDFGHJKL;'#",
    "ZXCVBNM,./",
]

// Holds functions that return if a given string should award the easter egg
const SPECIAL_PASSWORDS = {
    // easter_egg_id: (pwd) => {return true / return false}
    // "exempleC": (pwd) => {return pwd[2] == "z"},
    "too_easy": (pwd) => {
        if (pwd.length < 4) {
            // Maybe implement a "too short" EE instead
            return false;
        }
        
        // Vérifie si le mot de passe n'a que le même caractère
        const firstLetter = pwd[1]
        search: {
            for (const letter of pwd) {
                if (letter != firstLetter) {
                    break search;
                }
            }
            return true;
        }
        
        for (const easy of EASY_PASSWORDS) {
            if (easy.includes(pwd)) {
                return true;
            }
        }
    }
};


if (isTouchDevice()) {
    const arrowPasswords = [
        "<-",
        "<--",
        "<==",
        "<=",
        "←",
        "↤",
        "⬅",
    ];
    
    for (const pwd of arrowPasswords) {
        STRICT_PASSWORDS[pwd] = "fleche";
    }
    
    SPECIAL_PASSWORDS.bourrin = (pwd) => {
        let count = 0
        
        mainLoop: while (pwd) {
            for (const arrow of arrowPasswords) {
                if (pwd.startsWith(arrow)) {
                    pwd = pwd.slice(arrow.length);
                    count += 1;
                    continue mainLoop;
                }
            }
            break;
        }
        if (count >= 6) {
            window.tryBourrin();
            return true;
        }
    }
}

// Format to lower case every non case sensitive password
for (const password in NON_CASE_SENSITIVE_PASSWORDS) {
    const id = NON_CASE_SENSITIVE_PASSWORDS[password];
    delete NON_CASE_SENSITIVE_PASSWORDS[password];
    NON_CASE_SENSITIVE_PASSWORDS[password.toLowerCase()] = id;
}

const submitButton = document.getElementById("submit-pwd")

function success(easterEggID) {
    EASTER_EGGS_MANAGER.unlock(easterEggID);
    field.value = "";
}

function attempt(password) {
    let toUnlock = STRICT_PASSWORDS[password];
    if (toUnlock != undefined) {
        success(toUnlock);
        return;
    } else {
        toUnlock = NON_CASE_SENSITIVE_PASSWORDS[password.toLowerCase()];
        if (toUnlock != undefined) {
            success(toUnlock);
            return;
        } else {
            for (const id in SPECIAL_PASSWORDS) {
                if (SPECIAL_PASSWORDS[id](password)) {
                    success(id);
                    return;
                }
            }
        }
    }
    
    // Si ça arrive jusque là, c'est que le mot de passe est erroné
    submitButton._lastPress = Date.now()
    submitButton.classList.add("wrong");
    setTimeout(
        () => {
            if (submitButton._lastPress < Date.now() - BLINK_DURATION) {
                submitButton.classList.remove("wrong");
            }
        },
        BLINK_DURATION + 1
    );
};


const field = document.getElementById("password-field")

submitButton.addEventListener(
    "click",
    () => {
        attempt(field.value);
    }
)

field.addEventListener(
    "keyup",
    (event) => {
        if (event.key == "Enter") {
            attempt(field.value);
        }
    }
)