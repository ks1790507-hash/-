// =====================
// 基本設定
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
let currentEvents = {};
let currentTileTypes = {};
let mapWidth = 0;
let mapHeight = 0;

let cameraX = 0;
let cameraY = 0;

// =====================
// プレイヤー
// =====================

const player = {
  x:0,
  y:0,
  size:TILE,
  color:"blue"
};

let targetX = 0;
let targetY = 0;
let isMoving = false;
const moveSpeed = 8;

// =====================
// 通常会話システム
// =====================

let isTalking = false;
let afterTalkCallback = null;

const messageBox = document.getElementById("messageBox");

let messageLines = [];
let messageIndex = 0;

function startTalk(lines, callback=null){
  if(isTalking || !lines) return;

  isTalking = true;
  messageBox.style.display = "flex";

  messageLines = lines;
  messageIndex = 0;
  afterTalkCallback = callback;

  nextMessage();
}

function nextMessage(){
  if(messageIndex >= messageLines.length){
    endTalk();
    return;
  }

  messageBox.innerHTML = messageLines[messageIndex];
  messageIndex++;
}

function endTalk(){
  isTalking = false;
  messageBox.style.display = "none";
  messageBox.innerHTML = "";

  if(afterTalkCallback){
    const cb = afterTalkCallback;
    afterTalkCallback = null;
    cb();
  }
}

// =====================
// ぷよ風会話システム
// =====================

let puyoMode = false;
let puyoData = [];
let puyoIndex = 0;

const overlay = document.getElementById("specialOverlay");
const bg = document.getElementById("specialBg");
const leftChara = document.getElementById("leftCharacter");
const rightChara = document.getElementById("rightCharacter");
const puyoName = document.getElementById("puyoName");
const puyoText = document.getElementById("puyoText");

function startWindowScene(){

  puyoMode = true;
  overlay.style.display = "block";
  overlay.style.opacity = 0;

  bg.src = "beach.png";

  puyoData = [
    {
      name:"アルル",
      text:"……ねぇ、聞こえる？",
      side:"left",
      image:"aruru_normal.png"
    },
    {
      name:"ラフィーナ",
      text:"ふふ、やっと来たわね。",
      side:"right",
      image:"raffina_smile.png"
    },
    {
      name:"アルル",
      text:"えっ！？ここはどこ！？",
      side:"left",
      image:"aruru_surprise.png"
    },
    {
      name:"ラフィーナ",
      text:"覚悟しなさい！",
      side:"right",
      image:"raffina_angry.png"
    }
  ];

  puyoIndex = 0;

  // フェードイン
  let fade = 0;
  const fadeIn = setInterval(()=>{
    fade += 0.05;
    overlay.style.opacity = fade;
    if(fade >= 1){
      clearInterval(fadeIn);
      nextPuyo();
    }
  },16);
}

function nextPuyo(){
  if(puyoIndex >= puyoData.length){
    endPuyo();
    return;
  }

  const line = puyoData[puyoIndex];

  puyoName.textContent = line.name;
  puyoText.textContent = line.text;

  if(line.side === "left"){
    leftChara.src = line.image;
    rightChara.style.filter = "brightness(0.5)";
    leftChara.style.filter = "brightness(1)";
  }else{
    rightChara.src = line.image;
    leftChara.style.filter = "brightness(0.5)";
    rightChara.style.filter = "brightness(1)";
  }

  puyoIndex++;
}

function endPuyo(){
  let fade = 1;
  const fadeOut = setInterval(()=>{
    fade -= 0.05;
    overlay.style.opacity = fade;
    if(fade <= 0){
      clearInterval(fadeOut);
      overlay.style.display = "none";
      puyoMode = false;
    }
  },16);
}

// =====================
// マップ読み込み
// =====================

function loadMap(name){
  fetch("./"+name+".json")
    .then(res=>res.json())
    .then(data=>{
      mapData = data.tiles;
      currentEvents = data.events || {};
      currentTileTypes = data.tileTypes || {};

      mapWidth = mapData[0].length * TILE;
      mapHeight = mapData.length * TILE;

      player.x = data.spawn.x;
      player.y = data.spawn.y;

      targetX = player.x;
      targetY = player.y;

      createMap();
    });
}

loadMap("map");

function createMap(){
  blocks = [];
  for(let row=0; row<mapData.length; row++){
    for(let col=0; col<mapData[row].length; col++){
      const tile = mapData[row][col];
      const type = currentTileTypes[tile];
      if(type){
        blocks.push({
          x:col*TILE,
          y:row*TILE,
          size:TILE,
          solid:type.solid,
          tile:tile
        });
      }
    }
  }
}

// =====================
// イベント処理
// =====================

function getTileAt(x,y){
  const col = Math.floor((x+player.size/2)/TILE);
  const row = Math.floor((y+player.size/2)/TILE);
  return mapData[row]?.[col];
}

function handleTileEvent(x,y){
  const tile = getTileAt(x,y);
  if(!tile) return;

  if(tile === "窓"){
    startTalk(currentEvents[tile], ()=>{
      startWindowScene();
    });
    return;
  }

  if(currentEvents[tile]){
    startTalk(currentEvents[tile]);
  }
}

// =====================
// 描画
// =====================

function draw(){

  if(isMoving){
    if(player.x < targetX) player.x += moveSpeed;
    if(player.x > targetX) player.x -= moveSpeed;
    if(player.y < targetY) player.y += moveSpeed;
    if(Math.abs(player.x-targetX)<=moveSpeed &&
       Math.abs(player.y-targetY)<=moveSpeed){
      player.x = targetX;
      player.y = targetY;
      isMoving = false;

      if(!isTalking){
        handleTileEvent(player.x, player.y);
      }
    }
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // ===== マップ描画 =====
  for(let row=0; row<mapData.length; row++){
    for(let col=0; col<mapData[row].length; col++){
      const tile = mapData[row][col];
      const type = currentTileTypes[tile];

      const x = col * TILE;
      const y = row * TILE;

      if(type?.color){
        ctx.fillStyle = type.color;
        ctx.fillRect(x,y,TILE,TILE);
      }else{
        ctx.fillStyle = "#ddd";
        ctx.fillRect(x,y,TILE,TILE);
      }
    }
  }

  // ===== プレイヤー =====
  ctx.fillStyle="blue";
  ctx.fillRect(player.x,player.y,player.size,player.size);

  requestAnimationFrame(draw);
}
draw();

// =====================
// キー操作
// =====================

document.addEventListener("keydown", e=>{

  if(puyoMode){
    if(e.code==="Space") nextPuyo();
    if(e.code==="KeyT") endPuyo();
    return;
  }

  if(isTalking){
    if(e.code==="Space") nextMessage();
    return;
  }

  if(isMoving) return;

  let newX = player.x;
  let newY = player.y;

  if(e.key==="ArrowUp") newY -= TILE;
  if(e.key==="ArrowDown") newY += TILE;
  if(e.key==="ArrowLeft") newX -= TILE;
  if(e.key==="ArrowRight") newX += TILE;

  targetX = newX;
  targetY = newY;
  isMoving = true;
});
