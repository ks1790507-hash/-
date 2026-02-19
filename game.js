const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
let mapData = [];
let blocks = [];

// プレイヤー
const player = {
  x: 32,
  y: 32,
  size: TILE,
  color: "blue"
};

// 会話
let isTalking = false;
let talkLines = [];
let talkIndex = 0;
const messageBox = document.getElementById("messageBox");

// 通常机の会話
const deskConversation = [
  "机の中を調べた。",
  "プリントが入っている。",
  "特に変わったものはない。"
];

// ⭐ 特別机の会話
const specialDeskConversation = [
  "この机は少し違う…",
  "引き出しの奥に鍵がある！",
  "『理科準備室』と書いてある。"
];

// ⭐ 特別机の座標（ここを後で調整）
let specialDesk = {
  row: 8,
  col: 11
};

// =======================
// MAP読み込み
// =======================
fetch("map.json")
  .then(res => res.json())
  .then(data => {
    mapData = data;
    createMap();
    draw();
  });

// =======================
// マップ生成
// =======================
function createMap(){
  blocks = [];

  for(let row=0; row<mapData.length; row++){
    for(let col=0; col<mapData[row].length; col++){

      const tile = mapData[row][col];
      const x = col * TILE;
      const y = row * TILE;

      if(tile === "壁"){
        createBlock(x,y,"gray",true);
      }

      if(tile === "机"){
        createBlock(x,y,"brown",true);
      }

      if(tile === "黒板"){
        createBlock(x,y,"green",true);
      }

      if(tile === "教卓"){
        createBlock(x,y,"darkred",true);
      }

      if(tile === "扉"){
        createBlock(x,y,"orange",false);
      }
    }
  }
}

function createBlock(x,y,color,solid){
  blocks.push({
    x:x,
    y:y,
    size:TILE,
    color:color,
    solid:solid
  });
}

// =======================
// 描画
// =======================
function draw(){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  blocks.forEach(b=>{
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x,b.y,b.size,b.size);
  });

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x,player.y,player.size,player.size);

  requestAnimationFrame(draw);
}

// =======================
// 移動判定
// =======================
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

// タイル位置取得
function getTilePosition(x,y){
  return {
    col: x / TILE,
    row: y / TILE
  };
}

// =======================
// 会話処理
// =======================
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

// =======================
// キー操作
// =======================
document.addEventListener("keydown", e=>{

  // 会話中
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
  }
  else{
    const pos = getTilePosition(newX,newY);

    // ⭐ デバッグ表示（F12 → Consoleで確認）
    console.log("row:", pos.row, "col:", pos.col);

    const tile = mapData[pos.row]?.[pos.col];

    if(tile === "机"){

      // ⭐ 特別机判定
      if(pos.row === specialDesk.row && pos.col === specialDesk.col){
        startTalk(specialDeskConversation);
      }else{
        startTalk(deskConversation);
      }

    }
  }

});
