import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { drawStadium } from './stadium';
import { freshScene, G, H, W, labels, powerAt, resolveShot, type Dive, type Outcome, type Point, type Scene, type Shot } from './physics';
import { StadiumSound } from '../game-sound';
import { celebrate } from '@/lib/confetti';
import { useMiKit, type Kit } from './camisetas';
import type { Cancha3D } from './cancha-3d';

/** Se recuerda entre penales: si el 3D falló una vez en este celular, se queda en el dibujo plano. */
let fallo3D=false;
/** Baja la cancha 3D antes de entrar al juego. */
export function precargarCancha3D(){void import('./cancha-3d').catch(()=>undefined);}

/** watch: modo espectador (el arquero a distancia ve en vivo cómo apunta y patea el otro). onAim/onKick: el que patea avisa lo que hace. */
export function PenaltyPitch({knew,ready,ledText,muted,onShot,guess,watch,onAim,onKick,kit}:{kit?:Kit;knew:boolean;ready:boolean;ledText:string;muted:boolean;onShot:(o:Outcome)=>void;guess?:Dive;watch?:{aim?:Point|null;phase?:'aim'|'power'|null;shot?:Shot|null};onAim?:(p:Point,phase:'aim'|'power')=>void;onKick?:(shot:Shot)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),scene=useRef<Scene>(freshScene()),animation=useRef<((now:number)=>void)|null>(null),sound=useRef(new StadiumSound());
 const callback=useRef(onShot);callback.current=onShot;
 const settings=useRef({ledText,muted});settings.current={ledText,muted};
 const aimCb=useRef(onAim);aimCb.current=onAim;const kickCb=useRef(onKick);kickCb.current=onKick;
 const spectator=!!watch;scene.current.spectator=spectator;
 const [miKit]=useMiKit();scene.current.kit=kit??miKit;
 const lienzo3d=useRef<HTMLCanvasElement>(null),cancha3d=useRef<Cancha3D|null>(null),[en3d,setEn3d]=useState(false),[carga3d,setCarga3d]=useState(!fallo3D);
 // Cancha 3D: se carga aparte; si el celular no puede o tarda más de 8 s, queda el estadio plano de siempre.
 useEffect(()=>{if(fallo3D)return;let vivo=true;const corte=window.setTimeout(()=>{vivo=false;setCarga3d(false);},8000);
  import('./cancha-3d').then(m=>{if(!vivo||!lienzo3d.current||!m.soporta3D()){fallo3D=fallo3D||!m.soporta3D();setCarga3d(false);return;}
   try{const c=m.crearCancha(lienzo3d.current);const r=lienzo3d.current.getBoundingClientRect();c.resize(Math.max(1,r.width),Math.max(1,r.height));cancha3d.current=c;setEn3d(true);setCarga3d(false);}catch{fallo3D=true;setCarga3d(false);}
  }).catch(()=>{fallo3D=true;setCarga3d(false);}).finally(()=>window.clearTimeout(corte));
  const el=lienzo3d.current;const ro=typeof ResizeObserver!=='undefined'&&el?new ResizeObserver(([e])=>cancha3d.current?.resize(Math.max(1,e.contentRect.width),Math.max(1,e.contentRect.height))):null;if(el)ro?.observe(el);
  const perdido=(e:Event)=>{e.preventDefault();fallo3D=true;cancha3d.current=null;setEn3d(false);};el?.addEventListener('webglcontextlost',perdido);
  return()=>{vivo=false;window.clearTimeout(corte);ro?.disconnect();el?.removeEventListener('webglcontextlost',perdido);cancha3d.current?.dispose();cancha3d.current=null;};
 },[]);
 // Espectador: copia lo que hace el que patea.
 useEffect(()=>{if(!watch)return;const s=scene.current;if(s.phase==='shot'||s.phase==='result')return;if(watch.aim)s.aim=watch.aim;if(watch.phase==='power'&&s.phase!=='power'){s.phase='power';s.powerStart=performance.now();}else if(watch.phase==='aim')s.phase='aim';},[watch?.aim?.x,watch?.aim?.y,watch?.phase]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(watch?.shot&&scene.current.phase!=='shot'&&scene.current.phase!=='result')animate(watch.shot,performance.now());},[watch?.shot]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{scene.current.knew=knew;if(ready){scene.current.phase='aim';canvas.current?.focus({preventScroll:true});sound.current.muted=muted;sound.current.play('answer');}},[ready,knew]);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;
  const css=getComputedStyle(el),palette:Record<string,string>={};for(const k of ['night','sky','grass','grass-dark','stripe','white','black','kit-dark','red','blue','gold','green','miss','skin'])palette[k]=css.getPropertyValue(`--stadium-${k}`).trim();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,last=0;
  // El ciclo nunca se corta: si un dibujo falla en algún celular, se sigue con el próximo cuadro (antes, un error dejaba la pelota «disparada» para siempre).
  function tick(now:number){if(!ctx)return;try{animation.current?.(now);}catch{}const c3=cancha3d.current;if(c3)try{c3.render(scene.current,now);}catch{cancha3d.current=null;fallo3D=true;setEn3d(false);}
   try{if(now-last>30||c3){drawStadium(ctx,scene.current,now,settings.current.ledText,reduce,palette,!!cancha3d.current);last=now;}}catch{last=now;}
   // Mientras se apunta, el dedo es para el arco; el resto del tiempo, deslizar sobre la cancha mueve la página.
   const ta=scene.current.phase==='aim'||scene.current.phase==='power'?'none':'pan-y';if(el&&el.style.touchAction!==ta)el.style.touchAction=ta;
   frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);sound.current.dispose();};
 },[]);
 function kick(){
  const s=scene.current;if(s.phase!=='power'||!s.aim)return;
  const now=performance.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shot=resolveShot(s.aim,powerAt(now,s.powerStart,s.knew),s.knew,now,reduce,guess);
  kickCb.current?.(shot);animate(shot,now);
 }
 function animate(shot:Shot,now:number){
  const s=scene.current,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;s.phase='shot';s.objetivo=shot.end;sound.current.muted=settings.current.muted;sound.current.play('kick');
  const dur=shot.duration>0&&Number.isFinite(shot.duration)?shot.duration:900;
  // Respaldo: si el celular frena la animación (ahorro de batería, pestaña en segundo plano), el resultado igual llega.
  const respaldo=window.setTimeout(()=>{if(animation.current===paso)paso(now+dur);},dur+1500);
  const paso=(t:number)=>{
   const r=(t-now)/dur,q=Number.isFinite(r)?Math.max(0,Math.min(1,r)):1,e=1-Math.pow(1-q,2.2);
   s.ball={x:400+(shot.end.x-400)*e,y:520+(shot.end.y-520)*e-Math.sin(q*Math.PI)*50,r:16-6*e};
   const kq=reduce?q:Math.max(0,Math.min(1,((t-now)/1000-shot.react)/Math.max(.05,shot.T-shot.react))),ke=1-Math.pow(1-kq,2);
   s.keeper={x:400+(shot.keeper.x-400)*ke,y:278+(shot.keeper.y-278)*ke,ang:Math.sign(shot.keeper.x-400)*Math.min(1.2,Math.abs(shot.keeper.x-400)/170)*ke,stretch:ke};
   if(q>=1){window.clearTimeout(respaldo);animation.current=null;s.phase='result';s.outcome=shot.outcome;const goal=shot.outcome==='goal'||shot.outcome==='angle';s.banner={t,txt:labels[shot.outcome],c:getComputedStyle(canvas.current??document.documentElement).getPropertyValue(goal?'--stadium-gold':'--stadium-miss')};
    if(goal){s.cheer=t;s.net={...shot.end,t};celebrate(shot.outcome==='angle'?'big':'small');}sound.current.play(goal?'cheer':shot.outcome==='post'?'post':'hit');if(shot.outcome==='post')s.shake=t;
    if(!reduce)try{navigator.vibrate?.(goal?[40,30,60]:30);}catch{}
    callback.current(shot.outcome);
    if(!reduce)repetir(shot);
   }
  };
  animation.current=paso;
 }
 /** Repetición en cámara lenta del gol o la atajada; se corta sola si arranca el próximo penal. */
 function repetir(shot:Shot){
  const s=scene.current,ESPERA=1100,LENTO=2.6,dur=(shot.duration>0&&Number.isFinite(shot.duration)?shot.duration:900)*LENTO;
  window.setTimeout(()=>{
   if(s.phase!=='result'||animation.current)return;
   s.objetivo=shot.end;const t0=performance.now(),fin={...shot.end},kf={...shot.keeper};
   const color=getComputedStyle(canvas.current??document.documentElement).getPropertyValue('--stadium-gold');
   const paso=(t:number)=>{
    if(s.phase!=='result'){animation.current=null;return;}
    const q=Math.max(0,Math.min(1,(t-t0)/dur)),e=1-Math.pow(1-q,2.2),ke=1-Math.pow(1-Math.min(1,q*1.15),2);
    s.ball={x:400+(fin.x-400)*e,y:520+(fin.y-520)*e-Math.sin(q*Math.PI)*50,r:16-6*e};
    s.keeper={x:400+(kf.x-400)*ke,y:278+(kf.y-278)*ke,ang:Math.sign(kf.x-400)*Math.min(1.2,Math.abs(kf.x-400)/170)*ke,stretch:ke};
    if(!s.banner||s.banner.txt!=='REPETICIÓN')s.banner={t,txt:'REPETICIÓN',c:color};
    if(q>=1){animation.current=null;s.banner=null;}
   };
   animation.current=paso;
  },ESPERA);
 }
 function activate(point?:{x:number;y:number}){if(spectator)return;const s=scene.current;if(s.phase==='aim'){const p=point??s.aim;if(!p)return;if(p.x<G.x-40||p.x>G.x+G.w+40||p.y<G.y-40||p.y>G.y+G.h)return;s.aim=p;s.powerStart=performance.now();s.phase='power';aimCb.current?.(p,'power');}else if(s.phase==='power')kick();}
 const lastAimSent=useRef(0);
 function sendAim(p:Point){const n=performance.now();if(n-lastAimSent.current<90)return;lastAimSent.current=n;aimCb.current?.(p,'aim');}
 const dragging=useRef(false);
 function pt(e:PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
 const clamp=(p:{x:number;y:number})=>({x:Math.max(G.x-30,Math.min(G.x+G.w+30,p.x)),y:Math.max(G.y-30,Math.min(G.y+G.h-5,p.y))});
 function down(e:PointerEvent<HTMLCanvasElement>){e.preventDefault();if(spectator)return;const s=scene.current;if(s.phase==='aim'){dragging.current=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}s.aim=clamp(pt(e));sendAim(s.aim);}else activate();}
 function move(e:PointerEvent<HTMLCanvasElement>){if(spectator)return;const s=scene.current;if(s.phase!=='aim')return;if(dragging.current||e.pointerType==='mouse'){s.aim=clamp(pt(e));sendAim(s.aim);}}
 function up(e:PointerEvent<HTMLCanvasElement>){if(!dragging.current)return;dragging.current=false;const s=scene.current;if(s.phase==='aim'){const p=clamp(pt(e));try{navigator.vibrate?.(15);}catch{}activate(p);}}
 function keyboard(e:KeyboardEvent<HTMLCanvasElement>){if(spectator)return;const s=scene.current;const delta:Record<string,[number,number]>={ArrowLeft:[-25,0],ArrowRight:[25,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const d=delta[e.key];if(d&&s.phase==='aim'){e.preventDefault();const p=s.aim??{x:400,y:225};s.aim={x:Math.max(120,Math.min(680,p.x+d[0])),y:Math.max(80,Math.min(330,p.y+d[1]))};sendAim(s.aim);}if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}}
 return <div className="relative mx-auto aspect-[4/3] w-full max-h-[42vh] max-w-[56vh] overflow-hidden rounded-lg" data-scene-ready={en3d?"3d":"2d"}><canvas ref={lienzo3d} aria-hidden className={`absolute inset-0 h-full w-full ${en3d?"":"invisible"}`}/><canvas ref={canvas} width={W} height={H} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{dragging.current=false;}} onKeyDown={keyboard} className="relative block h-full w-full focus-visible:outline-2 focus-visible:outline-accent" aria-label="Arco: deslizá el dedo para apuntar con la flecha, soltá y tocá otra vez para patear"/><div aria-hidden={!carga3d} role={carga3d?'status':undefined} className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-6 transition-opacity duration-700 ${carga3d?'opacity-100':'opacity-0'}`} style={{background:'radial-gradient(ellipse at 50% 20%, hsl(215 45% 14%) 0%, hsl(220 50% 5%) 75%)'}}><div className="absolute top-3 flex w-full justify-around">{[0,1,2,3].map(i=><span key={i} className="h-2 w-2 rounded-full bg-white/30 motion-safe:animate-pulse" style={{animationDelay:`${i*180}ms`}}/>)}</div><p className="font-display text-sm font-bold uppercase tracking-wide text-white/80">Encendiendo los reflectores…</p></div>{en3d&&<div aria-hidden className="pointer-events-none absolute inset-0 bg-white motion-safe:animate-[jk-flash_.9s_ease-out_forwards] opacity-0"/>}<style>{'@keyframes jk-flash{0%{opacity:.55}100%{opacity:0}}'}</style></div>;
}
