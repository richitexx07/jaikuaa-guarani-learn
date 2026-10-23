import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, UserRound, UsersRound, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpeakerButton } from '@/components/audio/speaker-button';
import { GameShell, LessonFilter, NotEnough, shuffle, useGameWords } from '@/components/games/game-shell';
import { PenaltyPitch } from '@/components/games/penalties/pitch';
import { GameMascot as PenaltyMascot } from '@/components/games/game-mascot';
import { useGameKit } from '@/components/games/game-kit';
import { duelFinished, isGoal, labels, xpFor, type Dive, type Outcome } from '@/components/games/penalties/physics';
import { getPenaltiesLed } from '@/lib/penalties.functions';
import { playGuarani } from '@/lib/audio';
import { recordCompletion } from '@/lib/gamification';
import { celebrate } from '@/lib/confetti';
import type { GameWord } from '@/lib/games.functions';
import { DemoBrandPanel } from '@/components/games/demo-brand-panel';
import { demoLedText, useDemoBrand } from '@/lib/demo-brand';

export const Route=createFileRoute('/_authenticated/juegos/penales')({
 head:()=>({meta:[{title:'Penales: Solo y Duelo | Jaikuaa'},{name:'description',content:'Palabras, estadio y una tanda de penales. Jugá solo o compartí un duelo en el mismo celular.'},{property:'og:title',content:'Penales: Solo y Duelo | Jaikuaa'},{property:'og:description',content:'Una tanda de penales con vocabulario publicado y audio de voces reales.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Penalties,
});
function Penalties(){return <GameShell title="Penales" emoji="⚽" sponsorSlot="penales"><PenaltiesContent/></GameShell>;}
function PenaltiesContent(){
 const {muted}=useGameKit();
 const [lesson,setLesson]=useState<number|null>(null),q=useGameWords(lesson);
 const fn=useServerFn(getPenaltiesLed),led=useQuery({queryKey:['penales-led'],queryFn:()=>fn()});
 const demo=useDemoBrand(),ledText=demo?demoLedText(demo):(led.data?.text??'JAIKUAA · TU MARCA AQUÍ');
 const [mode,setMode]=useState<'solo'|'duel'>('solo'),[names,setNames]=useState<[string,string]>(['','']),[started,setStarted]=useState(false),[round,setRound]=useState(0);
 const words=useMemo(()=>{const seen=new Set<string>();return (q.data?.words??[]).filter(w=>{const key=w.es.trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});},[q.data]);
 return <div className="penalties-game mx-auto max-w-xl">
 <div className="flex flex-wrap items-center justify-center gap-2"><LessonFilter value={lesson} onChange={v=>{setLesson(v);setStarted(false);setRound(r=>r+1);}}/></div>
 <DemoBrandPanel/>
 {q.isLoading?<div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>:q.isError?<p className="py-8 text-center">No se pudieron cargar las palabras. Volvé a intentar.</p>:words.length<5?<NotEnough min={5}/>:!started?<div className="space-y-5 py-6">
 <PenaltyMascot message="¡El estadio está listo! Hoy jugamos con palabras y puntería."/>
 <PenaltyPitch knew={false} ready={false} muted={muted} ledText={ledText} onShot={()=>{}}/>
 <div className="grid grid-cols-2 gap-3" role="group" aria-label="Modo de juego"><Button variant={mode==='solo'?'default':'outline'} className="h-12" aria-pressed={mode==='solo'} onClick={()=>setMode('solo')}><UserRound/>Solo</Button><Button variant={mode==='duel'?'default':'outline'} className="h-12" aria-pressed={mode==='duel'} onClick={()=>setMode('duel')}><UsersRound/>Duelo</Button></div>
 {mode==='duel'&&<div className="grid gap-3 sm:grid-cols-2">{[0,1].map(i=><label key={i} className="text-sm font-semibold">Jugador {i+1}<Input aria-label={`Nombre del Jugador ${i+1}`} placeholder={`Jugador ${i+1}`} maxLength={20} value={names[i]} onChange={e=>setNames(old=>i===0?[e.target.value,old[1]]:[old[0],e.target.value])} className="mt-2"/></label>)}</div>}
 <Button variant="cta" size="lg" className="w-full" onClick={()=>setStarted(true)}>Empezar tanda</Button>
 <Button asChild variant="outline" size="lg" className="mt-3 h-12 w-full"><Link to="/juegos/nee-rape" search={{ sala: undefined, sendero: "nemongeta" }}>📲 Jugar a distancia (cada uno en su celular)</Link></Button>
 </div>:<Match key={`${round}:${lesson}:${mode}`} words={words} duel={mode==='duel'} names={[names[0].trim()||'Jugador 1',names[1].trim()||'Jugador 2']} ledText={ledText} muted={muted} onAgain={()=>setRound(r=>r+1)} onModes={()=>setStarted(false)}/>}
 </div>;
}
type Played={word:GameWord;outcome:Outcome;player:number};
const messages:Record<Outcome,string>={goal:'¡Gran gol! El público lo festeja con vos.',angle:'¡Al ángulo! Una definición espectacular.',save:'El arquero llegó. La próxima buscá el rincón.',post:'¡Por centímetros! La pelota dio en el palo.',over:'Se fue por arriba. Un poquito menos de fuerza.',wide:'Se fue afuera. La revancha está cerca.'};
function Match({words,duel,names,ledText,muted,onAgain,onModes}:{words:GameWord[];duel:boolean;names:[string,string];ledText:string;muted:boolean;onAgain:()=>void;onModes:()=>void}){
 const deck=useMemo(()=>shuffle(words),[words]);
 const [turn,setTurn]=useState(0),[choice,setChoice]=useState<string|null>(null),[played,setPlayed]=useState<Played[]>([]),[last,setLast]=useState<Outcome|null>(null),[finished,setFinished]=useState(false),[guess,setGuess]=useState<Dive|null>(null);
 const word=deck[turn%deck.length];
 const options=useMemo(()=>word?shuffle([word,...shuffle(words.filter(w=>w.gn!==word.gn)).slice(0,2)]):[],[word,words]);
 const player=duel?turn%2:0,results=[played.filter(p=>p.player===0).map(p=>p.outcome),played.filter(p=>p.player===1).map(p=>p.outcome)],goals=results.map(r=>r.filter(isGoal).length),xp=xpFor(results[0]),recorded=useRef(false);
 useEffect(()=>{if(!finished||recorded.current)return;recorded.current=true;recordCompletion({source:'game',sourceRef:'penales',xp});if(duel||goals[0]>=3)celebrate('big');},[finished,xp]);
 if(!word)return null;
 const knew=choice===word.gn;
 function answer(gn:string){if(choice!==null)return;setChoice(gn);if(word.hasAudio&&!muted)void playGuarani(word.gn);}
 function next(){const done=duel?duelFinished(results[0],results[1]):played.length>=5;if(done){setFinished(true);return;}setTurn(t=>t+1);setChoice(null);setLast(null);setGuess(null);}
 const sudden=duel&&turn>=10;
 const message=finished?(duel?(goals[0]===goals[1]?'¡Empate! Un duelo muy parejo.':`¡${goals[0]>goals[1]?names[0]:names[1]} ganó el duelo!`):'¡Tanda completa! Cada palabra suma práctica.') :last?messages[last]:choice!==null?(knew?'¡Respuesta correcta! El arquero reacciona tarde.':'Esta vez no. El arquero está atento, pero todavía podés marcar.'):`${duel?names[player]+': ':''}¡Vamos por el próximo penal!`;
 return <div className="space-y-4 pt-4"><div className={`grid gap-3 ${duel?'grid-cols-2':'grid-cols-1'}`}>
 {(duel?[0,1]:[0]).map(i=><div key={i} className={`min-w-0 border-b-2 py-2 ${!finished&&player===i?'border-accent':'border-border'}`}><div className="flex items-center justify-between gap-2"><span className="break-words text-sm font-semibold">{duel?names[i]:'Tus penales'}</span><strong className="shrink-0 font-display text-2xl">{goals[i]}/{Math.max(5,results[i].length)}</strong></div><div className="mt-2 flex gap-1" aria-label={`Goles de ${duel?names[i]:'la tanda'}`}>
 {Array.from({length:Math.max(5,results[i].length)},(_,n)=><span key={n} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${results[i][n]?(isGoal(results[i][n])?'bg-primary text-primary-foreground':'bg-accent text-accent-foreground'):'border-border bg-muted'}`}>{results[i][n]?(isGoal(results[i][n])?'●':'×'):''}</span>)}</div></div>)}
 </div><PenaltyMascot message={message}/>
 {finished?<div className="space-y-5 text-center"><div className="penalties-stars text-4xl" aria-label={`${goals[0]>=5?3:goals[0]>=3?2:goals[0]>=1?1:0} de 3 estrellas`}>{'★'.repeat(goals[0]>=5?3:goals[0]>=3?2:goals[0]>=1?1:0)}{'☆'.repeat(goals[0]>=5?0:goals[0]>=3?1:goals[0]>=1?2:3)}</div>
 <h2 className="font-display text-2xl font-bold">{duel?(goals[0]===goals[1]?'Empate':`Ganó ${goals[0]>goals[1]?names[0]:names[1]}`):`${goals[0]} de 5 goles`}</h2><p className="font-semibold text-accent">+{xp} XP{duel?' · Jugador 1':''}</p>
 <ul className="divide-y divide-border text-left">{played.map((p,i)=><li key={i} className="flex items-center gap-2 py-3 text-sm"><span aria-hidden>{isGoal(p.outcome)?'⚽':'•'}</span><div className="min-w-0 flex-1">{duel&&<span className="block text-xs text-muted-foreground">{names[p.player]}</span>}<span className="font-semibold">{p.word.gn}</span><span className="text-muted-foreground"> — {p.word.es}</span></div>{p.word.hasAudio&&<SpeakerButton gn={p.word.gn}/>}</li>)}</ul>
 <div className="flex flex-wrap justify-center gap-2"><Button variant="cta" onClick={onAgain}><RotateCcw/>{duel?'Revancha':'Otra tanda'}</Button><Button variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(`Hice ${goals[0]} goles en una tanda de penales. ¿Te animás a superarme? ${typeof window!=='undefined'?window.location.origin:''}/juegos/penales`)}`} target="_blank" rel="noopener noreferrer"><Share2/>Desafiar por WhatsApp</a></Button><Button variant="ghost" onClick={onModes}>Cambiar modo</Button></div>
 </div>:duel&&!guess?<KeeperPick keeper={names[1-player]} shooter={names[player]} onPick={setGuess}/>:<><PenaltyPitch key={turn} guess={duel?guess??undefined:undefined} knew={knew} ready={choice!==null} muted={muted} ledText={ledText} onShot={outcome=>{setLast(outcome);setPlayed(p=>[...p,{word,outcome,player}]);}}/>
 <div className="space-y-3 text-center"><p className="text-xs font-semibold text-muted-foreground">{sudden?`Muerte súbita · ronda ${Math.floor((turn-10)/2)+1} de 3`:`Penal ${duel?Math.floor(turn/2)+1:turn+1} de 5`}{duel?` · ${names[player]}`:''}</p><p className="text-sm text-muted-foreground">¿Cómo se dice en guaraní?</p><h2 className="break-words font-display text-2xl font-bold">{word.es}</h2><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{options.map(o=><Button key={o.gn} variant={choice!==null&&o.gn===word.gn?'default':choice===o.gn?'destructive':'outline'} disabled={choice!==null} onClick={()=>answer(o.gn)} className="h-auto min-h-12 whitespace-normal break-words px-3 py-3 text-base">{o.gn}</Button>)}</div>
 {choice!==null&&<div className="flex items-center justify-center gap-2 text-sm"><span>Respuesta: <strong>{word.gn}</strong></span>{word.hasAudio&&<SpeakerButton gn={word.gn}/>}</div>}
 {last&&<><p className="font-display text-xl font-bold" aria-live="polite">{labels[last]}</p><Button variant="cta" onClick={next}>{(duel?duelFinished(results[0],results[1]):played.length>=5)?'Ver resultado':'Siguiente penal'}</Button></>}
 </div></>}
 </div>;
}

function KeeperPick({keeper,shooter,onPick}:{keeper:string;shooter:string;onPick:(d:Dive)=>void}){
 const opts:[Dive,string,string][]=[['left','⬅','Izquierda'],['center','⬆','Centro'],['right','➡','Derecha']];
 return <section className="penalties-keeper-pick space-y-4 rounded-2xl p-5 text-center" aria-label="Turno del arquero">
  <p className="text-xs font-semibold uppercase tracking-widest">🧤 Turno del arquero</p>
  <h2 className="font-display text-2xl font-bold">{keeper}, elegí en secreto hacia dónde te tirás</h2>
  <p className="text-sm opacity-80">Que {shooter} no mire. Si adivinás el lado del tiro, ¡lo atajás! Los tiros al ángulo superior no se pueden atajar.</p>
  <div className="grid grid-cols-3 gap-2">{opts.map(([d,i,l])=><Button key={d} variant="outline" className="h-20 flex-col gap-1 text-base font-bold" onClick={()=>{try{navigator.vibrate?.(20);}catch{}onPick(d);}}><span className="text-2xl" aria-hidden>{i}</span>{l}</Button>)}</div>
  <p className="text-xs opacity-70">Después pasale el celular a {shooter}.</p>
 </section>;
}
