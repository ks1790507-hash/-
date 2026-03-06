function bucketFill(cx,cy){

// セル単位で色を取得
function getCellColor(x,y){
let d=ctx.getImageData(x*cellSize,y*cellSize,1,1).data;
return [d[0],d[1],d[2],d[3]];
}

function fillCell(x,y,color){
ctx.fillStyle=colorPicker.value;
ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
}

let target=getCellColor(cx,cy);
let fill=parseColor(colorPicker.value);

if(target[0]===fill[0] &&
   target[1]===fill[1] &&
   target[2]===fill[2]) return;

let stack=[[cx,cy]];
let visited=new Set();
let region=[];
let enclosed=true;

while(stack.length){

let [x,y]=stack.pop();
let key=x+","+y;

if(visited.has(key)) continue;
visited.add(key);

if(x<0||y<0||x>=gridSize||y>=gridSize){
enclosed=false;
continue;
}

let c=getCellColor(x,y);

if(c[0]!==target[0]||
   c[1]!==target[1]||
   c[2]!==target[2]||
   c[3]!==target[3]) continue;

region.push([x,y]);

// 端に触れたら囲まれていない
if(x===0||y===0||x===gridSize-1||y===gridSize-1){
enclosed=false;
}

stack.push([x+1,y]);
stack.push([x-1,y]);
stack.push([x,y+1]);
stack.push([x,y-1]);
}

if(!enclosed) return;

saveUndo();

for(let [x,y] of region){
fillCell(x,y,colorPicker.value);
}
}
