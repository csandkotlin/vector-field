// NGƯỜI CHƠI
let player = { x: MAP_W/2, y: MAP_H/2, radius: 16 };
const PLAYER_SPEED = 6.2;
let mouseWorld = { x: MAP_W/2, y: MAP_H/2 };
let mouseInside = true;
let movementLocked = false;

// XÂY DỰNG BẰNG GIỮ CHUỘT
let mouseHoldStart = 0;
let isHolding = false;
let buildRequested = false;
const BUILD_HOLD_TIME = 5000; // 5 giây

function updatePlayer() {
    if (!gameActive || movementLocked) return;
    
    let dx = mouseWorld.x - player.x, dy = mouseWorld.y - player.y;
    let distance = Math.hypot(dx, dy);
    if (distance < 4) return;
    let moveSpeed = PLAYER_SPEED;
    if (distance < 25) moveSpeed = Math.max(PLAYER_SPEED * (distance / 25), 1.5);
    let move = Math.min(moveSpeed, distance);
    player.x += (dx / distance) * move;
    player.y += (dy / distance) * move;
    player.x = Math.min(Math.max(player.x, 20), MAP_W - 20);
    player.y = Math.min(Math.max(player.y, 20), MAP_H - 20);
    
    checkCollisionWithObstaclesForPlayer(player, player.radius);
}

function healPlayer() {
    if (health < 20) {
        health++;
        updateUI();
        healEffects.push({ x: player.x, y: player.y, timer: 20 });
        return true;
    }
    return false;
}
