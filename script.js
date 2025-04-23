// GitHub Configuration
const GIST_ID = '00425639a64c7459ab79885e18446730'; // Your Gist ID
const GITHUB_TOKEN = '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'; // Replace with your token
const GIST_FILENAME = 'app_data.json';

// Enhanced Gist Service
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
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.files[GIST_FILENAME].content);
        } catch (error) {
            console.error('Load failed:', error);
            return { leaderboard: [], timerState: null };
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
                    files: {
                        [GIST_FILENAME]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorDetails = await response.json().catch(() => ({}));
                throw new Error(`Save failed: ${response.status} - ${JSON.stringify(errorDetails)}`);
            }

            return true;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    }
};

// App Implementation
let appData = {
    leaderboard: [],
    timerState: null
};

async function loadAppData() {
    appData = await GistService.load();
    if (!appData.leaderboard) appData.leaderboard = [];
    if (!appData.timerState) appData.timerState = null;
}

async function saveAppData() {
    if (isRunning) {
        appData.timerState = {
            elapsedTime: elapsedTime,
            isRunning: true,
            lastSaveTime: Date.now()
        };
    } else {
        appData.timerState = null;
    }
    return await GistService.save(appData);
}

// Initialize with proper error handling
async function init() {
    try {
        await loadAppData();
        
        // Rest of your initialization code...
        if (appData.timerState) {
            const savedState = appData.timerState;
            elapsedTime = savedState.elapsedTime;
            isRunning = savedState.isRunning;
            
            if (isRunning) {
                const timeSinceLastSave = Date.now() - savedState.lastSaveTime;
                elapsedTime += timeSinceLastSave;
                startTime = Date.now() - elapsedTime;
                startTimer();
            } else {
                displayTime(elapsedTime);
            }
        }

        updateLeaderboard();
        
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to load app data. Please refresh.');
    }
}

// Modified submit handler with user feedback
async function submitNameHandler() {
    const name = playerNameInput.value.trim();
    if (!name) return alert('Please enter your name');

    try {
        submitNameBtn.disabled = true;
        submitNameBtn.textContent = 'Saving...';
        
        appData.leaderboard.push({
            name: name,
            time: elapsedTime,
            displayTime: timerDisplay.textContent,
            timestamp: new Date().toISOString()
        });

        const success = await saveAppData();
        if (!success) throw new Error('Save failed');

        updateLeaderboard();
        playerNameInput.value = '';
        nameModal.style.display = 'none';
    } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to save your score. Please try again.');
    } finally {
        submitNameBtn.disabled = false;
        submitNameBtn.textContent = 'Submit';
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
