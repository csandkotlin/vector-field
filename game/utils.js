// KÍCH THƯỚC MAP & CAMERA
const MAP_W = 2500, MAP_H = 2500;
const CAM_W = 1000, CAM_H = 700;

// Các biến toàn cục
let gameActive = true;
let health = 20;
let score = 0;
let cameraX = 0, cameraY = 0;

// Vật cản
let obstacles = [];
const OBSTACLE_COUNT = 25;

// Hiệu ứng
let healEffects = [];
let teleporters = [];
let teleportCooldown = 0;
const TELEPORT_INTERVAL = 450;
let explosions = [];

let nextEnemyId = 1;

// KHỞI TẠO MAP
function generateObstacles() {
    obstacles = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        let width = 35 + Math.random() * 50;
        let height = 35 + Math.random() * 50;
        let x = 80 + Math.random() * (MAP_W - width - 80);
        let y = 80 + Math.random() * (MAP_H - height - 80);
        if (Math.hypot(x + width/2 - MAP_W/2, y + height/2 - MAP_H/2) < 150) continue;
        obstacles.push({ x: x, y: y, w: width, h: height, type: Math.random() > 0.6 ? 'building' : 'wall' });
    }
}

// KIỂM TRA VA CHẠM
function checkCollisionWithObstaclesForPlayer(entity, radius) {
    for (let obs of obstacles) {
        let closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
        let closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
        let dx = entity.x - closestX, dy = entity.y - closestY;
        let distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
            let angle = Math.atan2(dy, dx);
            let overlap = radius - Math.sqrt(distSq);
            entity.x += Math.cos(angle) * overlap;
            entity.y += Math.sin(angle) * overlap;
            return true;
        }
    }
    return false;
}

function checkCollisionWithObstaclesForEnemy(entity, radius) {
    for (let obs of obstacles) {
        let closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
        let closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
        let dx = entity.x - closestX, dy = entity.y - closestY;
        let distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
            let angle = Math.atan2(dy, dx);
            let overlap = radius - Math.sqrt(distSq);
            entity.x += Math.cos(angle) * overlap;
            entity.y += Math.sin(angle) * overlap;
            return true;
        }
    }
    return false;
}

function checkCollisionWithFortsForEnemy(entity, radius, forts) {
    for (let fort of forts) {
        if (!fort.active) continue;
        let closestX = Math.max(fort.x, Math.min(entity.x, fort.x + fort.w));
        let closestY = Math.max(fort.y, Math.min(entity.y, fort.y + fort.h));
        let dx = entity.x - closestX, dy = entity.y - closestY;
        let distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
            let angle = Math.atan2(dy, dx);
            let overlap = radius - Math.sqrt(distSq);
            entity.x += Math.cos(angle) * overlap;
            entity.y += Math.sin(angle) * overlap;
            return true;
        }
    }
    return false;
}

function bulletCollidesWithObstacles(bullet, isPlayerBullet, forts) {
    for (let obs of obstacles) {
        if (bullet.x > obs.x && bullet.x < obs.x + obs.w && bullet.y > obs.y && bullet.y < obs.y + obs.h) {
            return true;
        }
    }
    if (!isPlayerBullet) {
        for (let fort of forts) {
            if (!fort.active) continue;
            if (bullet.x > fort.x && bullet.x < fort.x + fort.w && bullet.y > fort.y && bullet.y < fort.y + fort.h) {
                return true;
            }
        }
    }
    return false;
}

function updateCamera(player) {
    cameraX = player.x - CAM_W/2;
    cameraY = player.y - CAM_H/2;
    cameraX = Math.min(Math.max(cameraX, 0), MAP_W - CAM_W);
    cameraY = Math.min(Math.max(cameraY, 0), MAP_H - CAM_H);
}

function toScreenX(worldX) { return worldX - cameraX; }
function toScreenY(worldY) { return worldY - cameraY; }

function showPlayAgainButton(initGame) {
    let existingBtn = document.querySelector('.play-again-btn');
    if (existingBtn) existingBtn.remove();
    
    const btn = document.createElement('button');
    btn.innerText = '🔄 PLAY AGAIN 🔄';
    btn.className = 'play-again-btn';
    btn.onclick = () => {
        btn.remove();
        initGame();
    };
    document.querySelector('.game-container').appendChild(btn);
}
