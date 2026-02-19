function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
let mapData = [];
let blocks = [];
let currentMap = "map";

let cameraX = 0;
let cameraY = 0;

let mapWidth = 0;
let mapHeight = 0;

// =====================
// プレイヤー
// =====================
const player = {
  x: 64,
  y: 64,
  size: TILE,
  color: "blue"
};

// =====================
// 会話
// =====================
let isTalking = false;
let talkLines = [];
let talkIndex = 0;
const messageBox = document.getElementById("messageBox");

const deskConversation = [
  "机の中を調べた。",
  "特に変わったものはない。"
];

const specialDeskConversation = [
  "机の中に手紙があった。",
  "”制作者メッセージ”",
  "が、字が汚くて読めない…"
];

const yoshiodesk = [
  "机の中に手紙がある…",
  "放課後生徒玄関前に来てください",
  "男の文字だ",
  "送り主はゲイに違いない"
];

const ryouA = [
  "机の中に手紙がある…",
  "放課後玄関前に来てください",
  "なにかデジャブを感じる"
];

const kyoutaku = [
  "先生からの最後の宿題",
  "幸せになってください",
  "…………………………………………",
  "普段宿題を出さない先生に言われてもなぁ"
];

// =====================
// マップ読み込み
// =====================
function loadMap(name){
  fetch(name + ".json")
    .then(res => res.json())
    .then(data => {
      mapData = data;
      currentMap = name;

      mapWidth = mapData[0].length * TILE;
      mapHeight = mapData.length * TILE;

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

      if(tile === "壁") createBlock(x,y,"gray",true);
      if(tile === "机") createBlock(x,y,"brown",true);
      if(tile === "よ") createBlock(x,y,"brown",true);
      if(tile === "特別机") createBlock(x,y,"brown",true);
      if(tile === "A") createBlock(x,y,"brown",true);
      if(tile === "黒板") createBlock(x,y,"green",true);
      if(tile === "教卓") createBlock(x,y,"darkred",true);
      if(tile === "扉") createBlock(x,y,"orange",true);
    }
  }
}

function createBlock(x,y,color,solid){
  blocks.push({ x,y,size:TILE,color,solid });
}

// =====================
// 描画
// =====================
function draw(){

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // ===== カメラ処理 =====
  if(currentMap === "map"){
    cameraX = 0;
    cameraY = 0;
  }else{

    cameraX = player.x - canvas.width/2 + player.size/2;
    cameraY = player.y - canvas.height/2 + player.size/2;

    // ★ 端で止める処理
    cameraX = Math.max(0, Math.min(cameraX, mapWidth - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, mapHeight - canvas.height));
  }

  blocks.forEach(b=>{
    ctx.fillStyle = b.color;
    ctx.fillRect(
      b.x - cameraX,
      b.y - cameraY,
      b.size,
      b.size
    );
  });

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

  let newX = player.x;
  let newY = player.y;

  if(e.key === "ArrowUp") newY -= TILE;
  if(e.key === "ArrowDown") newY += TILE;
  if(e.key === "ArrowLeft") newX -= TILE;
  if(e.key === "ArrowRight") newX += TILE;

  if(canMove(newX,newY)){
    player.x = newX;
    player.y = newY;
  }else{
    const tile = getTileAt(newX,newY);

    if(tile === "扉"){
      if(currentMap === "map"){
        loadMap("hallway");
      }else{
        loadMap("map");
      }
      player.x = 64;
      player.y = 64;
      return;
    }

    if(tile === "特別机") startTalk(specialDeskConversation);
    if(tile === "机") startTalk(deskConversation);
    if(tile === "A") startTalk(ryouA);
    if(tile === "よ") startTalk(yoshiodesk);
    if(tile === "教卓") startTalk(kyoutaku);
  }
});
document.addEventListener("keydown", e=>{
  if(e.key === "f"){
    canvas.requestFullscreen();
  }
});
