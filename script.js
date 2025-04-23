// Timer variables
let startTime;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

// Leaderboard data
// localStorage.clear();
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

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
function init() {
    // Load timer state from localStorage
    const savedState = JSON.parse(localStorage.getItem('timerState'));
    
    if (savedState) {
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

    // Load leaderboard data
    updateLeaderboard();
    
    // Set up event listeners
    startTimerBtn.addEventListener('click', startTimerHandler);
    stopTimerBtn.addEventListener('click', stopTimerHandler);
    submitNameBtn.addEventListener('click', submitNameHandler);
    
    // Save state before unload
    window.addEventListener('beforeunload', saveTimerState);
}

function saveTimerState() {
    const timerState = {
        elapsedTime: elapsedTime,
        isRunning: isRunning,
        lastSaveTime: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
}

// Start timer handler
function startTimerHandler() {
    startTime = Date.now() - elapsedTime;
    startTimer();
    startTimerBtn.disabled = true;
    stopTimerBtn.disabled = false;
    isRunning = true;
    saveTimerState();
}

// Start the timer
function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 10);
    }
}

// Update the timer display
function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    displayTime(elapsedTime);
}

// Display time in HH:MM:SS.mmm format
function displayTime(time) {
    const hours = Math.floor(time / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((time % (1000 * 60)) / 1000).toString().padStart(2, '0');
    const milliseconds = Math.floor(time % 1000).toString().padStart(3, '0');
    
    timerDisplay.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Handle stop timer button click
function stopTimerHandler() {
    recordedTimeDisplay.textContent = timerDisplay.textContent;
    nameModal.style.display = 'block';
}

// Handle name submission
function submitNameHandler() {
    const name = playerNameInput.value.trim();
    
    if (name) {
        leaderboard.push({
            name: name,
            time: elapsedTime,
            displayTime: timerDisplay.textContent
        });
        
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
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
    
    const sortedLeaderboard = [...leaderboard].sort((a, b) => a.time - b.time);
    
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

// Initialize the page when loaded
window.onload = init;

// Reset timer (manual function, not called automatically)
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    startTime = null;
    timerDisplay.textContent = '00:00:00.000';
    startTimerBtn.disabled = false;
    stopTimerBtn.disabled = true;
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('timerElapsedTime');
    localStorage.removeItem('timerIsRunning');
}