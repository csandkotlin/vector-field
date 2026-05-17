function drawMap() {
    ctx.fillStyle = "#030e03";
    ctx.fillRect(0, 0, CAM_W, CAM_H);
    ctx.strokeStyle = "#0f3f1a";
    ctx.lineWidth = 1;
    for (let x = Math.floor(cameraX/50)*50; x < cameraX + CAM_W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(toScreenX(x), 0);
        ctx.lineTo(toScreenX(x), CAM_H);
        ctx.stroke();
    }
    for (let y = Math.floor(cameraY/50)*50; y < cameraY + CAM_H; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, toScreenY(y));
        ctx.lineTo(CAM_W, toScreenY(y));
        ctx.stroke();
    }
}

function drawObstacles() {
    for (let obs of obstacles) {
        let screenX = toScreenX(obs.x), screenY = toScreenY(obs.y);
        if (screenX + obs.w < 0 || screenX > CAM_W || screenY + obs.h < 0 || screenY > CAM_H) continue;
        ctx.fillStyle = obs.type === 'building' ? '#4a6a3a' : '#5a5a4a';
        ctx.fillRect(screenX, screenY, obs.w, obs.h);
        ctx.strokeStyle = "#8aba6a";
        ctx.strokeRect(screenX, screenY, obs.w, obs.h);
    }
}

function drawForts() {
    for (let fort of forts) {
        if (!fort.active) continue;
        let screenX = toScreenX(fort.x), screenY = toScreenY(fort.y);
        if (screenX + fort.w < 0 || screenX > CAM_W || screenY + fort.h < 0 || screenY > CAM_H) continue;
        ctx.fillStyle = "#8B6914";
        ctx.fillRect(screenX, screenY, fort.w, fort.h);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, fort.w, fort.h);
        const hpPercent = fort.hp / fort.maxHp;
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(screenX, screenY - 8, fort.w * hpPercent, 4);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(screenX + 10, screenY + 15, 15, 15);
        ctx.fillRect(screenX + fort.w - 25, screenY + 15, 15, 15);
    }
}

function drawPlayer() {
    const angle = Math.atan2(mouseWorld.y - player.y, mouseWorld.x - player.x);
    ctx.save();
    ctx.translate(toScreenX(player.x), toScreenY(player.y));
    ctx.rotate(angle);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#73ff73";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = "#b3ffb3";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -11);
    ctx.lineTo(-10, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f9f9a3";
    ctx.beginPath();
    ctx.arc(4, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSupportBot() {
    if (!supportBot.active) {
        ctx.save();
        ctx.translate(toScreenX(supportBot.x), toScreenY(supportBot.y));
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, supportBot.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#666666";
        ctx.fill();
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 16px monospace";
        ctx.fillText("💀", -8, -8);
        if (botRespawnTimer > 0) {
            let seconds = Math.ceil(botRespawnTimer / 60);
            ctx.font = "bold 10px monospace";
            ctx.fillStyle = "#ffaa66";
            ctx.fillText(`${seconds}s`, -12, 18);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        return;
    }
    ctx.save();
    ctx.translate(toScreenX(supportBot.x), toScreenY(supportBot.y));
    const hpPercent = supportBot.hp / supportBot.maxHp;
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(-supportBot.radius - 2, -supportBot.radius - 8, (supportBot.radius * 2 + 4) * hpPercent, 4);
    ctx.beginPath();
    ctx.arc(0, 0, supportBot.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#3399ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, supportBot.radius - 3, 0, Math.PI * 2);
    ctx.fillStyle = "#55ccff";
    ctx.fill();
    const angleToPlayer = Math.atan2(player.y - supportBot.y, player.x - supportBot.x);
    const eyeX = Math.cos(angleToPlayer) * (supportBot.radius * 0.5);
    const eyeY = Math.sin(angleToPlayer) * (supportBot.radius * 0.5);
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
}

function drawBullets() {
    for (let b of bullets) { ctx.beginPath(); ctx.arc(toScreenX(b.x), toScreenY(b.y), b.radius - 1, 0, Math.PI*2); ctx.fillStyle = "#ffec80"; ctx.fill(); }
    for (let b of botBullets) { ctx.beginPath(); ctx.arc(toScreenX(b.x), toScreenY(b.y), b.radius - 1, 0, Math.PI*2); ctx.fillStyle = "#88ccff"; ctx.fill(); }
    for (let b of enemyBullets) { ctx.beginPath(); ctx.arc(toScreenX(b.x), toScreenY(b.y), b.radius - 1, 0, Math.PI*2); ctx.fillStyle = "#ff6688"; ctx.fill(); }
}

function drawEnemies() {
    for (let e of enemies) {
        let screenX = toScreenX(e.x), screenY = toScreenY(e.y);
        if (screenX + e.r < 0 || screenX - e.r > CAM_W || screenY + e.r < 0 || screenY - e.r > CAM_H) continue;
        if ((e.type === 'tanker') && e.maxHp > 1) {
            const hpPercent = e.hp / e.maxHp;
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(screenX - e.r - 2, screenY - e.r - 6, (e.r * 2 + 4) * hpPercent, 4);
        }
        ctx.beginPath();
        ctx.arc(screenX, screenY, e.r, 0, Math.PI*2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.font = `${e.r - 4}px monospace`;
        ctx.fillStyle = "white";
        if (e.type === 'runner') ctx.fillText("⚡", screenX - 5, screenY + 5);
        else if (e.type === 'tanker') ctx.fillText("🛡️", screenX - 6, screenY + 5);
        else if (e.type === 'shooter') ctx.fillText("🔫", screenX - 5, screenY + 5);
    }
}

function drawTeleporters() {
    for (let tp of teleporters) {
        let screenX = toScreenX(tp.x), screenY = toScreenY(tp.y);
        if (screenX + tp.radius < 0 || screenX - tp.radius > CAM_W || screenY + tp.radius < 0 || screenY - tp.radius > CAM_H) continue;
        ctx.beginPath();
        ctx.arc(screenX, screenY, tp.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170, 68, 255, 0.5)`;
        ctx.fill();
        ctx.font = "20px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("🌀", screenX - 10, screenY + 7);
    }
}

function drawExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        const exp = explosions[i];
        const alpha = exp.timer / 20;
        const radius = exp.isBig ? 160 : (exp.isWarning ? 65 : 75);
        ctx.beginPath();
        ctx.arc(toScreenX(exp.x), toScreenY(exp.y), radius * (1 - alpha), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 50, 0, ${0.6 * alpha})`;
        ctx.fill();
        ctx.font = `${22}px monospace`;
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        if (exp.isWarning) ctx.fillText("⚠️", toScreenX(exp.x) - 12, toScreenY(exp.y) - 20);
        else if (exp.isTeleportSpawn) ctx.fillText("👾", toScreenX(exp.x) - 12, toScreenY(exp.y) - 18);
        else ctx.fillText("💥", toScreenX(exp.x) - 15, toScreenY(exp.y) - 15);
        exp.timer--;
        if (exp.timer <= 0) explosions.splice(i, 1);
    }
}

function drawHealEffects() {
    for (let i = 0; i < healEffects.length; i++) {
        const heal = healEffects[i];
        const alpha = heal.timer / 20;
        ctx.font = `${16}px monospace`;
        ctx.fillStyle = `rgba(100, 255, 100, ${alpha})`;
        ctx.fillText("+1 HP", toScreenX(heal.x) - 15, toScreenY(heal.y) - 20);
        heal.timer--;
        if (heal.timer <= 0) healEffects.splice(i, 1);
    }
}

function drawMouseTarget() {
    if (!mouseInside) return;
    let screenX = toScreenX(mouseWorld.x), screenY = toScreenY(mouseWorld.y);
    if (screenX < 0 || screenX > CAM_W || screenY < 0 || screenY > CAM_H) return;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#88ff88";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    if (gameActive && score >= FORT_COST && forts.filter(f=>f.active).length < MAX_FORTS) {
        ctx.beginPath();
        ctx.rect(screenX - 30, screenY - 30, 60, 60);
        ctx.strokeStyle = "rgba(255,200,0,0.5)";
        ctx.stroke();
    }
}

function drawUItext() {
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#aaffaa88";
    ctx.fillText(`🏃 RUNNER | 🛡️ TANKER | 🔫 SHOOTER | 🧱 FORT (MAX 10) | ENEMY: ${enemies.length}/${MAX_ENEMIES}`, 15, 30);
    ctx.fillStyle = "#88dd88";
    ctx.fillText(`⚡ R: RESPAWN BOT (50) | DOUBLE CLICK: LOCK | HOLD 5s: BUILD (55)`, 15, 55);
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "#80ffaa";
    ctx.fillText(`SCORE: ${score}`, CAM_W-120, 30);
}

function drawBuildProgress() {
    if (isHolding && buildRequested && !movementLocked) {
        let elapsed = Date.now() - mouseHoldStart;
        let percent = Math.min(100, Math.floor((elapsed / BUILD_HOLD_TIME) * 100));
        buildProgressDiv.style.display = "block";
        buildProgressDiv.innerText = `🏗️ ĐANG XÂY... ${percent}%`;
        if (elapsed >= BUILD_HOLD_TIME) {
            buildProgressDiv.style.display = "none";
            console.log("Build time completed, attempting to place fort...");
            if (tryPlaceFort()) {
                console.log("Fort placed successfully!");
            } else {
                console.log("Failed to place fort!");
            }
            isHolding = false;
            buildRequested = false;
        }
    } else if (!isHolding) {
        buildProgressDiv.style.display = "none";
    }
}

function drawGameOverlay(initGame) {
    if (!gameActive && health <= 0) {
        ctx.font = "bold 34px 'Courier New', monospace";
        ctx.fillStyle = "#ff3366";
        ctx.fillText("GAME OVER", CAM_W/2-120, CAM_H/2-45);
        ctx.font = "18px monospace";
        ctx.fillStyle = "#88dd88";
        ctx.fillText(`FINAL SCORE: ${score}`, CAM_W/2-85, CAM_H/2+15);
        showPlayAgainButton(initGame);
        return true;
    }
    return false;
}
