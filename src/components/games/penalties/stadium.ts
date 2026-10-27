import { G, POST, W, H, powerAt, powerZone, type Scene } from './physics';
export function drawStadium(ctx: CanvasRenderingContext2D, S: Scene, now: number, ledText: string, reduce: boolean, palette: Record<string,string>) {
const alpha=(role: string, opacity: number)=>`color-mix(in srgb, ${palette[role]} ${opacity*100}%, transparent)`;
const crowd=Array.from({length:240},(_,i)=>({x:(i*53)%W,y:14+((i*37)%70),c:i%3,ph:i*1.7}));
const inGoal=(p: {x:number;y:number})=>p.x>G.x-40&&p.x<G.x+G.w+40&&p.y>G.y-40&&p.y<G.y+G.h;
const hover=S.aim;
const KEEP={y:278};
const zone=()=>powerZone(S.knew);
const power=(t:number)=>powerAt(t,S.powerStart,S.knew);
const wobble=(t:number)=>S.knew||reduce?{x:0,y:0}:{x:Math.sin(t/170)*22,y:Math.cos(t/230)*14};
function drawNet(now: number){const n=S.net,k=n?Math.max(0,1-(now-n.t)/900):0;ctx.strokeStyle=alpha('white', .3);ctx.lineWidth=1;
  const bulge=(x: number,y: number): [number, number]=>{if(!k||!n)return[x,y];const d=Math.hypot(x-n.x,y-n.y),f=Math.max(0,1-d/120)*k*14;return[x+(x-n.x)/(d||1)*f*.4,y-f*.2+f];};
  for(let x=G.x;x<=G.x+G.w;x+=20){ctx.beginPath();for(let y=G.y;y<=G.y+G.h;y+=10){const[a,b]=bulge(x,y);y===G.y?ctx.moveTo(a,b):ctx.lineTo(a,b);}ctx.stroke();}
  for(let y=G.y;y<=G.y+G.h;y+=20){ctx.beginPath();for(let x=G.x;x<=G.x+G.w;x+=10){const[a,b]=bulge(x,y);x===G.x?ctx.moveTo(a,b):ctx.lineTo(a,b);}ctx.stroke();}}
function drawKeeper(now: number){const k=S.keeper,idle=(S.phase==='aim'||S.phase==='power')&&!reduce?Math.sin(now/(S.knew?420:200))*(S.knew?6:16):0;
  ctx.save();ctx.translate(k.x+idle,k.y);ctx.rotate(k.ang);const arm=24+k.stretch*18;
  ctx.fillStyle=palette['gold'];ctx.beginPath();ctx.roundRect(-22,-30,44,58,10);ctx.fill();ctx.fillStyle=palette['kit-dark'];ctx.fillRect(-20,28,16,30);ctx.fillRect(4,28,16,30);
  ctx.fillStyle=palette['skin'];ctx.beginPath();ctx.arc(0,-46,15,0,7);ctx.fill();ctx.fillStyle=palette['kit-dark'];ctx.fillRect(-15,-58,30,7);
  ctx.strokeStyle=palette['gold'];ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-18,-22);ctx.lineTo(-18-arm,-34-k.stretch*16);ctx.moveTo(18,-22);ctx.lineTo(18+arm,-34-k.stretch*16);ctx.stroke();
  ctx.fillStyle=palette['white'];ctx.beginPath();ctx.arc(-22-arm,-36-k.stretch*16,10,0,7);ctx.arc(22+arm,-36-k.stretch*16,10,0,7);ctx.fill();ctx.restore();}
function draw(now: number){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,palette['night']);bg.addColorStop(.35,palette['sky']);bg.addColorStop(.36,palette['grass']);bg.addColorStop(1,palette['grass-dark']);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  [[120,30],[680,30]].forEach(([lx,ly])=>{const g=ctx.createRadialGradient(lx,ly,2,lx,ly,180);g.addColorStop(0,alpha('white', .35));g.addColorStop(1,alpha('white', 0));ctx.fillStyle=g;ctx.fillRect(lx-180,0,360,220);});
  const hype=Math.max(0,1-(now-S.cheer)/1800);crowd.forEach(p=>{const j=reduce?0:Math.sin(now/180+p.ph)*1.2-hype*Math.abs(Math.sin(now/90+p.ph))*10;ctx.fillStyle=p.c===0?palette['red']:p.c===1?palette['white']:palette['blue'];ctx.globalAlpha=.45+hype*.45;ctx.beginPath();ctx.arc(p.x,p.y+j,3,0,7);ctx.fill();});ctx.globalAlpha=1;
  if(hype>0&&!reduce){[90,250,550,710].forEach((fx,i)=>{const fy=40+(i%2)*18,r=26+Math.sin(now/60+i)*6;const g=ctx.createRadialGradient(fx,fy,1,fx,fy,r*2.4);g.addColorStop(0,alpha(i%2?'gold':'red',.9*hype));g.addColorStop(1,alpha('red',0));ctx.fillStyle=g;ctx.fillRect(fx-r*2.4,fy-r*2.4,r*4.8,r*4.8);for(let k=0;k<6;k++){ctx.fillStyle=alpha('white',.5*hype);ctx.beginPath();ctx.arc(fx+Math.sin(now/120+k*2)*14,fy-((now/8+k*20)%70),2,0,7);ctx.fill();}});}
  const led=[ledText,'JAIKUAA · EL ESTADIO DE LAS PALABRAS','APRENDÉ JUGANDO · AUDIO DE VOCES REALES'][Math.floor(now/9000)%3];ledText=led;ctx.font='800 16px sans-serif';const ledWidth=Math.max(420,ctx.measureText(ledText).width+90);const off=reduce?0:(now/12)%ledWidth;ctx.fillStyle=palette['black'];ctx.fillRect(0,92,W,24);ctx.save();ctx.beginPath();ctx.rect(0,92,W,24);ctx.clip();ctx.fillStyle=palette['gold'];for(let x=-ledWidth;x<W+ledWidth;x+=ledWidth)ctx.fillText(ledText + "  ·  ",x-off+20,110);ctx.restore();
  for(let i=0;i<6;i++){ctx.fillStyle=i%2?palette['grass']:palette['stripe'];ctx.fillRect(0,216+i*64,W,64);}
  ctx.strokeStyle=alpha('white', .85);ctx.lineWidth=4;ctx.strokeRect(70,G.y+G.h,660,170);ctx.beginPath();ctx.arc(400,520,5,0,7);ctx.fillStyle=palette['white'];ctx.fill();
  drawNet(now);
  // target hint: corners glow
  if(S.phase==='aim'){ctx.fillStyle=alpha('gold', .12);[[G.x,G.y],[G.x+G.w-110,G.y]].forEach(([x,y])=>{ctx.beginPath();ctx.roundRect(x+POST,y+POST,110-POST,70,10);ctx.fill();});}
  const sh=S.shake?Math.max(0,1-(now-S.shake)/500):0;ctx.save();if(sh&&!reduce)ctx.translate(Math.sin(now/18)*5*sh,0);ctx.strokeStyle=palette['white'];ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(G.x,G.y+G.h);ctx.lineTo(G.x,G.y);ctx.lineTo(G.x+G.w,G.y);ctx.lineTo(G.x+G.w,G.y+G.h);ctx.stroke();ctx.restore();
  drawKeeper(now);
  // aim reticle
  const showAim=S.phase==='aim'?(hover&&inGoal(hover)?hover:{x:400,y:225}):S.phase==='power'?S.aim:null;
  if(showAim){const w=S.phase==='power'?wobble(now):{x:0,y:0};const ax=showAim.x+w.x,ay=showAim.y+w.y;
    // trajectory arrow from the ball to the aim point
    const cx=(400+ax)/2,cy=Math.min(ay,520)-40;const pulse=reduce?0:Math.sin(now/160)*.15;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle=alpha('black',.35);ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(400,505);ctx.quadraticCurveTo(cx,cy,ax,ay);ctx.stroke();
    ctx.strokeStyle=alpha('gold',.85+pulse);ctx.lineWidth=8;ctx.setLineDash([18,10]);ctx.lineDashOffset=reduce?0:-(now/20)%28;ctx.beginPath();ctx.moveTo(400,505);ctx.quadraticCurveTo(cx,cy,ax,ay);ctx.stroke();ctx.setLineDash([]);
    const ang=Math.atan2(ay-cy,ax-cx),L=30;ctx.fillStyle=palette['gold'];ctx.strokeStyle=palette['black'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax+Math.cos(ang)*8,ay+Math.sin(ang)*8);ctx.lineTo(ax-Math.cos(ang-.45)*L,ay-Math.sin(ang-.45)*L);ctx.lineTo(ax-Math.cos(ang+.45)*L,ay-Math.sin(ang+.45)*L);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.strokeStyle=palette['white'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax,ay,20,0,7);ctx.stroke();}
  // power meter
  if(S.phase==='power'){const p=power(now),[lo,hi]=zone(),mx=740,my=170,mh=300;ctx.fillStyle=alpha('black', .7);ctx.beginPath();ctx.roundRect(mx-6,my-6,40,mh+12,12);ctx.fill();
    ctx.fillStyle=palette['red'];ctx.fillRect(mx,my,28,mh*(1-hi));ctx.fillStyle=palette['green'];ctx.fillRect(mx,my+mh*(1-hi),28,mh*(hi-lo));ctx.fillStyle=palette['gold'];ctx.fillRect(mx,my+mh*(1-lo),28,mh*lo);
    ctx.fillStyle=palette['white'];ctx.fillRect(mx-8,my+mh*(1-p)-3,44,6);ctx.font='800 20px sans-serif,sans-serif';ctx.textAlign='center';ctx.fillText('FUERZA',mx+14,my+mh+28);}
  if((S.phase==='aim'||S.phase==='power')&&!S.spectator){ctx.fillStyle=palette['gold'];ctx.font='800 32px sans-serif, sans-serif';ctx.textAlign='center';ctx.fillText(S.phase==='aim'?'Deslizá el dedo y soltá para apuntar':'¡Tocá cuando esté en verde!',400,G.y+G.h+46);}
  if((S.phase==='aim'||S.phase==='power')&&S.spectator){ctx.fillStyle=palette['gold'];ctx.font='800 32px sans-serif, sans-serif';ctx.textAlign='center';ctx.fillText(S.phase==='aim'?'Está apuntando…':'¡Va a patear!',400,G.y+G.h+46);}
  ctx.textAlign='start';
  const b=S.ball;ctx.fillStyle=alpha('black', .25);ctx.beginPath();ctx.ellipse(b.x,Math.max(b.y+b.r,G.y+G.h-10)+4,b.r,b.r*.35,0,0,7);ctx.fill();
  ctx.fillStyle=palette['white'];ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.save();ctx.translate(b.x,b.y);ctx.rotate(reduce?0:b.y/25);ctx.fillStyle=palette['kit-dark'];ctx.beginPath();for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.lineTo(Math.cos(a)*b.r*.42,Math.sin(a)*b.r*.42);}ctx.fill();ctx.restore();
  // Generic striped shirt: no crest, sponsor or team identifier.
  ctx.save();ctx.translate(400,S.phase==='shot'?576:582);ctx.fillStyle=palette['white'];ctx.beginPath();ctx.roundRect(-28,-4,56,44,10);ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=palette['red'];for(let x=-28;x<28;x+=16)ctx.fillRect(x,-4,8,44);ctx.restore();ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.arc(0,-16,14,0,7);ctx.fill();ctx.restore();
  if(S.banner){const q=(now-S.banner.t)/1400;if(q>1)S.banner=null;else{const s=reduce?1:Math.min(1,q*5)*(1+.08*Math.sin(q*20));ctx.save();ctx.translate(400,300);ctx.scale(s,s);ctx.globalAlpha=q>.8?(1-q)/.2:1;ctx.font='800 54px sans-serif';ctx.textAlign='center';ctx.lineWidth=10;ctx.strokeStyle=palette['black'];ctx.strokeText(S.banner.txt,0,20,720);ctx.fillStyle=S.banner.c;ctx.fillText(S.banner.txt,0,20,720);ctx.restore();}}
  }

draw(now);
}
