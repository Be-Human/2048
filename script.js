class Game {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = this.getBestScore();
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.history = [];
        this.maxUndoCount = 3;
        this.undoUsed = 0;
        this.moves = 0;
        this.time = 0;
        this.timer = null;
        this.startTime = null;
        this.tileContainer = document.getElementById('tileContainer');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('bestScore');
        this.undoCountElement = document.getElementById('undoCount');
        this.movesCountElement = document.getElementById('movesCount');
        this.timeCountElement = document.getElementById('timeCount');
        this.gameMessage = document.getElementById('gameMessage');
        this.gameMessageText = this.gameMessage.querySelector('p');
        this.continueButton = document.getElementById('continueButton');
        this.merges = [];
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardList = document.getElementById('leaderboardList');
        
        this.bestScoreElement.textContent = this.bestScore;
        this.initTheme();
        
        if (!this.tryRestoreGame()) {
            this.init();
        }
        
        this.bindEvents();
    }
    
    init() {
        if (this.gameOver === false && this.score > 0) {
            this.saveToLeaderboard(this.score);
        }
        this.stopTimer();
        this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.history = [];
        this.undoUsed = 0;
        this.moves = 0;
        this.time = 0;
        this.startTime = null;
        this.updateScore();
        this.updateUndoCount();
        this.updateMovesCount();
        this.updateTimeDisplay();
        this.hideGameMessage();
        this.clearTiles();
        this.addRandomTile();
        this.addRandomTile();
        this.clearSavedGame();
    }
    
    tryRestoreGame() {
        const savedState = this.loadGameState();
        if (!savedState) {
            return false;
        }
        
        try {
            this.grid = savedState.grid;
            this.score = savedState.score;
            this.gameOver = savedState.gameOver;
            this.won = savedState.won || false;
            this.keepPlaying = savedState.keepPlaying || false;
            this.history = savedState.history || [];
            this.undoUsed = savedState.undoUsed || 0;
            this.moves = savedState.moves || 0;
            this.time = savedState.time || 0;
            this.startTime = savedState.startTime || null;
            
            this.updateScore();
            this.updateUndoCount();
            this.updateMovesCount();
            this.updateTimeDisplay();
            
            if (this.gameOver) {
                this.showGameMessage('游戏结束！');
            } else if (this.won && !this.keepPlaying) {
                this.showWinMessage();
            } else {
                this.hideGameMessage();
            }
            
            if (this.startTime && !this.gameOver && !(this.won && !this.keepPlaying)) {
                this.resumeTimer();
            }
            
            this.clearTiles();
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    if (this.grid[row][col] !== null) {
                        this.createTile(row, col, this.grid[row][col]);
                    }
                }
            }
            
            return true;
        } catch (e) {
            console.error('Failed to restore game state:', e);
            this.clearSavedGame();
            return false;
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                this.undo();
                return;
            }
            
            if (this.gameOver || (this.won && !this.keepPlaying)) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });
        
        const newGameButton = document.getElementById('newGameButton');
        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                this.init();
            });
        }
        
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.init();
            });
        }
        
        const continueButton = document.getElementById('continueButton');
        if (continueButton) {
            continueButton.addEventListener('click', () => {
                this.keepPlaying = true;
                this.hideGameMessage();
                if (this.moves > 0) {
                    this.resumeTimer();
                }
                this.saveGameState();
            });
        }
        
        const themeToggleButton = document.getElementById('themeToggleButton');
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        const leaderboardButton = document.getElementById('leaderboardButton');
        if (leaderboardButton) {
            leaderboardButton.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }
        
        const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
        if (closeLeaderboardButton) {
            closeLeaderboardButton.addEventListener('click', () => {
                this.hideLeaderboard();
            });
        }
        
        const clearLeaderboardButton = document.getElementById('clearLeaderboardButton');
        if (clearLeaderboardButton) {
            clearLeaderboardButton.addEventListener('click', () => {
                this.clearLeaderboard();
            });
        }
        
        if (this.leaderboardModal) {
            this.leaderboardModal.addEventListener('click', (e) => {
                if (e.target === this.leaderboardModal) {
                    this.hideLeaderboard();
                }
            });
        }
    }
    
    clearTiles() {
        this.tileContainer.innerHTML = '';
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === null) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[row][col] = value;
            this.createTile(row, col, value, true);
        }
    }
    
    createTile(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        const tileInner = document.createElement('div');
        
        tile.className = `tile tile-${value}${isNew ? ' tile-new' : ''}`;
        tile.style.left = `${this.getPosition(col)}px`;
        tile.style.top = `${this.getPosition(row)}px`;
        
        tileInner.className = 'tile-inner';
        tileInner.textContent = value;
        
        tile.appendChild(tileInner);
        this.tileContainer.appendChild(tile);
        
        return tile;
    }
    
    getPosition(index) {
        const cellSize = 106.25;
        const gap = 15;
        return index * (cellSize + gap);
    }
    
    move(direction) {
        const previousGrid = this.copyGrid(this.grid);
        const previousScore = this.score;
        const moved = this.moveTiles(direction);
        
        if (moved) {
            this.moves++;
            this.updateMovesCount();
            
            if (this.moves === 1 && !this.timer) {
                this.startTimer();
            }
            
            const historyItem = {
                grid: previousGrid,
                score: previousScore
            };
            
            if (this.history.length >= this.maxUndoCount) {
                this.history.shift();
            }
            
            this.history.push(historyItem);
            this.undoUsed = 0;
            this.updateUndoCount();
            
            setTimeout(() => {
                this.addRandomTile();
                this.checkWin();
                this.checkGameOver();
                this.saveGameState();
            }, 150);
        }
    }
    
    copyGrid(grid) {
        return grid.map(row => [...row]);
    }
    
    moveTiles(direction) {
        const previousGrid = this.copyGrid(this.grid);
        this.merges = [];
        
        const config = {
            left: { isRow: true, reverse: false, fillEnd: true },
            right: { isRow: true, reverse: true, fillEnd: false },
            up: { isRow: false, reverse: false, fillEnd: true },
            down: { isRow: false, reverse: true, fillEnd: false }
        }[direction];
        
        for (let i = 0; i < 4; i++) {
            let currentLine = [];
            
            for (let j = 0; j < 4; j++) {
                const value = config.isRow ? this.grid[i][j] : this.grid[j][i];
                if (value !== null) {
                    currentLine.push(value);
                }
            }
            
            let newLine = [];
            let mergePositions = [];
            
            if (config.reverse) {
                for (let j = currentLine.length - 1; j >= 0; j--) {
                    if (currentLine[j] === currentLine[j - 1]) {
                        const mergedValue = currentLine[j] * 2;
                        mergePositions = mergePositions.map(p => p + 1);
                        mergePositions.unshift(0);
                        newLine.unshift(mergedValue);
                        this.score += mergedValue;
                        j--;
                    } else {
                        mergePositions = mergePositions.map(p => p + 1);
                        newLine.unshift(currentLine[j]);
                    }
                }
            } else {
                for (let j = 0; j < currentLine.length; j++) {
                    if (currentLine[j] === currentLine[j + 1]) {
                        const mergedValue = currentLine[j] * 2;
                        newLine.push(mergedValue);
                        this.score += mergedValue;
                        mergePositions.push(newLine.length - 1);
                        j++;
                    } else {
                        newLine.push(currentLine[j]);
                    }
                }
            }
            
            while (newLine.length < 4) {
                if (config.fillEnd) {
                    newLine.push(null);
                } else {
                    newLine.unshift(null);
                    mergePositions = mergePositions.map(p => p + 1);
                }
            }
            
            for (let j = 0; j < 4; j++) {
                if (config.isRow) {
                    this.grid[i][j] = newLine[j];
                } else {
                    this.grid[j][i] = newLine[j];
                }
            }
            
            for (const pos of mergePositions) {
                if (config.isRow) {
                    this.merges.push({ row: i, col: pos, value: newLine[pos] });
                } else {
                    this.merges.push({ row: pos, col: i, value: newLine[pos] });
                }
            }
        }
        
        this.updateScore();
        const moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, direction);
            this.showMergeAnimations();
        }
        
        return moved;
    }
    
    hasGridChanged(previousGrid) {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (previousGrid[row][col] !== this.grid[row][col]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    animateTiles(previousGrid, direction) {
        const tiles = this.tileContainer.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.classList.remove('tile-new');
        });
        
        this.tileContainer.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null) {
                    this.createTile(row, col, this.grid[row][col]);
                }
            }
        }
    }
    
    showMergeAnimations() {
        for (const merge of this.merges) {
            const scoreAnimation = document.createElement('div');
            scoreAnimation.className = 'score-animation';
            scoreAnimation.textContent = `+${merge.value}`;
            scoreAnimation.style.left = `${this.getPosition(merge.col) + 53}px`;
            scoreAnimation.style.top = `${this.getPosition(merge.row) + 53}px`;
            
            this.tileContainer.appendChild(scoreAnimation);
            
            setTimeout(() => {
                scoreAnimation.remove();
            }, 1000);
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            this.setBestScore(this.bestScore);
        }
    }
    
    updateUndoCount() {
        if (this.undoCountElement) {
            this.undoCountElement.textContent = this.maxUndoCount - this.undoUsed;
        }
    }
    
    updateMovesCount() {
        if (this.movesCountElement) {
            this.movesCountElement.textContent = this.moves;
        }
    }
    
    updateTimeDisplay() {
        if (this.timeCountElement) {
            const minutes = Math.floor(this.time / 60);
            const seconds = this.time % 60;
            this.timeCountElement.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
    
    startTimer() {
        if (this.timer) {
            return;
        }
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            this.time++;
            this.updateTimeDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    resumeTimer() {
        if (this.timer) {
            return;
        }
        this.timer = setInterval(() => {
            this.time++;
            this.updateTimeDisplay();
        }, 1000);
    }
    
    getBestScore() {
        const bestScore = localStorage.getItem('bestScore');
        return bestScore ? parseInt(bestScore) : 0;
    }
    
    setBestScore(score) {
        localStorage.setItem('bestScore', score);
    }
    
    saveGameState() {
        const gameState = {
            grid: this.grid,
            score: this.score,
            gameOver: this.gameOver,
            won: this.won,
            keepPlaying: this.keepPlaying,
            history: this.history,
            undoUsed: this.undoUsed,
            moves: this.moves,
            time: this.time,
            startTime: this.startTime
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }
    
    loadGameState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            try {
                return JSON.parse(savedState);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    hasSavedGame() {
        return localStorage.getItem('gameState') !== null;
    }
    
    clearSavedGame() {
        localStorage.removeItem('gameState');
    }
    
    undo() {
        if (this.undoUsed >= this.maxUndoCount || this.history.length === 0) {
            return false;
        }
        
        const previousState = this.history.pop();
        this.grid = previousState.grid;
        this.score = previousState.score;
        this.undoUsed++;
        this.gameOver = false;
        
        this.updateScore();
        this.updateUndoCount();
        this.hideGameMessage();
        
        this.tileContainer.innerHTML = '';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null) {
                    this.createTile(row, col, this.grid[row][col]);
                }
            }
        }
        
        this.saveGameState();
        return true;
    }
    
    checkWin() {
        if (this.won || this.keepPlaying) {
            return;
        }
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 2048) {
                    this.won = true;
                    this.showWinMessage();
                    return;
                }
            }
        }
    }
    
    showWinMessage() {
        this.stopTimer();
        this.gameMessageText.textContent = '你赢了！';
        this.continueButton.style.display = 'inline-block';
        this.gameMessage.classList.add('show');
    }
    
    checkGameOver() {
        if (this.gameOver) {
            return;
        }
        
        if (this.hasEmptyCell()) {
            return;
        }
        
        if (this.canMerge()) {
            return;
        }
        
        this.gameOver = true;
        this.stopTimer();
        this.saveToLeaderboard(this.score);
        this.showGameMessage('游戏结束！');
        this.saveGameState();
    }
    
    hasEmptyCell() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === null) {
                    return true;
                }
            }
        }
        return false;
    }
    
    canMerge() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.grid[row][col];
                
                if (col < 3 && current === this.grid[row][col + 1]) {
                    return true;
                }
                
                if (row < 3 && current === this.grid[row + 1][col]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    showGameMessage(message) {
        this.gameMessageText.textContent = message;
        this.continueButton.style.display = 'none';
        this.gameMessage.classList.add('show');
    }
    
    hideGameMessage() {
        this.gameMessage.classList.remove('show');
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggleButton = document.getElementById('themeToggleButton');
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggleButton) {
                themeToggleButton.textContent = '☀️';
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggleButton) {
                themeToggleButton.textContent = '🌙';
            }
        }
    }
    
    toggleTheme() {
        const body = document.body;
        const themeToggleButton = document.getElementById('themeToggleButton');
        
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            if (themeToggleButton) {
                themeToggleButton.textContent = '🌙';
            }
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-mode');
            if (themeToggleButton) {
                themeToggleButton.textContent = '☀️';
            }
            localStorage.setItem('theme', 'dark');
        }
    }
    
    getLeaderboard() {
        const leaderboard = localStorage.getItem('leaderboard');
        if (leaderboard) {
            try {
                return JSON.parse(leaderboard);
            } catch (e) {
                return [];
            }
        }
        return [];
    }
    
    saveToLeaderboard(score) {
        if (score <= 0) {
            return;
        }
        
        const leaderboard = this.getLeaderboard();
        const now = new Date();
        const dateStr = this.formatDate(now);
        
        const newRecord = {
            score: score,
            moves: this.moves,
            time: this.time,
            date: dateStr,
            timestamp: now.getTime()
        };
        
        leaderboard.push(newRecord);
        
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.timestamp - a.timestamp;
        });
        
        const top5 = leaderboard.slice(0, 5);
        
        localStorage.setItem('leaderboard', JSON.stringify(top5));
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    
    clearLeaderboard() {
        if (confirm('确定要清空所有排行榜记录吗？')) {
            localStorage.removeItem('leaderboard');
            this.renderLeaderboard();
        }
    }
    
    showLeaderboard() {
        this.renderLeaderboard();
        if (this.leaderboardModal) {
            this.leaderboardModal.classList.add('show');
        }
    }
    
    hideLeaderboard() {
        if (this.leaderboardModal) {
            this.leaderboardModal.classList.remove('show');
        }
    }
    
    formatTimeForDisplay(seconds) {
        if (seconds === undefined || seconds === null) {
            return '-';
        }
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    renderLeaderboard() {
        if (!this.leaderboardList) {
            return;
        }
        
        const leaderboard = this.getLeaderboard();
        
        if (leaderboard.length === 0) {
            this.leaderboardList.innerHTML = '<p class="no-records">暂无记录</p>';
            return;
        }
        
        let html = '';
        leaderboard.forEach((record, index) => {
            const rank = index + 1;
            const moves = record.moves !== undefined ? record.moves : '-';
            const time = this.formatTimeForDisplay(record.time);
            
            html += `
                <div class="leaderboard-item">
                    <div class="leaderboard-header">
                        <span class="leaderboard-rank">#${rank}</span>
                        <span class="leaderboard-score">${record.score}</span>
                        <span class="leaderboard-date">${record.date}</span>
                    </div>
                    <div class="leaderboard-details">
                        <span class="leaderboard-moves">步数: ${moves}</span>
                        <span class="leaderboard-time">时间: ${time}</span>
                    </div>
                </div>
            `;
        });
        
        this.leaderboardList.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
