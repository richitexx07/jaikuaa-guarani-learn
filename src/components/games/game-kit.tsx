import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StadiumSound } from './game-sound';
import { GameMascot, type MascotMood } from './game-mascot';
import { useGT } from "@/lib/i18n-games";
import { celebrate } from '@/lib/confetti';

type FeedbackKind = Exclude<MascotMood,'idle'>;
const GameContext=createContext({muted:false,mood:'idle' as MascotMood,event:0,toggleMute:()=>{},react:(_kind:FeedbackKind)=>{},reset:()=>{}});
export function GameKit({children}:{children:ReactNode}){
 const [muted,setMuted]=useState(false),[mood,setMood]=useState<MascotMood>('idle'),[event,setEvent]=useState(0);
 const sound=useRef<StadiumSound|null>(null);
 useEffect(()=>{try{setMuted(localStorage.getItem('jaikuaa:games-muted')==='true');}catch{}return()=>sound.current?.dispose();},[]);
 const toggleMute=useCallback(()=>setMuted(old=>{const next=!old;try{localStorage.setItem('jaikuaa:games-muted',String(next));}catch{}return next;}),[]);
 const react=useCallback((kind:FeedbackKind)=>{
  setMood(kind);setEvent(e=>e+1);const player=sound.current??(sound.current=new StadiumSound());player.muted=muted;player.play(kind);
  if(kind==='victory')celebrate('big');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)try{navigator.vibrate?.(kind==='error'?25:kind==='victory'?[30,30,50]:15);}catch{}
 },[muted]);
 const reset=useCallback(()=>setMood('idle'),[]);
 return <GameContext.Provider value={{muted,mood,event,toggleMute,react,reset}}><div className="game-kit" data-feedback={mood} data-feedback-event={event}>{children}</div></GameContext.Provider>;
}
export function useGameKit(){return useContext(GameContext);}
export function useGameFeedback(){const {react,reset}=useGameKit();useEffect(()=>{reset();},[reset]);return react;}
export function GameSoundButton(){const {muted,toggleMute}=useGameKit();const {g}=useGT();return <Button variant="outline" size="sm" className="h-10 gap-1.5 px-3 font-semibold" title={muted?'Activar sonido':'Silenciar sonido'} aria-label={muted?'Activar sonido':'Silenciar sonido'} aria-pressed={muted} onClick={toggleMute}>{muted?<VolumeX aria-hidden/>:<Volume2 aria-hidden/>}{muted?g("soundOff"):g("soundOn")}</Button>;}
export function GameCompanion(){const {mood,event}=useGameKit();const messages={idle:'¡Vamos! Cada palabra es una nueva oportunidad.',success:'¡Muy bien! Seguí así.',error:'No pasa nada. ¡Seguimos aprendiendo!',victory:'¡Lo lograste! Un aplauso para vos.'};return <div key={event} className={`game-companion game-reaction-${mood}`}><GameMascot mood={mood} message={messages[mood]}/></div>;}
export function LaceBackground(){return <div className="game-lace-background" aria-hidden="true">{[0,1].map(wheel=><svg key={wheel} className="game-lace" viewBox="-150 -150 300 300" fill="none"><circle r="138"/><circle r="126"/><circle r="84"/><circle r="35"/>{Array.from({length:24},(_,i)=><g key={i} transform={`rotate(${i*15})`}><path d="M0 0 L-15 -125 Q0 -148 15 -125 Z M0 -35 Q-35 -73 0 -126 Q35 -73 0 -35 M-15 -125 Q0 -110 15 -125"/><path d="M0 -35 L0 -138 M-9 -67 L9 -67 M-12 -78 L12 -78 M-13 -89 L13 -89 M-11 -100 L11 -100"/></g>)}</svg>)}</div>;}