class Game {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = this.getBestScore();
        this.gameOver = false;
        this.history = [];
        this.maxUndoCount = 3;
        this.undoUsed = 0;
        this.tileContainer = document.getElementById('tileContainer');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('bestScore');
        this.undoCountElement = document.getElementById('undoCount');
        this.gameMessage = document.getElementById('gameMessage');
        this.gameMessageText = this.gameMessage.querySelector('p');
        this.merges = [];
        
        this.bestScoreElement.textContent = this.bestScore;
        this.init();
        this.bindEvents();
    }
    
    init() {
        this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.history = [];
        this.undoUsed = 0;
        this.updateScore();
        this.updateUndoCount();
        this.hideGameMessage();
        this.clearTiles();
        this.addRandomTile();
        this.addRandomTile();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                this.undo();
                return;
            }
            
            if (this.gameOver) return;
            
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
        
        document.getElementById('newGameButton').addEventListener('click', () => {
            this.init();
        });
        
        document.getElementById('retryButton').addEventListener('click', () => {
            this.init();
        });
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
        let moved = false;
        
        switch(direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }
        
        if (moved) {
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
                this.checkGameOver();
            }, 150);
        }
    }
    
    copyGrid(grid) {
        return grid.map(row => [...row]);
    }
    
    moveLeft() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        this.merges = [];
        
        for (let row = 0; row < 4; row++) {
            let currentRow = this.grid[row].filter(cell => cell !== null);
            let newRow = [];
            let newCol = 0;
            
            for (let i = 0; i < currentRow.length; i++) {
                if (currentRow[i] === currentRow[i + 1]) {
                    const mergedValue = currentRow[i] * 2;
                    newRow.push(mergedValue);
                    this.score += mergedValue;
                    this.merges.push({ row, col: newCol, value: mergedValue });
                    newCol++;
                    i++;
                } else {
                    newRow.push(currentRow[i]);
                    newCol++;
                }
            }
            
            while (newRow.length < 4) {
                newRow.push(null);
            }
            
            this.grid[row] = newRow;
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'left');
            this.showMergeAnimations();
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        this.merges = [];
        
        for (let row = 0; row < 4; row++) {
            let currentRow = this.grid[row].filter(cell => cell !== null);
            let newRow = [];
            let mergePositions = [];
            
            for (let i = currentRow.length - 1; i >= 0; i--) {
                if (currentRow[i] === currentRow[i - 1]) {
                    const mergedValue = currentRow[i] * 2;
                    newRow.unshift(mergedValue);
                    this.score += mergedValue;
                    mergePositions.unshift(newRow.length - 1);
                    i--;
                } else {
                    newRow.unshift(currentRow[i]);
                }
            }
            
            while (newRow.length < 4) {
                newRow.unshift(null);
                mergePositions = mergePositions.map(p => p + 1);
            }
            
            this.grid[row] = newRow;
            
            for (const pos of mergePositions) {
                this.merges.push({ row, col: pos, value: newRow[pos] });
            }
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'right');
            this.showMergeAnimations();
        }
        
        return moved;
    }
    
    moveUp() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        this.merges = [];
        
        for (let col = 0; col < 4; col++) {
            let currentCol = [];
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== null) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            let newCol = [];
            let mergePositions = [];
            for (let i = 0; i < currentCol.length; i++) {
                if (currentCol[i] === currentCol[i + 1]) {
                    const mergedValue = currentCol[i] * 2;
                    newCol.push(mergedValue);
                    this.score += mergedValue;
                    mergePositions.push(newCol.length - 1);
                    i++;
                } else {
                    newCol.push(currentCol[i]);
                }
            }
            
            while (newCol.length < 4) {
                newCol.push(null);
            }
            
            for (let row = 0; row < 4; row++) {
                this.grid[row][col] = newCol[row];
            }
            
            for (const pos of mergePositions) {
                this.merges.push({ row: pos, col, value: newCol[pos] });
            }
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'up');
            this.showMergeAnimations();
        }
        
        return moved;
    }
    
    moveDown() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        this.merges = [];
        
        for (let col = 0; col < 4; col++) {
            let currentCol = [];
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== null) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            let newCol = [];
            let mergePositions = [];
            for (let i = currentCol.length - 1; i >= 0; i--) {
                if (currentCol[i] === currentCol[i - 1]) {
                    const mergedValue = currentCol[i] * 2;
                    newCol.unshift(mergedValue);
                    this.score += mergedValue;
                    mergePositions.unshift(newCol.length - 1);
                    i--;
                } else {
                    newCol.unshift(currentCol[i]);
                }
            }
            
            while (newCol.length < 4) {
                newCol.unshift(null);
                mergePositions = mergePositions.map(p => p + 1);
            }
            
            for (let row = 0; row < 4; row++) {
                this.grid[row][col] = newCol[row];
            }
            
            for (const pos of mergePositions) {
                this.merges.push({ row: pos, col, value: newCol[pos] });
            }
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'down');
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
    
    getBestScore() {
        const bestScore = localStorage.getItem('bestScore');
        return bestScore ? parseInt(bestScore) : 0;
    }
    
    setBestScore(score) {
        localStorage.setItem('bestScore', score);
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
        
        return true;
    }
    
    checkGameOver() {
        if (this.hasEmptyCell()) {
            return;
        }
        
        if (this.canMerge()) {
            return;
        }
        
        this.gameOver = true;
        this.showGameMessage('游戏结束！');
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
        this.gameMessage.classList.add('show');
    }
    
    hideGameMessage() {
        this.gameMessage.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
