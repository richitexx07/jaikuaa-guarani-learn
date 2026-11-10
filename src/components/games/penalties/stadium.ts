import { G, POST, W, H, powerAt, powerZone, type Scene } from './physics';
import { ARCO_EN_ESTADIO, ARQUERO, ESTADIO, PELOTA, estadoEstadio, imagen, pateadorPintado, pintadoTarde } from './sprites';
import { KIT_INICIAL, disenoDe } from './camisetas';
export function drawStadium(ctx: CanvasRenderingContext2D, S: Scene, now: number, ledText: string, reduce: boolean, palette: Record<string,string>, capa3d=false) {
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
function limb(x1:number,y1:number,x2:number,y2:number,w:number,c:string){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function drawKeeperVector(now: number){const k=S.keeper,idle=(S.phase==='aim'||S.phase==='power')&&!reduce?Math.sin(now/(S.knew?420:200))*(S.knew?6:16):0;
  const party=!!S.banner&&S.banner.txt==='¡ATAJÓ!'&&!reduce;const bob=party?Math.abs(Math.sin(now/90))*14:reduce?0:Math.abs(Math.sin(now/260))*2;
  ctx.save();ctx.translate(k.x+idle,k.y-bob);ctx.rotate(k.ang);ctx.scale(1.3,1.3);const st=party?1:k.stretch,arm=30+st*22,hy=party?-70:-30-st*22;
  // sombra
  ctx.fillStyle=alpha('black',.25);ctx.beginPath();ctx.ellipse(0,52,34,7,0,0,7);ctx.fill();
  // piernas abiertas con medias y botines
  limb(-10,18,-22,42,13,palette['skin']);limb(10,18,22,42,13,palette['skin']);
  limb(-21,36,-24,46,14,palette['gold']);limb(21,36,24,46,14,palette['gold']);
  ctx.fillStyle=palette['black'];ctx.beginPath();ctx.ellipse(-27,50,10,5,0,0,7);ctx.ellipse(27,50,10,5,0,0,7);ctx.fill();
  // short
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.roundRect(-20,6,40,18,5);ctx.fill();
  // brazos con mangas y guantes grandes
  limb(-18,-20,-18-arm*.55,(-20+hy)/2,12,palette['gold']);limb(-18-arm*.55,(-20+hy)/2,-18-arm,hy,10,palette['gold']);
  limb(18,-20,18+arm*.55,(-20+hy)/2,12,palette['gold']);limb(18+arm*.55,(-20+hy)/2,18+arm,hy,10,palette['gold']);
  [-1,1].forEach(d=>{const gx=d*(22+arm),gy=hy-2;ctx.fillStyle=palette['white'];ctx.beginPath();ctx.ellipse(gx,gy,10,12,d*.3,0,7);ctx.fill();ctx.strokeStyle=palette['kit-dark'];ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=palette['kit-dark'];ctx.fillRect(gx-8,gy+7,16,4);});
  // camiseta con degradé y cuello
  const jg=ctx.createLinearGradient(-22,0,22,0);jg.addColorStop(0,alpha('gold',.75));jg.addColorStop(.5,palette['gold']);jg.addColorStop(1,alpha('gold',.75));
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.roundRect(-23,-30,46,40,12);ctx.fill();
  ctx.fillStyle=jg;ctx.beginPath();ctx.roundRect(-22,-30,44,40,12);ctx.fill();
  ctx.strokeStyle=palette['kit-dark'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,-6);ctx.lineTo(22,-6);ctx.stroke();
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.moveTo(-8,-30);ctx.lineTo(0,-22);ctx.lineTo(8,-30);ctx.fill();
  // cuello y cabeza
  ctx.fillStyle=palette['skin'];ctx.fillRect(-5,-36,10,8);ctx.beginPath();ctx.ellipse(0,-48,14,16,0,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(-14,-48,3.5,0,7);ctx.arc(14,-48,3.5,0,7);ctx.fill();
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.ellipse(0,-58,15,9,0,Math.PI,0);ctx.fill();ctx.fillRect(-15,-59,30,4);
  ctx.fillStyle=palette['white'];ctx.beginPath();ctx.arc(-5,-48,3,0,7);ctx.arc(5,-48,3,0,7);ctx.fill();
  ctx.fillStyle=palette['black'];ctx.beginPath();ctx.arc(-5,-48,1.6,0,7);ctx.arc(5,-48,1.6,0,7);ctx.fill();
  ctx.strokeStyle=palette['black'];ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-5,-39);ctx.quadraticCurveTo(0,st>.3?-35:-37,5,-39);ctx.stroke();
  ctx.restore();}
function drawShooterVector(now:number){const kick=S.phase==='shot'||S.phase==='result';const lean=kick?.18:0;const sway=reduce||kick?0:Math.sin(now/400)*1.5;
  ctx.save();ctx.translate(352+sway,600);ctx.rotate(lean);
  ctx.fillStyle=alpha('black',.25);ctx.beginPath();ctx.ellipse(0,-4,40,8,0,0,7);ctx.fill();
  // piernas (de espaldas): la derecha patea
  limb(-14,-48,-18,-8,16,palette['skin']);
  if(kick)limb(14,-48,40,-30,16,palette['skin']);else limb(14,-48,16,-8,16,palette['skin']);
  ctx.fillStyle=palette['white'];ctx.fillRect(-26,-26,16,18);if(!kick)ctx.fillRect(8,-26,16,18);
  ctx.fillStyle=palette['black'];ctx.beginPath();ctx.ellipse(-18,-6,12,6,0,0,7);ctx.fill();if(kick){ctx.beginPath();ctx.ellipse(44,-30,12,6,-.5,0,7);ctx.fill();}else{ctx.beginPath();ctx.ellipse(16,-6,12,6,0,0,7);ctx.fill();}
  // short
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.roundRect(-30,-70,60,26,6);ctx.fill();
  // brazos
  limb(-30,-120,-44,-80,13,palette['skin']);limb(30,-120,44,-80,13,palette['skin']);
  limb(-30,-122,-38,-104,15,disenoDe(S.kit??KIT_INICIAL).base);limb(30,-122,38,-104,15,disenoDe(S.kit??KIT_INICIAL).base);
  // camiseta a rayas genérica (sin escudo ni marca)
  const kit=S.kit??KIT_INICIAL,d:{base:string;rayas?:string;banda?:string;vivo?:string;numero:string}=disenoDe(kit);ctx.save();ctx.beginPath();ctx.roundRect(-32,-134,64,70,14);ctx.clip();ctx.fillStyle=d.base;ctx.fillRect(-32,-134,64,70);if(d.rayas){ctx.fillStyle=d.rayas;for(let x=-28;x<32;x+=16)ctx.fillRect(x,-134,8,70);}if(d.banda){ctx.save();ctx.translate(0,-100);ctx.rotate(.8);ctx.fillStyle=d.banda;ctx.fillRect(-60,-8,120,16);ctx.restore();}ctx.textAlign='center';ctx.fillStyle=d.numero;ctx.strokeStyle=d.base;ctx.lineJoin='round';ctx.font='800 9px sans-serif';const nom=kit.nombre.trim().toUpperCase();if(nom){ctx.lineWidth=3;ctx.strokeText(nom,0,-118,52);ctx.fillText(nom,0,-118,52);}ctx.font='800 30px sans-serif';ctx.lineWidth=4;ctx.strokeText(String(kit.numero),0,-84,50);ctx.fillText(String(kit.numero),0,-84,50);ctx.textAlign='start';if(d.vivo){ctx.strokeStyle=d.vivo;ctx.lineWidth=6;ctx.strokeRect(-32,-134,64,70);}
  const sh=ctx.createLinearGradient(-32,0,32,0);sh.addColorStop(0,alpha('black',.25));sh.addColorStop(.5,alpha('black',0));sh.addColorStop(1,alpha('black',.25));ctx.fillStyle=sh;ctx.fillRect(-32,-134,64,70);ctx.restore();
  // cabeza de espaldas
  ctx.fillStyle=palette['skin'];ctx.fillRect(-7,-144,14,12);ctx.beginPath();ctx.arc(-17,-156,4,0,7);ctx.arc(17,-156,4,0,7);ctx.fill();
  ctx.fillStyle=palette['kit-dark'];ctx.beginPath();ctx.ellipse(0,-158,17,19,0,0,7);ctx.fill();
  ctx.strokeStyle=alpha('white',.15);ctx.lineWidth=2;ctx.beginPath();ctx.arc(-4,-164,9,3.6,5);ctx.stroke();
  ctx.restore();}
function fondoVector(now: number){
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,palette['night']);bg.addColorStop(.35,palette['sky']);bg.addColorStop(.36,palette['grass']);bg.addColorStop(1,palette['grass-dark']);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  [[120,30],[680,30]].forEach(([lx,ly])=>{const g=ctx.createRadialGradient(lx,ly,2,lx,ly,180);g.addColorStop(0,alpha('white', .35));g.addColorStop(1,alpha('white', 0));ctx.fillStyle=g;ctx.fillRect(lx-180,0,360,220);});
  const hype=Math.max(0,1-(now-S.cheer)/1800);crowd.forEach(p=>{const j=reduce?0:Math.sin(now/180+p.ph)*1.2-hype*Math.abs(Math.sin(now/90+p.ph))*10;ctx.fillStyle=p.c===0?palette['red']:p.c===1?palette['white']:palette['blue'];ctx.globalAlpha=.45+hype*.45;ctx.beginPath();ctx.arc(p.x,p.y+j,3,0,7);ctx.fill();});ctx.globalAlpha=1;
  if(hype>0&&!reduce){[90,250,550,710].forEach((fx,i)=>{const fy=40+(i%2)*18,r=26+Math.sin(now/60+i)*6;const g=ctx.createRadialGradient(fx,fy,1,fx,fy,r*2.4);g.addColorStop(0,alpha(i%2?'gold':'red',.9*hype));g.addColorStop(1,alpha('red',0));ctx.fillStyle=g;ctx.fillRect(fx-r*2.4,fy-r*2.4,r*4.8,r*4.8);for(let k=0;k<6;k++){ctx.fillStyle=alpha('white',.5*hype);ctx.beginPath();ctx.arc(fx+Math.sin(now/120+k*2)*14,fy-((now/8+k*20)%70),2,0,7);ctx.fill();}});}
  const led=[ledText,'JAIKUAA · EL ESTADIO DE LAS PALABRAS','APRENDÉ JUGANDO · AUDIO DE VOCES REALES'][Math.floor(now/9000)%3];ledText=led;ctx.font='800 16px sans-serif';const ledWidth=Math.max(420,ctx.measureText(ledText).width+90);const off=reduce?0:(now/12)%ledWidth;ctx.fillStyle=palette['black'];ctx.fillRect(0,92,W,24);ctx.save();ctx.beginPath();ctx.rect(0,92,W,24);ctx.clip();ctx.fillStyle=palette['gold'];for(let x=-ledWidth;x<W+ledWidth;x+=ledWidth)ctx.fillText(ledText + "  ·  ",x-off+20,110);ctx.restore();
  for(let i=0;i<6;i++){ctx.fillStyle=i%2?palette['grass']:palette['stripe'];ctx.fillRect(0,216+i*64,W,64);}
  {const gl=ctx.createRadialGradient(400,330,20,400,330,420);gl.addColorStop(0,alpha('white',.14));gl.addColorStop(1,alpha('white',0));ctx.fillStyle=gl;ctx.fillRect(0,216,W,H-216);}
  ctx.fillStyle=alpha('black',.35);ctx.fillRect(0,84,W,8);ctx.fillStyle=alpha('white',.08);for(let r=0;r<4;r++)ctx.fillRect(0,18+r*18,W,2);
  ctx.strokeStyle=alpha('white', .85);ctx.lineWidth=4;ctx.strokeRect(70,G.y+G.h,660,170);ctx.beginPath();ctx.arc(400,520,5,0,7);ctx.fillStyle=palette['white'];ctx.fill();
}

/* ---------- Estadio ilustrado: Jai arquero, pateador con su camiseta y estadio de noche ---------- */
function estadioListo(){return !!imagen(ESTADIO);}
function cartelLed(now:number,y:number,h:number){const led=[ledText,'JAIKUAA · EL ESTADIO DE LAS PALABRAS','APRENDÉ JUGANDO · AUDIO DE VOCES REALES'][Math.floor(now/9000)%3];ctx.font=`800 ${Math.round(h*.68)}px sans-serif`;const ledWidth=Math.max(420,ctx.measureText(led).width+90);const off=reduce?0:(now/12)%ledWidth;
  ctx.fillStyle=alpha('black',.85);ctx.fillRect(0,y,W,h);ctx.save();ctx.beginPath();ctx.rect(0,y,W,h);ctx.clip();ctx.fillStyle=palette['gold'];ctx.shadowColor=palette['gold'];ctx.shadowBlur=8;for(let x=-ledWidth;x<W+ledWidth;x+=ledWidth)ctx.fillText(led+"  ·  ",x-off+20,y+h*.78);ctx.restore();
  ctx.fillStyle=alpha('white',.18);ctx.fillRect(0,y,W,1);ctx.fillRect(0,y+h-1,W,1);}
function fondoIlustrado(now:number){const im=imagen(ESTADIO);if(!im)return false;const A=ARCO_EN_ESTADIO,sx=G.w/A.w,sy=G.h/A.h;
  ctx.fillStyle=palette['night'];ctx.fillRect(0,0,W,H);ctx.drawImage(im,G.x-A.x*sx,G.y-A.y*sy,im.naturalWidth*sx,im.naturalHeight*sy);
  // La hinchada salta con el gol: destello de los reflectores y papelitos.
  const hype=Math.max(0,1-(now-S.cheer)/1800);
  if(hype>0&&!reduce){ctx.save();ctx.globalCompositeOperation='lighter';[[110,26],[690,26]].forEach(([lx,ly])=>{const g=ctx.createRadialGradient(lx,ly,2,lx,ly,260);g.addColorStop(0,alpha('white',.35*hype));g.addColorStop(1,alpha('white',0));ctx.fillStyle=g;ctx.fillRect(lx-260,0,520,300);});ctx.restore();
    for(let k=0;k<70;k++){const x=(k*97+now*.05*(k%3+1))%W,y=((k*53)%90)+((now/6+k*17)%120)*hype;ctx.fillStyle=[palette['red'],palette['white'],palette['blue'],palette['gold']][k%4];ctx.globalAlpha=hype;ctx.fillRect(x,y,4,7);}ctx.globalAlpha=1;}
  cartelLed(now,Math.max(4,G.y-46),22);
  return true;}
function sprite(im:CanvasImageSource,cx:number,pie:number,alto:number,ancho:number,espejo=false,giro=0){ctx.save();ctx.translate(cx,pie-alto/2);if(giro)ctx.rotate(giro);if(espejo)ctx.scale(-1,1);ctx.drawImage(im,-ancho/2,-alto/2,ancho,alto);ctx.restore();}
function sombra(cx:number,y:number,r:number){ctx.fillStyle=alpha('black',.3);ctx.beginPath();ctx.ellipse(cx,y,r,r*.2,0,0,7);ctx.fill();}
function drawKeeper(now:number){
  const k=S.keeper,piso=G.y+G.h+6,dx=k.x-400,arriba=Math.min(0,k.y-278),res=S.phase==='result'?S.outcome:undefined;
  const listo=imagen(ARQUERO.listo);if(!listo){drawKeeperVector(now);return;}
  const idle=(S.phase==='aim'||S.phase==='power')&&!reduce?Math.sin(now/(S.knew?420:200))*(S.knew?6:16):0;
  // La estirada se centra en el cuerpo del arquero y nunca se sale del arco (ni por arriba del travesaño ni bajo el césped).
  const volar=(es:CanvasImageSource,sinGiro=false)=>{const alto=200,cy=Math.max(G.y+alto*.32,Math.min(piso-alto*.28,k.y)),giro=sinGiro?0:Math.max(-.5,Math.min(.25,arriba/220))*Math.sign(dx);sombra(k.x,piso,70*k.stretch+30);sprite(es,k.x+Math.sign(dx)*20,cy+alto/2,alto,alto,dx<0,giro);};
  if(res==='save'){const t=S.banner?now-S.banner.t:1e9,es=imagen(ARQUERO.estirada);if(t<380&&es&&Math.abs(dx)>24){volar(es);return;}const at=imagen(ARQUERO.atajada)??listo;const bote=reduce?0:Math.abs(Math.sin(now/120))*10*(S.banner?Math.max(0,1-(now-S.banner.t)/1400):0);sombra(k.x,piso,48);sprite(at,k.x,piso-bote,190,190);return;}
  if(res&&Math.abs(dx)>40){const ve=imagen(ARQUERO.vencido)??listo;sombra(k.x,piso,52);sprite(ve,k.x,piso+4,160,160,dx<0);return;}
  if(S.phase==='shot'&&k.stretch>.18&&Math.abs(dx)>24){const es=imagen(ARQUERO.estiradaSinPelota)??imagen(ARQUERO.estirada);if(es){volar(es);return;}}
  sombra(k.x+idle,piso,46);sprite(listo,k.x+idle,piso+arriba,180,180);
}
function drawShooter(now:number){const kit=S.kit??KIT_INICIAL,kick=S.phase==='shot'||S.phase==='result';
  const im=pateadorPintado(kit,kick?'patea':'listo')??(kick?pateadorPintado(kit,'listo'):null);if(!im){drawShooterVector(now);return;}
  // Los dibujos vienen recortados al cuerpo: la misma escala para todas las poses, con los pies en el piso.
  const alto=im.height*.27,ancho=im.width*.27,sway=reduce||kick?0:Math.sin(now/400)*1.5;
  sombra(kick?372:330,H-6,56);sprite(im,(kick?372:330)+sway,H+10,alto,ancho);}
function drawBall(){const b=S.ball;if(S.phase==='result'&&S.outcome==='save'&&imagen(ARQUERO.atajada))return;
  const pel=imagen(PELOTA);ctx.fillStyle=alpha('black', .25);ctx.beginPath();ctx.ellipse(b.x,Math.max(b.y+b.r,G.y+G.h-10)+4,b.r,b.r*.35,0,0,7);ctx.fill();
  if(pel){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(reduce?0:b.y/25);ctx.drawImage(pel,-b.r*1.1,-b.r*1.1,b.r*2.2,b.r*2.2);ctx.restore();return;}
  ctx.fillStyle=palette['white'];ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.save();ctx.translate(b.x,b.y);ctx.rotate(reduce?0:b.y/25);ctx.fillStyle=palette['kit-dark'];ctx.beginPath();for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.lineTo(Math.cos(a)*b.r*.42,Math.sin(a)*b.r*.42);}ctx.fill();ctx.restore();}
function draw(now: number){
  if(capa3d)ctx.clearRect(0,0,W,H);else{if(!fondoIlustrado(now))fondoVector(now);
  if(!estadioListo()||(S.net&&now-S.net.t<900))drawNet(now);}
  // target hint: corners glow
  if(S.phase==='aim'&&!capa3d){ctx.fillStyle=alpha('gold', .12);[[G.x,G.y],[G.x+G.w-110,G.y]].forEach(([x,y])=>{ctx.beginPath();ctx.roundRect(x+POST,y+POST,110-POST,70,10);ctx.fill();});}
  const sh=S.shake?Math.max(0,1-(now-S.shake)/500):0;if(!capa3d&&(!estadioListo()||sh>0)){ctx.save();if(sh&&!reduce)ctx.translate(Math.sin(now/18)*5*sh,0);ctx.strokeStyle=palette['white'];ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(G.x,G.y+G.h);ctx.lineTo(G.x,G.y);ctx.lineTo(G.x+G.w,G.y);ctx.lineTo(G.x+G.w,G.y+G.h);ctx.stroke();ctx.restore();}
  if(!capa3d)drawKeeper(now);
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
  if(!capa3d)drawBall();
  // Generic striped shirt: no crest, sponsor or team identifier.
  drawShooter(now);
  if(S.banner){const q=(now-S.banner.t)/1400;if(q>1)S.banner=null;else{const s=reduce?1:Math.min(1,q*5)*(1+.08*Math.sin(q*20));ctx.save();ctx.translate(400,300);ctx.scale(s,s);ctx.globalAlpha=q>.8?(1-q)/.2:1;ctx.font='800 54px sans-serif';ctx.textAlign='center';ctx.lineWidth=10;ctx.strokeStyle=palette['black'];ctx.strokeText(S.banner.txt,0,20,720);ctx.fillStyle=S.banner.c;ctx.fillText(S.banner.txt,0,20,720);ctx.restore();}}
  }

/** Mientras bajan las ilustraciones: estadio de noche con reflectores, sin mostrar el dibujo viejo. */
function cargando(now:number){ctx.fillStyle=palette['night'];ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalCompositeOperation='lighter';[[110,26],[690,26]].forEach(([lx,ly])=>{const g=ctx.createRadialGradient(lx,ly,2,lx,ly,300);g.addColorStop(0,alpha('white',.22));g.addColorStop(1,alpha('white',0));ctx.fillStyle=g;ctx.fillRect(lx-300,0,600,340);});ctx.restore();
  const gr=ctx.createLinearGradient(0,H*.62,0,H);gr.addColorStop(0,alpha('grass',.0));gr.addColorStop(1,alpha('grass',.55));ctx.fillStyle=gr;ctx.fillRect(0,H*.62,W,H*.38);
  ctx.fillStyle=palette['white'];ctx.font='800 34px sans-serif';ctx.textAlign='center';ctx.fillText('Preparando el estadio…',400,H/2-6);
  for(let i=0;i<3;i++){const on=reduce?1:(Math.floor(now/260)%3===i?1:.35);ctx.globalAlpha=on;ctx.fillStyle=[palette['red'],palette['white'],palette['blue']][i];ctx.beginPath();ctx.arc(370+i*30,H/2+36,9,0,7);ctx.fill();}ctx.globalAlpha=1;}

// También espera al pateador con su camiseta pintada, así nunca asoma el dibujo viejo.
const est=estadoEstadio(),pintado=!!pateadorPintado(S.kit??KIT_INICIAL,'listo');
if(!capa3d&&(est==='cargando'||(est==='listo'&&!pintado&&!S.spectator&&S.phase!=='shot'&&S.phase!=='result'&&!pintadoTarde())))cargando(now);else draw(now);
}
