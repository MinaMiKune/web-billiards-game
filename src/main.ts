import './style.css'

type Ball = { x: number; y: number; vx: number; vy: number; color: string; number: number; cue?: boolean; sunk?: boolean }
const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="shell">
    <header><div><p class="eyebrow">BROWSER GAME · 8-BALL</p><h1>BREAK <span>&</span> RUN</h1></div><button id="reset" class="reset">↻ New rack</button></header>
    <section class="hud"><div><small>YOUR TURN</small><strong id="status">Aim and shoot</strong></div><div class="power"><label for="power">SHOT POWER <b id="power-value">65%</b></label><input id="power" type="range" min="15" max="100" value="65"></div></section>
    <div class="table-wrap"><canvas id="table" aria-label="Billiards table. Drag from the cue ball backwards to aim, then release to shoot."></canvas></div>
    <footer><span>DRAG BACK FROM THE CUE BALL TO AIM</span><span>MADE FOR THE WEB <i>●</i></span></footer>
  </main>`
const canvas = document.querySelector<HTMLCanvasElement>('#table')!
const ctx = canvas.getContext('2d')!
const powerInput = document.querySelector<HTMLInputElement>('#power')!
const powerValue = document.querySelector<HTMLElement>('#power-value')!
const status = document.querySelector<HTMLElement>('#status')!
const W=900,H=500,R=10, left=48,top=48,right=852,bottom=452
let balls:Ball[]=[]
let aiming=false, aim={x:0,y:0}, pointer={x:0,y:0}, shotPower=0.65
const colors=['#f4d03f','#277bd1','#d94a43','#7145a8','#e88c36','#299b68','#9c314b','#171717','#f4d03f','#277bd1','#d94a43','#7145a8','#e88c36','#299b68','#9c314b']
function rack(){
  balls=[{x:270,y:250,vx:0,vy:0,color:'#fff',number:0,cue:true}]
  const startX=625, spacing=22, rows=5
  let n=1
  for(let row=0;row<rows;row++) for(let col=0;col<=row;col++){
    const x=startX+row*spacing*.87, y=250+(col-row/2)*spacing
    balls.push({x,y,vx:0,vy:0,color:colors[(n-1)%colors.length],number:n++})
  }
  status.textContent='Aim and shoot'
}
function resize(){
  const rect=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2)
  canvas.width=rect.width*dpr; canvas.height=rect.width*(H/W)*dpr
  ctx.setTransform(canvas.width/W,0,0,canvas.width/W,0,0)
}
function draw(){
  ctx.clearRect(0,0,W,H)
  ctx.fillStyle='#4a2919'; roundRect(8,8,884,484,22); ctx.fill()
  ctx.fillStyle='#176447'; roundRect(27,27,846,446,16); ctx.fill()
  ctx.strokeStyle='#2b8a66';ctx.lineWidth=2;ctx.strokeRect(39,39,822,422)
  for(const [x,y] of [[27,27],[450,27],[873,27],[27,473],[450,473],[873,473]]){ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fillStyle='#080d0b';ctx.fill()}
  for(const b of balls){if(b.sunk)continue
    ctx.beginPath();ctx.arc(b.x+2,b.y+3,R+1,0,Math.PI*2);ctx.fillStyle='#09251c';ctx.fill()
    const g=ctx.createRadialGradient(b.x-4,b.y-5,1,b.x,b.y,R)
    g.addColorStop(0,'#fff');g.addColorStop(.22,b.color);g.addColorStop(1,'#101719')
    ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
    if(!b.cue){ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fillStyle='#f7f2df';ctx.fill();ctx.fillStyle='#17211c';ctx.font='5px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(b.number),b.x,b.y)}
  }
  const cue=balls[0]
  if(aiming&&cue&&!cue.sunk){
    const dx=cue.x-pointer.x,dy=cue.y-pointer.y,len=Math.hypot(dx,dy)||1, ux=dx/len,uy=dy/len
    ctx.setLineDash([5,6]);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5
    ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(cue.x+ux*150,cue.y+uy*150);ctx.stroke();ctx.setLineDash([])
    ctx.strokeStyle='#e7d3a0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cue.x-ux*18,cue.y-uy*18);ctx.lineTo(cue.x-ux*len*.55,cue.y-uy*len*.55);ctx.stroke()
  }
}
function roundRect(x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function physics(){
  for(const b of balls){if(b.sunk)continue;b.x+=b.vx;b.y+=b.vy;b.vx*=.986;b.vy*=.986;if(Math.hypot(b.vx,b.vy)<.035)b.vx=b.vy=0
    if(b.x<left+R||b.x>right-R){b.vx*=-.91;b.x=Math.max(left+R,Math.min(right-R,b.x))}
    if(b.y<top+R||b.y>bottom-R){b.vy*=-.91;b.y=Math.max(top+R,Math.min(bottom-R,b.y))}
    for(const p of [[27,27],[450,27],[873,27],[27,473],[450,473],[873,473]])if(Math.hypot(b.x-p[0],b.y-p[1])<22){b.sunk=true;b.vx=b.vy=0;if(b.cue){b.sunk=false;b.x=270;b.y=250;status.textContent='Scratch! Cue ball reset'}else status.textContent='Ball pocketed!'}
  }
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    const a=balls[i],b=balls[j];if(a.sunk||b.sunk)continue
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=R*2||d===0)continue
    const nx=dx/d,ny=dy/d,overlap=R*2-d
    a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny
    if(rel>0){const impulse=rel*.96;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}
  }
}
function frame(){physics();draw();requestAnimationFrame(frame)}
function coords(e:PointerEvent){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.width*W}}
canvas.addEventListener('pointerdown',e=>{const p=coords(e),cue=balls[0];if(balls.some(b=>Math.hypot(b.vx,b.vy)>.15))return;if(cue.sunk)return;if(Math.hypot(p.x-cue.x,p.y-cue.y)<34){aiming=true;pointer=p;canvas.setPointerCapture(e.pointerId)}})
canvas.addEventListener('pointermove',e=>{if(aiming)pointer=coords(e)})
canvas.addEventListener('pointerup',()=>{if(!aiming)return;const cue=balls[0],dx=cue.x-pointer.x,dy=cue.y-pointer.y,len=Math.hypot(dx,dy);if(len>4){const speed=Math.min(len*.095,13)*shotPower;cue.vx=dx/len*speed;cue.vy=dy/len*speed;status.textContent='Balls in motion'}aiming=false})
powerInput.addEventListener('input',()=>{shotPower=Number(powerInput.value)/100;powerValue.textContent=powerInput.value+'%'})
document.querySelector('#reset')!.addEventListener('click',rack)
new ResizeObserver(resize).observe(canvas)
resize();rack();requestAnimationFrame(frame)
