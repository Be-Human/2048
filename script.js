class Game {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = this.getBestScore();
        this.gameOver = false;
        this.tileContainer = document.getElementById('tileContainer');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('bestScore');
        this.gameMessage = document.getElementById('gameMessage');
        this.gameMessageText = this.gameMessage.querySelector('p');
        
        this.bestScoreElement.textContent = this.bestScore;
        this.init();
        this.bindEvents();
    }
    
    init() {
        this.grid = Array(4).fill(null).map(() => Array(4).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.updateScore();
        this.hideGameMessage();
        this.clearTiles();
        this.addRandomTile();
        this.addRandomTile();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
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
        
        for (let row = 0; row < 4; row++) {
            let currentRow = this.grid[row].filter(cell => cell !== null);
            let newRow = [];
            
            for (let i = 0; i < currentRow.length; i++) {
                if (currentRow[i] === currentRow[i + 1]) {
                    const mergedValue = currentRow[i] * 2;
                    newRow.push(mergedValue);
                    this.score += mergedValue;
                    i++;
                } else {
                    newRow.push(currentRow[i]);
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
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        
        for (let row = 0; row < 4; row++) {
            let currentRow = this.grid[row].filter(cell => cell !== null);
            let newRow = [];
            
            for (let i = currentRow.length - 1; i >= 0; i--) {
                if (currentRow[i] === currentRow[i - 1]) {
                    const mergedValue = currentRow[i] * 2;
                    newRow.unshift(mergedValue);
                    this.score += mergedValue;
                    i--;
                } else {
                    newRow.unshift(currentRow[i]);
                }
            }
            
            while (newRow.length < 4) {
                newRow.unshift(null);
            }
            
            this.grid[row] = newRow;
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'right');
        }
        
        return moved;
    }
    
    moveUp() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        
        for (let col = 0; col < 4; col++) {
            let currentCol = [];
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== null) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            let newCol = [];
            for (let i = 0; i < currentCol.length; i++) {
                if (currentCol[i] === currentCol[i + 1]) {
                    const mergedValue = currentCol[i] * 2;
                    newCol.push(mergedValue);
                    this.score += mergedValue;
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
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'up');
        }
        
        return moved;
    }
    
    moveDown() {
        let moved = false;
        const previousGrid = this.copyGrid(this.grid);
        
        for (let col = 0; col < 4; col++) {
            let currentCol = [];
            
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== null) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            let newCol = [];
            for (let i = currentCol.length - 1; i >= 0; i--) {
                if (currentCol[i] === currentCol[i - 1]) {
                    const mergedValue = currentCol[i] * 2;
                    newCol.unshift(mergedValue);
                    this.score += mergedValue;
                    i--;
                } else {
                    newCol.unshift(currentCol[i]);
                }
            }
            
            while (newCol.length < 4) {
                newCol.unshift(null);
            }
            
            for (let row = 0; row < 4; row++) {
                this.grid[row][col] = newCol[row];
            }
        }
        
        this.updateScore();
        moved = this.hasGridChanged(previousGrid);
        
        if (moved) {
            this.animateTiles(previousGrid, 'down');
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
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            this.setBestScore(this.bestScore);
        }
    }
    
    getBestScore() {
        const bestScore = localStorage.getItem('bestScore');
        return bestScore ? parseInt(bestScore) : 0;
    }
    
    setBestScore(score) {
        localStorage.setItem('bestScore', score);
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
