// ===== キャンバス =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== UI =====
const messageBox = document.getElementById("messageBox");

// ===== プレイヤー =====
const player = {
  x: 0,
  y: 0,
  size: 32,
  speed: 3,
  color: "blue"
};

// ===== 入力 =====
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ===== マップ関連（超重要修正）=====
let mapData;
let mapCols = 0;
let mapRows = 0;
let mapWidth = 0;
let mapHeight = 0;
const tileSize = 32;

// カメラ
let cameraX = 0;
let cameraY = 0;

// ===== マップ読み込み =====
async function loadMap() {
  const res = await fetch("map.json");
  mapData = await res.json();

  // ★ここが神修正（横長対応）
  mapRows = mapData.tiles.length;
  mapCols = mapData.tiles[0].length;

  mapWidth = mapCols * tileSize;
  mapHeight = mapRows * tileSize;

  // スポーン位置
  player.x = mapData.spawn.x;
  player.y = mapData.spawn.y;
}

// ===== 当たり判定（タイル）=====
function isSolidTile(tile) {
  if (!mapData.tileTypes[tile]) return false;
  return mapData.tileTypes[tile].solid;
}

function getTileAt(x, y) {
  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);

  if (row < 0 || col < 0 || row >= mapRows || col >= mapCols) {
    return "壁";
  }
  return mapData.tiles[row][col];
}

// ===== イベント表示 =====
function showEvent(tile) {
  if (!mapData.events || !mapData.events[tile]) return;

  const texts = mapData.events[tile];
  messageBox.style.display = "flex";
  messageBox.textContent = texts[0];

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 2000);
}

// ===== 更新 =====
function update() {
  let newX = player.x;
  let newY = player.y;

  if (keys["ArrowUp"] || keys["w"]) newY -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) newY += player.speed;
  if (keys["ArrowLeft"] || keys["a"]) newX -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) newX += player.speed;

  const tile = getTileAt(newX, newY);

  if (!isSolidTile(tile)) {
    player.x = newX;
    player.y = newY;
  } else {
    showEvent(tile);
  }

  // ===== カメラ（横長マップ完全対応）=====
  cameraX = player.x - canvas.width / 2 + player.size / 2;
  cameraY = player.y - canvas.height / 2 + player.size / 2;

  // 左上制限
  cameraX = Math.max(0, cameraX);
  cameraY = Math.max(0, cameraY);

  // 右下制限（横長でも追従する）
  cameraX = Math.min(cameraX, Math.max(0, mapWidth - canvas.width));
  cameraY = Math.min(cameraY, Math.max(0, mapHeight - canvas.height));
}

// ===== 描画 =====
function drawMap() {
  for (let row = 0; row < mapRows; row++) {
    for (let col = 0; col < mapCols; col++) {
      const tile = mapData.tiles[row][col];
      const type = mapData.tileTypes[tile];

      if (!type) continue;

      if (type.drawType === "floor") {
        ctx.fillStyle = "#dddddd";
      } else {
        ctx.fillStyle = type.color || "black";
      }

      ctx.fillRect(
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize
      );
    }
  }
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  drawMap();

  // プレイヤー
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.restore();
}

// ===== ループ =====
function loop() {
  if (mapData) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

// ===== リサイズ =====
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// 起動
loadMap();
loop();
