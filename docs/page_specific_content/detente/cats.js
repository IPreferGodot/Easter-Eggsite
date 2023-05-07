import { EASTER_EGGS_MANAGER } from "../../common/easter_eggs.js";
import { SAVE_MANAGER } from "../../common/save_system.js";


const bossRequirement = 40
const bossMaxHealth = 80

const basicCats = [
    "./assets/detente/cats/angry.jpg",
    "./assets/detente/cats/orange.jpg",
    "./assets/detente/cats/sob.jpg",
    "./assets/detente/cats/tilt.jpg",
]

const hitSound = new Audio("../../assets/detente/hit.mp3");
const bossDeathSound = new Audio("../../assets/detente/boss_death.ogg");
bossDeathSound.volume = 0.5
const music = new Audio("../../assets/detente/miaou.ogg");
music.volume = 0.5
let musicStarted = false;

const catContainer = document.getElementById("cat-container")

const catSave = SAVE_MANAGER.create("cat-kill", "0")
const bossSave = SAVE_MANAGER.create("boss-kill", "0")

const killCount = {
    get cat() {
        return parseInt(catSave.value);
    },
    set cat(newValue) {
        catSave.value = String(newValue);
        if (newValue > 1) {
            EASTER_EGGS_MANAGER.unlock("cat_killer_1");
            if (newValue > 10) {
                EASTER_EGGS_MANAGER.unlock("cat_killer_10");
                if (newValue > 50) {
                    EASTER_EGGS_MANAGER.unlock("cat_killer_50");
                    if (newValue > 100) {
                        EASTER_EGGS_MANAGER.unlock("cat_killer_100");
                    }
                }
            }
        }
    },
    get boss() {
        return parseInt(bossSave.value);
    },
    set boss(newValue) {
        bossSave.value = String(newValue);
    }
}

let bossCountDown = 0;

function playHitSound() {
    let newSound = hitSound.cloneNode();
    newSound.volume = 0.2;
    newSound.addEventListener(
        "ended",
        () => {newSound.remove();}
    );
    newSound.play();
}

function startMusic() {
    if (!musicStarted) {
        musicStarted = true;
        music.addEventListener(
            "ended",
            music.play
        )
        music.play();
    }
}

function summonBoss() {
    if (bossCountDown < bossRequirement) {
        return;
    }
    bossCountDown = bossCountDown % bossRequirement;
    
    let bossLife = bossMaxHealth
    
    const bossContainer = document.createElement("div");
    bossContainer.classList.add("boss-container")
    const newBoss = document.createElement("img");
    newBoss.classList.add("boss");
    const healthBar = document.createElement("div");
    healthBar.classList.add("health-bar");
    
    
    newBoss.src = "./assets/detente/cats/boss.jpg"
    
    function hitListener() {
        playHitSound()
        bossLife -= 1;
        if (bossLife > 0) {
            bossContainer.style.setProperty("--health", bossLife/bossMaxHealth*100 + "%")
            bossContainer.style.rotate = (Math.random() - 0.5) * 30 + "deg";
        } else {
            bossDeathSound.play();
            bossContainer.classList.add("dead");
            bossContainer.style.removeProperty("rotate");
            newBoss.removeEventListener("mousedown", hitListener);
            killCount.boss += 1;
        }
    }
    newBoss.addEventListener(
        "mousedown",
        hitListener
    );
    
    bossContainer.addEventListener(
        "animationend",
        (event) => {
            if (event.animationName == "death") {
                bossContainer.remove();
            }
        }
    )
    
    bossContainer.appendChild(newBoss)
    bossContainer.appendChild(healthBar)
    catContainer.appendChild(bossContainer)
}

function buildCat(cat, long) {
    const newCat = document.createElement("img");
    newCat.classList.add("cat");
    
    // Set a random cat style
    newCat.src = cat;
    
    const catStyle = newCat.style;
    if (long) {
        catStyle.transform = "none"
    } else {
        catStyle.maxWidth = 5 + Math.random() * 10 + "%";
        catStyle.rotate = (Math.random() - 0.5) * 30 + "deg";
        catStyle.left = 10 + Math.random() * 80 + "%";
        catStyle.animationDuration = 2 + Math.random() * 4 + "s";
    }
    
    newCat.addEventListener(
        "animationend",
        (event) => {
            if (event.animationName == "travel") {
                newCat.remove();
            }
        }
    );
    newCat.addEventListener(
        "mousedown",
        (event) => {
            playHitSound();
            newCat.remove();
            killCount.cat += 1;
            bossCountDown += 1;
            summonBoss()
            startMusic();
        }
    );
    
    return newCat;
}

function summon() {
    if (catContainer.childElementCount > 20) {
        return;
    }
    
    if (Math.random() < 0.05) {
        let positionPercent = 10
        const tail = buildCat("./assets/detente/cats/long_start.jpg", true);
        tail.style.left = positionPercent + "%"
        catContainer.appendChild(tail)
        
        const length = Math.ceil(Math.random() * 3 + 3)
        for (let i=0; i<length; i++) {
            positionPercent += 10
            const part = buildCat("./assets/detente/cats/long_middle.jpg", true)
            part.style.left = positionPercent + "%"
            catContainer.appendChild(part)
        }
        
        positionPercent += 10
        const head = buildCat("./assets/detente/cats/long_end.jpg", true);
        head.style.left = positionPercent + "%"
        head.style.maxWidth = 10 * 318/118 + "%"
        catContainer.appendChild(head)
    } else {
        catContainer.appendChild(buildCat(basicCats[Math.floor(Math.random() * basicCats.length)]));
    }
}



setInterval(summon, 1000);
// setInterval(summon, 2000);
// setInterval(summon, 5000);
// setInterval(summon, 7000);
// setInterval(summon, 11000);