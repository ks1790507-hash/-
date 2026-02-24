// =====================
// canvas取得
// =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
// 窓特殊イベント用（最重要）
// =====================
let windowTouchCount = 0;
let isSpecialEvent = false;

const specialOverlay = document.getElementById("specialOverlay");
const specialBg = document.getElementById("specialBg");
const specialCharacter = document.getElementById("specialCharacter");
const specialName = document.getElementById("specialName");
const specialText = document.getElementById("specialText");

let specialLines = [];
let specialIndex = 0;
let specialCharIndex = 0;
let isSpecialTyping = false;
let fullSpecialText = "";

// =====================
// BGM
// =====================
let currentBGM = null;

function playBGM(src){
  if(currentBGM){
    currentBGM.pause();
    currentBGM = null;
  }
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.5;
  audio.play().catch(()=>{});
  currentBGM = audio;
}

// =====================
// フェード
// =====================
let fadeAlpha = 0;
let isFading = false;
let fadeMode = null;
let fadeCallback = null;

function startFade(callback){
  isFading = true;
  fadeMode = "out";
  fadeAlpha = 0;
  fadeCallback = callback;
}

// =====================
// 画像
// =====================
const images = {};
function loadImage(name, src){
  const img = new Image();
  img.src = src;
  images[name] = img;
}
loadImage("desk", "desk.png");
loadImage("window", "window.png");

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
// 下コメントシステム（スクショ形式）
// =====================
let isTalking = false;
const messageBox = document.getElementById("messageBox");

let messageLines = [];
let messageIndex = 0;
let charIndex = 0;
let isTyping = false;
let fullMessage = "";

function startTalk(lines){
  if(isTalking || isSpecialEvent || !lines) return;

  isTalking = true;
  messageBox.style.display = "flex";

  messageLines = lines;
  messageIndex = 0;
  nextMessage();
}

function typeMessage(text){
  isTyping = true;
  fullMessage = text;
  charIndex = 0;
  messageBox.innerHTML = "";
  typeWriter();
}

function typeWriter(){
  if(charIndex < fullMessage.length){
    messageBox.innerHTML += fullMessage[charIndex];
    charIndex++;
    setTimeout(typeWriter, 30);
  }else{
    isTyping = false;
  }
}

function nextMessage(){
  if(isTyping){
    messageBox.innerHTML = fullMessage;
    isTyping = false;
    return;
  }

  if(messageIndex >= messageLines.length){
    endTalk();
    return;
  }

  typeMessage(messageLines[messageIndex]);
  messageIndex++;
}

function endTalk(){
  isTalking = false;
  messageBox.style.display = "none";
  messageBox.innerHTML = "";
}

// =====================
// 特殊イベント（窓3回）
// =====================
function startSpecialEvent(){
  isSpecialEvent = true;
  isTalking = true;

  specialBg.src = "event_bg.png"; // 好きな背景
  specialCharacter.src = "nozle.png"; // キャラ画像
  specialName.textContent = "ノズル";

  specialLines = [
    "………………",
    "やっと気づいたね",
    "ずっと窓から見ていたよ",
    "君が来るのを"
  ];

  specialIndex = 0;
  specialOverlay.style.display = "block";
  nextSpecialDialogue();
}

function typeSpecialText(text){
  isSpecialTyping = true;
  fullSpecialText = text;
  specialCharIndex = 0;
  specialText.innerHTML = "";
  typeSpecialWriter();
}

function typeSpecialWriter(){
  if(specialCharIndex < fullSpecialText.length){
    specialText.innerHTML += fullSpecialText[specialCharIndex];
    specialCharIndex++;
    setTimeout(typeSpecialWriter, 35);
  }else{
    isSpecialTyping = false;
  }
}

function nextSpecialDialogue(){
  if(isSpecialTyping){
    specialText.innerHTML = fullSpecialText;
    isSpecialTyping = false;
    return;
  }

  if(specialIndex >= specialLines.length){
    endSpecialEvent();
    return;
  }

  typeSpecialText(specialLines[specialIndex]);
  specialIndex++;
}

function endSpecialEvent(){
  specialOverlay.style.display = "none";
  isSpecialEvent = false;
  isTalking = false;
  windowTouchCount = 0;
}

// =====================
// マップ読み込み
// =====================
function loadMap(name, customSpawn=null){
  fetch("./" + name + ".json?v=2")
    .then(res => res.json())
    .then(data => {

      currentMap = name;
      mapData = data.tiles;
      currentEvents = data.events || {};
      currentTileTypes = data.tileTypes || {};

      mapWidth = mapData[0].length * TILE;
      mapHeight = mapData.length * TILE;

      if(customSpawn){
        player.x = customSpawn.x;
        player.y = customSpawn.y;
      } else if(data.spawn){
        player.x = data.spawn.x;
        player.y = data.spawn.y;
      }

      targetX = player.x;
      targetY = player.y;

      createMap();

      if(data.bgm){
        playBGM(data.bgm);
      }
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
          x,y,
          size:TILE,
          solid:type.solid || false,
          warp:type.warp || null,
          tile:tile
        });
      }
    }
  }
}

// =====================
// タイル取得
// =====================
function getTileAt(x,y){
  const col = Math.floor((x + player.size/2) / TILE);
  const row = Math.floor((y + player.size/2) / TILE);
  return mapData[row]?.[col];
}

// =====================
// イベント処理（窓3回対応）
// =====================
function handleTileEvent(x,y){
  const tile = getTileAt(x,y);
  if(!tile) return;

  const type = currentTileTypes[tile];

  // ★ 窓3回触れたら特殊イベント
  if(tile === "窓"){
    windowTouchCount++;

    if(windowTouchCount >= 3){
      startSpecialEvent();
      return;
    }
  }

  // ワープ
  if(type && type.warp){
    startFade(()=>{
      loadMap(type.warp.map, {
        x: type.warp.x,
        y: type.warp.y
      });
    });
    return;
  }

  // 通常イベント
  if(currentEvents[tile]){
    startTalk(currentEvents[tile]);
  }
}

// =====================
// 移動判定
// =====================
function canMove(newX,newY){
  for(let b of blocks){
    if(b.solid){
      if(newX < b.x+b.size &&
         newX+player.size > b.x &&
         newY < b.y+b.size &&
         newY+player.size > b.y){
        return false;
      }
    }
  }
  return true;
}

// =====================
// 描画
// =====================
function draw(){

  if(isMoving){
    if(player.x < targetX) player.x += moveSpeed;
    if(player.x > targetX) player.x -= moveSpeed;
    if(player.y < targetY) player.y += moveSpeed;
    if(player.y > targetY) player.y -= moveSpeed;

    if(Math.abs(player.x-targetX)<=moveSpeed &&
       Math.abs(player.y-targetY)<=moveSpeed){
      player.x = targetX;
      player.y = targetY;
      isMoving = false;

      if(!isTalking && !isSpecialEvent){
        handleTileEvent(player.x, player.y);
      }
    }
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);

  cameraX = player.x - canvas.width/2 + player.size/2;
  cameraY = player.y - canvas.height/2 + player.size/2;

  blocks.forEach(b=>{
    ctx.fillStyle = "#ccc";
    ctx.fillRect(b.x-cameraX, b.y-cameraY, b.size, b.size);
  });

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x-cameraX, player.y-cameraY, player.size, player.size);

  requestAnimationFrame(draw);
}
draw();

// =====================
// キー操作
// =====================
document.addEventListener("keydown", e=>{

  // 特殊イベント中
  if(isSpecialEvent){
    if(e.code === "Space") nextSpecialDialogue();
    return;
  }

  // 通常会話中
  if(isTalking){
    if(e.code==="Space") nextMessage();
    if(e.code==="KeyT") endTalk();
    return;
  }

  if(isMoving || isFading) return;

  let newX=player.x;
  let newY=player.y;

  if(e.key==="ArrowUp") newY-=TILE;
  if(e.key==="ArrowDown") newY+=TILE;
  if(e.key==="ArrowLeft") newX-=TILE;
  if(e.key==="ArrowRight") newX+=TILE;

  if(canMove(newX,newY)){
    targetX=newX;
    targetY=newY;
    isMoving=true;
  }else{
    handleTileEvent(newX,newY);
  }
});
