import { useEffect, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const HELP = {
 'Ahorcado con chipas': {xp:'15 XP al ganar · 5 XP al terminar sin chipas',steps:['💡 Adiviná la palabra en guaraní con la pista en español.','👆 Tocá las letras: ch, mb y nd van en una sola tecla.','🥯 Cada error se come una chipa. Tenés 6.']},
 'Sopa de letras': {xp:'20 XP al encontrar las 6 palabras',steps:['🔎 Buscá las palabras en guaraní a partir de las pistas en español.','👆 Tocá la primera y la última letra de cada palabra.','↔️ Las palabras están en horizontal o vertical.']},
 'Memoria': {xp:'Entre 10 y 20 XP · menos intentos, más XP',steps:['🃏 Da vuelta dos tarjetas.','🤝 Formá parejas de palabra en guaraní y su significado.','🔊 Escuchá el audio al abrir la tarjeta en guaraní.','⭐ Completá los 6 pares con pocos intentos.']},
 'Palabra del día': {xp:'5 XP si acertás · una vez por día',steps:['🔊 Escuchá la palabra del día.','👆 Elegí su significado entre 4 opciones.','📅 Podés jugar una vez por día. Volvé mañana.']},
 'Penales': {xp:'4 XP por gol · 6 XP al ángulo · máximo 20 XP por tanda para Jugador 1',steps:['💡 Respondé la palabra: si acertás, el arquero es más lento.','🎯 Tocá el arco para apuntar.','⚽ Tocá de nuevo cuando la barra de fuerza esté en verde.','🤝 En Duelo, dos jugadores se turnan en el mismo celular.']},
 'Duelo Cara a Cara': {xp:'3 XP por punto + 5 XP al ganar · máximo 20 XP para Jugador 1',steps:['📱 Apoyen el celular en la mesa, uno de cada lado.','🔊 Suena una palabra en guaraní.','👆 El primero que toca su traducción gana el punto.','⛔ Si te equivocás, quedás bloqueado 1 segundo.','🏆 Gana quien llega a 5.']},
 'Ventanilla de Jai': {xp:'3 XP por persona bien atendida · máximo 20 XP',steps:['🏛️ Sos quien atiende la ventanilla y la fila avanza.','🔊 Si la persona te habla en guaraní, elegí qué te está diciendo.','💬 Si vos le tenés que decir algo, elegí cómo se dice en guaraní.','⏳ No tardes: cada persona tiene su paciencia.']},
 'Jai en la chacra': {xp:'4 XP por productor ayudado · máximo 20 XP',steps:['🚙 Sos técnico de campo y visitás 5 productores.','👂 Cada productor te cuenta su problema.','👆 Elegí la palabra en guaraní que necesitás para entenderlo.','🌱 Después leé el consejo del técnico.']},
 'Duelo de Trivia': {xp:'3 XP por punto + 5 XP al ganar · máximo 20 XP para Jugador 1',steps:['📱 Apoyen el celular en la mesa, uno de cada lado.','❓ Aparece una pregunta sobre el Paraguay.','👆 Cada uno tiene una sola chance: el primero que acierta gana el punto.','🤝 Si los dos fallan, nadie suma.','🏆 Gana quien llega a 5.']},
} as const;

export function GameHelp({title}:{title:string}) {
 const [open,setOpen]=useState(false);
 const help=HELP[title as keyof typeof HELP];
 useEffect(()=>{if(!help)return;try{if(localStorage.getItem(`jaikuaa:game-help:${title}`)!=='seen')setOpen(true);}catch{setOpen(true);}},[title,help]);
 if(!help)return null;
 function change(value:boolean){setOpen(value);if(!value)try{localStorage.setItem(`jaikuaa:game-help:${title}`,'seen');}catch{}}
 return <Dialog open={open} onOpenChange={change}><Button variant="outline" size="icon" title="¿Cómo se juega?" aria-label="¿Cómo se juega?" onClick={()=>change(true)}><CircleHelp/></Button><DialogContent className="game-help max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle className="tracking-normal">¿Cómo se juega?</DialogTitle><DialogDescription>{title}</DialogDescription><ol className="space-y-4">{help.steps.map(step=><li key={step} className="text-sm leading-relaxed text-foreground">{step}</li>)}</ol><p className="border-t border-border pt-4 text-sm font-semibold text-accent">{help.xp}</p><Button onClick={()=>change(false)}>¡A jugar!</Button></DialogContent></Dialog>;
}