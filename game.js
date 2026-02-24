// ===== キャンバス設定 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== UI取得 =====
const messageBox = document.getElementById("messageBox");
const dialogueUI = document.getElementById("dialogueUI");
const characterSprite = document.getElementById("characterSprite");
const nameBox = document.getElementById("nameBox");
const textBox = document.getElementById("textBox");

// ===== プレイヤー =====
const player = {
  x: 200,
  y: 200,
  size: 32,
  speed: 3,
  color: "blue"
};

// ===== マップ設定 =====
const tileSize = 64;
const mapCols = 20;
const mapRows = 15;
const mapWidth = mapCols * tileSize;
const mapHeight = mapRows * tileSize;

// ===== キー入力 =====
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ===== カメラ =====
let cameraX = 0;
let cameraY = 0;

// ===== 窓イベント用 =====
let windowTouchCount = 0;
let specialEvent = false;

// 窓の位置（好きに変えられる）
const windowObject = {
  x: 500,
  y: 300,
  width: 64,
  height: 64
};

// ===== 当たり判定 =====
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.size > b.x &&
    a.y < b.y + b.height &&
    a.y + a.size > b.y
  );
}

// ===== メッセージ表示 =====
function showMessage(text) {
  messageBox.style.display = "flex";
  messageBox.textContent = text;

  setTimeout(() => {
    if (!specialEvent) {
      messageBox.style.display = "none";
    }
  }, 2000);
}

// ===== 特殊会話開始 =====
function startSpecialDialogue() {
  specialEvent = true;

  // 画面最上位レイヤー表示
  dialogueUI.style.display = "flex";

  // 背景（黒＋画面いっぱい）
  dialogueUI.style.background = "black";

  // キャラ画像（好きな画像に変更OK）
  characterSprite.src = "character.png"; // ←画像ファイル名

  // 名前
  nameBox.textContent = "？？？";

  // 会話テキスト
  textBox.textContent = "……やっと三回、触ったね。";
}

// ===== 会話送り（スペース） =====
document.addEventListener("keydown", (e) => {
  if (!specialEvent) return;

  if (e.code === "Space") {
    textBox.textContent = "窓の向こう側を、見てしまったんだね…。";
  }
});

// ===== 更新処理 =====
function update() {
  // 移動
  if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;

  // マップ外に出ない制御
  player.x = Math.max(0, Math.min(player.x, mapWidth - player.size));
  player.y = Math.max(0, Math.min(player.y, mapHeight - player.size));

  // カメラ（最重要修正：余白バグ完全防止）
  cameraX = player.x - canvas.width / 2 + player.size / 2;
  cameraY = player.y - canvas.height / 2 + player.size / 2;

  // 左上制限
  cameraX = Math.max(0, cameraX);
  cameraY = Math.max(0, cameraY);

  // 右下制限（これでベージュ余白が消える）
  cameraX = Math.min(cameraX, mapWidth - canvas.width);
  cameraY = Math.min(cameraY, mapHeight - canvas.height);

  // ===== 窓接触判定 =====
  if (!specialEvent && isColliding(player, windowObject)) {
    if (!windowObject.touched) {
      windowObject.touched = true;
      windowTouchCount++;

      if (windowTouchCount === 1) {
        showMessage("窓だ…");
      } else if (windowTouchCount === 2) {
        showMessage("なんだか、嫌な感じがする…");
      } else if (windowTouchCount >= 3) {
        startSpecialDialogue();
      }
    }
  } else {
    windowObject.touched = false;
  }
}

// ===== 描画 =====
function draw() {
  // 背景
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // 床（マップ）
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // 窓オブジェクト
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(
    windowObject.x,
    windowObject.y,
    windowObject.width,
    windowObject.height
  );

  // プレイヤー
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.restore();
}

// ===== ゲームループ =====
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// ===== 画面リサイズ対応 =====
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
