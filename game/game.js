const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CAM_W;
canvas.height = CAM_H;

// DOM elements
const hpSpan = document.getElementById('hpDisplay');
const scoreSpan = document.getElementById('scoreDisplay');
const botStatusSpan = document.getElementById('botStatus');
const respawnTimerDiv = document.getElementById('respawnTimer');
const fortCountSpan = document.getElementById('fortCount');
const lockIndicator = document.getElementById('lockIndicator');
const buildProgressDiv = document.getElementById('buildProgress');

// Teleporter functions
function spawnNormalEnemyAt(x, y) {
    let dx = player.x - x, dy = player.y - y;
    let length = Math.hypot(dx, dy);
    if (length < 0.001) length = 1;
    const vx = (dx / length) * 1.0;
    const vy = (dy / length) * 1.0;
    
    enemies.push({
        id: nextEnemyId++,
        x: x, y: y, vx: vx, vy: vy, r: 10,
        type: 'normal', hp: 2, maxHp: 2, color: '#ff6666', points: 8,
        shootCooldown: 0
    });
    
    explosions.push({ x: x, y: y, timer: 18, isWarning: false, isTeleportSpawn: true });
}

function spawnTeleporter() {
    if (teleportCooldown <= 0) {
        let angle = Math.random() * Math.PI * 2;
        let distance = 280 + Math.random() * 200;
        let x = player.x + Math.cos(angle) * distance;
        let y = player.y + Math.sin(angle) * distance;
        x = Math.min(Math.max(x, 80), MAP_W - 80);
        y = Math.min(Math.max(y, 80), MAP_H - 80);
        teleporters.push({ x: x, y: y, radius: 22, timer: 150 });
        teleportCooldown = TELEPORT_INTERVAL;
    } else {
        teleportCooldown--;
    }
}

function handleTeleporters() {
    for (let i = 0; i < teleporters.length; i++) {
        const tp = teleporters[i];
        tp.timer--;
        
        if (Math.hypot(player.x - tp.x, player.y - tp.y) < player.radius + tp.radius) {
            spawnNormalEnemyAt(tp.x, tp.y);
            teleporters.splice(i, 1);
            i--;
            continue;
        }
        
        if (tp.timer <= 0) {
            teleporters.splice(i, 1);
            i--;
        }
    }
}

// Cập nhật UI
function updateUI() {
    hpSpan.innerText = health;
    scoreSpan.innerText = score;
    let activeForts = forts.filter(f => f.active).length;
    fortCountSpan.innerText = activeForts;
    if (supportBot.active) {
        botStatusSpan.innerText = "ACTIVE";
        botStatusSpan.style.color = "#44aaff";
        respawnTimerDiv.innerText = "🤖 BOT ACTIVE";
    } else {
        botStatusSpan.innerText = "DESTROYED";
        botStatusSpan.style.color = "#ff6666";
        if (botRespawnTimer > 0) {
            let seconds = Math.ceil(botRespawnTimer / 60);
            respawnTimerDiv.innerText = `⏳ RESPAWN: ${seconds}s`;
        } else {
            respawnTimerDiv.innerText = "✅ PRESS 'R' TO RESPAWN (50)";
        }
    }
    lockIndicator.innerText = movementLocked ? "🔒 DI CHUYỂN: KHOÁ" : "🔓 DI CHUYỂN: BẬT";
    lockIndicator.style.color = movementLocked ? "#ff8888" : "#88ff88";
}

// Đăng ký hàm updateUI cho forts.js
setUpdateUI(updateUI);

// SỰ KIỆN - NHẤN ĐÚP ĐỂ LOCK MOVE
let clickCount = 0;
let clickTimer = null;

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CAM_W / rect.width, scaleY = CAM_H / rect.height;
    let screenX = (e.clientX - rect.left) * scaleX;
    let screenY = (e.clientY - rect.top) * scaleY;
    mouseWorld.x = cameraX + screenX;
    mouseWorld.y = cameraY + screenY;
    mouseWorld.x = Math.min(Math.max(mouseWorld.x, 0), MAP_W);
    mouseWorld.y = Math.min(Math.max(mouseWorld.y, 0), MAP_H);
    mouseInside = true;
}

function onMouseLeave() { 
    mouseInside = false;
    if (isHolding) {
        isHolding = false;
        buildRequested = false;
        buildProgressDiv.style.display = "none";
    }
}

function onMouseEnter(e) { 
    mouseInside = true; 
    onMouseMove(e); 
}

function onMouseDown(e) {
    e.preventDefault();
    if (!gameActive) return;
    
    // Xử lý nhấn đúp để lock/move
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    
    clickTimer = setTimeout(() => {
        if (clickCount === 1) {
            // Nhấn 1 lần: bắt đầu giữ để xây (chỉ khi chưa lock movement)
            if (!isHolding && !movementLocked) {
                console.log("Start holding to build fort");
                isHolding = true;
                buildRequested = true;
                mouseHoldStart = Date.now();
            }
        }
        clickCount = 0;
    }, 200);
    
    if (clickCount === 2) {
        // Nhấn đúp: lock/unlock di chuyển
        clearTimeout(clickTimer);
        movementLocked = !movementLocked;
        console.log("Movement locked:", movementLocked);
        updateUI();
        clickCount = 0;
        
        // Hủy xây nếu đang giữ
        if (isHolding) {
            isHolding = false;
            buildRequested = false;
            buildProgressDiv.style.display = "none";
        }
    }
}

function onMouseUp(e) {
    e.preventDefault();
    // Huỷ xây nếu chưa đủ thời gian và không phải do lock movement
    if (isHolding && !movementLocked) {
        console.log("Build cancelled - mouse released early");
        isHolding = false;
        buildRequested = false;
        buildProgressDiv.style.display = "none";
    } else if (isHolding && movementLocked) {
        // Nếu đang giữ nhưng movement bị lock, cũng hủy xây
        isHolding = false;
        buildRequested = false;
        buildProgressDiv.style.display = "none";
    }
}

function onKeyDown(e) {
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        respawnBotInstant();
    }
}

// Khởi tạo game
function initGame() {
    console.log("Initializing game...");
    gameActive = true;
    health = 20;
    score = 0;
    bullets = [];
    botBullets = [];
    enemyBullets = [];
    explosions = [];
    healEffects = [];
    teleporters = [];
    enemies = [];
    forts = [];
    teleportCooldown = 0;
    movementLocked = false;
    nextEnemyId = 1;
    window.spawnedMilestones = {};
    player.x = MAP_W/2; 
    player.y = MAP_H/2;
    supportBot.active = true;
    supportBot.hp = supportBot.maxHp;
    supportBot.healTimer = 0;
    supportBot.selfHealTimer = 0;
    supportBot.x = MAP_W/2 - 45; 
    supportBot.y = MAP_H/2 + 30;
    mouseWorld.x = MAP_W/2; 
    mouseWorld.y = MAP_H/2;
    shootTimer = 0;
    enemySpawnCooldown = 10;
    botRespawnTimer = 0;
    generateObstacles();
    updateCamera(player);
    for(let i = 0; i < 3; i++) spawnEnemy();
    updateUI();
    
    let existingBtn = document.querySelector('.play-again-btn');
    if (existingBtn) existingBtn.remove();
    
    console.log("Game initialized. Fort cost:", FORT_COST);
}

// GAME LOOP
function gameLoop() {
    if (gameActive && health > 0) {
        updatePlayer();
        updateSupportBot(updateUI);
        updateAutoShoot();
        updateBotShoot();
        updateBullets();
        updateEnemiesAndDamage(bullets, botBullets, enemyBullets, supportBot, updateUI);
        handleCollisionsBulletEnemy(updateUI);
        handleEnemyBulletCollisions(supportBot, updateUI);
        updateSpawning();
        spawnTeleporter();
        handleTeleporters();
        updateCamera(player);
        drawBuildProgress();
        
        if (health <= 0) {
            gameActive = false;
            updateUI();
        }
    }
    
    drawMap();
    drawObstacles();
    drawForts();
    drawTeleporters();
    drawBullets();
    drawEnemies();
    drawSupportBot();
    drawPlayer();
    drawExplosions();
    drawHealEffects();
    drawMouseTarget();
    drawUItext();
    drawGameOverlay(initGame);
    
    requestAnimationFrame(gameLoop);
}

// Gán các hàm vào window để có thể truy cập từ các file khác
window.botRespawnTimer = botRespawnTimer;
window.enemyShoot = enemyShoot;

// Đăng ký sự kiện
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseleave', onMouseLeave);
canvas.addEventListener('mouseenter', onMouseEnter);
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
window.addEventListener('keydown', onKeyDown);

// Khởi động game
initGame();
gameLoop();
