// GitHub Configuration - REPLACE THESE VALUES
const GIST_ID = '00425639a64c7459ab79885e18446730'; // Your Gist ID
const GITHUB_TOKEN = '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'; // Replace with your token
const GIST_FILENAME = 'app_data.json';

// App State
let appData = {
  leaderboard: [],
  timerState: null
};
let startTime;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

// DOM Elements
const timerDisplay = document.getElementById('timer');
const startTimerBtn = document.getElementById('startTimer');
const stopTimerBtn = document.getElementById('stopTimer');
const nameModal = document.getElementById('nameModal');
const recordedTimeDisplay = document.getElementById('recordedTime');
const playerNameInput = document.getElementById('playerName');
const submitNameBtn = document.getElementById('submitName');
const leaderboardBody = document.getElementById('leaderboardBody');

// Gist Service with improved error handling
const GistService = {
  async load() {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorDetails.message}`);
      }

      const data = await response.json();
      if (!data.files || !data.files[GIST_FILENAME]) {
        throw new Error('Gist file not found');
      }
      
      return JSON.parse(data.files[GIST_FILENAME].content);
    } catch (error) {
      console.error('Load failed:', error);
      // Return default data structure if loading fails
      return { 
        leaderboard: [],
        timerState: null 
      };
    }
  },

  async save(data) {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'Timer app data - Last updated: ' + new Date().toISOString(),
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorDetails.message}`);
      }

      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }
};

// Timer Functions
function startTimer() {
  if (!timerInterval) {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTimer, 10);
  }
}

function updateTimer() {
  elapsedTime = Date.now() - startTime;
  displayTime(elapsedTime);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function displayTime(time) {
  const date = new Date(time);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
  timerDisplay.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Leaderboard Functions
function updateLeaderboard() {
  leaderboardBody.innerHTML = '';
  const sorted = [...appData.leaderboard].sort((a, b) => a.time - b.time);
  
  sorted.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.displayTime}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

// Event Handlers
async function startTimerHandler() {
  isRunning = true;
  startTimerBtn.disabled = true;
  stopTimerBtn.disabled = false;
  startTimer();
  await saveAppData();
}

async function stopTimerHandler() {
  isRunning = false;
  startTimerBtn.disabled = false;
  stopTimerBtn.disabled = true;
  stopTimer();
  recordedTimeDisplay.textContent = timerDisplay.textContent;
  nameModal.style.display = 'block';
  await saveAppData();
}

async function submitNameHandler() {
  const name = playerNameInput.value.trim();
  if (!name) return alert('Please enter your name');

  submitNameBtn.disabled = true;
  submitNameBtn.textContent = 'Saving...';

  try {
    appData.leaderboard.push({
      name: name,
      time: elapsedTime,
      displayTime: timerDisplay.textContent,
      date: new Date().toISOString()
    });

    const success = await saveAppData();
    if (!success) throw new Error('Failed to save');

    updateLeaderboard();
    playerNameInput.value = '';
    nameModal.style.display = 'none';
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to save score. Please try again.');
  } finally {
    submitNameBtn.disabled = false;
    submitNameBtn.textContent = 'Submit';
  }
}

// Data Management
async function loadAppData() {
  appData = await GistService.load();
  if (!appData.leaderboard) appData.leaderboard = [];
  if (!appData.timerState) appData.timerState = null;
}

async function saveAppData() {
  appData.timerState = isRunning ? {
    elapsedTime: elapsedTime,
    isRunning: true,
    lastSaveTime: Date.now()
  } : null;

  return await GistService.save(appData);
}

// Initialize App
async function init() {
  try {
    await loadAppData();
    
    // Restore timer state
    if (appData.timerState) {
      const savedState = appData.timerState;
      elapsedTime = savedState.elapsedTime;
      isRunning = savedState.isRunning;
      
      if (isRunning) {
        elapsedTime += Date.now() - savedState.lastSaveTime;
        startTimer();
      } else {
        displayTime(elapsedTime);
      }
    }

    // Set initial button states
    startTimerBtn.disabled = isRunning;
    stopTimerBtn.disabled = !isRunning;
    
    // Update UI
    updateLeaderboard();
    
    // Set up event listeners
    startTimerBtn.addEventListener('click', startTimerHandler);
    stopTimerBtn.addEventListener('click', stopTimerHandler);
    submitNameBtn.addEventListener('click', submitNameHandler);
    
  } catch (error) {
    console.error('Initialization failed:', error);
    alert('Failed to load application data. Please refresh the page.');
  }
}

// Start the app
window.addEventListener('DOMContentLoaded', init);
