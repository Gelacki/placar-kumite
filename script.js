let timerInterval;
let duration = 120; // Default 2 minutes (120 seconds)
let timeLeft = duration;
let pontos = { aka: 0, ao: 0 };
let activeSenshu = null; // To track who has Senshu (null, 'aka', or 'ao')
let matchEnded = false; // Flag to prevent further actions once match is over

// Initialize display on load
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    // Add click listeners for editing names and category
    document.getElementById('nomeAo').addEventListener('click', () => editText('nomeAo', 'Athlete AO Name'));
    document.getElementById('nomeAka').addEventListener('click', () => editText('nomeAka', 'Athlete AKA Name'));
    document.getElementById('categoria').addEventListener('click', () => editText('categoria', 'Category Name'));
});

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Allows editing of text content for athlete names and category.
 * @param {string} id - The ID of the HTML element to edit.
 * @param {string} defaultText - The default text to show in the prompt.
 */
function editText(id, defaultText) {
    const element = document.getElementById(id);
    const currentText = element.innerText;
    let newText = prompt(`Enter new text for ${defaultText}:`, currentText);

    if (newText !== null) { // User did not cancel
        element.innerText = newText.trim() === '' ? defaultText : newText.trim();
    }
}

/**
 * Toggles the Senshu advantage for an athlete.
 * @param {string} lado - The side ('aka' or 'ao') to toggle Senshu for.
 */
function toggleSenshu(lado) {
    if (matchEnded) return;

    const btn = document.getElementById(lado + 'Senshu');

    if (activeSenshu === lado) {
        // If already active, deactivate it
        btn.classList.remove('active');
        activeSenshu = null;
    } else {
        // Deactivate any currently active Senshu
        if (activeSenshu) {
            document.getElementById(activeSenshu + 'Senshu').classList.remove('active');
        }
        // Activate the new Senshu
        btn.classList.add('active');
        activeSenshu = lado;
    }
}

/**
 * Adds or subtracts points for an athlete.
 * Awards Senshu if it's the first point of the match.
 * @param {string} atleta - The athlete's side ('aka' or 'ao').
 * @param {number} valor - The point value to add (e.g., 1, 2, 3) or subtract (-1).
 */
function addPonto(atleta, valor) {
    if (matchEnded) return; // Prevent score changes if match is over

    const oldPoints = pontos[atleta];
    pontos[atleta] = Math.max(0, pontos[atleta] + valor); // Ensure score doesn't go below 0
    document.getElementById(`pontos${capitalize(atleta)}`).innerText = pontos[atleta];

    // Award Senshu if it's the very first point of the match and no Senshu is active
    const totalPoints = pontos.aka + pontos.ao;
    if (totalPoints === valor && valor > 0 && activeSenshu === null) {
        toggleSenshu(atleta);
    }

    verificarVencedor();
}

/**
 * Toggles a penalty for an athlete.
 * Applies specific logic for Hansoku penalties.
 * @param {string} atleta - The athlete's side ('aka' or 'ao').
 * @param {string} tipo - The type of penalty (e.g., 'C1', 'H').
 */
function togglePenalty(atleta, tipo) {
    if (matchEnded && tipo !== "H") return; // Allow Hansoku to be toggled even if match ended by other means

    const el = document.getElementById(`${atleta}${tipo}`);
    el.classList.toggle("active");

    // Specific logic for Hansoku (H)
    if (tipo === "H") {
        const outroLado = atleta === "aka" ? "ao" : "aka";
        if (el.classList.contains("active")) {
            document.getElementById(outroLado).classList.add("blink"); // Opponent blinks
            document.getElementById(atleta).classList.remove("blink"); // Penalized side stops blinking
            pauseTimer(); // Pause timer on Hansoku
            matchEnded = true; // Match ends on Hansoku
        } else {
            // If Hansoku is deactivated, remove blink and allow timer to resume (matchEnded might be true from another cause)
            document.getElementById(outroLado).classList.remove("blink");
            document.getElementById(atleta).classList.remove("blink");
            matchEnded = false; // Match is no longer ended by Hansoku
        }
    }
    verificarVencedor(); // Re-check winner status after penalty change
}

/**
 * Gets the count of active penalties for an athlete.
 * @param {string} atleta - The athlete's side ('aka' or 'ao').
 * @returns {number} The total count of active penalties.
 */
function getPenaltyCount(atleta) {
    let count = 0;
    const penalties = ['C1', 'C2', 'C3', 'HC', 'H'];
    penalties.forEach(p => {
        if (document.getElementById(`${atleta}${p}`).classList.contains('active')) {
            count++;
        }
    });
    return count;
}

/**
 * Checks all win conditions and updates the display accordingly.
 * Win conditions are checked in WKF priority: Hansoku > 8-point difference > Time expiry.
 */
function verificarVencedor() {
    // Clear any previous blinking
    document.getElementById("aka").classList.remove("blink");
    document.getElementById("ao").classList.remove("blink");
    matchEnded = false; // Reset match ended flag

    const akaHansoku = document.getElementById('akaH').classList.contains('active');
    const aoHansoku = document.getElementById('aoH').classList.contains('active');

    // 1. Hansoku (Automatic win for opponent)
    if (akaHansoku) {
        document.getElementById("ao").classList.add("blink");
        pauseTimer();
        matchEnded = true;
        return;
    }
    if (aoHansoku) {
        document.getElementById("aka").classList.add("blink");
        pauseTimer();
        matchEnded = true;
        return;
    }

    // 2. 8-point difference (Kachi by Saishukai)
    const diff = Math.abs(pontos.aka - pontos.ao);
    if (diff >= 8) {
        const vencedor = pontos.aka > pontos.ao ? "aka" : "ao";
        document.getElementById(vencedor).classList.add("blink");
        pauseTimer();
        matchEnded = true;
        return;
    }

    // 3. Time expiry
    if (timeLeft === 0) {
        pauseTimer(); // Ensure timer is stopped
        matchEnded = true; // Match is definitively over by time

        let winner = null;
        if (pontos.aka > pontos.ao) {
            winner = "aka";
        } else if (pontos.ao > pontos.aka) {
            winner = "ao";
        } else { // Scores are tied
            if (activeSenshu === 'aka') {
                winner = "aka";
            } else if (activeSenshu === 'ao') {
                winner = "ao";
            } else { // Scores tied, no Senshu or Senshu cancelled
                const akaPenalties = getPenaltyCount('aka');
                const aoPenalties = getPenaltyCount('ao');

                if (akaPenalties < aoPenalties) {
                    winner = "aka";
                } else if (aoPenalties < akaPenalties) {
                    winner = "ao";
                } else {
                    // Still tied: Hantei (Decision by judges)
                    // In a real scenario, this would prompt judges for decision.
                    // Here, we just won't declare a winner by blinking.
                    console.log("Match tied, Hantei decision needed.");
                }
            }
        }
        if (winner) {
            document.getElementById(winner).classList.add("blink");
        }
        return; // Exit after time expiry checks
    }

    // If match is still ongoing, ensure no one is blinking for a win
    if (!matchEnded) {
        document.getElementById("aka").classList.remove("blink");
        document.getElementById("ao").classList.remove("blink");
    }
}

/**
 * Sets the match duration.
 */
function definirTempo() {
    if (timerInterval) { // Prevent changing time while timer is running
        alert("Please pause the timer before setting a new time.");
        return;
    }
    let newMin = prompt("Enter minutes:", String(Math.floor(duration / 60)));
    let newSec = prompt("Enter seconds:", String(duration % 60).padStart(2, "0"));

    const min = parseInt(newMin);
    const sec = parseInt(newSec);

    if (!isNaN(min) && !isNaN(sec) && min >= 0 && sec >= 0 && sec < 60) {
        duration = min * 60 + sec;
        timeLeft = duration;
        updateDisplay();
    } else {
        alert("Invalid time entered. Please enter valid numbers for minutes (>=0) and seconds (0-59).");
    }
}

/**
 * Updates the timer display and applies warning/final styles.
 */
function updateDisplay() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;
    const timerElement = document.getElementById("timer");
    timerElement.innerText = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    timerElement.classList.remove('warning', 'final');
    if (timeLeft <= 15 && timeLeft > 0) {
        timerElement.classList.add('warning');
    } else if (timeLeft === 0) {
        timerElement.classList.add('final');
    }
}

/**
 * Starts the match timer.
 */
function startTimer() {
    if (timerInterval || matchEnded) return; // Prevent starting if already running or match ended

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            verificarVencedor(); // Check winner when time runs out
        }
    }, 1000);
}

/**
 * Pauses the match timer.
 */
function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/**
 * Resets all scores, penalties, timer, and Senshu.
 */
function resetAll() {
    pauseTimer();
    pontos.aka = 0;
    pontos.ao = 0;
    document.getElementById("pontosAka").innerText = "0";
    document.getElementById("pontosAo").innerText = "0";

    // Reset all penalty buttons
    document.querySelectorAll(".pen-btn").forEach(btn => btn.classList.remove("active"));
    
    // Remove blinking from athlete sections
    document.getElementById("aka").classList.remove("blink");
    document.getElementById("ao").classList.remove("blink");

    // Reset Senshu
    document.getElementById("akaSenshu").classList.remove("active");
    document.getElementById("aoSenshu").classList.remove("active");
    activeSenshu = null; 
    
    timeLeft = duration; // Reset timer to initial duration
    matchEnded = false; // Reset match ended flag
    updateDisplay(); // Update timer display
}

/**
 * Toggles full-screen mode for the document.
 */
function alternarTelaCheia() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}