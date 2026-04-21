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
        this.gameSessionId = this.generateGameSessionId();
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
        this.gameMessageText = this.gameMessage.querySelector('p:first-of-type');
        this.rankMessage = document.getElementById('rankMessage');
        this.continueButton = document.getElementById('continueButton');
        this.copyScoreButton = document.getElementById('copyScoreButton');
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
        this.gameSessionId = this.generateGameSessionId();
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
            this.gameSessionId = savedState.gameSessionId || this.gameSessionId;
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
    
    handleSwipe() {
        if (this.gameOver || (this.won && !this.keepPlaying)) return;
        
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.move('right');
            } else {
                this.move('left');
            }
        } else {
            if (deltaY > 0) {
                this.move('down');
            } else {
                this.move('up');
            }
        }
    }
    
    bindEvents() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        const gameContainer = document.getElementById('gameContainer');
        
        if (gameContainer) {
            gameContainer.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            gameContainer.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            gameContainer.addEventListener('touchend', (e) => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    this.touchEndX = e.changedTouches[0].clientX;
                    this.touchEndY = e.changedTouches[0].clientY;
                    this.handleSwipe();
                }
            }, { passive: true });
        }
        
        window.addEventListener('resize', () => {
            this.updateTilePositions();
        });
        
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
                const isGameActive = !this.gameOver && !(this.won && !this.keepPlaying);
                const hasProgress = this.score > 0 || this.moves > 0;
                
                if (isGameActive && hasProgress) {
                    if (confirm('游戏进行中，确定要开始新游戏吗？当前进度将丢失。')) {
                        this.init();
                    }
                } else {
                    this.init();
                }
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
        
        if (this.copyScoreButton) {
            this.copyScoreButton.addEventListener('click', () => {
                this.copyScoreToClipboard();
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
    
    getCellSize() {
        const gridCell = document.querySelector('.grid-cell');
        if (gridCell) {
            return gridCell.offsetWidth;
        }
        return 106.25;
    }
    
    getCellGap() {
        const gridContainer = document.querySelector('.grid-container');
        if (gridContainer) {
            const computedStyle = window.getComputedStyle(gridContainer);
            return parseFloat(computedStyle.gap) || parseFloat(computedStyle.rowGap) || 15;
        }
        return 15;
    }
    
    getPosition(index) {
        const cellSize = this.getCellSize();
        const gap = this.getCellGap();
        return index * (cellSize + gap);
    }
    
    updateTilePositions() {
        this.clearTiles();
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null) {
                    this.createTile(row, col, this.grid[row][col]);
                }
            }
        }
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
                score: previousScore,
                moves: this.moves - 1
            };
            
            if (this.history.length >= this.maxUndoCount) {
                this.history.shift();
            }
            
            this.history.push(historyItem);
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
        
        const movedTiles = [];
        const mergedTiles = [];
        const usedPrevious = new Set();
        const usedCurrent = new Set();
        
        for (const merge of this.merges) {
            const targetRow = merge.row;
            const targetCol = merge.col;
            const targetValue = merge.value;
            const sourceValue = targetValue / 2;
            
            const sources = [];
            
            switch (direction) {
                case 'left':
                    for (let col = targetCol + 1; col < 4; col++) {
                        if (previousGrid[targetRow][col] === sourceValue && sources.length < 2) {
                            sources.push({ row: targetRow, col });
                        }
                    }
                    if (sources.length < 2 && previousGrid[targetRow][targetCol] === sourceValue) {
                        sources.unshift({ row: targetRow, col: targetCol });
                    }
                    break;
                    
                case 'right':
                    for (let col = targetCol - 1; col >= 0; col--) {
                        if (previousGrid[targetRow][col] === sourceValue && sources.length < 2) {
                            sources.push({ row: targetRow, col });
                        }
                    }
                    if (sources.length < 2 && previousGrid[targetRow][targetCol] === sourceValue) {
                        sources.unshift({ row: targetRow, col: targetCol });
                    }
                    break;
                    
                case 'up':
                    for (let row = targetRow + 1; row < 4; row++) {
                        if (previousGrid[row][targetCol] === sourceValue && sources.length < 2) {
                            sources.push({ row, col: targetCol });
                        }
                    }
                    if (sources.length < 2 && previousGrid[targetRow][targetCol] === sourceValue) {
                        sources.unshift({ row: targetRow, col: targetCol });
                    }
                    break;
                    
                case 'down':
                    for (let row = targetRow - 1; row >= 0; row--) {
                        if (previousGrid[row][targetCol] === sourceValue && sources.length < 2) {
                            sources.push({ row, col: targetCol });
                        }
                    }
                    if (sources.length < 2 && previousGrid[targetRow][targetCol] === sourceValue) {
                        sources.unshift({ row: targetRow, col: targetCol });
                    }
                    break;
            }
            
            if (sources.length === 2) {
                mergedTiles.push({
                    targetRow,
                    targetCol,
                    value: targetValue,
                    sources: sources
                });
                
                usedPrevious.add(`${sources[0].row},${sources[0].col}`);
                usedPrevious.add(`${sources[1].row},${sources[1].col}`);
                usedCurrent.add(`${targetRow},${targetCol}`);
            }
        }
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const currentValue = this.grid[row][col];
                if (currentValue === null) continue;
                if (usedCurrent.has(`${row},${col}`)) continue;
                
                let foundSource = null;
                
                switch (direction) {
                    case 'left':
                        for (let c = col; c < 4; c++) {
                            if (previousGrid[row][c] === currentValue && !usedPrevious.has(`${row},${c}`)) {
                                foundSource = { row, col: c };
                                break;
                            }
                        }
                        break;
                        
                    case 'right':
                        for (let c = col; c >= 0; c--) {
                            if (previousGrid[row][c] === currentValue && !usedPrevious.has(`${row},${c}`)) {
                                foundSource = { row, col: c };
                                break;
                            }
                        }
                        break;
                        
                    case 'up':
                        for (let r = row; r < 4; r++) {
                            if (previousGrid[r][col] === currentValue && !usedPrevious.has(`${r},${col}`)) {
                                foundSource = { row: r, col };
                                break;
                            }
                        }
                        break;
                        
                    case 'down':
                        for (let r = row; r >= 0; r--) {
                            if (previousGrid[r][col] === currentValue && !usedPrevious.has(`${r},${col}`)) {
                                foundSource = { row: r, col };
                                break;
                            }
                        }
                        break;
                }
                
                if (foundSource && !(foundSource.row === row && foundSource.col === col)) {
                    movedTiles.push({
                        fromRow: foundSource.row,
                        fromCol: foundSource.col,
                        toRow: row,
                        toCol: col,
                        value: currentValue
                    });
                    usedPrevious.add(`${foundSource.row},${foundSource.col}`);
                    usedCurrent.add(`${row},${col}`);
                }
            }
        }
        
        this.tileContainer.innerHTML = '';
        
        const tilesToAnimate = [];
        
        for (const movedTile of movedTiles) {
            const tile = this.createTile(movedTile.fromRow, movedTile.fromCol, movedTile.value);
            tilesToAnimate.push({
                tile,
                toCol: movedTile.toCol,
                toRow: movedTile.toRow
            });
        }
        
        for (const mergedTile of mergedTiles) {
            for (const source of mergedTile.sources) {
                const tile = this.createTile(source.row, source.col, source.value);
                tilesToAnimate.push({
                    tile,
                    toCol: mergedTile.targetCol,
                    toRow: mergedTile.targetRow
                });
            }
        }
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null) {
                    const isMoved = movedTiles.some(
                        t => t.toRow === row && t.toCol === col
                    );
                    const isMerged = mergedTiles.some(
                        t => t.targetRow === row && t.targetCol === col
                    );
                    
                    if (!isMoved && !isMerged) {
                        this.createTile(row, col, this.grid[row][col]);
                    }
                }
            }
        }
        
        if (tilesToAnimate.length > 0) {
            void this.tileContainer.offsetHeight;
            
            for (const { tile, toCol, toRow } of tilesToAnimate) {
                tile.style.left = `${this.getPosition(toCol)}px`;
                tile.style.top = `${this.getPosition(toRow)}px`;
            }
        }
        
        for (const mergedTile of mergedTiles) {
            setTimeout(() => {
                const allTiles = this.tileContainer.querySelectorAll('.tile');
                const tilesToRemove = [];
                
                for (const tile of allTiles) {
                    const tileLeft = parseFloat(tile.style.left);
                    const tileTop = parseFloat(tile.style.top);
                    const targetLeft = this.getPosition(mergedTile.targetCol);
                    const targetTop = this.getPosition(mergedTile.targetRow);
                    
                    if (Math.abs(tileLeft - targetLeft) < 1 && Math.abs(tileTop - targetTop) < 1) {
                        tilesToRemove.push(tile);
                    }
                }
                
                for (const tile of tilesToRemove) {
                    tile.remove();
                }
                
                const mergedTileElement = this.createTile(
                    mergedTile.targetRow, 
                    mergedTile.targetCol, 
                    mergedTile.value
                );
                mergedTileElement.classList.add('tile-merged');
            }, 150);
        }
    }
    
    showMergeAnimations() {
        const cellSize = this.getCellSize();
        const cellCenter = cellSize / 2;
        
        for (const merge of this.merges) {
            const scoreAnimation = document.createElement('div');
            scoreAnimation.className = 'score-animation';
            scoreAnimation.textContent = `+${merge.value}`;
            scoreAnimation.style.left = `${this.getPosition(merge.col) + cellCenter}px`;
            scoreAnimation.style.top = `${this.getPosition(merge.row) + cellCenter}px`;
            
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
            this.undoCountElement.textContent = this.history.length;
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
            gameSessionId: this.gameSessionId,
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
        if (this.history.length === 0) {
            return false;
        }
        
        const previousState = this.history.pop();
        this.grid = previousState.grid;
        this.score = previousState.score;
        this.moves = previousState.moves !== undefined ? previousState.moves : this.moves - 1;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        this.updateScore();
        this.updateUndoCount();
        this.updateMovesCount();
        this.hideGameMessage();
        
        this.tileContainer.innerHTML = '';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null) {
                    this.createTile(row, col, this.grid[row][col]);
                }
            }
        }
        
        if (this.moves > 0) {
            this.resumeTimer();
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
        
        const rank = this.saveToLeaderboard(this.score);
        
        this.showGameMessage('游戏结束！', rank);
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
    
    showGameMessage(message, rank = null) {
        this.gameMessageText.textContent = message;
        this.continueButton.style.display = 'none';
        
        const maxTile = this.getMaxTileValue();
        let infoHtml = '';
        
        if (maxTile > 0) {
            infoHtml = `本局最高方块：${maxTile}`;
        }
        
        if (rank && this.rankMessage) {
            const rankEmoji = this.getRankEmoji(rank);
            if (infoHtml) {
                infoHtml += '<br>';
            }
            infoHtml += `本局排名：${rankEmoji} 第${rank}名`;
        }
        
        if (this.rankMessage && infoHtml) {
            this.rankMessage.innerHTML = infoHtml;
            this.rankMessage.style.display = 'block';
        } else if (this.rankMessage) {
            this.rankMessage.style.display = 'none';
        }
        
        this.gameMessage.classList.add('show');
    }
    
    getRankEmoji(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    }
    
    getMaxTileValue() {
        let maxValue = 0;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] !== null && this.grid[row][col] > maxValue) {
                    maxValue = this.grid[row][col];
                }
            }
        }
        return maxValue;
    }
    
    hideGameMessage() {
        this.gameMessage.classList.remove('show');
        if (this.rankMessage) {
            this.rankMessage.style.display = 'none';
        }
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
    
    generateGameSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    saveToLeaderboard(score) {
        if (score <= 0) {
            return null;
        }
        
        const leaderboard = this.getLeaderboard();
        const now = new Date();
        const dateStr = this.formatDate(now);
        
        const existingIndex = leaderboard.findIndex(
            record => record.gameSessionId === this.gameSessionId
        );
        
        if (existingIndex !== -1) {
            const existingRecord = leaderboard[existingIndex];
            if (score > existingRecord.score) {
                leaderboard[existingIndex] = {
                    ...existingRecord,
                    score: score,
                    moves: this.moves,
                    time: this.time,
                    date: dateStr,
                    timestamp: now.getTime()
                };
            } else {
                leaderboard.sort((a, b) => {
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    }
                    return b.timestamp - a.timestamp;
                });
                const rank = leaderboard.findIndex(
                    record => record.gameSessionId === this.gameSessionId
                );
                return rank !== -1 ? rank + 1 : null;
            }
        } else {
            const newRecord = {
                score: score,
                moves: this.moves,
                time: this.time,
                date: dateStr,
                timestamp: now.getTime(),
                gameSessionId: this.gameSessionId
            };
            leaderboard.push(newRecord);
        }
        
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.timestamp - a.timestamp;
        });
        
        const top5 = leaderboard.slice(0, 5);
        
        localStorage.setItem('leaderboard', JSON.stringify(top5));
        
        const rank = top5.findIndex(
            record => record.gameSessionId === this.gameSessionId
        );
        return rank !== -1 ? rank + 1 : null;
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
            
            if (confirm('是否同时重置最高分？')) {
                this.bestScore = 0;
                this.bestScoreElement.textContent = '0';
                this.setBestScore(0);
            }
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
            const rankEmoji = this.getRankEmoji(rank);
            const rankClass = `rank-${rank}`;
            const moves = record.moves !== undefined ? record.moves : '-';
            const time = this.formatTimeForDisplay(record.time);
            
            html += `
                <div class="leaderboard-item ${rankClass}">
                    <div class="leaderboard-header">
                        <span class="leaderboard-rank">${rankEmoji}</span>
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
    
    copyScoreToClipboard() {
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const scoreText = `2048游戏成绩
得分：${this.score}
步数：${this.moves}
用时：${timeStr}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(scoreText).then(() => {
                this.showCopySuccess();
            }).catch(() => {
                this.fallbackCopy(scoreText);
            });
        } else {
            this.fallbackCopy(scoreText);
        }
    }
    
    showCopySuccess() {
        const originalText = this.copyScoreButton.textContent;
        this.copyScoreButton.textContent = '已复制！';
        this.copyScoreButton.classList.add('copy-success');
        
        setTimeout(() => {
            this.copyScoreButton.textContent = originalText;
            this.copyScoreButton.classList.remove('copy-success');
        }, 2000);
    }
    
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
