// ĐẠN
let bullets = [], botBullets = [], enemyBullets = [];
const BULLET_RADIUS = 5, BULLET_SPEED = 7.2;
let shootTimer = 0;
const SHOOT_DELAY_FRAMES = 4;

function shootTowardsMouse() {
    if (!gameActive) return;
    let dx = mouseWorld.x - player.x, dy = mouseWorld.y - player.y;
    let len = Math.hypot(dx, dy);
    if (len < 0.001) { dx = 1; dy = 0; len = 1; }
    const normX = dx / len, normY = dy / len;
    bullets.push({ x: player.x, y: player.y, vx: normX * BULLET_SPEED, vy: normY * BULLET_SPEED, radius: BULLET_RADIUS, damage: 1 });
}

function enemyShoot(shooter, enemyBullets) {
    let dx = player.x - shooter.x, dy = player.y - shooter.y;
    let len = Math.hypot(dx, dy);
    if (len < 0.001) len = 1;
    const normX = dx / len, normY = dy / len;
    enemyBullets.push({ 
        x: shooter.x, y: shooter.y, 
        vx: normX * 3.3, vy: normY * 3.3, 
        radius: 4, damage: 1, 
        shooterId: shooter.id 
    });
}

window.enemyShoot = enemyShoot;

function updateBullets() {
    for (let i = bullets.length-1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        if (bullets[i].x < -100 || bullets[i].x > MAP_W + 100 || bullets[i].y < -100 || bullets[i].y > MAP_H + 100 ||
            bulletCollidesWithObstacles(bullets[i], true, forts)) {
            bullets.splice(i, 1);
        }
    }
    for (let i = botBullets.length-1; i >= 0; i--) {
        botBullets[i].x += botBullets[i].vx;
        botBullets[i].y += botBullets[i].vy;
        if (botBullets[i].x < -100 || botBullets[i].x > MAP_W + 100 || botBullets[i].y < -100 || botBullets[i].y > MAP_H + 100 ||
            bulletCollidesWithObstacles(botBullets[i], false, forts)) {
            botBullets.splice(i, 1);
        }
    }
    for (let i = enemyBullets.length-1; i >= 0; i--) {
        enemyBullets[i].x += enemyBullets[i].vx;
        enemyBullets[i].y += enemyBullets[i].vy;
        if (enemyBullets[i].x < -100 || enemyBullets[i].x > MAP_W + 100 || enemyBullets[i].y < -100 || enemyBullets[i].y > MAP_H + 100 ||
            bulletCollidesWithObstacles(enemyBullets[i], false, forts)) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updateAutoShoot() {
    if (!gameActive) return;
    if (shootTimer <= 0) {
        shootTowardsMouse();
        shootTimer = SHOOT_DELAY_FRAMES;
    } else {
        shootTimer--;
    }
}

function handleCollisionsBulletEnemy(updateUI) {
    for (let i = bullets.length-1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (Math.hypot(bullet.x - e.x, bullet.y - e.y) < bullet.radius + e.r) {
                e.hp -= bullet.damage;
                bullets.splice(i, 1);
                if (e.hp <= 0) {
                    score += e.points;
                    removeBulletsFromShooter(e.id, enemyBullets);
                    enemies.splice(j, 1);
                    updateUI();
                }
                break;
            }
        }
    }
    
    for (let i = botBullets.length-1; i >= 0; i--) {
        const bullet = botBullets[i];
        for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (Math.hypot(bullet.x - e.x, bullet.y - e.y) < bullet.radius + e.r) {
                e.hp -= bullet.damage;
                botBullets.splice(i, 1);
                if (e.hp <= 0) {
                    score += e.points;
                    removeBulletsFromShooter(e.id, enemyBullets);
                    enemies.splice(j, 1);
                    updateUI();
                }
                break;
            }
        }
    }
}

function handleEnemyBulletCollisions(supportBot, updateUI) {
    for (let i = enemyBullets.length-1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (Math.hypot(bullet.x - player.x, bullet.y - player.y) < bullet.radius + player.radius) {
            health--;
            updateUI();
            enemyBullets.splice(i, 1);
            if (health <= 0) gameActive = false;
            continue;
        }
        if (supportBot.active && Math.hypot(bullet.x - supportBot.x, bullet.y - supportBot.y) < bullet.radius + supportBot.radius) {
            supportBot.hp--;
            enemyBullets.splice(i, 1);
            if (supportBot.hp <= 0) {
                supportBot.active = false;
                if (window.botRespawnTimer) window.botRespawnTimer = 30 * 60;
                updateUI();
            }
            continue;
        }
        for (let f of forts) {
            if (!f.active) continue;
            if (bullet.x > f.x && bullet.x < f.x + f.w && bullet.y > f.y && bullet.y < f.y + f.h) {
                f.hp--;
                enemyBullets.splice(i, 1);
                if (f.hp <= 0) f.active = false;
                break;
            }
        }
    }
}
