export type SonidoCancha='kick'|'hit'|'cheer'|'answer'|'success'|'error'|'victory'|'post'|'net'|'gloves'|'groan';
/** Efectos de cancha hechos con Web Audio (sin voces): zapatazo, red, guantes, palo y tribuna. */
export class StadiumSound {
 private context:AudioContext|null=null;
 muted=false;
 private ruido(a:AudioContext,dur:number,tipo:BiquadFilterType,f:number,vol:number,ataque=.005,t=a.currentTime,q=1){
  const b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),ch=b.getChannelData(0);
  for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
  const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=b;fl.type=tipo;fl.frequency.value=f;fl.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+ataque);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl).connect(g).connect(a.destination);s.start(t);return fl;
 }
 private golpe(a:AudioContext,f0:number,f1:number,dur:number,vol:number,t=a.currentTime){
  const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);
 }
 play(kind:SonidoCancha){
  if(this.muted)return;
  try{
   const a=this.context??(this.context=new AudioContext());void a.resume();const t=a.currentTime;
   switch(kind){
    case 'kick':this.golpe(a,180,45,.18,.45);this.ruido(a,.06,'bandpass',2200,.35,.002);return; // zapatazo seco
    case 'net':this.ruido(a,.55,'highpass',3200,.22,.03);this.ruido(a,.35,'bandpass',900,.12,.02,t+.05);return; // la red se infla
    case 'gloves':this.golpe(a,260,90,.12,.4);this.ruido(a,.09,'lowpass',700,.4,.002);return; // pelota contra los guantes
    case 'post':this.golpe(a,140,60,.1,.3);[1240,1860,2730,3410].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.1/(i+1),t);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);o.connect(g).connect(a.destination);o.start();o.stop(t+1.1);});return;
    case 'cheer':{const fl=this.ruido(a,2.6,'bandpass',1100,.2,.12,t,.6);fl.frequency.setValueAtTime(700,t);fl.frequency.linearRampToValueAtTime(1500,t+.5);this.ruido(a,2.2,'lowpass',420,.14,.2);return;} // tribuna explota
    case 'groan':{const fl=this.ruido(a,1.4,'bandpass',600,.13,.15,t,1.2);fl.frequency.setValueAtTime(750,t);fl.frequency.exponentialRampToValueAtTime(280,t+1.3);return;} // «uuuh» de la tribuna
    case 'hit':this.golpe(a,140,60,.2,.15);return;
    case 'answer':this.golpe(a,660,990,.15,.08);return;
    default:{const notes=kind==='error'?[220,165]:kind==='victory'?[523,659,784,1047]:[660,880];
     notes.forEach((frequency,i)=>{const osc=a.createOscillator(),gain=a.createGain(),ti=t+i*.12;osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,ti);gain.gain.exponentialRampToValueAtTime(.09,ti+.015);gain.gain.exponentialRampToValueAtTime(.0001,ti+.18);osc.connect(gain).connect(a.destination);osc.start(ti);osc.stop(ti+.2);});}
   }
  }catch{/* Sound is optional on devices without Web Audio. */}
 }
 dispose(){void this.context?.close();this.context=null;}
}
