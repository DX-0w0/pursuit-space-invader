const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    width: canvas.width,
    height: canvas.height,
    player: {
        x: canvas.width / 2,
        y: canvas.height - 50,
        width: 50,
        height: 30,
        speed: 5,
        color: '#0f0',
        dx: 0
    },
    enemies: [],
    bullets: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    enemyRows: 4,
    enemyCols: 8,
    enemySize: 30,
    enemyPadding: 20,
    enemyOffsetTop: 50,
    enemyOffsetLeft: 60,
    enemyDirection: 1,
    enemySpeed: 1,
    enemyDropDistance: 20
};

// Create enemies
for (let r = 0; r < game.enemyRows; r++) {
    for (let c = 0; c < game.enemyCols; c++) {
        game.enemies.push({
            x: c * (game.enemySize + game.enemyPadding) + game.enemyOffsetLeft,
            y: r * (game.enemySize + game.enemyPadding) + game.enemyOffsetTop,
            width: game.enemySize,
            height: game.enemySize,
            alive: true
        });
    }
}

// Keyboard controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === ' ' && !game.bullets.some(b => b.fromPlayer)) {
        game.bullets.push({
            x: game.player.x,
            y: game.player.y - game.player.height/2,
            width: 3,
            height: 10,
            speed: 7,
            fromPlayer: true
        });
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

function resetGame() {
    game.enemies = [];
    game.bullets = [];
    game.score = 0;
    game.gameOver = false;
    game.gameStarted = false;
    game.enemyDirection = 1;
    
    // Recreate enemies
    for (let r = 0; r < game.enemyRows; r++) {
        for (let c = 0; c < game.enemyCols; c++) {
            game.enemies.push({
                x: c * (game.enemySize + game.enemyPadding) + game.enemyOffsetLeft,
                y: r * (game.enemySize + game.enemyPadding) + game.enemyOffsetTop,
                width: game.enemySize,
                height: game.enemySize,
                alive: true
            });
        }
    }
}

// Main game loop
function gameLoop() {
    if (!game.gameStarted) {
        // Draw start screen
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE INVADERS', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE to start', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Arrow keys to move, SPACE to shoot', canvas.width/2, canvas.height/2 + 50);
        
        if (keys[' ']) {
            game.gameStarted = true;
        }
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (game.gameOver) {
        // Draw game over screen
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#f00';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press SPACE to play again', canvas.width/2, canvas.height/2 + 50);
        
        if (keys[' ']) {
            resetGame();
        }
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update player position
    if (keys.ArrowLeft) game.player.dx = -game.player.speed;
    if (keys.ArrowRight) game.player.dx = game.player.speed;
    if (!keys.ArrowLeft && !keys.ArrowRight) game.player.dx = 0;
    
    game.player.x += game.player.dx;
    
    // Boundary check
    game.player.x = Math.max(game.player.width/2, 
                           Math.min(game.width - game.player.width/2, game.player.x));
    
    // Update and draw enemies
    let anyEnemiesAlive = false;
    let hitEdge = false;
    
    game.enemies.forEach(enemy => {
        if (enemy.alive) {
            anyEnemiesAlive = true;
            enemy.x += game.enemySpeed * game.enemyDirection;
            
            // Check if any enemy hit edge
            if ((enemy.x + enemy.width/2 > game.width && game.enemyDirection > 0) ||
                (enemy.x - enemy.width/2 < 0 && game.enemyDirection < 0)) {
                hitEdge = true;
            }
            
            // Check if enemy reached bottom
            if (enemy.y + enemy.height/2 > game.player.y - game.player.height/2) {
                game.gameOver = true;
            }
        }
    });
    
    if (hitEdge) {
        game.enemyDirection *= -1;
        game.enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += game.enemyDropDistance;
            }
        });
    }
    
    ctx.fillStyle = '#f00';
    game.enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillRect(
                enemy.x - enemy.width/2,
                enemy.y - enemy.height/2,
                enemy.width,
                enemy.height
            );
        }
    });
    
    // Check if all enemies defeated
    if (!anyEnemiesAlive) {
        resetGame();
    }

    // Check collisions and update/draw bullets
    ctx.fillStyle = '#0ff';
    game.bullets.forEach((bullet, bIndex) => {
        bullet.y -= bullet.speed;
        ctx.fillRect(
            bullet.x - bullet.width/2,
            bullet.y - bullet.height/2,
            bullet.width,
            bullet.height
        );
        
        // Check bullet-enemy collisions
        if (bullet.fromPlayer) {
            game.enemies.forEach((enemy, eIndex) => {
                if (enemy.alive &&
                    bullet.x > enemy.x - enemy.width/2 &&
                    bullet.x < enemy.x + enemy.width/2 &&
                    bullet.y > enemy.y - enemy.height/2 &&
                    bullet.y < enemy.y + enemy.height/2) {
                    
                    enemy.alive = false;
                    game.bullets.splice(bIndex, 1);
                    game.score += 10;
                }
            });
        }
        
        // Remove bullets that go off screen
        if (bullet.y < 0 || bullet.y > game.height) {
            game.bullets.splice(bIndex, 1);
        }
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 20, 30);

    // Draw player
    ctx.fillStyle = game.player.color;
    ctx.fillRect(
        game.player.x - game.player.width/2,
        game.player.y - game.player.height/2,
        game.player.width,
        game.player.height
    );
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
