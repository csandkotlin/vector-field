// ENEMY
let enemies = [];
let enemySpawnCooldown = 0;
const MAX_ENEMIES = 10;
const RESPAWN_THRESHOLD = 8;
const BASE_SPAWN_DELAY = 50;

function findCoverObstacle(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let obs of obstacles) {
        let obsCenterX = obs.x + obs.w/2;
        let obsCenterY = obs.y + obs.h/2;
        let distToPlayer = Math.hypot(player.x - obsCenterX, player.y - obsCenterY);
        let distToSelf = Math.hypot(x - obsCenterX, y - obsCenterY);
        if (distToSelf < bestDist && distToSelf < 200 && distToPlayer > 100) {
            bestDist = distToSelf;
            best = obs;
        }
    }
    return best;
}

function spawnSingleEnemy(type) {
    let side = Math.floor(Math.random() * 4);
    let x, y;
    const padding = 50;
    if (side === 0) { x = -padding; y = Math.random() * MAP_H; }
    else if (side === 1) { x = MAP_W + padding; y = Math.random() * MAP_H; }
    else if (side === 2) { x = Math.random() * MAP_W; y = -padding; }
    else { x = Math.random() * MAP_W; y = MAP_H + padding; }
    
    let radius, speed, hp, color, points;
    switch(type) {
        case 'runner': radius = 8; speed = 2.4; hp = 1; color = '#ffaa44'; points = 8; break;
        case 'tanker': radius = 16; speed = 0.65; hp = 4; color = '#aa66ff'; points = 15; break;
        case 'shooter': radius = 11; speed = 0.95; hp = 2; color = '#ff44aa'; points = 8; break;
        default: radius = 9 + Math.random() * 5; speed = 1.1; hp = 2; color = `hsl(${Math.random() * 360}, 85%, 58%)`; points = 5;
    }
    speed = Math.min(speed, 2.8);
    if (type === 'runner') speed = Math.min(speed, 2.6);
    
    let dx = player.x - x, dy = player.y - y;
    let length = Math.hypot(dx, dy);
    if (length < 0.001) length = 1;
    const vx = (dx / length) * speed;
    const vy = (dy / length) * speed;
    
    let enemy = {
        id: nextEnemyId++,
        x: x, y: y, vx: vx, vy: vy, r: radius,
        type: type, hp: hp, maxHp: hp, color: color, points: points,
        shootCooldown: 0,
        isSquadMember: false
    };
    
    if (type === 'shooter') {
        enemy.coverObstacle = null;
    }
    
    enemies.push(enemy);
}

function spawnShooterPair() {
    if (enemies.length >= MAX_ENEMIES - 1) return;
    
    let side = Math.floor(Math.random() * 4);
    let baseX, baseY;
    const padding = 80;
    
    if (side === 0) { baseX = -padding; baseY = Math.random() * MAP_H; }
    else if (side === 1) { baseX = MAP_W + padding; baseY = Math.random() * MAP_H; }
    else if (side === 2) { baseX = Math.random() * MAP_W; baseY = -padding; }
    else { baseX = Math.random() * MAP_W; baseY = MAP_H + padding; }
    
    const offsets = [[-30, -20], [30, 20]];
    
    for (let i = 0; i < 2; i++) {
        if (enemies.length >= MAX_ENEMIES) break;
        let x = baseX + offsets[i][0];
        let y = baseY + offsets[i][1];
        x = Math.min(Math.max(x, 20), MAP_W - 20);
        y = Math.min(Math.max(y, 20), MAP_H - 20);
        
        let dx = player.x - x;
        let dy = player.y - y;
        let length = Math.hypot(dx, dy);
        if (length < 0.001) length = 1;
        const speed = 0.9 + Math.floor(score / 500) * 0.12;
        const vx = (dx / length) * Math.min(speed, 2.2);
        const vy = (dy / length) * Math.min(speed, 2.2);
        
        enemies.push({
            id: nextEnemyId++,
            x: x, y: y, vx: vx, vy: vy, r: 11,
            type: 'shooter', hp: 2, maxHp: 2, color: '#ff44aa', points: 8,
            shootCooldown: Math.floor(20 + Math.random() * 30),
            isSquadMember: true
        });
    }
    
    explosions.push({ x: baseX, y: baseY, timer: 15, isWarning: true });
}

function shouldSpawnSquad() {
    if (score < 700) return false;
    let milestone = Math.floor(score / 100) * 100;
    if (milestone < 700) return false;
    if (!window.spawnedMilestones) window.spawnedMilestones = {};
    if (window.spawnedMilestones[milestone]) return false;
    
    if (Math.random() < 0.2) {
        window.spawnedMilestones[milestone] = true;
        return true;
    }
    return false;
}

function spawnEnemy() {
    if (!gameActive) return;
    if (enemies.length >= MAX_ENEMIES) return;
    
    if (shouldSpawnSquad()) {
        spawnShooterPair();
        return;
    }
    
    let type = 'normal';
    const rand = Math.random();
    
    if (score > 100) {
        if (rand < 0.05) type = 'runner';
        else if (rand < 0.15) type = 'tanker';
        else if (rand < 0.25) type = 'shooter';
        else type = 'normal';
    } else if (score > 50) {
        if (rand < 0.04) type = 'runner';
        else if (rand < 0.12) type = 'tanker';
        else if (rand < 0.20) type = 'shooter';
        else type = 'normal';
    } else {
        if (rand < 0.03) type = 'runner';
        else if (rand < 0.10) type = 'tanker';
        else type = 'normal';
    }
    
    spawnSingleEnemy(type);
}

function updateSpawning() {
    if (!gameActive) return;
    if (enemySpawnCooldown <= 0 && enemies.length < RESPAWN_THRESHOLD) {
        spawnEnemy();
        if (score > 200 && Math.random() < 0.25 && enemies.length < MAX_ENEMIES) spawnEnemy();
        if (score > 450 && Math.random() < 0.15 && enemies.length < MAX_ENEMIES) spawnEnemy();
        let delay = Math.max(28, BASE_SPAWN_DELAY - Math.floor(score / 300));
        enemySpawnCooldown = Math.min(delay, 45);
    } else {
        enemySpawnCooldown--;
    }
}

function removeBulletsFromShooter(shooterId, enemyBullets) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i].shooterId === shooterId) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updateEnemiesAndDamage(bullets, botBullets, enemyBullets, supportBot, updateUI) {
    if (!gameActive) return;
    
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        
        // SHOOTER: Tìm vật cản để núp
        if (e.type === 'shooter') {
            if (!e.coverObstacle || Math.hypot(e.x - (e.coverObstacle.x + e.coverObstacle.w/2), e.y - (e.coverObstacle.y + e.coverObstacle.h/2)) > 150) {
                e.coverObstacle = findCoverObstacle(e.x, e.y);
            }
            
            if (e.coverObstacle) {
                let coverX = e.coverObstacle.x + e.coverObstacle.w/2;
                let coverY = e.coverObstacle.y + e.coverObstacle.h/2;
                let angleToPlayer = Math.atan2(player.y - coverY, player.x - coverX);
                let targetX = coverX + Math.cos(angleToPlayer) * (e.coverObstacle.w/2 + e.r + 5);
                let targetY = coverY + Math.sin(angleToPlayer) * (e.coverObstacle.h/2 + e.r + 5);
                
                let dx = targetX - e.x;
                let dy = targetY - e.y;
                let len = Math.hypot(dx, dy);
                if (len > 0) {
                    e.x += (dx / len) * 0.8;
                    e.y += (dy / len) * 0.8;
                }
            } else {
                let newX = e.x + e.vx, newY = e.y + e.vy;
                e.x = newX; e.y = newY;
            }
        } else {
            let newX = e.x + e.vx, newY = e.y + e.vy;
            e.x = newX; e.y = newY;
        }
        
        checkCollisionWithObstaclesForEnemy(e, e.r);
        checkCollisionWithFortsForEnemy(e, e.r, forts);
        
        // SHOOTER bắn
        if (e.type === 'shooter') {
            if (e.shootCooldown <= 0) {
                if (window.enemyShoot) window.enemyShoot(e, enemyBullets);
                e.shootCooldown = 75;
            } else {
                e.shootCooldown--;
            }
        }
        
        // Va chạm với player
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.r) {
            if (e.type === 'runner') {
                health -= 2;
                updateUI();
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                player.x += Math.cos(angle) * 20;
                player.y += Math.sin(angle) * 20;
                player.x = Math.min(Math.max(player.x, 20), MAP_W - 20);
                player.y = Math.min(Math.max(player.y, 20), MAP_H - 20);
                checkCollisionWithObstaclesForPlayer(player, player.radius);
                removeBulletsFromShooter(e.id, enemyBullets);
                enemies.splice(i, 1);
                i--;
                if (health <= 0) gameActive = false;
                continue;
            } else {
                health--;
                updateUI();
                removeBulletsFromShooter(e.id, enemyBullets);
                enemies.splice(i, 1);
                i--;
                if (health <= 0) gameActive = false;
                continue;
            }
        }
        
        // Tấn công fort
        let attackedFort = false;
        for (let f of forts) {
            if (!f.active) continue;
            if (Math.abs(e.x - (f.x + f.w/2)) < e.r + f.w/2 && Math.abs(e.y - (f.y + f.h/2)) < e.r + f.h/2) {
                f.hp--;
                if (f.hp <= 0) f.active = false;
                attackedFort = true;
                break;
            }
        }
        if (attackedFort) {
            removeBulletsFromShooter(e.id, enemyBullets);
            enemies.splice(i, 1);
            i--;
            continue;
        }
        
        // Tấn công bot
        if (supportBot.active && Math.hypot(supportBot.x - e.x, supportBot.y - e.y) < supportBot.radius + e.r) {
            supportBot.hp--;
            const angle = Math.atan2(e.y - supportBot.y, e.x - supportBot.x);
            supportBot.x -= Math.cos(angle) * 14;
            supportBot.y -= Math.sin(angle) * 14;
            if (supportBot.hp <= 0) {
                supportBot.active = false;
                if (window.botRespawnTimer) window.botRespawnTimer = 30 * 60;
                updateUI();
            }
            removeBulletsFromShooter(e.id, enemyBullets);
            enemies.splice(i, 1);
            i--;
            continue;
        }
        
        // Xóa enemy ra khỏi map
        if (e.x < -200 || e.x > MAP_W + 200 || e.y < -200 || e.y > MAP_H + 200) {
            removeBulletsFromShooter(e.id, enemyBullets);
            enemies.splice(i, 1);
            i--;
        }
    }
}
