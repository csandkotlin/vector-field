// CÔNG SỰ
let forts = [];
const MAX_FORTS = 10;
const FORT_COST = 55;

// Hàm cập nhật UI (định nghĩa sau)
let updateUIFunc = null;

function setUpdateUI(func) {
    updateUIFunc = func;
}

function updateUI() {
    if (updateUIFunc) updateUIFunc();
}

// ĐẶT CÔNG SỰ (GIỮ CHUỘT)
function tryPlaceFort() {
    console.log("tryPlaceFort called - gameActive:", gameActive, "score:", score, "forts.length:", forts.length);
    
    if (!gameActive) {
        console.log("Game not active");
        return false;
    }
    if (score < FORT_COST) {
        console.log("Not enough score. Need:", FORT_COST, "Have:", score);
        return false;
    }
    
    let activeForts = forts.filter(f => f.active).length;
    if (activeForts >= MAX_FORTS) {
        console.log("Max forts reached:", MAX_FORTS);
        return false;
    }
    
    let fortX = mouseWorld.x - 30;
    let fortY = mouseWorld.y - 30;
    let fortW = 60;
    let fortH = 60;
    
    // Kiểm tra không đè lên player
    if (Math.abs(player.x - (fortX + fortW/2)) < player.radius + fortW/2 &&
        Math.abs(player.y - (fortY + fortH/2)) < player.radius + fortH/2) {
        console.log("Cannot build on player");
        return false;
    }
    
    // Kiểm tra không đè lên fort khác
    for (let f of forts) {
        if (Math.abs(f.x - fortX) < f.w && Math.abs(f.y - fortY) < f.h) {
            console.log("Overlapping with another fort");
            return false;
        }
    }
    
    // Kiểm tra không đè lên vật cản
    for (let obs of obstacles) {
        if (fortX < obs.x + obs.w && fortX + fortW > obs.x && fortY < obs.y + obs.h && fortY + fortH > obs.y) {
            console.log("Overlapping with obstacle");
            return false;
        }
    }
    
    // Xây thành công
    score -= FORT_COST;
    forts.push({
        x: fortX, y: fortY, w: fortW, h: fortH,
        hp: 15, maxHp: 15, active: true
    });
    console.log("Fort built successfully! New fort count:", forts.length);
    updateUI();
    return true;
}
