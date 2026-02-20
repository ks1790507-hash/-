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
// 画像読み込み（PNG対応）
// =====================
const images = {};

function loadImage(name, src){
  const img = new Image();
  img.src = src;
  images[name] = img;
}

// 必要な画像をここで読み込む
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
          solid: type.solid || false,
          image: type.image || null,
          color: type.color || null,
          drawType: type.drawType || null
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

  // カメラ
  cameraX = player.x - canvas.width/2 + player.size/2;
  cameraY = player.y - canvas.height/2 + player.size/2;

  cameraX = Math.max(0, Math.min(cameraX, mapWidth - canvas.width));
  cameraY = Math.max(0, Math.min(cameraY, mapHeight - canvas.height));

  // タイル描画
  blocks.forEach(b => {

    const x = b.x - cameraX;
    const y = b.y - cameraY;

    // ① PNGタイル
    if(b.image && images[b.image]){
      ctx.drawImage(images[b.image], x, y, b.size, b.size);
    }

    // ② 床デザイン描画
    else if(b.drawType === "floor"){
      ctx.fillStyle = "#7b3f61";
      ctx.fillRect(x, y, b.size, b.size);

      ctx.fillStyle = "#a85c7d";
      ctx.fillRect(x, y, b.size, 4);

      ctx.strokeStyle = "#5e2e47";
      ctx.strokeRect(x, y, b.size, b.size);
    }

    // ③ 通常色タイル
    else if(b.color){
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y, b.size, b.size);
    }

  });

  // プレイヤー
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
