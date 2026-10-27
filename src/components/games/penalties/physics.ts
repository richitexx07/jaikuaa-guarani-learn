export const W=800,H=600,G={x:150,y:110,w:500,h:230},POST=12,BR=16;
export type Outcome='goal'|'angle'|'save'|'post'|'over'|'wide';
export type Point={x:number;y:number};
export type Scene={phase:'ask'|'aim'|'power'|'shot'|'result'; knew:boolean; spectator?:boolean; aim:Point|null; powerStart:number; ball:Point & {r:number}; keeper:Point & {ang:number;stretch:number}; net:(Point & {t:number})|null; cheer:number; banner:{t:number;txt:string;c:string}|null; shake?:number};
export const labels:Record<Outcome,string>={goal:'¡GOOOL!',angle:'¡GOLAZO AL ÁNGULO!',save:'¡ATAJÓ!',post:'¡PALO!',over:'¡POR ARRIBA!',wide:'¡AFUERA!'};
export function freshScene():Scene {return {phase:'ask',knew:false,aim:{x:400,y:225},powerStart:0,ball:{x:400,y:520,r:BR},keeper:{x:400,y:278,ang:0,stretch:0},net:null,cheer:0,banner:null};}
export function powerZone(knew:boolean):[number,number]{return knew?[.52,.86]:[.62,.8];}
export function powerAt(now:number,start:number,knew:boolean){const t=((now-start)%(knew?1300:850))/(knew?1300:850);return t<.5?t*2:2-t*2;}
export type Dive='left'|'center'|'right';
export function zoneOf(x:number):Dive{return x<G.x+G.w/3?'left':x>G.x+G.w*2/3?'right':'center';}
const DIVE_X:Record<Dive,number>={left:260,center:400,right:540};
/** guess: human keeper's secret dive in Duelo; without it the AI keeper reacts. */
export function resolveShot(aim:Point,p:number,knew:boolean,now:number,reduce=false,guess?:Dive){
 const [lo,hi]=powerZone(knew);const weak=p<lo,over=p>hi;
 const t={x:aim.x+(knew||reduce?0:Math.sin(now/170)*22),y:aim.y+(knew||reduce?0:Math.cos(now/230)*14)};
 if(over)t.y-=(p-hi)*520+30;if(weak)t.y+=18;
 const nearPost=Math.min(Math.abs(t.x-G.x),Math.abs(t.x-(G.x+G.w)))<POST&&t.y>G.y-POST&&t.y<G.y+G.h||(Math.abs(t.y-G.y)<POST&&t.x>G.x-POST&&t.x<G.x+G.w+POST);
 const inside=t.x>G.x+POST&&t.x<G.x+G.w-POST&&t.y>G.y+POST&&t.y<G.y+G.h;
 const T=weak?.95:.55,react=knew?.36:.2,dist=Math.abs(t.x-400),high=t.y<G.y+G.h*.32;
 const reach=70-(high&&dist>150?40:0),travel=Math.max(0,T-react)*480;
 const saved=guess?inside&&zoneOf(t.x)===guess&&!(high&&dist>205):inside&&dist-reach<=travel&&!(high&&dist>205);
 const outcome:Outcome=nearPost?'post':!inside?(over||t.y<G.y?'over':'wide'):saved?'save':high&&dist>150?'angle':'goal';
 return {outcome,end:t,duration:reduce?80:T*1000,react,T,keeper:{x:saved?t.x:guess?DIVE_X[guess]:400+Math.sign(t.x-400||1)*Math.min(dist,travel+reach*.6),y:saved?Math.min(278,t.y+20):Math.max(G.y+60,Math.min(278,t.y+30))}};
}
export function isGoal(o:Outcome){return o==='goal'||o==='angle';}
export function xpFor(results:Outcome[]){return Math.min(20,results.reduce((n,r)=>n+(r==='angle'?6:r==='goal'?4:0),0));}
export function duelFinished(a:Outcome[],b:Outcome[]){if(a.length!==b.length||a.length<5)return false;return a.filter(isGoal).length!==b.filter(isGoal).length||a.length>=8;}

/** Un tiro ya resuelto (para mostrarlo igual en el celular del arquero). */
export type Shot=ReturnType<typeof resolveShot>;
