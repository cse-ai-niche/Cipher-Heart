// GitHub Gist Configuration
const GIST_ID = '00425639a64c7459ab79885e18446730#file-app_data-json'; // Replace with your actual Gist ID
const GITHUB_TOKEN = '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'; // Replace with your GitHub token
const GIST_FILENAME = 'app_data.json';

// Timer variables
let startTime;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

// App data (combines leaderboard and timer state)
let appData = {
    leaderboard: [],
    timerState: null
};

// DOM elements
const timerDisplay = document.getElementById('timer');
const startTimerBtn = document.getElementById('startTimer');
const stopTimerBtn = document.getElementById('stopTimer');
const nameModal = document.getElementById('nameModal');
const recordedTimeDisplay = document.getElementById('recordedTime');
const playerNameInput = document.getElementById('playerName');
const submitNameBtn = document.getElementById('submitName');
const leaderboardBody = document.getElementById('leaderboardBody');

// Initialize the page
async function init() {
    // Load all data from Gist
    await loadAppData();
    
    // Set up timer state if it exists
    if (appData.timerState) {
        const savedState = appData.timerState;
        elapsedTime = savedState.elapsedTime;
        isRunning = savedState.isRunning;
        
        if (isRunning) {
            // Calculate how much time passed since last save
            const timeSinceLastSave = Date.now() - savedState.lastSaveTime;
            elapsedTime += timeSinceLastSave;
            
            // Start the timer with updated elapsed time
            startTime = Date.now() - elapsedTime;
            startTimer();
        } else {
            // Just display the saved time
            displayTime(elapsedTime);
        }
    }

    // Set button states
    startTimerBtn.disabled = isRunning;
    stopTimerBtn.disabled = !isRunning;

    // Update leaderboard display
    updateLeaderboard();
    
    // Set up event listeners
    startTimerBtn.addEventListener('click', startTimerHandler);
    stopTimerBtn.addEventListener('click', stopTimerHandler);
    submitNameBtn.addEventListener('click', submitNameHandler);
    
    // Save state before unload
    window.addEventListener('beforeunload', saveAppData);
}

// Load all app data from GitHub Gist
async function loadAppData() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        const gistData = await response.json();
        
        if (gistData.files && gistData.files[GIST_FILENAME]) {
            appData = JSON.parse(gistData.files[GIST_FILENAME].content) || {
                leaderboard: [],
                timerState: null
            };
        }
    } catch (error) {
        console.error('Error loading app data:', error);
        // Fallback to empty data if there's an error
        appData = {
            leaderboard: [],
            timerState: null
        };
    }
}

// Save all app data to GitHub Gist
async function saveAppData() {
    // Update timer state before saving
    appData.timerState = {
        elapsedTime: elapsedTime,
        isRunning: isRunning,
        lastSaveTime: Date.now()
    };
    
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(appData)
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save app data');
        }
    } catch (error) {
        console.error('Error saving app data:', error);
    }
}

// Start timer handler
async function startTimerHandler() {
    startTime = Date.now() - elapsedTime;
    startTimer();
    startTimerBtn.disabled = true;
    stopTimerBtn.disabled = false;
    isRunning = true;
    await saveAppData();
}

// Stop timer handler
function stopTimerHandler() {
    recordedTimeDisplay.textContent = timerDisplay.textContent;
    nameModal.style.display = 'block';
}

// Handle name submission
async function submitNameHandler() {
    const name = playerNameInput.value.trim();
    
    if (name) {
        appData.leaderboard.push({
            name: name,
            time: elapsedTime,
            displayTime: timerDisplay.textContent
        });
        
        // Save to GitHub Gist
        await saveAppData();
        updateLeaderboard();
        
        playerNameInput.value = '';
        nameModal.style.display = 'none';
    } else {
        alert('Please enter your name');
    }
}

// Update leaderboard display
function updateLeaderboard() {
    leaderboardBody.innerHTML = '';
    
    const sortedLeaderboard = [...appData.leaderboard].sort((a, b) => a.time - b.time);
    
    sortedLeaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.displayTime}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Timer functions (unchanged)
function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 10);
    }
}

function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    displayTime(elapsedTime);
}

function displayTime(time) {
    const hours = Math.floor(time / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((time % (1000 * 60)) / 1000).toString().padStart(2, '0');
    const milliseconds = Math.floor(time % 1000).toString().padStart(3, '0');
    
    timerDisplay.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Initialize the page when loaded
window.onload = init;

// Reset timer (manual function, not called automatically)
async function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    startTime = null;
    timerDisplay.textContent = '00:00:00.000';
    startTimerBtn.disabled = false;
    stopTimerBtn.disabled = true;
    
    // Clear timer state from app data
    appData.timerState = null;
    await saveAppData();
}
