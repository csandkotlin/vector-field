// BOT ĐỒNG MINH
let supportBot = {
    x: MAP_W/2 - 45, y: MAP_H/2 + 30, radius: 12,
    active: true, shootTimer: 0, shootDelay: 7,
    hp: 5, maxHp: 5,
    healTimer: 0, healDelay: 550,
    selfHealTimer: 0, selfHealDelay: 450
};

let botRespawnTimer = 0;
const botRespawnCooldown = 30;

window.botRespawnTimer = botRespawnTimer;

function shootFromBot() {
    if (!gameActive || !supportBot.active || enemies.length === 0) return;
    
    let priorityEnemy = null;
    let priorityScore = -1;
    
    for (let enemy of enemies) {
        let scoreVal = 0;
        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const distToBot = Math.hypot(enemy.x - supportBot.x, enemy.y - supportBot.y);
        
        if (enemy.type === 'shooter') scoreVal += 30;
        if (enemy.type === 'runner') scoreVal += 20;
        if (distToPlayer < 200) scoreVal += 40;
        if (distToBot < 250) scoreVal += 20;
        
        if (scoreVal > priorityScore) {
            priorityScore = scoreVal;
            priorityEnemy = enemy;
        }
    }
    
    if (priorityEnemy) {
        let dx = priorityEnemy.x - supportBot.x, dy = priorityEnemy.y - supportBot.y;
        let len = Math.hypot(dx, dy);
        if (len < 0.001) len = 1;
        const normX = dx / len, normY = dy / len;
        botBullets.push({ x: supportBot.x, y: supportBot.y, vx: normX * (BULLET_SPEED - 1), vy: normY * (BULLET_SPEED - 1), radius: BULLET_RADIUS - 1, damage: 1 });
    }
}

function healBot() {
    if (supportBot.active && supportBot.hp < supportBot.maxHp) {
        supportBot.hp++;
        updateUI();
        return true;
    }
    return false;
}

function updateSupportBot(updateUI) {
    if (!gameActive) return;
    
    if (!supportBot.active && gameActive && health > 0) {
        if (botRespawnTimer > 0) { 
            botRespawnTimer--; 
            updateUI(); 
        }
        else if (botRespawnTimer === 0) { 
            autoRespawnBot(); 
        }
    }
    
    if (!supportBot.active) { updateUI(); return; }
    
    if (supportBot.healTimer <= 0) {
        if (healPlayer()) {
            healEffects.push({ x: supportBot.x, y: supportBot.y, timer: 20, fromBot: true });
        }
        supportBot.healTimer = supportBot.healDelay;
    } else {
        supportBot.healTimer--;
    }
    
    if (supportBot.selfHealTimer <= 0) {
        if (healBot()) {}
        supportBot.selfHealTimer = supportBot.selfHealDelay;
    } else {
        supportBot.selfHealTimer--;
    }
    
    let dodgeX = 0, dodgeY = 0;
    for (let bullet of enemyBullets) {
        let dx = supportBot.x - bullet.x;
        let dy = supportBot.y - bullet.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 80 && dist > 0) {
            let force = (80 - dist) / 80;
            dodgeX += (dx / dist) * force * 4;
            dodgeY += (dy / dist) * force * 4;
        }
    }
    
    for (let enemy of enemies) {
        let dx = supportBot.x - enemy.x;
        let dy = supportBot.y - enemy.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 70 && dist > 0) {
            let force = (70 - dist) / 70;
            dodgeX += (dx / dist) * force * 3;
            dodgeY += (dy / dist) * force * 3;
        }
    }
    
    const time = Date.now() / 1000;
    let orbitX = Math.cos(time * 1.5) * 70;
    let orbitY = Math.sin(time * 1.8) * 55;
    let targetX = player.x + orbitX + dodgeX;
    let targetY = player.y + orbitY + dodgeY;
    
    targetX = Math.min(Math.max(targetX, supportBot.radius + 10), MAP_W - supportBot.radius - 10);
    targetY = Math.min(Math.max(targetY, supportBot.radius + 10), MAP_H - supportBot.radius - 10);
    supportBot.x = supportBot.x * 0.9 + targetX * 0.1;
    supportBot.y = supportBot.y * 0.9 + targetY * 0.1;
    supportBot.x = Math.min(Math.max(supportBot.x, supportBot.radius + 5), MAP_W - supportBot.radius - 5);
    supportBot.y = Math.min(Math.max(supportBot.y, supportBot.radius + 5), MAP_H - supportBot.radius - 5);
    
    checkCollisionWithObstaclesForEnemy(supportBot, supportBot.radius);
    // Bot có thể đi qua fort - không xử lý va chạm với fort
}

function autoRespawnBot() {
    if (!supportBot.active && gameActive && health > 0 && botRespawnTimer <= 0) {
        supportBot.active = true;
        supportBot.hp = supportBot.maxHp;
        supportBot.x = player.x - 45;
        supportBot.y = player.y + 30;
        supportBot.healTimer = 0;
        supportBot.selfHealTimer = 0;
        updateUI();
    }
}

function respawnBotInstant() {
    if (!supportBot.active && score >= 50 && gameActive && health > 0) {
        score -= 50;
        supportBot.active = true;
        supportBot.hp = supportBot.maxHp;
        supportBot.x = player.x - 45;
        supportBot.y = player.y + 30;
        supportBot.healTimer = 0;
        supportBot.selfHealTimer = 0;
        botRespawnTimer = 0;
        updateUI();
    }
}

function updateBotShoot() {
    if (!gameActive || !supportBot.active) return;
    if (supportBot.shootTimer <= 0) {
        shootFromBot();
        supportBot.shootTimer = supportBot.shootDelay;
    } else {
        supportBot.shootTimer--;
    }
}
