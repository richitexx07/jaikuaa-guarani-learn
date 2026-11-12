import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePM } from '@/lib/i18n-penales-modos';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, UserRound, UsersRound, RotateCcw, Wifi, Trophy, Hand, ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowDownLeft, ArrowDown, ArrowDownRight } from 'lucide-react';
import { FinalDia, TarjetaPenalDia, useResultadoDia } from '@/components/games/penalties/penal-dia';
import { CopaFlow } from '@/components/games/penalties/copa-flow';
import { Atajar } from '@/components/games/penalties/atajar';
import { guardarResultadoDia, leerResultadoDia, palabrasDelDia, semillaDelDia } from '@/lib/penal-dia';
import { hoyPy } from '@/lib/meta-diaria';
import { relatarGol } from '@/lib/relato-gol';
import { PenalesLive } from '@/components/games/penalties/live-penales';
import { nuevoCodigoSala, ponerSalaEnLaUrl, salaDeLaUrl } from '@/lib/use-sala';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeakerButton } from '@/components/audio/speaker-button';
import { LessonFilter, NotEnough, useGameWords } from '@/components/games/game-shell';
import { GameStage } from '@/components/games/game-stage';
import { PenaltyPitch } from '@/components/games/penalties/pitch';
import { GameMascot as PenaltyMascot } from '@/components/games/game-mascot';
import { useGameKit } from '@/components/games/game-kit';
import { duelFinished, isGoal, KEEPER_DIVES, ladoDe, xpFor, type Dive, type Outcome } from '@/components/games/penalties/physics';
import { getPenaltiesLed } from '@/lib/penalties.functions';
import { playGuarani } from '@/lib/audio';
import { recordCompletion } from '@/lib/gamification';
import { celebrate } from '@/lib/confetti';
import type { GameWord } from '@/lib/games.functions';
import { usePT } from '@/lib/i18n-penales';
import { DemoBrandPanel } from '@/components/games/demo-brand-panel';
import { demoLedText, useDemoBrands } from '@/lib/demo-brand';
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from '@/components/games/reto';
import { leccionDeReto, orderedBy, shufflerFor } from '@/lib/reto';
import { PauseButton, RefereeMenu, useEndTitle, type DuelEnd } from '@/components/games/duel-referee';
import { useIsGuest } from '@/lib/guest';
import { ElegirCamiseta } from '@/components/games/penalties/elegir-camiseta';
import { PAISES, nombrePais, useMiKit, type Kit, type Pais } from '@/components/games/penalties/camisetas';
import { useAppLang } from '@/lib/i18n';

export const Route=createFileRoute('/_authenticated/juegos/penales')({
 head:()=>({meta:[{title:'Penales: Solo y Duelo | Jaikuaa'},{name:'description',content:'Palabras, estadio y una tanda de penales. Jugá solo o compartí un duelo en el mismo celular.'},{property:'og:title',content:'Penales: Solo y Duelo | Jaikuaa'},{property:'og:description',content:'Una tanda de penales con vocabulario publicado y audio de voces reales.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Penalties,
});
/* Noche de estadio: cielo azul profundo, césped, reflectores y marcador de luces. */
const P={noche:'#071A33',cesped:'#0F5A36',led:'#FFB23E',gol:'#3BE38A',mal:'#FF5A4E',blanco:'#F4F7FB'};
const CSS=`
.pn-lights span{animation:pn-blink 2.2s ease-in-out infinite}.pn-lights span:nth-child(2n){animation-delay:1.1s}
@keyframes pn-blink{50%{opacity:.45}}
.pn-led{font-variant-numeric:tabular-nums;text-shadow:0 0 10px currentColor}
.pn-dark label{color:rgba(255,255,255,.8)}.pn-dark select{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.25)}.pn-dark select option{color:#000}
.pn-opt{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}
.pn-opt:not(:disabled):hover{box-shadow:inset 0 0 0 2px ${P.led}}
@media (prefers-reduced-motion: reduce){.pn-lights span{animation:none}}
`;
function Penalties(){return <GameStage title="Penales" sponsorSlot="penales" css={CSS} background={`radial-gradient(70% 35% at 15% 0%, rgba(255,247,214,.18), transparent 70%), radial-gradient(70% 35% at 85% 0%, rgba(255,247,214,.18), transparent 70%), linear-gradient(180deg, #0B2A52 0%, ${P.noche} 45%, #06281A 100%)`}><PenaltiesContent/></GameStage>;}
function Reflectores(){return <div className="pn-lights flex justify-between px-2" aria-hidden>{[0,1].map(g=><div key={g} className="grid grid-cols-4 gap-1 rounded-md bg-black/40 p-1.5">{Array.from({length:8},(_,i)=><span key={i} className="h-2.5 w-2.5 rounded-full" style={{background:'#FFF7D6',boxShadow:'0 0 10px #FFF7D6'}}/>)}</div>)}</div>;}
type Especial='dia'|'copa'|'atajar';
function especialDeLaUrl():Especial|null{if(typeof window==='undefined')return null;const q=new URLSearchParams(window.location.search);return q.get('dia')?'dia':q.get('copa')?'copa':q.get('atajar')?'atajar':null;}
function sinDuplicados(ws:GameWord[]){const seen=new Set<string>();return ws.filter(w=>{const key=w.es.trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});}
function PenaltiesContent(){
 const {muted}=useGameKit();const {p}=usePT();const pm=usePM();
 const [especial,setEspecial]=useState<Especial|null>(null),[vuelta,setVuelta]=useState(0),[resDia,setResDia]=useResultadoDia();
 useEffect(()=>{const e=especialDeLaUrl();if(e)setEspecial(e);},[]);
 const qAll=useGameWords(null),wordsAll=useMemo(()=>sinDuplicados(qAll.data?.words??[]),[qAll.data]);
 const hoy=hoyPy(),mazoDia=useMemo(()=>palabrasDelDia(wordsAll,hoy),[wordsAll,hoy]);
 const partida=useRetoPartida('penales',{total:5}),{reto,seed,otra}=partida;
 const [lesson,setLesson]=useState<number|null>(()=>leccionDeReto(reto)),q=useGameWords(lesson);
 useEffect(()=>{if(reto)setLesson(leccionDeReto(reto));},[reto?.id]);// eslint-disable-line react-hooks/exhaustive-deps
 const guest=useIsGuest(),fn=useServerFn(getPenaltiesLed),led=useQuery({queryKey:['penales-led'],enabled:!guest,queryFn:()=>fn()});
 const demo=useDemoBrands(),ledText=demo.length?demoLedText(demo):(led.data?.text??'JAIKUAA · TU MARCA AQUÍ');
 const [remote,setRemote]=useState<{code:string;host:boolean}|null>(()=>{const c=salaDeLaUrl();return c?{code:c,host:false}:null;}),[joinCode,setJoinCode]=useState('');
 const [miKit]=useMiKit(),lang=useAppLang(),[paisesDuelo,setPaisesDuelo]=useState<[Pais,Pais]>(['PY','PY']);
 const [mode,setMode]=useState<'solo'|'duel'|'remote'>('solo'),[names,setNames]=useState<[string,string]>(['','']),[started,setStarted]=useState(false),[round,setRound]=useState(0);
 const words=useMemo(()=>sinDuplicados(q.data?.words??[]),[q.data]);
 const salir=()=>{const r=leerResultadoDia();if(r)setResDia(r);setEspecial(null);setStarted(false);};
 const partidoBase={partida,lesson:null,duel:false,names:[p('player',{n:1}),p('player',{n:2})] as [string,string],kits:[miKit],ledText,muted,onAgain:()=>{},onModes:salir};
 return <div className="penalties-game mx-auto max-w-xl">
 <Reflectores/><div className={`pn-dark mt-3 flex-wrap items-center justify-center gap-2 ${remote||especial?'hidden':'flex'}`}><LessonFilter value={lesson} onChange={v=>{otra();setLesson(v);setStarted(false);setRound(r=>r+1);}}/></div>
 {!remote&&!especial&&<RetoBanner partida={partida} extra={lesson===null?undefined:String(lesson)} className="mt-3" onJugar={started?undefined:()=>{setMode('solo');setStarted(true);window.scrollTo({top:0,behavior:'smooth'});}}/>}
 <DemoBrandPanel/>
 {especial&&!remote?(qAll.isLoading?<div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>:wordsAll.length<5?<NotEnough min={5}/>:especial==='dia'?(resDia?<div className="space-y-3 py-4"><TarjetaPenalDia resultado={resDia} onJugar={()=>{}}/><div className="text-center"><button type="button" className="h-11 rounded-2xl px-4 text-sm font-semibold text-white/80" onClick={salir}>{pm('volverModos')}</button></div></div>:<Match key={`dia-${hoy}`} {...partidoBase} seed={semillaDelDia(hoy)} words={wordsAll} mazo={mazoDia} etiqueta={pm('diaTitulo')} final={({outcomes})=><FinalDia outcomes={outcomes} onGuardar={guardarResultadoDia} onModes={salir}/>}/>):especial==='copa'?<CopaFlow onSalir={salir} jugar={o=><Match key={o.key} {...partidoBase} seed={o.seed} words={wordsAll} total={o.total} etiqueta={o.etiqueta} final={o.final}/>}/>:<Atajar key={vuelta} words={wordsAll} seed={(seed+vuelta*101)>>>0} muted={muted} ledText={ledText} onModes={salir} onAgain={()=>setVuelta(v=>v+1)}/>)
 :remote?<div className="pt-4"><PenalesLive key={remote.code} code={remote.code} host={remote.host} words={words} ledText={ledText} muted={muted} onExit={()=>{setRemote(null);ponerSalaEnLaUrl(null);setStarted(false);}}/></div>:q.isLoading?<div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>:q.isError?<p className="py-8 text-center">{p('loadErr')}</p>:words.length<5?<NotEnough min={5}/>:!started?<div className="space-y-5 py-5">
 <div className="text-center"><h1 className="font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl">{p('title')}</h1><p className="mt-2 text-white/75">{p('tagline')}</p></div>
 <button type="button" data-en-vivo onClick={()=>{const c=nuevoCodigoSala();ponerSalaEnLaUrl(c);setRemote({code:c,host:true});}} className="flex w-full items-center gap-3 rounded-2xl tap-3d-dark p-4 text-left shadow-lg transition active:scale-[.98]" style={{background:P.led,color:P.noche}}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{background:P.noche,color:P.led}} aria-hidden><Wifi className="h-6 w-6"/></span><span className="min-w-0 flex-1"><b className="block font-display text-xl leading-tight">En vivo con un amigo</b><span className="block text-sm font-semibold opacity-80">Uno chuta y el otro ataja, cada uno en su celular. Creá la sala y mandale el enlace.</span></span></button>
 <TarjetaPenalDia resultado={resDia} onJugar={()=>setEspecial('dia')}/>
 <PenaltyPitch knew={false} ready={false} muted={muted} ledText={ledText} onShot={()=>{}}/>
 <div className="grid grid-cols-3 gap-2" role="group" aria-label={p('modeGroup')}>{([['solo',UserRound,p('solo'),p('soloD')],['duel',UsersRound,p('duel'),p('duelD')],['remote',Wifi,p('remote'),p('remoteD')]] as const).map(([m,Icon,t,d])=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>setMode(m)} className="flex flex-col items-center gap-1 rounded-2xl tap-3d-dark p-3 text-center transition active:scale-95" style={{background:mode===m?P.blanco:'rgba(255,255,255,.08)',color:mode===m?P.noche:'#fff',boxShadow:mode===m?`0 0 0 3px ${P.led}`:'inset 0 0 0 2px rgba(255,255,255,.18)'}}><Icon className="h-6 w-6"/><b className="font-display text-lg">{t}</b><span className="text-xs opacity-75">{d}</span></button>)}</div>
 <div className="grid grid-cols-2 gap-2">{([['copa',Trophy,pm('copa'),pm('copaD')],['atajar',Hand,pm('atajar'),pm('atajarD')]] as const).map(([m,Icon,t,d])=><button key={m} type="button" onClick={()=>setEspecial(m)} className="flex items-center gap-3 rounded-2xl tap-3d-dark p-3 text-left transition active:scale-95" style={{background:'linear-gradient(135deg,rgba(255,178,62,.22),rgba(255,255,255,.06))',boxShadow:'inset 0 0 0 2px rgba(255,178,62,.55)'}}><Icon className="h-7 w-7 shrink-0" style={{color:P.led}} aria-hidden/><span className="min-w-0"><b className="block font-display text-lg leading-tight">{t}</b><span className="block text-xs opacity-75">{d}</span></span></button>)}</div>
 {mode==='duel'&&<div className="grid gap-3 sm:grid-cols-2 [&_input]:border-white/25 [&_input]:bg-white/10 [&_input]:text-white">{[0,1].map(i=><label key={i} className="text-sm font-semibold">{p('player',{n:i+1})}<Input aria-label={p('playerName',{n:i+1})} placeholder={p('player',{n:i+1})} maxLength={20} value={names[i]} onChange={e=>setNames(old=>i===0?[e.target.value,old[1]]:[old[0],e.target.value])} className="mt-2"/><select aria-label={`${p('kitCountry')} · ${p('player',{n:i+1})}`} value={paisesDuelo[i]} onChange={e=>{const v=e.target.value as Pais;setPaisesDuelo(old=>i===0?[v,old[1]]:[old[0],v]);}} className="mt-2 h-11 w-full rounded-md border px-2 text-base">{PAISES.map(x=><option key={x} value={x}>{nombrePais(x,lang)}</option>)}</select></label>)}</div>}
 {mode!=='duel'&&<ElegirCamiseta/>}
 {mode==='remote'&&<div className="rounded-2xl bg-white/[.06] p-3 text-sm text-white/80 ring-1 ring-white/15"><p>{p('remoteInfo')}</p><div className="mt-2 flex gap-2 [&_input]:border-white/25 [&_input]:bg-white/10 [&_input]:text-white"><Input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))} placeholder={p('haveCode')} aria-label={p('roomCode')} className={`h-11 text-center ${joinCode?'font-display text-lg tracking-[0.3em]':''}`}/><button type="button" disabled={joinCode.length!==4} onClick={()=>{ponerSalaEnLaUrl(joinCode);setRemote({code:joinCode,host:false});}} className="h-11 shrink-0 rounded-xl px-4 font-bold ring-1 ring-white/30 disabled:opacity-40">{p('join')}</button></div></div>}
 <button type="button" className="h-16 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg transition active:scale-[.98]" style={{background:P.led,color:P.noche}} onClick={()=>{if(mode==='remote'){const c=nuevoCodigoSala();ponerSalaEnLaUrl(c);setRemote({code:c,host:true});}else setStarted(true);}}>{mode==='remote'?p('createRoom'):p('start')}</button>
 </div>:<Match key={`${round}:${lesson}:${mode}:${seed}`} seed={seed} partida={partida} lesson={lesson} words={words} duel={mode==='duel'} names={[names[0].trim()||p('player',{n:1}),names[1].trim()||p('player',{n:2})]} kits={mode==='duel'?[{...miKit,especial:undefined,pais:paisesDuelo[0],nombre:names[0].trim().slice(0,12),numero:10},{...miKit,especial:undefined,figura:miKit.figura,pais:paisesDuelo[1],nombre:names[1].trim().slice(0,12),numero:10}]:[miKit]} ledText={ledText} muted={muted} onAgain={()=>{otra();setRound(r=>r+1);}} onModes={()=>setStarted(false)}/>}
 </div>;
}
type Played={word:GameWord;outcome:Outcome;player:number};
/** total: penales de la tanda (5; 1 en el desempate de la copa). mazo: las palabras en orden fijo (penal del día). final: pantalla final propia (día y copa). */
function Match({seed,partida,lesson,words,duel,names,kits,ledText,muted,onAgain,onModes,total=5,mazo,final,etiqueta}:{kits:Kit[];seed:number;partida:Partida;lesson:number|null;words:GameWord[];duel:boolean;names:[string,string];ledText:string;muted:boolean;onAgain:()=>void;onModes:()=>void;total?:number;mazo?:GameWord[];final?:(r:{goals:number;outcomes:Outcome[]})=>ReactNode;etiqueta?:string}){
 const pm=usePM();
 const {p,msg,label}=usePT();
 const deck=useMemo(()=>mazo&&mazo.length?mazo:shufflerFor(seed)(orderedBy(words,w=>w.gn)),[words,seed,mazo]);
 const [turn,setTurn]=useState(0),[choice,setChoice]=useState<string|null>(null),[played,setPlayed]=useState<Played[]>([]),[last,setLast]=useState<Outcome|null>(null),[finished,setFinished]=useState(false),[guess,setGuess]=useState<Dive|null>(null),[menu,setMenu]=useState(false),[end,setEnd]=useState<DuelEnd|null>(null),endTitle=useEndTitle();
 const word=deck[turn%deck.length];
 const options=useMemo(()=>{if(!word)return [];const mezclar=shufflerFor(seed,turn+1);return mezclar([word,...mezclar(orderedBy(words.filter(w=>w.gn!==word.gn),w=>w.gn)).slice(0,2)]);},[word,words,seed,turn]);
 const player=duel?turn%2:0,results=[played.filter(p=>p.player===0).map(p=>p.outcome),played.filter(p=>p.player===1).map(p=>p.outcome)],goals=results.map(r=>r.filter(isGoal).length),xp=xpFor(results[0]),recorded=useRef(false);
 useEffect(()=>{if(!finished||recorded.current)return;recorded.current=true;recordCompletion({source:'game',sourceRef:'penales',xp});if(duel||goals[0]>=3)celebrate('big');},[finished,xp]);
 if(!word)return null;
 function endBy(e:DuelEnd){setEnd(e);setFinished(true);}
 const champ:0|1=end?.kind==='forfeit'?(end.loser===0?1:0):goals[0]>=goals[1]?0:1;
 const knew=choice===word.gn;
 function answer(gn:string){if(choice!==null)return;setChoice(gn);if(word.hasAudio&&!muted)void playGuarani(word.gn);}
 function next(){const done=duel?duelFinished(results[0],results[1]):played.length>=total;if(done){setFinished(true);return;}setTurn(t=>t+1);setChoice(null);setLast(null);setGuess(null);}
 const sudden=duel&&turn>=10;
 const message=finished?(duel?(end?endTitle(end,champ,''):goals[0]===goals[1]?p('drawMsg'):p('wonMsg',{n:goals[0]>goals[1]?names[0]:names[1]})):p('doneMsg')) :last?msg(last):choice!==null?(knew?p('rightMsg'):p('wrongMsg')):`${duel?names[player]+': ':''}${p('goNext')}`;
 const stars=goals[0]>=5?3:goals[0]>=3?2:goals[0]>=1?1:0;
 return <div className="space-y-4 pt-3">
 {duel&&!finished&&<><RefereeMenu open={menu} onClose={()=>setMenu(false)} onEnd={endBy} colors={['#0E7C86','#B5452B']} ink={P.noche}/><div className="flex justify-end"><PauseButton onClick={()=>setMenu(true)} className="text-white hover:bg-white/10"/></div></>}
 {/* Marcador de luces */}
 <div className="rounded-2xl border-4 bg-black p-3" style={{borderColor:'#1C2B44'}}>
  <div className={`grid gap-3 ${duel?'grid-cols-2':'grid-cols-1'}`}>
  {(duel?[0,1]:[0]).map(i=><div key={i} className="min-w-0 rounded-lg px-2 py-1" style={{background:!finished&&player===i?'rgba(255,178,62,.12)':'transparent'}}>
   <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold uppercase tracking-wide text-white/70">{duel?names[i]:p('yourPens')}</span><strong className="pn-led shrink-0 font-display text-3xl" style={{color:P.led}}>{goals[i]}</strong></div>
   <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label={p('goalsOf',{n:duel?names[i]:p('theRound')})}>
   {Array.from({length:Math.max(5,results[i].length)},(_,n)=>{const r=results[i][n];return <span key={n} className="h-3.5 w-3.5 shrink-0 rounded-full" style={{background:r?(isGoal(r)?P.gol:P.mal):'#2A3448',boxShadow:r?`0 0 8px ${isGoal(r)?P.gol:P.mal}`:'none'}}/>;})}</div>
  </div>)}
  </div>
 </div>
 <PenaltyMascot message={message} mood={finished?(duel||goals[0]>=3?'victory':'success'):last?(isGoal(last)?'success':'error'):choice!==null?(knew?'success':'error'):'idle'}/>
 {finished&&final&&!duel?<div className="space-y-5 text-center">{final({goals:goals[0],outcomes:results[0]})}<ul className="divide-y divide-white/10 rounded-2xl bg-white/[.06] px-3 text-left">{played.map((pl,i)=><li key={i} className="flex items-center gap-2 py-3 text-sm"><span className="h-3 w-3 shrink-0 rounded-full" style={{background:isGoal(pl.outcome)?P.gol:P.mal}} aria-label={isGoal(pl.outcome)?p('goal'):p('missed')}/><div className="min-w-0 flex-1"><span className="font-semibold">{pl.word.gn}</span><span className="text-white/60"> — {pl.word.es}</span></div>{pl.word.hasAudio&&<SpeakerButton gn={pl.word.gn}/>}</li>)}</ul></div>:finished?<div className="space-y-5 text-center"><div className="text-5xl tracking-widest" style={{color:P.led}} aria-label={`${stars} de 3 estrellas`}>{'★'.repeat(stars)}<span className="opacity-25">{'★'.repeat(3-stars)}</span></div>
 <h2 className="font-display text-3xl font-bold">{duel?(end?endTitle(end,champ,''):goals[0]===goals[1]?p('draw'):p('won',{n:goals[0]>goals[1]?names[0]:names[1]})):p('ofFive',{n:goals[0]})}</h2><p className="font-bold" style={{color:P.led}}>+{xp} XP{duel?` · ${p('player',{n:1})}`:''}</p>
 <ul className="divide-y divide-white/10 rounded-2xl bg-white/[.06] px-3 text-left">{played.map((pl,i)=><li key={i} className="flex items-center gap-2 py-3 text-sm"><span className="h-3 w-3 shrink-0 rounded-full" style={{background:isGoal(pl.outcome)?P.gol:P.mal}} aria-label={isGoal(pl.outcome)?p('goal'):p('missed')}/><div className="min-w-0 flex-1">{duel&&<span className="block text-xs text-white/60">{names[pl.player]}</span>}<span className="font-semibold">{pl.word.gn}</span><span className="text-white/60"> — {pl.word.es}</span></div>{pl.word.hasAudio&&<SpeakerButton gn={pl.word.gn}/>}</li>)}</ul>
 <div className="flex flex-wrap justify-center gap-2"><button type="button" onClick={onAgain} className="inline-flex h-12 items-center gap-2 rounded-2xl tap-3d-dark px-6 font-bold" style={{background:P.led,color:P.noche}}><RotateCcw className="h-5 w-5"/>{duel?p('rematch'):p('again')}</button><button type="button" className="h-12 rounded-2xl px-4 font-semibold text-white/80" onClick={onModes}>{p('changeMode')}</button></div>
{!duel&&<RetoFinal partida={partida} puntaje={goals[0]} extra={lesson===null?undefined:String(lesson)}/>}
 </div>:duel&&!guess?<KeeperPick keeper={names[1-player]} shooter={names[player]} onPick={setGuess}/>:<><div className="overflow-hidden rounded-2xl ring-4 ring-black/40"><PenaltyPitch key={turn} kit={kits[player]??kits[0]} guess={duel?guess??undefined:undefined} knew={knew} ready={choice!==null} muted={muted} ledText={ledText} onShot={outcome=>{setLast(outcome);setPlayed(prev=>[...prev,{word,outcome,player}]);if(isGoal(outcome)&&!muted)relatarGol(outcome==='angle'?'golazo':'gol');}}/></div>
 <div className="space-y-3 text-center"><p className="text-xs font-bold uppercase tracking-wide" style={{color:P.led}}>{[etiqueta,sudden?p('sudden',{n:Math.floor((turn-10)/2)+1}):total===1?'':total===5?p('penN',{n:duel?Math.floor(turn/2)+1:turn+1}):pm('penNof',{n:turn+1,t:total})].filter(Boolean).join(' · ')}{duel?` · ${names[player]}`:''}</p><p className="text-sm text-white/70">{p('howSay')}</p><h2 className="break-words font-display text-3xl font-bold">{word.es}</h2><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{options.map(o=>{const ok=choice!==null&&o.gn===word.gn,bad=choice===o.gn&&!ok;return <button key={o.gn} type="button" disabled={choice!==null} onClick={()=>answer(o.gn)} className="pn-opt min-h-14 whitespace-normal break-words rounded-2xl tap-3d-dark px-3 py-3 font-display text-lg font-bold transition active:scale-95 disabled:cursor-default" style={ok?{background:P.gol,color:P.noche,boxShadow:'none'}:bad?{background:P.mal,color:'#fff',boxShadow:'none'}:choice!==null?{opacity:.4}:undefined}>{o.gn}</button>;})}</div>
 {choice!==null&&<div className="flex items-center justify-center gap-2 text-sm"><span>{p('answer')} <strong>{word.gn}</strong></span>{word.hasAudio&&<SpeakerButton gn={word.gn}/>}</div>}
 {choice!==null&&!last&&<p className="text-sm font-semibold" style={{color:P.led}}>{p('aim')}</p>}
 {last&&<><p className="font-display text-2xl font-bold" style={{color:isGoal(last)?P.gol:P.mal}} aria-live="polite">{label(last)}</p><button type="button" className="h-14 w-full rounded-2xl tap-3d-dark font-display text-lg font-bold" style={{background:P.led,color:P.noche}} onClick={next}>{(duel?duelFinished(results[0],results[1]):played.length>=total)?p('result'):p('nextPen')}</button></>}
 </div></>}
 </div>;
}

function KeeperPick({keeper,shooter,onPick}:{keeper:string;shooter:string;onPick:(d:Dive)=>void}){
 const {p}=usePT();
 const icons={ 'left-high':ArrowUpLeft, 'center-high':ArrowUp, 'right-high':ArrowUpRight, left:ArrowDownLeft, center:ArrowDown, right:ArrowDownRight };
 return <section className="penalties-keeper-pick space-y-4 rounded-2xl p-5 text-center" aria-label={p('keeperTurn')}>
  <p className="text-xs font-semibold uppercase tracking-widest">{p('keeperTurn')}</p>
  <h2 className="font-display text-2xl font-bold">{p('keeperPick',{k:keeper})}</h2>
  <p className="text-sm opacity-80">{p('keeperInfo',{s:shooter})}</p>
  <div className="grid grid-cols-3 grid-rows-2 gap-2">{KEEPER_DIVES.map(d=>{const Icon=icons[d],side=p(ladoDe(d)),height=p(d.endsWith('-high')?'high':'low');return <Button key={d} variant="outline" aria-label={`${height} · ${side}`} title={`${height} · ${side}`} className="h-24 min-w-0 flex-col gap-1 whitespace-normal px-1 text-sm font-bold" onClick={()=>{try{navigator.vibrate?.(20);}catch{}onPick(d);}}><Icon className="h-6 w-6 shrink-0" aria-hidden/><span>{side}</span><span className="text-xs font-normal">{height}</span></Button>;})}</div>
  <p className="text-xs opacity-70">{p('passPhone',{s:shooter})}</p>
 </section>;
}
