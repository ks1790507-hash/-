// =====================
// canvas取得
// =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// =====================
// 画面リサイズ
// =====================
function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =====================
// 基本設定
// =====================
const TILE = 32;

let mapData = [];
let blocks = [];
let currentMap = "";
let currentEvents = {};
let currentTileTypes = {};

let mapWidth = 0;
let mapHeight = 0;

let cameraX = 0;
let cameraY = 0;

// =====================
// 画像読み込み
// =====================
const images = {};

function loadImage(name, src){
  const img = new Image();
  img.src = src;
  images[name] = img;
}

// 机画像
loadImage("desk", "desk.png");

// =====================
// プレイヤー
// =====================
const player = {
  x: 0,
  y: 0,
  size: TILE,
  color: "blue"
};

let targetX = 0;
let targetY = 0;
let isMoving = false;
const moveSpeed = 8;

// =====================
// 会話
// =====================
let isTalking = false;
let talkLines = [];
let talkIndex = 0;
const messageBox = document.getElementById("messageBox");

// =====================
// マップ読み込み
// =====================
function loadMap(name){
  fetch("./" + name + ".json")
    .then(res => res.json())
    .then(data => {

      currentMap = name;

      mapData = data.tiles;
      currentEvents = data.events || {};
      currentTileTypes = data.tileTypes || {};

      mapWidth = mapData[0].length * TILE;
      mapHeight = mapData.length * TILE;

      if(data.spawn){
        player.x = data.spawn.x;
        player.y = data.spawn.y;
        targetX = player.x;
        targetY = player.y;
      }

      createMap();
    });
}

loadMap("map");

// =====================
// マップ生成
// =====================
function createMap(){
  blocks = [];

  for(let row=0; row<mapData.length; row++){
    for(let col=0; col<mapData[row].length; col++){

      const tile = mapData[row][col];
      const x = col * TILE;
      const y = row * TILE;

      const type = currentTileTypes[tile];

      if(type){
        blocks.push({
          x: x,
          y: y,
          size: TILE,
          color: type.color,
          solid: type.solid,
          image: type.image || null
        });
      }
    }
  }
}

// =====================
// 描画
// =====================
function draw(){

  // スムーズ移動
  if(isMoving){
    if(player.x < targetX) player.x += moveSpeed;
    if(player.x > targetX) player.x -= moveSpeed;
    if(player.y < targetY) player.y += moveSpeed;
    if(player.y > targetY) player.y -= moveSpeed;

    if(
      Math.abs(player.x - targetX) <= moveSpeed &&
      Math.abs(player.y - targetY) <= moveSpeed
    ){
      player.x = targetX;
      player.y = targetY;
      isMoving = false;
    }
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // カメラ
  if(currentMap === "map"){
    cameraX = 0;
    cameraY = 0;
  }else{
    cameraX = player.x - canvas.width/2 + player.size/2;
    cameraY = player.y - canvas.height/2 + player.size/2;

    cameraX = Math.max(0, Math.min(cameraX, mapWidth - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, mapHeight - canvas.height));
  }

  // タイル描画
  blocks.forEach(b => {

    if(b.image && images[b.image]){
      ctx.drawImage(
        images[b.image],
        b.x - cameraX,
        b.y - cameraY,
        b.size,
        b.size
      );
    } else {
      ctx.fillStyle = b.color;
      ctx.fillRect(
        b.x - cameraX,
        b.y - cameraY,
        b.size,
        b.size
      );
    }

  });

  // プレイヤー描画
  ctx.fillStyle = player.color;
  ctx.fillRect(
    player.x - cameraX,
    player.y - cameraY,
    player.size,
    player.size
  );

  requestAnimationFrame(draw);
}
draw();

// =====================
// 判定
// =====================
function canMove(newX,newY){
  for(let b of blocks){
    if(b.solid){
      if(
        newX < b.x + b.size &&
        newX + player.size > b.x &&
        newY < b.y + b.size &&
        newY + player.size > b.y
      ){
        return false;
      }
    }
  }
  return true;
}

function getTileAt(x,y){
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return mapData[row]?.[col];
}

// =====================
// 会話
// =====================
function startTalk(lines){
  isTalking = true;
  talkLines = lines;
  talkIndex = 0;
  showMessage(talkLines[0]);
}

function showMessage(text){
  messageBox.style.display = "flex";
  messageBox.innerText = text;
}

function endTalk(){
  isTalking = false;
  messageBox.style.display = "none";
}

// =====================
// キー操作
// =====================
document.addEventListener("keydown", e=>{

  if(isTalking){
    if(e.code === "Space"){
      talkIndex++;
      if(talkIndex < talkLines.length){
        showMessage(talkLines[talkIndex]);
      }else{
        endTalk();
      }
    }
    return;
  }

  if(isMoving) return;

  let newX = player.x;
  let newY = player.y;

  if(e.key === "ArrowUp") newY -= TILE;
  if(e.key === "ArrowDown") newY += TILE;
  if(e.key === "ArrowLeft") newX -= TILE;
  if(e.key === "ArrowRight") newX += TILE;

  if(canMove(newX,newY)){
    targetX = newX;
    targetY = newY;
    isMoving = true;
  }else{

    const tile = getTileAt(newX,newY);

    if(tile === "扉"){
      if(currentMap === "map"){
        loadMap("hallway");
      }else{
        loadMap("map");
      }
      return;
    }

    if(currentEvents[tile]){
      startTalk(currentEvents[tile]);
    }
  }
});
