import { useEffect, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_HELP, gameTitle, useGT } from '@/lib/i18n-games';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';



export function GameHelp({title}:{title:string}) {
 const [open,setOpen]=useState(false);
 const {lang,g}=useGT();
 const help=GAME_HELP[title];
 useEffect(()=>{if(!help)return;try{if(localStorage.getItem(`jaikuaa:game-help:${title}`)!=='seen')setOpen(true);}catch{setOpen(true);}},[title,help]);
 if(!help)return null;
 function change(value:boolean){setOpen(value);if(!value)try{localStorage.setItem(`jaikuaa:game-help:${title}`,'seen');}catch{}}
 return <Dialog open={open} onOpenChange={change}><Button variant="outline" size="sm" className="h-10 gap-1.5 px-3 font-semibold" title={g("howTo")} aria-label={g("howTo")} onClick={()=>change(true)}><CircleHelp aria-hidden/>{g("helpShort")}</Button><DialogContent className="game-help max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle className="tracking-normal">{g("howTo")}</DialogTitle><DialogDescription>{gameTitle(title,lang)}</DialogDescription><ol className="space-y-4">{help.steps.map(step=><li key={step.es} className="text-sm leading-relaxed text-foreground">{step[lang]}</li>)}</ol><p className="border-t border-border pt-4 text-sm font-semibold text-accent">{help.xp[lang]}</p><Button onClick={()=>change(false)}>{g("letsPlay")}</Button></DialogContent></Dialog>;
}