// --- Global Variables ---
let currentGrid = [];
let solvedGrid = [];
let selectedCell = null;
let timerInterval;
let startTime;
// --- Add these variables with the other global variables ---
let currentScore = 1000;
let hintsLeft = 3;
let baseScore = 1000;
let scorePenalty = 0;
let difficultyMultiplier = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
};

// --- Helper Functions for Grid Logic ---

/**
 * Generates a full solved Sudoku grid using backtracking.
 * @returns {number[][]} A 9x9 solved grid.
 */
function generateSolvedGrid() {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solve(grid);
    return grid;
}

/**
 * Backtracking algorithm to solve the Sudoku grid.
 * @param {number[][]} grid The 9x9 grid to solve.
 * @returns {boolean} True if the grid is solved, false otherwise.
 */
function solve(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (let num of numbers) {
                    if (isValid(grid, r, c, num)) {
                        grid[r][c] = num;
                        if (solve(grid)) {
                            return true;
                        }
                        grid[r][c] = 0; // Backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if placing a number at a position is valid.
 */
function isValid(grid, r, c, num) {
    // Check row and column
    for (let i = 0; i < 9; i++) {
        if (grid[r][i] === num || grid[i][c] === num) {
            return false;
        }
    }

    // Check 3x3 box
    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[startRow + i][startCol + j] === num) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Shuffles an array (Fisher-Yates algorithm).
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Creates the puzzle by removing numbers from the solved grid.
 * @param {number[][]} solvedGrid - The complete solved grid.
 * @param {string} difficulty - 'easy', 'medium', or 'hard'.
 * @returns {number[][]} The puzzle grid.
 */
function createPuzzle(solvedGrid, difficulty) {
    // Determine the number of cells to clear based on difficulty
    let cellsToRemove;
    switch (difficulty) {
        case 'easy':
            cellsToRemove = 40; // Fewer blanks
            break;
        case 'medium':
            cellsToRemove = 50; // Moderate blanks
            break;
        case 'hard':
            cellsToRemove = 60; // Many blanks
            break;
        default:
            cellsToRemove = 50;
    }

    const puzzle = solvedGrid.map(row => [...row]);
    let positions = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            positions.push({ r, c });
        }
    }
    shuffle(positions);

    let removedCount = 0;
    for (let pos of positions) {
        if (removedCount >= cellsToRemove) break;

        const { r, c } = pos;
        if (puzzle[r][c] !== 0) {
            const temp = puzzle[r][c];
            puzzle[r][c] = 0;
            removedCount++;
        }
    }

    return puzzle;
}

// --- UI and Game Flow Functions ---

/**
 * Switches the active page view.
 */
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    if (pageId === 'game-page' && currentGrid.length === 0) {
        newGame();
    }

    if (pageId === 'stats-page') {
        loadStats();
    }

    document.querySelectorAll('video').forEach(v => v.pause());
}



/**
 * Initializes a new Sudoku game based on selected difficulty.
 */
// Update newGame() function:
function newGame() {
    // Reset timer
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00';
    
    // Reset score and hints
    const difficulty = document.getElementById('game-difficulty').value;
    baseScore = 1000;
    scorePenalty = 0;
    currentScore = baseScore;
    hintsLeft = 3;
    
    // Adjust starting score based on difficulty
    if (difficulty === 'easy') {
        baseScore = 800;
    } else if (difficulty === 'hard') {
        baseScore = 1200;
    }
    
    currentScore = baseScore;
    updateScoreDisplay();
    updateHintDisplay();
    
    // Sync difficulty
    document.getElementById('home-difficulty').value = difficulty;
    
    // Generate grids
    solvedGrid = generateSolvedGrid();
    currentGrid = createPuzzle(solvedGrid, difficulty);
    
    // Render grid
    renderGrid(currentGrid);
    
    // Start timer
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}
/**
 * Renders the Sudoku grid on the page.
 */
function renderGrid(grid) {
    const gridElement = document.getElementById('sudoku-grid');
    gridElement.innerHTML = ''; // Clear previous grid

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            const value = grid[r][c];

            if (value !== 0) {
                cell.classList.add('fixed');
                cell.textContent = value;
                // Store the initial value for reset functionality
                cell.dataset.initial = value;
            } else {
                cell.dataset.initial = 0;
                cell.addEventListener('click', handleCellClick);
                cell.setAttribute('tabindex', '0'); // Make empty cells focusable
            }

            gridElement.appendChild(cell);
        }
    }

    // Initialize mobile keypad and keyboard listeners
    renderMobileKeypad();
    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * Handles the click event on an editable cell.
 */
function handleCellClick(event) {
    // Clear previous highlights
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('active-cell', 'highlight', 'error');
    });

    selectedCell = event.target;
    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);

    // Highlight selected cell
    selectedCell.classList.add('active-cell');

    // Highlight row, column, and 3x3 box
    highlightRelatedCells(r, c);

    // Show mobile keypad if on mobile
    if (window.innerWidth < 769) {
        document.getElementById('mobile-keypad').classList.remove('hidden');
    }
}

/**
 * Highlights the row, column, and 3x3 box of the selected cell.
 */
function highlightRelatedCells(r, c) {
    document.querySelectorAll('.cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Check if in the same row or column
        if (row === r || col === c) {
            cell.classList.add('highlight');
        }

        // Check if in the same 3x3 box
        const boxR = Math.floor(r / 3);
        const boxC = Math.floor(c / 3);
        if (Math.floor(row / 3) === boxR && Math.floor(col / 3) === boxC) {
            cell.classList.add('highlight');
        }
    });

    // Ensure the active cell is on top of the highlight
    if (selectedCell) {
        selectedCell.classList.add('active-cell');
    }
}


/**
 * Handles number input via keyboard.
 */
function handleKeyPress(event) {
    if (!selectedCell || selectedCell.classList.contains('fixed')) return;

    const value = parseInt(event.key);
    const isNumber = !isNaN(value) && value >= 1 && value <= 9;
    const isClearKey = event.key === 'Delete' || event.key === 'Backspace' || event.key === '0';

    if (isNumber) {
        updateCellValue(value);
    } else if (isClearKey) {
        updateCellValue(0);
    }
}

/**
 * Renders and handles input from the mobile keypad.
 */
function renderMobileKeypad() {
    const keypad = document.getElementById('mobile-keypad');
    keypad.innerHTML = '';
    
    // Add hint button to mobile keypad
    const hintBtn = document.createElement('button');
    hintBtn.classList.add('keypad-btn', 'hint-btn');
    hintBtn.textContent = 'Hint';
    hintBtn.style.backgroundColor = '#9c27b0';
    hintBtn.style.color = 'white';
    hintBtn.addEventListener('click', useHint);
    keypad.appendChild(hintBtn);
    
    // Add 1-9 buttons
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.classList.add('keypad-btn');
        btn.textContent = i;
        btn.dataset.value = i;
        btn.addEventListener('click', (e) => {
            if (selectedCell && !selectedCell.classList.contains('fixed')) {
                updateCellValue(parseInt(e.target.dataset.value));
            }
        });
        keypad.appendChild(btn);
    }
    
    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.classList.add('keypad-btn', 'clear-btn');
    clearBtn.textContent = 'Clear';
    clearBtn.dataset.value = '0';
    clearBtn.addEventListener('click', () => {
        if (selectedCell && !selectedCell.classList.contains('fixed')) {
            updateCellValue(0);
        }
    });
    keypad.appendChild(clearBtn);
}

/**
 * Updates the value of the selected cell.
 */
function updateCellValue(value) {
    if (!selectedCell || selectedCell.classList.contains('fixed')) return;

    // Convert value to 0 if it's the clear signal
    const newValue = value === 0 ? '' : value.toString();

    // Update UI
    selectedCell.textContent = newValue;

    // Update internal grid state for solution checking
    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);
    currentGrid[r][c] = value;

    // Check for errors immediately (optional feature)
    validateInput();

    // Check for completion after every valid input
    if (isPuzzleComplete()) {
        checkSolution(true); // Check and declare victory silently
    }
}

/**
 * Validates the user's input against the solved grid.
 */
function validateInput() {
    document.querySelectorAll('.cell:not(.fixed)').forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const userValue = parseInt(cell.textContent) || 0;

        cell.classList.remove('error');

        if (userValue !== 0 && userValue !== solvedGrid[r][c]) {
            cell.classList.add('error');
        }
    });
}

/**
 * Checks if the user's current grid state is the final solution.
 * @param {boolean} silent - If true, only checks, doesn't show alerts/highlights.
 */
function checkSolution(silent = false) {
    let allCorrect = true;
    let gridComplete = isPuzzleComplete();

    document.querySelectorAll('.cell:not(.fixed)').forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const userValue = parseInt(cell.textContent) || 0;

        cell.classList.remove('error');

        if (userValue === 0) {
            allCorrect = false;
        } else if (userValue !== solvedGrid[r][c]) {
            allCorrect = false;
            if (!silent) {
                // Highlight wrong answers only if checking manually
                cell.classList.add('error');
            }
        }
    });

   if (allCorrect && gridComplete) {
    const finalScore = calculateScoreOnWin();
    currentScore = finalScore;
    updateScoreDisplay();
    clearInterval(timerInterval);
    saveWinData(document.getElementById('timer').textContent, finalScore);
    if (!silent) {
        alert(`🎉 Congratulations! You solved the Sudoku in ${document.getElementById('timer').textContent}!\nYour score: ${finalScore} points!`);
    }
}else if (!silent) {
        if (!gridComplete) {
            alert("Keep going! The grid is not yet full.");
        } else {
            alert("Keep going! There are still incorrect numbers on the board.");
        }
    }
}

/**
 * Fills the entire grid with the correct solution and stops the timer.
 */
function showFinalSolution() {
    if (solvedGrid.length === 0) {
        alert("Please start a new game first.");
        return;
    }
    
    // Apply penalty for using solution
    applyPenalty(200);
    
    clearInterval(timerInterval);
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const solutionValue = solvedGrid[r][c];
        
        cell.textContent = solutionValue;
        cell.classList.add('fixed');
        cell.classList.remove('error', 'highlight', 'active-cell');
        currentGrid[r][c] = solutionValue;
    });
    
    alert("The puzzle has been solved for you! (-200 points)\nStart a New Game to try again.");
    document.removeEventListener('keydown', handleKeyPress);
    document.getElementById('mobile-keypad').classList.add('hidden');
    selectedCell = null;
}

/**
 * Checks if all editable cells have a number.
 * @returns {boolean} True if the grid is full.
 */
function isPuzzleComplete() {
    const cells = document.querySelectorAll('.cell:not(.fixed)');
    for (let cell of cells) {
        if (cell.textContent.trim() === '') {
            return false;
        }
    }
    return true;
}


/**
 * Resets the puzzle to its initial state.
 */
function resetGame() {
     scorePenalty = 0;
    currentScore = baseScore;
    updateScoreDisplay();
    document.querySelectorAll('.cell').forEach(cell => {
        const initialValue = cell.dataset.initial;
        cell.classList.remove('active-cell', 'highlight', 'error');
        if (initialValue !== '0') {
            cell.textContent = initialValue;
            cell.classList.add('fixed');
        } else {
            cell.textContent = '';
            cell.classList.remove('fixed');
        }
    });

    // Re-initialize currentGrid from initial state
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            currentGrid[r][c] = parseInt(cell.dataset.initial) || 0;
        }
    }

    // Reset and restart the timer
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('timer').textContent = '00:00';

    // Re-enable input
    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * Updates the game timer display.
 */
function updateTimer() {
    const elapsed = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = formattedTime;
}


// --- Initialization ---

// Sync difficulty selection from Home Page to Game Page
document.getElementById('home-difficulty').addEventListener('change', (e) => {
    document.getElementById('game-difficulty').value = e.target.value;
});

// Run this on load to set up the default view
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ensure the home page's selected difficulty matches the game page's
    const initialDifficulty = document.getElementById('home-difficulty').value;
    document.getElementById('game-difficulty').value = initialDifficulty;

    // 2. Attach event listeners for the How to Play page example grid (if needed)
    const exampleGrid = document.querySelector('.example-grid');
    if (exampleGrid) {
        // Simple cells for illustration (appends cells after the ones already in HTML)
        const currentCells = exampleGrid.children.length;
        for (let i = currentCells; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            exampleGrid.appendChild(cell);
        }
    }
});
let lockedNumber = null;

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('sudoku-dark', document.body.classList.contains('dark-theme'));
}
// ===== STATISTICS SYSTEM =====

// Initialize stats if not present
function initStats() {
    if (!localStorage.getItem('sudokuStats')) {
        localStorage.setItem('sudokuStats', JSON.stringify({
            wins: 0,
            history: []
        }));
    }
}

// Save win data
function saveWinData(time, score) {
    initStats();
    const stats = JSON.parse(localStorage.getItem('sudokuStats'));
    
    const difficulty = document.getElementById('game-difficulty').value;
    const date = new Date().toLocaleString();
    
    stats.wins += 1;
    stats.history.unshift({
        time,
        score: Math.round(score),
        difficulty,
        date
    });
    
    stats.history = stats.history.slice(0, 10);
    localStorage.setItem('sudokuStats', JSON.stringify(stats));
}

// Load stats into UI
function loadStats() {
    initStats();
    const stats = JSON.parse(localStorage.getItem('sudokuStats'));
    
    document.getElementById('stats-won').textContent = stats.wins;
    
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (stats.history.length === 0) {
        historyList.innerHTML = '<li>No games played yet</li>';
        return;
    }
    
    stats.history.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${entry.time}</strong> (${entry.difficulty})
            </div>
            <div>
                Score: <strong>${entry.score || 0}</strong>
            </div>
            <div style="font-size:0.9em;color:#666">
                ${entry.date}
            </div>
        `;
        historyList.appendChild(li);
    });
}

// Clear all statistics
function clearStats() {
    localStorage.removeItem('sudokuStats');
    loadStats();
    alert('Statistics cleared successfully!');
}

// Check for dark mode on startup
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('sudoku-dark') === 'true') document.body.classList.add('dark-theme');
});
// --- Score System Functions ---

function updateScoreDisplay() {
    document.getElementById('score').textContent = Math.max(0, currentScore);
}

function calculateScoreOnWin() {
    const timeString = document.getElementById('timer').textContent;
    const [minutes, seconds] = timeString.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    
    // Bonus for fast completion: subtract time from score penalty
    const timeBonus = Math.max(0, 300 - totalSeconds); // 5-minute max bonus
    const difficulty = document.getElementById('game-difficulty').value;
    const multiplier = difficultyMultiplier[difficulty];
    
    let finalScore = Math.max(0, baseScore - scorePenalty + timeBonus);
    finalScore = Math.round(finalScore * multiplier);
    
    return finalScore;
}

function applyPenalty(points) {
    scorePenalty += points;
    currentScore = Math.max(0, baseScore - scorePenalty);
    updateScoreDisplay();
}

// --- Hint System Functions ---

function updateHintDisplay() {
    document.getElementById('hint-count').textContent = hintsLeft;
    const hintButton = document.getElementById('hint-btn');
    if (hintButton) {
        if (hintsLeft <= 0) {
            hintButton.disabled = true;
            hintButton.textContent = "No Hints Left";
        } else {
            hintButton.disabled = false;
            hintButton.textContent = `Use Hint (-50 points) - ${hintsLeft} left`;
        }
    }
}

function useHint() {
    if (hintsLeft <= 0) {
        alert("No hints remaining!");
        return;
    }
    
    if (!selectedCell || selectedCell.classList.contains('fixed')) {
        alert("Please select an empty cell first!");
        return;
    }
    
    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);
    
    // Check if cell is already correct
    const currentValue = parseInt(selectedCell.textContent) || 0;
    if (currentValue === solvedGrid[r][c]) {
        alert("This cell is already correct!");
        return;
    }
    
    // Apply penalty
    applyPenalty(50);
    
    // Reveal the correct number
    selectedCell.textContent = solvedGrid[r][c];
    selectedCell.classList.add('fixed');
    selectedCell.classList.remove('error');
    
    // Update current grid
    currentGrid[r][c] = solvedGrid[r][c];
    
    // Decrement hints
    hintsLeft--;
    updateHintDisplay();
    
    // Check if puzzle is complete
    if (isPuzzleComplete()) {
        setTimeout(() => checkSolution(true), 500);
    }
    
    // Move to next empty cell
    selectNextEmptyCell(r, c);
}

function selectNextEmptyCell(currentRow, currentCol) {
    for (let r = currentRow; r < 9; r++) {
        for (let c = (r === currentRow ? currentCol + 1 : 0); c < 9; c++) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell && !cell.classList.contains('fixed')) {
                cell.click();
                return;
            }
        }
    }
    
    // If no empty cells found after current position, start from beginning
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell && !cell.classList.contains('fixed')) {
                cell.click();
                return;
            }
        }
    }
}

