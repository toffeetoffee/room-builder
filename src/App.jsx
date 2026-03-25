import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import {
  Play, Pencil, Eye, EyeOff, Grid3X3, Undo2, Redo2, Save, Upload, Share2,
  Type, Image, Trash2, Link2, Unlink, Camera, CameraOff,
  Plus, Minus, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Download, X, Copy,
  ZoomIn, ZoomOut, MousePointer, Settings, Menu, Maximize2,
  Sun, Moon, Cloud, CloudOff, ExternalLink, RotateCw, FlipHorizontal, FlipVertical,
  Check, Volume2, VolumeX, Palette, RefreshCw, HelpCircle, User, Sliders, LinkIcon
} from "lucide-react";

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 1: SUPABASE — HARDCODED CREDENTIALS                ║
  ║  Replace these two values with your actual Supabase creds.   ║
  ║  Every user who opens the site will be auto-connected.       ║
  ╚═══════════════════════════════════════════════════════════════╝*/
const SUPABASE_URL = "https://kbuxisynsybxabqzjdhp.supabase.co";   // ← Replace this
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidXhpc3luc3lieGFicXpqZGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTI0MjMsImV4cCI6MjA5MDAyODQyM30.DbXt9pghyH2K0EyR64-iPS-vIPHM4SI7NG8Z7EwtYkc";              // ← Replace this

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 2: CONSTANTS                                        ║
  ╚═══════════════════════════════════════════════════════════════╝*/
const ROOM_W = 1600, ROOM_H = 1200, GRID = 32;
const MIN_ZOOM = 0.15, MAX_ZOOM = 4;
const LAYERS = { BG: 0, OBJ: 1, PLAYER: 2 };
const BTN_TYPE = { PRESS_E: "pressE", FLOOR_TOGGLE: "floorToggle", FLOOR_HOLD: "floorHold" };
const INTERACT_R = 52;
let _u = Date.now();
const uid = () => `o${_u++}_${Math.random().toString(36).slice(2,6)}`;

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 3: THEME SYSTEM — 6 Color Themes                   ║
  ╚═══════════════════════════════════════════════════════════════╝*/
const THEMES = {
  light: { label:"Light", bg:"#f5f5f8", surface:"#ffffff", surfAlt:"#f0f0f5",
    border:"#dddde6", borderLt:"#e8e8f0", text:"#1a1a2e", textDim:"#5a5a72",
    textMut:"#9999aa", accent:"#0087a8", accentDim:"rgba(0,135,168,0.08)",
    accentBrd:"rgba(0,135,168,0.3)", warn:"#d97706", warnDim:"rgba(217,119,6,0.08)",
    danger:"#dc2626", dangerDim:"rgba(220,38,38,0.06)", success:"#16a34a",
    successDim:"rgba(22,163,74,0.06)", canvas:"#e4e4ec", btnBg:"rgba(0,0,0,0.03)",
    btnBrd:"rgba(0,0,0,0.08)", gridLine:"rgba(0,0,0,0.06)" },
  dark: { label:"Dark", bg:"#0d0d18", surface:"#13131f", surfAlt:"#191928",
    border:"#222236", borderLt:"#2a2a42", text:"#e0e0ec", textDim:"#8888a0",
    textMut:"#555570", accent:"#00d4f5", accentDim:"rgba(0,212,245,0.1)",
    accentBrd:"rgba(0,212,245,0.3)", warn:"#fbbf24", warnDim:"rgba(251,191,36,0.1)",
    danger:"#ef4444", dangerDim:"rgba(239,68,68,0.08)", success:"#22c55e",
    successDim:"rgba(34,197,94,0.08)", canvas:"#0f0f1e", btnBg:"rgba(255,255,255,0.04)",
    btnBrd:"rgba(255,255,255,0.08)", gridLine:"rgba(255,255,255,0.04)" },
  ocean: { label:"Ocean", bg:"#0b1628", surface:"#0f1d33", surfAlt:"#132440",
    border:"#1a3050", borderLt:"#204060", text:"#d0e8ff", textDim:"#7aa8cc",
    textMut:"#4a7090", accent:"#00bcd4", accentDim:"rgba(0,188,212,0.12)",
    accentBrd:"rgba(0,188,212,0.35)", warn:"#ff9800", warnDim:"rgba(255,152,0,0.1)",
    danger:"#f44336", dangerDim:"rgba(244,67,54,0.08)", success:"#4caf50",
    successDim:"rgba(76,175,80,0.08)", canvas:"#081220", btnBg:"rgba(255,255,255,0.04)",
    btnBrd:"rgba(255,255,255,0.06)", gridLine:"rgba(100,180,255,0.05)" },
  forest: { label:"Forest", bg:"#0f1a0f", surface:"#152015", surfAlt:"#1a281a",
    border:"#2a3a2a", borderLt:"#354535", text:"#d4e8d0", textDim:"#88aa84",
    textMut:"#557755", accent:"#66bb6a", accentDim:"rgba(102,187,106,0.12)",
    accentBrd:"rgba(102,187,106,0.35)", warn:"#ffb74d", warnDim:"rgba(255,183,77,0.1)",
    danger:"#e57373", dangerDim:"rgba(229,115,115,0.08)", success:"#81c784",
    successDim:"rgba(129,199,132,0.08)", canvas:"#0a140a", btnBg:"rgba(255,255,255,0.04)",
    btnBrd:"rgba(255,255,255,0.06)", gridLine:"rgba(100,200,100,0.05)" },
  sunset: { label:"Sunset", bg:"#1a0f0a", surface:"#241410", surfAlt:"#2e1a14",
    border:"#4a2820", borderLt:"#5a3428", text:"#f0d8cc", textDim:"#c09080",
    textMut:"#806050", accent:"#ff7043", accentDim:"rgba(255,112,67,0.12)",
    accentBrd:"rgba(255,112,67,0.35)", warn:"#ffd54f", warnDim:"rgba(255,213,79,0.1)",
    danger:"#ef5350", dangerDim:"rgba(239,83,80,0.08)", success:"#66bb6a",
    successDim:"rgba(102,187,106,0.08)", canvas:"#140a06", btnBg:"rgba(255,255,255,0.04)",
    btnBrd:"rgba(255,255,255,0.06)", gridLine:"rgba(255,150,100,0.05)" },
  lavender: { label:"Lavender", bg:"#f5f0fa", surface:"#ffffff", surfAlt:"#f0eaf8",
    border:"#d8d0e8", borderLt:"#e4ddf0", text:"#2a1a40", textDim:"#6a5a80",
    textMut:"#9990aa", accent:"#7c4dff", accentDim:"rgba(124,77,255,0.08)",
    accentBrd:"rgba(124,77,255,0.3)", warn:"#f59e0b", warnDim:"rgba(245,158,11,0.08)",
    danger:"#e11d48", dangerDim:"rgba(225,29,72,0.06)", success:"#059669",
    successDim:"rgba(5,150,105,0.06)", canvas:"#ece4f4", btnBg:"rgba(100,50,200,0.03)",
    btnBrd:"rgba(100,50,200,0.08)", gridLine:"rgba(100,50,200,0.06)" }
};
const ThemeCtx = createContext(THEMES.light);

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 4: SOUND SYSTEM                                     ║
  ║  Generates default button sounds via Web Audio API.          ║
  ║  Supports custom uploaded sounds stored as base64.           ║
  ╚═══════════════════════════════════════════════════════════════╝*/
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
/** Play a generated synth tone as default SFX */
function playDefaultSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === BTN_TYPE.PRESS_E) {
      osc.frequency.value = 660; osc.type = "square";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } else if (type === BTN_TYPE.FLOOR_TOGGLE) {
      osc.frequency.value = 440; osc.type = "triangle";
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.value = 330; osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    }
  } catch(e) { /* Audio not available */ }
}
/** Play a custom base64 audio file */
function playCustomSound(base64DataUrl) {
  try {
    const audio = new Audio(base64DataUrl);
    audio.volume = 0.3;
    audio.play().catch(()=>{});
  } catch(e) {}
}
/** Play a button's sound — custom if set, otherwise default */
function playBtnSound(btn, muted) {
  if (muted) return;
  if (btn.customSound) playCustomSound(btn.customSound);
  else playDefaultSound(btn.buttonType);
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 5: OOP CLASSES                                      ║
  ╚═══════════════════════════════════════════════════════════════╝*/

class GameObject {
  constructor(p={}) {
    this.id=p.id||uid(); this.type=p.type||"base";
    this.x=p.x??100; this.y=p.y??100; this.width=p.width??64; this.height=p.height??64;
    this.rotation=p.rotation??0; this.scaleX=p.scaleX??1; this.scaleY=p.scaleY??1;
    this.zIndex=p.zIndex??0; this.layer=p.layer??LAYERS.OBJ;
    this.visible=p.visible!==undefined?p.visible:true; this.name=p.name||"Object";
    this.link=p.link||""; // Embedded URL link
  }
  center(){return{x:this.x+this.width/2,y:this.y+this.height/2}}
  hits(wx,wy){return wx>=this.x&&wx<=this.x+this.width&&wy>=this.y&&wy<=this.y+this.height}
  snap(g){this.x=Math.round(this.x/g)*g;this.y=Math.round(this.y/g)*g}
  _tf(ctx){const cx=this.x+this.width/2,cy=this.y+this.height/2;ctx.translate(cx,cy);ctx.rotate(this.rotation*Math.PI/180);ctx.scale(this.scaleX,this.scaleY)}
  _sel(ctx){
    ctx.strokeStyle="#00d4f5";ctx.lineWidth=2;ctx.setLineDash([6,3]);
    ctx.strokeRect(-this.width/2-4,-this.height/2-4,this.width+8,this.height+8);
    ctx.setLineDash([]);
    ctx.fillStyle="#00d4f5";
    const hw=this.width/2+4,hh=this.height/2+4;
    for(const[hx,hy]of[[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]])ctx.fillRect(hx-3,hy-3,6,6);
    // Link indicator
    if(this.link){ctx.fillStyle="#3b82f6";ctx.font="bold 10px monospace";ctx.textAlign="right";ctx.textBaseline="top";ctx.fillText("🔗",this.width/2+2,-this.height/2-16)}
  }
  draw(ctx,ed,sel,showH){
    ctx.save();this._tf(ctx);
    if(!this.visible&&showH)ctx.globalAlpha=0.3;
    else if(!this.visible){ctx.restore();return}
    ctx.fillStyle="#888";ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height);
    if(sel)this._sel(ctx);ctx.restore();
  }
  toJSON(){return{id:this.id,type:this.type,x:this.x,y:this.y,width:this.width,height:this.height,rotation:this.rotation,scaleX:this.scaleX,scaleY:this.scaleY,zIndex:this.zIndex,layer:this.layer,visible:this.visible,name:this.name,link:this.link}}
}

/** Text with background color and embedded link support */
class TextObject extends GameObject {
  constructor(p={}) {
    super({...p,type:"text"});
    this.text=p.text||"Hello"; this.fontSize=p.fontSize??24;
    this.color=p.color||"#222222"; this.bgColor=p.bgColor||""; // empty = transparent
    this.fontFamily=p.fontFamily||"sans-serif"; this.name=p.name||"Text";
    this.width=p.width??Math.max(48,this.text.length*this.fontSize*0.55);
    this.height=p.height??(this.fontSize+20);
  }
  draw(ctx,ed,sel,showH){
    ctx.save();this._tf(ctx);
    if(!this.visible&&showH)ctx.globalAlpha=0.3;
    else if(!this.visible){ctx.restore();return}
    // Background fill
    if(this.bgColor){
      ctx.fillStyle=this.bgColor;
      ctx.beginPath();ctx.roundRect(-this.width/2,-this.height/2,this.width,this.height,4);ctx.fill();
    } else if(ed){
      ctx.fillStyle="rgba(128,128,128,0.06)";ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height);
    }
    ctx.fillStyle=this.color;ctx.font=`${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    // Word wrap
    const words=this.text.split(' '),lh=this.fontSize*1.2,lines=[];let cur='';
    for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>this.width-8&&cur){lines.push(cur);cur=w}else cur=t}
    if(cur)lines.push(cur);
    const sy=-lines.length*lh/2+lh/2;
    lines.forEach((l,i)=>ctx.fillText(l,0,sy+i*lh));
    if(sel)this._sel(ctx);ctx.restore();
  }
  toJSON(){return{...super.toJSON(),text:this.text,fontSize:this.fontSize,color:this.color,bgColor:this.bgColor,fontFamily:this.fontFamily}}
}

/** Image/GIF object with embedded link */
class ImageObject extends GameObject {
  constructor(p={}) {
    super({...p,type:"image"});this.src=p.src||"";
    this._img=null;this._ok=false;this.name=p.name||"Image";
    if(this.src)this._load();
  }
  _load(){this._img=new window.Image();this._img.crossOrigin="anonymous";this._img.onload=()=>{this._ok=true};this._img.src=this.src}
  draw(ctx,ed,sel,showH){
    ctx.save();this._tf(ctx);
    if(!this.visible&&showH)ctx.globalAlpha=0.3;
    else if(!this.visible){ctx.restore();return}
    if(this._ok&&this._img)ctx.drawImage(this._img,-this.width/2,-this.height/2,this.width,this.height);
    else{ctx.fillStyle="#2a2a3a";ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height);ctx.fillStyle="#666";ctx.font="11px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Loading...",0,0)}
    if(sel)this._sel(ctx);ctx.restore();
  }
  toJSON(){return{...super.toJSON(),src:this.src}}
}

/** Interactive button with custom images, sounds, and linking */
class ButtonObject extends GameObject {
  constructor(p={}) {
    super({...p,type:"button",width:p.width??44,height:p.height??44});
    this.buttonType=p.buttonType||BTN_TYPE.PRESS_E;
    this.linkedIds=p.linkedIds||p.linkedObjectIds||[];
    this.isActive=p.isActive??false; this.visible=true; this.name=p.name||"Button";
    this.imgActive=p.imgActive||""; this.imgInactive=p.imgInactive||"";
    this.customSound=p.customSound||""; // Base64 audio
    this._imgA=null;this._imgI=null;this._imgAOk=false;this._imgIOk=false;
    if(this.imgActive)this._loadA();if(this.imgInactive)this._loadI();
  }
  _loadA(){this._imgA=new window.Image();this._imgA.crossOrigin="anonymous";this._imgA.onload=()=>{this._imgAOk=true};this._imgA.src=this.imgActive}
  _loadI(){this._imgI=new window.Image();this._imgI.crossOrigin="anonymous";this._imgI.onload=()=>{this._imgIOk=true};this._imgI.src=this.imgInactive}
  toggle(objs,muted){this.isActive=!this.isActive;this._sync(objs);playBtnSound(this,muted)}
  activate(objs,muted){if(!this.isActive){this.isActive=true;this._sync(objs);playBtnSound(this,muted)}}
  deactivate(objs){if(this.isActive){this.isActive=false;this._sync(objs)}}
  _sync(objs){for(const o of objs)if(this.linkedIds.includes(o.id))o.visible=this.isActive}
  link(id){if(!this.linkedIds.includes(id))this.linkedIds.push(id)}
  unlink(id){this.linkedIds=this.linkedIds.filter(i=>i!==id)}
  draw(ctx,ed,sel,showH){
    ctx.save();this._tf(ctx);const r=this.width/2;
    const useA=this.isActive&&this._imgAOk&&this._imgA;
    const useI=!this.isActive&&this._imgIOk&&this._imgI;
    if(useA){ctx.drawImage(this._imgA,-this.width/2,-this.height/2,this.width,this.height)}
    else if(useI){ctx.drawImage(this._imgI,-this.width/2,-this.height/2,this.width,this.height)}
    else{
      const cols={[BTN_TYPE.PRESS_E]:this.isActive?"#22c55e":"#ef4444",[BTN_TYPE.FLOOR_TOGGLE]:this.isActive?"#84cc16":"#f59e0b",[BTN_TYPE.FLOOR_HOLD]:this.isActive?"#06b6d4":"#a855f7"};
      ctx.fillStyle=cols[this.buttonType]||"#888";ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
      const g=ctx.createRadialGradient(0,-r*0.3,0,0,0,r);g.addColorStop(0,"rgba(255,255,255,0.25)");g.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.font=`bold ${Math.max(10,r*0.5)}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText({[BTN_TYPE.PRESS_E]:"E",[BTN_TYPE.FLOOR_TOGGLE]:"F",[BTN_TYPE.FLOOR_HOLD]:"H"}[this.buttonType]||"?",0,1);
    }
    if(sel){ctx.strokeStyle="#00d4f5";ctx.lineWidth=2.5;ctx.setLineDash([6,3]);ctx.beginPath();ctx.arc(0,0,r+6,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
    ctx.restore();
  }
  toJSON(){return{...super.toJSON(),buttonType:this.buttonType,linkedIds:[...this.linkedIds],isActive:this.isActive,imgActive:this.imgActive,imgInactive:this.imgInactive,customSound:this.customSound}}
}

/** Player with custom sprite support (2 frames, horizontal flip) */
class Player {
  constructor(p={}) {
    this.x=p.x??400;this.y=p.y??300;this.size=p.size??26;
    this.speed=p.speed??3;this.color=p.color??"#00d4f5";this.dir="down";
    this.sprite1=p.sprite1||""; // Frame 1 base64
    this.sprite2=p.sprite2||""; // Frame 2 base64
    this._s1=null;this._s2=null;this._s1ok=false;this._s2ok=false;
    this._frame=0;this._tick=0;
    if(this.sprite1)this._loadS1();if(this.sprite2)this._loadS2();
  }
  _loadS1(){this._s1=new window.Image();this._s1.onload=()=>{this._s1ok=true};this._s1.src=this.sprite1}
  _loadS2(){this._s2=new window.Image();this._s2.onload=()=>{this._s2ok=true};this._s2.src=this.sprite2}
  bounds(){const h=this.size/2;return{x:this.x-h,y:this.y-h,width:this.size,height:this.size}}
  move(dx,dy,rw,rh){
    const h=this.size/2;
    this.x=Math.max(h,Math.min(rw-h,this.x+dx));
    this.y=Math.max(h,Math.min(rh-h,this.y+dy));
    if(Math.abs(dx)>Math.abs(dy))this.dir=dx>0?"right":"left";
    else if(dy!==0)this.dir=dy>0?"down":"up";
    // Animate sprite frames while moving
    this._tick++;if(this._tick%10===0)this._frame=1-this._frame;
  }
  draw(ctx){
    ctx.save();ctx.translate(this.x,this.y);
    const useSprite=(this._s1ok&&this._s1);
    if(useSprite){
      // Flip horizontally based on direction (left = -1, right = 1)
      const flipX=(this.dir==="left")?-1:1;
      ctx.scale(flipX,1);
      const img=(this._frame===1&&this._s2ok&&this._s2)?this._s2:this._s1;
      ctx.drawImage(img,-this.size/2,-this.size/2,this.size,this.size);
    } else {
      // Default drawn player
      ctx.fillStyle="rgba(0,0,0,0.12)";
      ctx.beginPath();ctx.ellipse(0,this.size*0.4,this.size*0.42,this.size*0.13,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(0,0,this.size/2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,0.25)";ctx.lineWidth=1.5;ctx.stroke();
      const ig=ctx.createRadialGradient(-this.size*0.12,-this.size*0.12,0,0,0,this.size/2);
      ig.addColorStop(0,"rgba(255,255,255,0.3)");ig.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=ig;ctx.beginPath();ctx.arc(0,0,this.size/2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";const a=this.size*0.22;
      const dd={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
      const[ddx,ddy]=dd[this.dir]||[0,1];const t=this.size*0.3;
      ctx.beginPath();ctx.moveTo(ddx*t,ddy*t);
      ctx.lineTo(ddx*t-ddy*a*0.5-ddx*a,ddy*t+ddx*a*0.5-ddy*a);
      ctx.lineTo(ddx*t+ddy*a*0.5-ddx*a,ddy*t-ddx*a*0.5-ddy*a);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  toJSON(){return{x:this.x,y:this.y,size:this.size,speed:this.speed,color:this.color,sprite1:this.sprite1,sprite2:this.sprite2}}
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 6: ROOM, HISTORY, TUTORIAL FACTORY                 ║
  ╚═══════════════════════════════════════════════════════════════╝*/

class Room {
  constructor(p={}){
    this.width=p.width??ROOM_W;this.height=p.height??ROOM_H;
    this.gridSize=p.gridSize??GRID;this.gridOn=p.gridOn??false;
    this.bgColor=p.bgColor||"#ffffff";this.roomName=p.roomName||"My Room";
    this.objects=p.objects||[];this.player=p.player||new Player({x:this.width/2,y:this.height/2});
    this.soundMuted=p.soundMuted??false;
  }
  add(o){this.objects.push(o)}
  remove(id){for(const o of this.objects)if(o instanceof ButtonObject)o.unlink(id);this.objects=this.objects.filter(o=>o.id!==id)}
  find(id){return this.objects.find(o=>o.id===id)}
  unlinkAll(id){for(const o of this.objects)if(o instanceof ButtonObject)o.unlink(id)}
  sorted(){return[...this.objects].sort((a,b)=>a.layer!==b.layer?a.layer-b.layer:a.zIndex-b.zIndex)}
  hitTest(wx,wy){return this.sorted().reverse().find(o=>o.hits(wx,wy))||null}
  dup(id){const o=this.find(id);if(!o)return null;const j=o.toJSON();j.id=uid();j.x+=20;j.y+=20;j.name+=" copy";const n=Room._mk(j);this.objects.push(n);return n}
  toJSON(){return{width:this.width,height:this.height,gridSize:this.gridSize,gridOn:this.gridOn,bgColor:this.bgColor,roomName:this.roomName,objects:this.objects.map(o=>o.toJSON()),player:this.player.toJSON(),soundMuted:this.soundMuted}}
  static _mk(o){switch(o.type){case"text":return new TextObject(o);case"image":return new ImageObject(o);case"button":return new ButtonObject(o);default:return new GameObject(o)}}
  static fromJSON(d){return new Room({...d,objects:(d.objects||[]).map(Room._mk),player:new Player(d.player||{})})}
}

/** Create the interactive tutorial room shown on first launch */
function createTutorialRoom() {
  const w=1600,h=1200;
  const objs = [
    // Title
    new TextObject({id:"tut_title",x:w/2-300,y:40,width:600,height:60,text:"Welcome to Room Builder!",fontSize:36,color:"#1a1a2e",bgColor:"#e0f7fa",zIndex:10,name:"Title"}),
    new TextObject({id:"tut_sub",x:w/2-260,y:110,width:520,height:36,text:"This is a tutorial room. Walk around and explore!",fontSize:16,color:"#555",name:"Subtitle"}),

    // ── TOP BAR EXPLANATION ──
    new TextObject({id:"tut_bar",x:30,y:170,width:440,height:110,text:"⬆️ TOP TOOLBAR: Switch between Play and Editor mode. Toggle camera follow, grid snap, show hidden objects. Undo/Redo, zoom controls, theme picker, save & cloud share are all here.",fontSize:13,color:"#333",bgColor:"#fff9c4",name:"Toolbar Guide"}),

    // ── SIDEBAR EXPLANATION ──
    new TextObject({id:"tut_side",x:30,y:310,width:360,height:90,text:"⬅️ SIDEBAR (Editor): Add text, images/GIFs, and buttons. Edit object properties, adjust transforms with sliders, manage layers and z-index.",fontSize:13,color:"#333",bgColor:"#c8e6c9",name:"Sidebar Guide"}),

    // ── MOVEMENT ──
    new TextObject({id:"tut_move",x:30,y:430,width:340,height:70,text:"🎮 MOVEMENT: Use WASD or arrow keys to walk around. On mobile, a D-pad appears. Adjust speed in Settings!",fontSize:13,color:"#333",bgColor:"#bbdefb",name:"Movement Guide"}),

    // ── BUTTONS DEMO ──
    new TextObject({id:"tut_btn_title",x:600,y:200,width:380,height:40,text:"Interactive Buttons — Try Them!",fontSize:20,color:"#1a1a2e",bgColor:"#f3e5f5",name:"Buttons Title"}),

    // Press E demo
    new TextObject({id:"tut_e_label",x:600,y:260,width:340,height:50,text:"🔴 Walk near this red button and press E to toggle the hidden text below:",fontSize:13,color:"#444",name:"Press E Hint"}),
    new ButtonObject({id:"tut_btn_e",x:960,y:265,buttonType:BTN_TYPE.PRESS_E,linkedIds:["tut_e_secret"],name:"Try Press E"}),
    new TextObject({id:"tut_e_secret",x:620,y:320,width:300,height:36,text:"🎉 You found the secret text!",fontSize:16,color:"#16a34a",bgColor:"#dcfce7",visible:false,name:"Secret Text"}),

    // Floor Toggle demo
    new TextObject({id:"tut_f_label",x:600,y:390,width:340,height:50,text:"🟠 Walk onto this orange button to toggle the message:",fontSize:13,color:"#444",name:"Floor Toggle Hint"}),
    new ButtonObject({id:"tut_btn_f",x:960,y:395,width:50,height:50,buttonType:BTN_TYPE.FLOOR_TOGGLE,linkedIds:["tut_f_msg"],name:"Floor Toggle"}),
    new TextObject({id:"tut_f_msg",x:620,y:450,width:300,height:36,text:"Toggled by walking over!",fontSize:15,color:"#d97706",bgColor:"#fef3c7",visible:false,name:"Toggle Message"}),

    // Floor Hold demo
    new TextObject({id:"tut_h_label",x:600,y:520,width:340,height:50,text:"🟣 Stand on the purple button — text shows only while you're on it:",fontSize:13,color:"#444",name:"Floor Hold Hint"}),
    new ButtonObject({id:"tut_btn_h",x:960,y:525,width:50,height:50,buttonType:BTN_TYPE.FLOOR_HOLD,linkedIds:["tut_h_msg"],name:"Floor Hold"}),
    new TextObject({id:"tut_h_msg",x:620,y:580,width:300,height:36,text:"I only appear while you stand here!",fontSize:15,color:"#7c3aed",bgColor:"#ede9fe",visible:false,name:"Hold Message"}),

    // ── FEATURES LIST ──
    new TextObject({id:"tut_feat",x:600,y:660,width:420,height:220,text:"✨ MORE FEATURES:\n• Upload custom images & GIFs\n• Custom button images (active/inactive)\n• Custom button sound effects\n• Embed links on text & images\n• Adjustable player sprite & speed\n• Grid snap, layers, z-index\n• Undo/Redo (Ctrl+Z)\n• Cloud sharing via Supabase\n• 6 color themes\n• Mobile touch controls",fontSize:13,color:"#1a1a2e",bgColor:"#e8eaf6",name:"Features List"}),

    // ── TIPS ──
    new TextObject({id:"tut_tips",x:30,y:540,width:420,height:160,text:"💡 TIPS:\n• Switch to Editor mode to build\n• Use Grid Snap for precise placement\n• Link buttons to objects in the Properties panel\n• Use 'Show Hidden' in Editor to see invisible objects\n• Save locally, export as JSON, or share online\n• Press Delete to remove selected objects\n• Ctrl+D to duplicate objects",fontSize:13,color:"#333",bgColor:"#fff3e0",name:"Tips"}),

    // ── CAMERA ──
    new TextObject({id:"tut_cam",x:30,y:730,width:360,height:60,text:"📷 CAMERA: Toggle 'Follow' to track the player, or use 'Fixed' and drag to pan. Scroll to zoom!",fontSize:13,color:"#333",bgColor:"#fce4ec",name:"Camera Guide"}),

    // Starting point label
    new TextObject({id:"tut_start",x:w/2-80,y:h/2+40,width:160,height:30,text:"↑ You start here ↑",fontSize:14,color:"#0087a8",bgColor:"rgba(0,135,168,0.08)",name:"Start Point"}),
  ];
  return new Room({ width:w, height:h, roomName:"Tutorial Room", objects:objs,
    player: new Player({x:w/2,y:h/2-10,speed:3}), bgColor:"#f8f9fc" });
}

class History {
  constructor(max=60){this.u=[];this.r=[];this.max=max}
  push(j){this.u.push(JSON.stringify(j));if(this.u.length>this.max)this.u.shift();this.r=[]}
  undo(c){if(!this.u.length)return null;this.r.push(JSON.stringify(c));return JSON.parse(this.u.pop())}
  redo(c){if(!this.r.length)return null;this.u.push(JSON.stringify(c));return JSON.parse(this.r.pop())}
  get canUndo(){return this.u.length>0}
  get canRedo(){return this.r.length>0}
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 7: CLOUD SERVICE (Supabase)                         ║
  ╚═══════════════════════════════════════════════════════════════╝*/

class CloudSvc {
  constructor(url,key){this.url=url?.replace(/\/$/,"");this.key=key;this.bucket="room-assets"}
  get ok(){return!!(this.url&&this.key&&!this.url.includes("YOUR_PROJECT"))}
  _h(ct){const h={Authorization:`Bearer ${this.key}`,apikey:this.key};if(ct)h["Content-Type"]=ct;return h}
  async uploadBlob(dataUrl,name){
    const r=await fetch(dataUrl);const b=await r.blob();
    const ext=b.type.split("/")[1]||"bin";
    const path=`${Date.now()}_${name}.${ext}`;
    const res=await fetch(`${this.url}/storage/v1/object/${this.bucket}/${path}`,
      {method:"POST",headers:{...this._h(b.type),"x-upsert":"true"},body:b});
    if(!res.ok)throw new Error(await res.text());
    return`${this.url}/storage/v1/object/public/${this.bucket}/${path}`;
  }
  /** Upload all base64 data in a room to cloud storage, replace with URLs */
  async _uploadAssets(data) {
    for(let i=0;i<data.objects.length;i++){
      const o=data.objects[i];
      if(o.type==="image"&&o.src?.startsWith("data:"))o.src=await this.uploadBlob(o.src,`img_${o.id}`);
      if(o.type==="button"){
        if(o.imgActive?.startsWith("data:"))o.imgActive=await this.uploadBlob(o.imgActive,`bA_${o.id}`);
        if(o.imgInactive?.startsWith("data:"))o.imgInactive=await this.uploadBlob(o.imgInactive,`bI_${o.id}`);
        if(o.customSound?.startsWith("data:"))o.customSound=await this.uploadBlob(o.customSound,`snd_${o.id}`);
      }
    }
    const p=data.player;
    if(p.sprite1?.startsWith("data:"))p.sprite1=await this.uploadBlob(p.sprite1,"spr1");
    if(p.sprite2?.startsWith("data:"))p.sprite2=await this.uploadBlob(p.sprite2,"spr2");
    return data;
  }
  async saveRoom(room){
    if(!this.ok)throw new Error("Cloud not configured");
    let data=JSON.parse(JSON.stringify(room.toJSON()));
    data=await this._uploadAssets(data);
    const roomId=crypto.randomUUID();
    const res=await fetch(`${this.url}/rest/v1/rooms`,{
      method:"POST",headers:{...this._h("application/json"),Prefer:"resolution=merge-duplicates"},
      body:JSON.stringify({id:roomId,name:data.roomName||"Untitled",data})});
    if(!res.ok)throw new Error(await res.text());
    return roomId;
  }
  async loadRoom(id){
    if(!this.ok)throw new Error("Not configured");
    const res=await fetch(`${this.url}/rest/v1/rooms?id=eq.${id}&select=*`,{headers:this._h("application/json")});
    if(!res.ok)throw new Error("Load failed");
    const rows=await res.json();if(!rows.length)throw new Error("Not found");
    return Room.fromJSON(rows[0].data);
  }
  async listRooms(n=20){
    if(!this.ok)return[];
    const r=await fetch(`${this.url}/rest/v1/rooms?select=id,name,created_at&order=created_at.desc&limit=${n}`,{headers:this._h("application/json")});
    return r.ok?r.json():[];
  }
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 8: LOCAL SERIALIZATION                              ║
  ╚═══════════════════════════════════════════════════════════════╝*/
const Ser={
  save(r,s="room_default"){try{localStorage.setItem(s,JSON.stringify(r.toJSON()));return true}catch{return false}},
  load(s="room_default"){try{const d=localStorage.getItem(s);return d?Room.fromJSON(JSON.parse(d)):null}catch{return null}},
  exportFile(r,fn="room.json"){const b=new Blob([JSON.stringify(r.toJSON(),null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u)},
  importFile(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(Room.fromJSON(JSON.parse(r.result)))}catch(e){rej(e)}};r.onerror=rej;r.readAsText(f)})}
};

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 9: CANVAS RENDERER                                  ║
  ╚═══════════════════════════════════════════════════════════════╝*/
class Renderer {
  constructor(c){this.c=c;this.ctx=c.getContext("2d")}
  render({room,camX,camY,zoom,ed,selId,showH,linking,hovId,vw,vh,T}){
    const ctx=this.ctx,dpr=window.devicePixelRatio||1;
    this.c.width=vw*dpr;this.c.height=vh*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle=T.canvas;ctx.fillRect(0,0,vw,vh);
    ctx.save();ctx.translate(vw/2,vh/2);ctx.scale(zoom,zoom);ctx.translate(-camX,-camY);
    ctx.fillStyle=room.bgColor;ctx.fillRect(0,0,room.width,room.height);
    ctx.strokeStyle=T.border;ctx.lineWidth=2;ctx.strokeRect(0,0,room.width,room.height);
    if(room.gridOn){ctx.strokeStyle=T.gridLine;ctx.lineWidth=1;for(let x=0;x<=room.width;x+=room.gridSize){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,room.height);ctx.stroke()}for(let y=0;y<=room.height;y+=room.gridSize){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(room.width,y);ctx.stroke()}}
    for(const o of room.sorted())o.draw(ctx,ed,o.id===selId,showH);
    // Link lines in editor
    if(ed)for(const o of room.objects){if(!(o instanceof ButtonObject)||!o.linkedIds.length)continue;const f=o.center();for(const lid of o.linkedIds){const t=room.find(lid);if(!t)continue;const tc=t.center();const hi=o.id===selId||linking;ctx.strokeStyle=hi?"#fbbf24":"rgba(251,191,36,0.2)";ctx.lineWidth=hi?2.5:1.5;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(tc.x,tc.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=hi?"#fbbf24":"rgba(251,191,36,0.35)";ctx.beginPath();ctx.arc(tc.x,tc.y,4,0,Math.PI*2);ctx.fill()}}
    // Interaction prompts
    if(!ed){const px=room.player.x,py=room.player.y;for(const o of room.objects){if(!(o instanceof ButtonObject)||o.buttonType!==BTN_TYPE.PRESS_E)continue;const c=o.center();if(Math.hypot(c.x-px,c.y-py)<INTERACT_R+o.width/2){ctx.fillStyle="rgba(0,0,0,0.75)";ctx.beginPath();ctx.roundRect(c.x-38,c.y-o.height/2-34,76,24,6);ctx.fill();ctx.fillStyle="#fbbf24";ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("⏎ Press E",c.x,c.y-o.height/2-22)}}
      // Link indicator on clickable objects
      for(const o of room.objects){if(!o.link||!o.visible)continue;const c=o.center();ctx.fillStyle="rgba(59,130,246,0.6)";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText("🔗 Click",c.x,o.y-4)}
    }
    room.player.draw(ctx);
    if(ed&&linking&&hovId){const h=room.find(hovId);if(h&&h.type!=="button"){ctx.strokeStyle="#fbbf24";ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.strokeRect(h.x-3,h.y-3,h.width+6,h.height+6);ctx.setLineDash([])}}
    ctx.restore();
  }
  s2w(sx,sy,cx,cy,z,vw,vh){return{wx:(sx-vw/2)/z+cx,wy:(sy-vh/2)/z+cy}}
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 10: UI COMPONENTS                                   ║
  ╚═══════════════════════════════════════════════════════════════╝*/

function Btn({children,active,onClick,title,style,className=""}){
  const T=useContext(ThemeCtx);
  return(<button onClick={onClick} title={title}
    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110 active:scale-95 ${className}`}
    style={{background:active?T.accentDim:T.btnBg,border:`1px solid ${active?T.accentBrd:T.btnBrd}`,color:active?T.accent:T.textDim,...style}}>
    {children}</button>);
}

/** Slider + number input combo for transform properties */
function SliderRow({label,value,onChange,min,max,step=1}){
  const T=useContext(ThemeCtx);
  return(
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{color:T.textDim}}>{label}</span>
        <input type="number" value={value} min={min} max={max} step={step}
          className="w-16 px-1 py-0.5 rounded text-right text-xs outline-none"
          style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
          onChange={e=>onChange(parseFloat(e.target.value)||0)}/>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{background:T.border,accentColor:T.accent}}
        onChange={e=>onChange(parseFloat(e.target.value))}/>
    </div>
  );
}

/** File read helper */
function readFile(accept){
  return new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept=accept;i.onchange=()=>{const f=i.files?.[0];if(!f){res(null);return}const r=new FileReader();r.onload=()=>res({data:r.result,name:f.name});r.readAsDataURL(f)};i.click()});
}
function getImgDims(src){return new Promise(r=>{const i=new window.Image();i.onload=()=>r({w:i.width,h:i.height});i.onerror=()=>r({w:200,h:200});i.src=src})}

/** Mobile D-pad */
function DPad({onDir}){
  const T=useContext(ThemeCtx);
  const bc="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform select-none";
  const bs={background:T.accentDim,border:`1px solid ${T.accentBrd}`};
  const h=d=>e=>{e.preventDefault();onDir(d,true)};const r=d=>e=>{e.preventDefault();onDir(d,false)};
  return(<div className="fixed bottom-6 left-6 z-50 select-none" style={{touchAction:"none"}}>
    <div className="grid grid-cols-3 gap-1" style={{width:156}}>
      <div/><button className={bc} style={bs} onTouchStart={h("up")} onTouchEnd={r("up")} onMouseDown={h("up")} onMouseUp={r("up")}><ChevronUp size={22} color={T.accent}/></button><div/>
      <button className={bc} style={bs} onTouchStart={h("left")} onTouchEnd={r("left")} onMouseDown={h("left")} onMouseUp={r("left")}><ChevronLeft size={22} color={T.accent}/></button>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:T.btnBg}}><Move size={14} color={T.textMut}/></div>
      <button className={bc} style={bs} onTouchStart={h("right")} onTouchEnd={r("right")} onMouseDown={h("right")} onMouseUp={r("right")}><ChevronRight size={22} color={T.accent}/></button>
      <div/><button className={bc} style={bs} onTouchStart={h("down")} onTouchEnd={r("down")} onMouseDown={h("down")} onMouseUp={r("down")}><ChevronDown size={22} color={T.accent}/></button><div/>
    </div>
    <button className="mt-2 w-full h-11 rounded-xl font-bold text-sm tracking-widest select-none active:scale-95"
      style={{background:T.warnDim,border:`1px solid ${T.warn}`,color:T.warn}}
      onTouchStart={e=>{e.preventDefault();onDir("interact",true)}} onTouchEnd={e=>{e.preventDefault();onDir("interact",false)}}
      onMouseDown={()=>onDir("interact",true)} onMouseUp={()=>onDir("interact",false)}>⏎ INTERACT</button>
  </div>);
}

function Toast({msg,type="info",onDone}){
  const T=useContext(ThemeCtx);
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t)},[onDone]);
  const c={info:T.accent,error:T.danger,success:T.success};
  return(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2" style={{background:T.surface,border:`1px solid ${T.border}`,color:T.text}}>
    <div className="w-2 h-2 rounded-full" style={{background:c[type]||T.accent}}/>{msg}</div>);
}

/** Section label */
function Sec({title,children}){const T=useContext(ThemeCtx);return(<div className="space-y-1.5"><p className="font-semibold uppercase tracking-wider" style={{color:T.textMut,fontSize:9}}>{title}</p>{children}</div>)}

/** Property panel */
function PropPanel({obj,room,onChange,onDelete,onUnlinkAll,linking,onToggleLink}){
  const T=useContext(ThemeCtx);
  if(!obj)return(<div className="p-4 flex flex-col items-center h-32 justify-center" style={{color:T.textMut}}><MousePointer size={20} className="mb-2 opacity-40"/><p className="text-xs">Click to select</p></div>);
  const ch=(k,v)=>onChange(obj.id,k,v);
  return(
    <div className="p-3 space-y-3 text-xs overflow-y-auto" style={{maxHeight:"calc(100vh - 160px)"}}>
      <div>
        <input value={obj.name} className="w-full px-2 py-1.5 rounded text-sm font-semibold outline-none"
          style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
          onChange={e=>ch("name",e.target.value)}/>
        <p className="mt-0.5 uppercase tracking-widest font-semibold" style={{color:T.textMut,fontSize:9}}>{obj.type}</p>
      </div>

      {/* Embedded Link */}
      {(obj.type==="text"||obj.type==="image")&&(
        <Sec title="Link URL">
          <div className="flex gap-1">
            <input value={obj.link||""} placeholder="https://..." className="flex-1 px-2 py-1 rounded text-xs outline-none"
              style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
              onChange={e=>ch("link",e.target.value)}/>
            {obj.link&&<button onClick={()=>window.open(obj.link,"_blank")} className="p-1 rounded" style={{color:T.accent}}><ExternalLink size={12}/></button>}
          </div>
        </Sec>
      )}

      {/* Transform with sliders */}
      <Sec title="Transform">
        <SliderRow label="X" value={obj.x} onChange={v=>ch("x",v)} min={-200} max={room.width+200} step={1}/>
        <SliderRow label="Y" value={obj.y} onChange={v=>ch("y",v)} min={-200} max={room.height+200} step={1}/>
        <SliderRow label="W" value={obj.width} onChange={v=>ch("width",v)} min={8} max={2000}/>
        <SliderRow label="H" value={obj.height} onChange={v=>ch("height",v)} min={8} max={2000}/>
        <SliderRow label="Rotation" value={obj.rotation} onChange={v=>ch("rotation",v)} min={-180} max={180} step={1}/>
        <SliderRow label="Scale X" value={obj.scaleX} onChange={v=>ch("scaleX",v)} min={-5} max={5} step={0.1}/>
        <SliderRow label="Scale Y" value={obj.scaleY} onChange={v=>ch("scaleY",v)} min={-5} max={5} step={0.1}/>
        <div className="flex gap-1 pt-1">
          <Btn onClick={()=>ch("rotation",0)} title="Reset rotation"><RotateCw size={11}/> 0°</Btn>
          <Btn onClick={()=>ch("scaleX",obj.scaleX*-1)} title="Flip H"><FlipHorizontal size={11}/></Btn>
          <Btn onClick={()=>ch("scaleY",obj.scaleY*-1)} title="Flip V"><FlipVertical size={11}/></Btn>
        </div>
      </Sec>

      <Sec title="Ordering">
        <label className="flex items-center justify-between"><span style={{color:T.textDim}}>Layer</span>
          <select value={obj.layer} className="px-1.5 py-0.5 rounded text-xs outline-none"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
            onChange={e=>ch("layer",parseInt(e.target.value))}>
            <option value={LAYERS.BG}>Background</option><option value={LAYERS.OBJ}>Objects</option>
          </select></label>
        <SliderRow label="Z-Index" value={obj.zIndex} onChange={v=>ch("zIndex",v)} min={-50} max={50}/>
      </Sec>

      {/* TEXT PROPS */}
      {obj.type==="text"&&(
        <Sec title="Text">
          <textarea value={obj.text} rows={2} className="w-full px-2 py-1.5 rounded text-xs outline-none resize-y"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
            onChange={e=>ch("text",e.target.value)}/>
          <SliderRow label="Font Size" value={obj.fontSize} onChange={v=>ch("fontSize",v)} min={8} max={120}/>
          <label className="flex items-center justify-between"><span style={{color:T.textDim}}>Text Color</span>
            <input type="color" value={obj.color} onChange={e=>ch("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label>
          <label className="flex items-center justify-between"><span style={{color:T.textDim}}>BG Color</span>
            <div className="flex items-center gap-1">
              {obj.bgColor&&<button onClick={()=>ch("bgColor","")} className="text-xs px-1 rounded" style={{color:T.danger}}>Clear</button>}
              <input type="color" value={obj.bgColor||"#ffffff"} onChange={e=>ch("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/>
            </div></label>
        </Sec>
      )}

      {/* BUTTON PROPS */}
      {obj.type==="button"&&(
        <Sec title="Button">
          <label className="flex items-center justify-between"><span style={{color:T.textDim}}>Type</span>
            <select value={obj.buttonType} className="px-1.5 py-0.5 rounded text-xs outline-none"
              style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
              onChange={e=>ch("buttonType",e.target.value)}>
              <option value={BTN_TYPE.PRESS_E}>Press E</option>
              <option value={BTN_TYPE.FLOOR_TOGGLE}>Floor Toggle</option>
              <option value={BTN_TYPE.FLOOR_HOLD}>Floor Hold</option>
            </select></label>
          {/* Button images */}
          <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.textMut,fontSize:9}}>Button Images</p>
          <div className="flex gap-2">
            {["Inactive","Active"].map((lbl,idx)=>{
              const key=idx===0?"imgInactive":"imgActive";
              const val=obj[key];
              return(<div key={key} className="flex-1">
                <p style={{color:T.textDim,fontSize:10}} className="mb-0.5">{lbl}</p>
                {val?(<div className="relative group"><img src={val} alt="" className="w-full h-10 object-contain rounded" style={{background:T.bg}}/>
                  <button onClick={()=>ch(key,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100" style={{background:T.danger}}><X size={9} color="#fff"/></button>
                </div>):(<button onClick={async()=>{const r=await readFile("image/*");if(r)ch(key,r.data)}} className="w-full h-10 rounded flex items-center justify-center" style={{border:`1px dashed ${T.border}`,color:T.textMut,fontSize:10}}><Upload size={10} className="mr-1"/>Upload</button>)}
              </div>);
            })}
          </div>
          {/* Sound */}
          <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.textMut,fontSize:9}}>Sound Effect</p>
          {obj.customSound?(<div className="flex items-center gap-1">
            <Volume2 size={12} color={T.success}/><span style={{color:T.textDim}}>Custom sound</span>
            <button onClick={()=>ch("customSound","")} className="ml-auto p-0.5" style={{color:T.danger}}><X size={11}/></button>
          </div>):(<div className="flex items-center gap-1">
            <span style={{color:T.textMut,fontSize:10}}>Default synth tone</span>
            <button onClick={async()=>{const r=await readFile("audio/*");if(r)ch("customSound",r.data)}} className="ml-auto px-2 py-0.5 rounded text-xs" style={{border:`1px solid ${T.border}`,color:T.textDim}}><Upload size={10} className="inline mr-1"/>Upload</button>
          </div>)}
          {/* Link mode */}
          <button onClick={onToggleLink} className="w-full py-2 rounded-md text-xs font-semibold transition-colors mt-1"
            style={{background:linking?T.warnDim:T.accentDim,border:`1px solid ${linking?T.warn:T.accentBrd}`,color:linking?T.warn:T.textDim}}>
            {linking?"✓ Linking — Click targets":"🔗 Link to Objects"}</button>
          <div className="pt-0.5"><p style={{color:T.textMut}}>{obj.linkedIds.length} linked</p>
            {obj.linkedIds.map(lid=>{const lo=room.find(lid);return lo?(<div key={lid} className="flex items-center justify-between py-0.5 pl-1">
              <span style={{color:T.textDim}} className="truncate">{lo.name}</span>
              <button onClick={()=>ch("_unlink",lid)} className="p-0.5" style={{color:T.danger}}><X size={11}/></button></div>):null})}
          </div>
        </Sec>
      )}

      {/* Visibility */}
      {obj.type!=="button"&&(<label className="flex items-center justify-between px-1">
        <span style={{color:T.textDim}}>Visible</span>
        <button onClick={()=>ch("visible",!obj.visible)} className="p-1 rounded"
          style={{background:obj.visible?T.successDim:T.dangerDim}}>
          {obj.visible?<Eye size={13} color={T.success}/>:<EyeOff size={13} color={T.danger}/>}</button></label>)}

      <div className="space-y-1.5 pt-2" style={{borderTop:`1px solid ${T.border}`}}>
        <button onClick={()=>onUnlinkAll(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5"
          style={{background:T.warnDim,border:`1px solid ${T.warn}30`,color:T.warn}}><Unlink size={11}/> Remove All Links</button>
        <button onClick={()=>onDelete(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5"
          style={{background:T.dangerDim,border:`1px solid ${T.danger}30`,color:T.danger}}><Trash2 size={11}/> Delete</button>
      </div>
    </div>
  );
}

/** Cloud Share Modal */
function ShareModal({room,cloud,onClose,toast:doToast,onLoad,pushH}){
  const T=useContext(ThemeCtx);
  const[saving,setSaving]=useState(false);const[shareId,setShareId]=useState(null);
  const[loadId,setLoadId]=useState("");const[loading,setLoading]=useState(false);
  const[recent,setRecent]=useState([]);const[tab,setTab]=useState("share");
  useEffect(()=>{if(cloud.ok)cloud.listRooms(15).then(setRecent).catch(()=>{})},[cloud]);
  const handleShare=async()=>{setSaving(true);try{const id=await cloud.saveRoom(room);setShareId(id);const url=`${location.origin}${location.pathname}?room=${id}`;try{await navigator.clipboard.writeText(url);doToast("Link copied!","success")}catch{doToast("Shared! ID: "+id,"success")}}catch(e){doToast("Failed: "+e.message,"error")}setSaving(false)};
  const handleLoad=async(id)=>{setLoading(true);try{pushH();const r=await cloud.loadRoom(id);onLoad(r);doToast("Loaded!","success");onClose()}catch(e){doToast("Failed: "+e.message,"error")}setLoading(false)};
  return(<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50"/>
    <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" style={{background:T.surface,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-2"><Cloud size={16} color={T.accent}/><span className="font-semibold text-sm" style={{color:T.text}}>Cloud Sharing</span></div>
        <button onClick={onClose} style={{color:T.textMut}}><X size={16}/></button></div>
      <div className="flex" style={{borderBottom:`1px solid ${T.border}`}}>
        {[["share","Share"],["browse","Browse"],["load","Load ID"]].map(([id,l])=>(<button key={id} onClick={()=>setTab(id)} className="flex-1 py-2 text-xs font-medium" style={{color:tab===id?T.accent:T.textMut,borderBottom:tab===id?`2px solid ${T.accent}`:"2px solid transparent"}}>{l}</button>))}
      </div>
      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        {tab==="share"&&(<>
          <p className="text-xs" style={{color:T.textDim}}>Upload to cloud with all images, GIFs, and sounds.</p>
          <div className="p-3 rounded-lg" style={{background:T.bg}}><p className="text-sm font-semibold" style={{color:T.text}}>{room.roomName}</p><p className="text-xs mt-0.5" style={{color:T.textMut}}>{room.objects.length} objects</p></div>
          <button onClick={handleShare} disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent}}>{saving?"Uploading...":"Share to Cloud"}</button>
          {shareId&&<div className="p-2 rounded text-xs break-all" style={{background:T.successDim,color:T.success}}><Check size={12} className="inline mr-1"/>Shared! ID: {shareId}</div>}
        </>)}
        {tab==="browse"&&(<>{recent.length===0&&<p className="text-xs" style={{color:T.textMut}}>No rooms found.</p>}
          {recent.map(r=>(<button key={r.id} onClick={()=>handleLoad(r.id)} className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:brightness-110" style={{background:T.bg,border:`1px solid ${T.border}`}}>
            <div><p className="text-sm font-medium" style={{color:T.text}}>{r.name}</p><p className="text-xs mt-0.5" style={{color:T.textMut}}>{new Date(r.created_at).toLocaleDateString()}</p></div>
            <ExternalLink size={14} color={T.textMut}/></button>))}</>)}
        {tab==="load"&&(<>
          <input value={loadId} onChange={e=>setLoadId(e.target.value)} placeholder="Room ID or URL..." className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/>
          <button onClick={()=>{let id=loadId.trim();if(id.includes("room="))id=id.split("room=")[1].split("&")[0];if(id)handleLoad(id)}} disabled={loading||!loadId.trim()} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent}}>{loading?"Loading...":"Load"}</button>
        </>)}
      </div>
    </div>
  </div>);
}

/*╔═══════════════════════════════════════════════════════════════╗
  ║  SECTION 11: MAIN APPLICATION                                ║
  ╚═══════════════════════════════════════════════════════════════╝*/

export default function App(){
  // ── Theme ──
  const[themeName,setThemeName]=useState(()=>localStorage.getItem("rb_theme")||"light");
  const T=THEMES[themeName]||THEMES.light;
  // ── Cloud (auto-connected from hardcoded creds) ──
  const cloud=useMemo(()=>new CloudSvc(SUPABASE_URL,SUPABASE_KEY),[]);
  // ── Core state ──
  const[room,setRoom]=useState(()=>{
    // Show tutorial on first visit, otherwise load local save
    if(!localStorage.getItem("rb_visited")){localStorage.setItem("rb_visited","1");return createTutorialRoom()}
    return Ser.load()||createTutorialRoom();
  });
  const[editor,setEditor]=useState(false); // Start in play mode for tutorial
  const[selId,setSelId]=useState(null);
  const[showH,setShowH]=useState(false);
  const[camFollow,setCamFollow]=useState(true);
  const[zoom,setZoom]=useState(1);
  const[camPos,setCamPos]=useState({x:ROOM_W/2,y:ROOM_H/2});
  const[linking,setLinking]=useState(false);
  const[hovId,setHovId]=useState(null);
  const[toast,setToast]=useState(null);const[toastType,setToastType]=useState("info");
  const[showSave,setShowSave]=useState(false);
  const[showShare,setShowShare]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[mobile,setMobile]=useState(false);
  const[sidebar,setSidebar]=useState(true);
  const[tab,setTab]=useState("add");

  const canvasRef=useRef(null);const rendRef=useRef(null);const roomRef=useRef(room);
  const keysRef=useRef({});const histRef=useRef(new History());const dragRef=useRef(null);
  const afRef=useRef(null);const contRef=useRef(null);const[vp,setVp]=useState({w:800,h:600});
  const fileRef=useRef(null);
  roomRef.current=room;
  const doToast=useCallback((m,t="info")=>{setToast(m);setToastType(t)},[]);

  useEffect(()=>{setMobile("ontouchstart"in window||navigator.maxTouchPoints>0)},[]);

  // Load from URL param
  useEffect(()=>{
    const p=new URLSearchParams(location.search);const rid=p.get("room");
    if(rid&&cloud.ok)cloud.loadRoom(rid).then(r=>{setRoom(r);setCamPos({x:r.width/2,y:r.height/2});doToast("Room loaded!","success");setEditor(false)}).catch(e=>doToast("Load failed","error"));
  },[]); // eslint-disable-line

  useEffect(()=>{const el=contRef.current;if(!el)return;const ro=new ResizeObserver(e=>{const{width,height}=e[0].contentRect;setVp({w:width,h:height})});ro.observe(el);return()=>ro.disconnect()},[]);
  useEffect(()=>{if(canvasRef.current)rendRef.current=new Renderer(canvasRef.current)},[]);

  // Keyboard
  useEffect(()=>{
    const kd=e=>{
      const k=e.key.toLowerCase();keysRef.current[k]=true;
      if((e.ctrlKey||e.metaKey)&&k==="z"&&!e.shiftKey){e.preventDefault();doUndo()}
      if((e.ctrlKey||e.metaKey)&&k==="z"&&e.shiftKey){e.preventDefault();doRedo()}
      if((e.ctrlKey||e.metaKey)&&k==="y"){e.preventDefault();doRedo()}
      if((e.ctrlKey||e.metaKey)&&k==="d"){e.preventDefault();dupSel()}
      if(k==="e"&&!editor)interact();
      if((e.key==="Delete"||e.key==="Backspace")&&editor&&selId&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){e.preventDefault();delObj(selId)}
      if(e.key==="Escape"){setLinking(false);setSelId(null)}
    };
    const ku=e=>{keysRef.current[e.key.toLowerCase()]=false};
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    return()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku)};
  },[editor,selId]); // eslint-disable-line

  // Game loop
  useEffect(()=>{
    let run=true;
    const loop=()=>{
      if(!run)return;const r=roomRef.current,k=keysRef.current;
      if(!editor){
        let dx=0,dy=0;
        if(k.w||k.arrowup)dy-=r.player.speed;if(k.s||k.arrowdown)dy+=r.player.speed;
        if(k.a||k.arrowleft)dx-=r.player.speed;if(k.d||k.arrowright)dx+=r.player.speed;
        if(dx&&dy){dx*=0.707;dy*=0.707}
        if(dx||dy){
          r.player.move(dx,dy,r.width,r.height);
          const pb=r.player.bounds();
          for(const o of r.objects){
            if(!(o instanceof ButtonObject))continue;
            const ov=pb.x<o.x+o.width&&pb.x+pb.width>o.x&&pb.y<o.y+o.height&&pb.y+pb.height>o.y;
            if(o.buttonType===BTN_TYPE.FLOOR_TOGGLE){if(ov&&!o._was){o.toggle(r.objects,r.soundMuted);o._was=true}else if(!ov)o._was=false}
            else if(o.buttonType===BTN_TYPE.FLOOR_HOLD){if(ov)o.activate(r.objects,r.soundMuted);else o.deactivate(r.objects)}
          }
        }
      }
      const cx=camFollow?r.player.x:camPos.x,cy=camFollow?r.player.y:camPos.y;
      if(rendRef.current)rendRef.current.render({room:r,camX:cx,camY:cy,zoom,ed:editor,selId,showH,linking,hovId,vw:vp.w,vh:vp.h,T});
      afRef.current=requestAnimationFrame(loop);
    };
    afRef.current=requestAnimationFrame(loop);
    return()=>{run=false;if(afRef.current)cancelAnimationFrame(afRef.current)};
  },[editor,selId,showH,linking,hovId,camFollow,camPos,zoom,vp,T]);

  const pushH=useCallback(()=>{histRef.current.push(roomRef.current.toJSON())},[]);
  const doUndo=useCallback(()=>{const p=histRef.current.undo(roomRef.current.toJSON());if(p){setRoom(Room.fromJSON(p));setSelId(null)}},[]);
  const doRedo=useCallback(()=>{const n=histRef.current.redo(roomRef.current.toJSON());if(n){setRoom(Room.fromJSON(n));setSelId(null)}},[]);

  const chgProp=useCallback((id,k,v)=>{
    pushH();const r=roomRef.current,o=r.find(id);if(!o)return;
    if(k==="_unlink"&&o instanceof ButtonObject)o.unlink(v);
    else o[k]=v;
    if(k==="imgActive"&&o instanceof ButtonObject)o._loadA();
    if(k==="imgInactive"&&o instanceof ButtonObject)o._loadI();
    if((k==="x"||k==="y")&&r.gridOn)o.snap(r.gridSize);
    setRoom(Room.fromJSON(r.toJSON()));
  },[pushH]);

  const addText=useCallback(()=>{pushH();const r=roomRef.current;const o=new TextObject({x:r.width/2-80,y:r.height/2-20,text:"New Text",fontSize:24,color:"#333"});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(r.toJSON()));setSelId(o.id);setTab("props")},[pushH]);

  const addImage=useCallback(async()=>{
    const res=await readFile("image/png,image/jpeg,image/gif,image/webp,image/svg+xml");if(!res)return;
    pushH();const r=roomRef.current;const d=await getImgDims(res.data);
    let w=d.w,h=d.h;const mx=400;if(w>mx||h>mx){const s=mx/Math.max(w,h);w*=s;h*=s}
    const o=new ImageObject({x:r.width/2-w/2,y:r.height/2-h/2,width:w,height:h,src:res.data,name:res.name||"Image"});
    if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(r.toJSON()));setSelId(o.id);setTab("props");
  },[pushH]);

  const addBtn=useCallback(bt=>{pushH();const r=roomRef.current;const o=new ButtonObject({x:r.width/2-22,y:r.height/2-22,buttonType:bt});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(r.toJSON()));setSelId(o.id);setTab("props")},[pushH]);
  const delObj=useCallback(id=>{pushH();roomRef.current.remove(id);setRoom(Room.fromJSON(roomRef.current.toJSON()));setSelId(null);setLinking(false)},[pushH]);
  const unlinkAll=useCallback(id=>{pushH();roomRef.current.unlinkAll(id);setRoom(Room.fromJSON(roomRef.current.toJSON()))},[pushH]);
  const dupSel=useCallback(()=>{if(!selId)return;pushH();const n=roomRef.current.dup(selId);if(n){setRoom(Room.fromJSON(roomRef.current.toJSON()));setSelId(n.id)}},[selId,pushH]);
  const interact=useCallback(()=>{const r=roomRef.current;for(const o of r.objects){if(!(o instanceof ButtonObject)||o.buttonType!==BTN_TYPE.PRESS_E)continue;const c=o.center();if(Math.hypot(c.x-r.player.x,c.y-r.player.y)<INTERACT_R+o.width/2){o.toggle(r.objects,r.soundMuted);break}}},[]);

  // Canvas mouse
  const w2s=useCallback((cx,cy)=>{if(!canvasRef.current||!rendRef.current)return{wx:0,wy:0};const rect=canvasRef.current.getBoundingClientRect();const camX=camFollow?roomRef.current.player.x:camPos.x;const camY=camFollow?roomRef.current.player.y:camPos.y;return rendRef.current.s2w(cx-rect.left,cy-rect.top,camX,camY,zoom,vp.w,vp.h)},[camFollow,camPos,zoom,vp]);

  const onDown=useCallback(e=>{
    const{wx,wy}=w2s(e.clientX,e.clientY);const r=roomRef.current,hit=r.hitTest(wx,wy);
    if(!editor){
      // In play mode, clicking a linked object opens its URL
      if(hit&&hit.link&&hit.visible){window.open(hit.link,"_blank");return}
      return;
    }
    if(linking&&selId){if(hit&&hit.type!=="button"&&hit.id!==selId){pushH();const btn=r.find(selId);if(btn instanceof ButtonObject){if(btn.linkedIds.includes(hit.id))btn.unlink(hit.id);else btn.link(hit.id);setRoom(Room.fromJSON(r.toJSON()))}}return}
    if(hit){setSelId(hit.id);setTab("props");pushH();dragRef.current={id:hit.id,ox:wx-hit.x,oy:wy-hit.y}}
    else{setSelId(null);setLinking(false);if(!camFollow)dragRef.current={id:null,scx:camPos.x,scy:camPos.y,smx:e.clientX,smy:e.clientY}}
  },[editor,linking,selId,w2s,camFollow,camPos,pushH]);

  const onMove=useCallback(e=>{
    if(!editor)return;const{wx,wy}=w2s(e.clientX,e.clientY);
    if(linking){const h=roomRef.current.hitTest(wx,wy);setHovId(h?.id||null)}
    if(!dragRef.current)return;
    if(dragRef.current.id){const o=roomRef.current.find(dragRef.current.id);if(o){let nx=wx-dragRef.current.ox,ny=wy-dragRef.current.oy;if(roomRef.current.gridOn){nx=Math.round(nx/roomRef.current.gridSize)*roomRef.current.gridSize;ny=Math.round(ny/roomRef.current.gridSize)*roomRef.current.gridSize}o.x=nx;o.y=ny}}
    else if(dragRef.current.scx!==undefined)setCamPos({x:dragRef.current.scx-(e.clientX-dragRef.current.smx)/zoom,y:dragRef.current.scy-(e.clientY-dragRef.current.smy)/zoom});
  },[editor,linking,w2s,zoom]);

  const onUp=useCallback(()=>{if(dragRef.current?.id)setRoom(Room.fromJSON(roomRef.current.toJSON()));dragRef.current=null},[]);
  const onWheel=useCallback(e=>{e.preventDefault();setZoom(z=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,z-e.deltaY*0.001)))},[]);
  const dpadH=useCallback((d,p)=>{const km={up:"w",down:"s",left:"a",right:"d",interact:"e"};keysRef.current[km[d]]=p;if(d==="interact"&&p&&!editor)interact()},[editor,interact]);

  const chgRoom=useCallback((k,v)=>{setRoom(prev=>{const d=prev.toJSON();d[k]=v;return Room.fromJSON(d)})},[]);
  const chgPlayer=useCallback((k,v)=>{setRoom(prev=>{const d=prev.toJSON();d.player[k]=v;return Room.fromJSON(d)})},[]);

  const resetRoom=useCallback(()=>{pushH();setRoom(new Room());setSelId(null);doToast("Room cleared","info")},[pushH,doToast]);
  const restoreTutorial=useCallback(()=>{pushH();setRoom(createTutorialRoom());setSelId(null);setCamFollow(true);doToast("Tutorial restored","success")},[pushH,doToast]);

  const saveLocal=useCallback(()=>{Ser.save(roomRef.current);doToast("Saved!","success");setShowSave(false)},[doToast]);
  const loadLocal=useCallback(()=>{const l=Ser.load();if(l){pushH();setRoom(l);setCamPos({x:l.width/2,y:l.height/2});doToast("Loaded!","success")}else doToast("No save found","error");setShowSave(false)},[pushH,doToast]);
  const exportFile=useCallback(()=>{Ser.exportFile(roomRef.current,(roomRef.current.roomName||"room")+".json");doToast("Exported!","success");setShowSave(false)},[doToast]);
  const importFile=useCallback(async e=>{const f=e.target.files?.[0];if(!f)return;try{pushH();const l=await Ser.importFile(f);setRoom(l);setCamPos({x:l.width/2,y:l.height/2});doToast("Imported!","success")}catch{doToast("Failed","error")}e.target.value="";setShowSave(false)},[pushH,doToast]);

  const selObj=useMemo(()=>selId?room.find(selId):null,[room,selId]);

  return(
    <ThemeCtx.Provider value={T}>
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{background:T.bg,fontFamily:"'DM Mono','JetBrains Mono','Fira Code',ui-monospace,monospace",color:T.text}}>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importFile}/>
      {toast&&<Toast msg={toast} type={toastType} onDone={()=>setToast(null)}/>}
      {showShare&&cloud.ok&&<ShareModal room={room} cloud={cloud} onClose={()=>setShowShare(false)} toast={doToast} onLoad={r=>{setRoom(r);setCamPos({x:r.width/2,y:r.height/2})}} pushH={pushH}/>}

      {/* Settings Modal */}
      {showSettings&&(<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={()=>setShowSettings(false)}>
        <div className="absolute inset-0 bg-black/50"/>
        <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" style={{background:T.surface,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 sticky top-0" style={{background:T.surface,borderBottom:`1px solid ${T.border}`,zIndex:1}}>
            <div className="flex items-center gap-2"><Settings size={16} color={T.accent}/><span className="font-semibold text-sm" style={{color:T.text}}>Settings</span></div>
            <button onClick={()=>setShowSettings(false)} style={{color:T.textMut}}><X size={16}/></button></div>
          <div className="p-4 space-y-4">
            {/* Themes */}
            <Sec title="Color Theme">
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(THEMES).map(([k,v])=>(<button key={k} onClick={()=>{setThemeName(k);localStorage.setItem("rb_theme",k)}}
                  className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  style={{background:themeName===k?T.accentDim:T.bg,border:`1px solid ${themeName===k?T.accentBrd:T.border}`,color:themeName===k?T.accent:T.textDim}}>
                  <div className="w-3 h-3 rounded-full" style={{background:v.accent}}/>{v.label}</button>))}
              </div>
            </Sec>
            {/* Player */}
            <Sec title="Player">
              <SliderRow label="Speed" value={room.player.speed} onChange={v=>chgPlayer("speed",v)} min={1} max={10} step={0.5}/>
              <SliderRow label="Size" value={room.player.size} onChange={v=>chgPlayer("size",v)} min={12} max={60}/>
              <label className="flex items-center justify-between"><span className="text-xs" style={{color:T.textDim}}>Color</span>
                <input type="color" value={room.player.color} onChange={e=>chgPlayer("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label>
              <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.textMut,fontSize:9}}>Custom Sprite (2 frames max)</p>
              <p className="text-xs" style={{color:T.textMut}}>Sprite flips horizontally for direction. Always stays upright.</p>
              <div className="flex gap-2">
                {[["sprite1","Frame 1"],["sprite2","Frame 2"]].map(([k,lbl])=>{
                  const val=room.player[k];
                  return(<div key={k} className="flex-1">
                    <p style={{color:T.textDim,fontSize:10}} className="mb-0.5">{lbl}</p>
                    {val?(<div className="relative group"><img src={val} alt="" className="w-full h-14 object-contain rounded" style={{background:T.bg}}/>
                      <button onClick={()=>chgPlayer(k,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" style={{background:T.danger}}><X size={9} color="#fff"/></button>
                    </div>):(<button onClick={async()=>{const r=await readFile("image/*");if(r)chgPlayer(k,r.data)}} className="w-full h-14 rounded flex items-center justify-center" style={{border:`1px dashed ${T.border}`,color:T.textMut,fontSize:10}}><Upload size={10} className="mr-1"/>Upload</button>)}
                  </div>);
                })}
              </div>
            </Sec>
            {/* Sound */}
            <Sec title="Audio">
              <label className="flex items-center justify-between"><span className="text-xs" style={{color:T.textDim}}>Mute Sounds</span>
                <button onClick={()=>chgRoom("soundMuted",!room.soundMuted)} className="p-1.5 rounded" style={{background:room.soundMuted?T.dangerDim:T.successDim}}>
                  {room.soundMuted?<VolumeX size={14} color={T.danger}/>:<Volume2 size={14} color={T.success}/>}</button></label>
            </Sec>
            {/* Room */}
            <Sec title="Room">
              <label className="flex items-center justify-between"><span className="text-xs" style={{color:T.textDim}}>Background</span>
                <input type="color" value={room.bgColor} onChange={e=>chgRoom("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label>
            </Sec>
            {/* Cloud status */}
            <Sec title="Cloud">
              <div className="flex items-center gap-1.5 text-xs" style={{color:cloud.ok?T.success:T.textMut}}>
                {cloud.ok?<Cloud size={12}/>:<CloudOff size={12}/>}
                {cloud.ok?"Connected to Supabase":"Not configured"}</div>
            </Sec>
            {/* Reset / Tutorial */}
            <Sec title="Room Management">
              <div className="flex gap-2">
                <button onClick={resetRoom} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  style={{background:T.dangerDim,border:`1px solid ${T.danger}30`,color:T.danger}}><Trash2 size={12}/>Clear Room</button>
                <button onClick={restoreTutorial} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  style={{background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent}}><HelpCircle size={12}/>Tutorial</button>
              </div>
            </Sec>
          </div>
        </div>
      </div>)}

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 flex-shrink-0" style={{background:T.surface,borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:`linear-gradient(135deg,${T.accent},#7c4dff)`}}><Maximize2 size={11} color="#fff"/></div>
          <span className="text-xs font-bold tracking-wider hidden md:inline" style={{color:T.text}}>ROOM&nbsp;BUILDER</span>
        </div>
        {editor&&<input value={room.roomName} onChange={e=>chgRoom("roomName",e.target.value)} className="px-2 py-0.5 rounded text-xs font-medium w-24 outline-none hidden sm:block" style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/>}
        <div className="w-px h-5 mx-0.5" style={{background:T.border}}/>

        {/* Mode button shows what it SWITCHES TO */}
        <Btn onClick={()=>{setEditor(p=>!p);setSelId(null);setLinking(false)}}>
          {editor?<><Play size={12}/><span className="hidden sm:inline">Play</span></>:<><Pencil size={12}/><span className="hidden sm:inline">Edit</span></>}
        </Btn>
        <Btn active={camFollow} onClick={()=>setCamFollow(p=>!p)}>
          {camFollow?<Camera size={12}/>:<CameraOff size={12}/>}<span className="hidden sm:inline">{camFollow?"Follow":"Fixed"}</span>
        </Btn>
        {editor&&<><div className="w-px h-5 mx-0.5" style={{background:T.border}}/>
          <Btn active={room.gridOn} onClick={()=>chgRoom("gridOn",!room.gridOn)}><Grid3X3 size={12}/><span className="hidden sm:inline">Grid</span></Btn>
          <Btn active={showH} onClick={()=>setShowH(p=>!p)}>{showH?<Eye size={12}/>:<EyeOff size={12}/>}<span className="hidden sm:inline">Hidden</span></Btn>
          <div className="w-px h-5 mx-0.5" style={{background:T.border}}/>
          <Btn onClick={doUndo} title="Undo"><Undo2 size={12}/></Btn>
          <Btn onClick={doRedo} title="Redo"><Redo2 size={12}/></Btn>
          {selId&&<Btn onClick={dupSel} title="Duplicate (Ctrl+D)"><Copy size={12}/></Btn>}
        </>}
        <div className="flex items-center gap-0.5 ml-1">
          <Btn onClick={()=>setZoom(z=>Math.max(MIN_ZOOM,z-0.2))}><ZoomOut size={12}/></Btn>
          <span className="text-xs w-9 text-center" style={{color:T.textMut}}>{Math.round(zoom*100)}%</span>
          <Btn onClick={()=>setZoom(z=>Math.min(MAX_ZOOM,z+0.2))}><ZoomIn size={12}/></Btn>
        </div>
        <div className="flex-1"/>
        <Btn onClick={()=>setShowSettings(true)} title="Settings"><Settings size={12}/></Btn>
        <div className="relative">
          <Btn active={showSave} onClick={()=>setShowSave(p=>!p)}><Save size={12}/><span className="hidden sm:inline">Save</span></Btn>
          {showSave&&(<div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl py-1 z-50 min-w-[180px]" style={{background:T.surface,border:`1px solid ${T.border}`}}>
            {[{icon:<Save size={12}/>,label:"Save Local",action:saveLocal},{icon:<Upload size={12}/>,label:"Load Local",action:loadLocal},{icon:<Download size={12}/>,label:"Export JSON",action:exportFile},{icon:<Upload size={12}/>,label:"Import JSON",action:()=>fileRef.current?.click()}].map((it,i)=>(
              <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:brightness-110" style={{color:T.textDim}} onClick={it.action}>{it.icon}{it.label}</button>))}
          </div>)}
        </div>
        <Btn onClick={()=>{if(!cloud.ok){doToast("Supabase not configured — check SUPABASE_URL in code","error");return}setShowShare(true)}}>
          <Cloud size={12}/><span className="hidden sm:inline">Share</span></Btn>
        <Btn className="sm:hidden" onClick={()=>setSidebar(p=>!p)}><Menu size={12}/></Btn>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {editor&&(<div className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${sidebar?"w-56":"w-0 sm:w-56"}`} style={{background:T.surface,borderRight:`1px solid ${T.border}`}}>
          <div className="flex" style={{borderBottom:`1px solid ${T.border}`}}>
            {[["add","Add",<Plus size={12} key="a"/>],["props","Props",<Sliders size={12} key="p"/>]].map(([id,l,ic])=>(
              <button key={id} onClick={()=>setTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium"
                style={{color:tab===id?T.accent:T.textMut,borderBottom:tab===id?`2px solid ${T.accent}`:"2px solid transparent"}}>{ic}{l}</button>))}
          </div>
          {tab==="add"&&(<div className="p-3 space-y-2 overflow-y-auto flex-1">
            <p className="font-semibold uppercase tracking-wider" style={{color:T.textMut,fontSize:9}}>Objects</p>
            <button onClick={addText} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.border}`,color:T.textDim}}><Type size={14}/>Text Label</button>
            <button onClick={addImage} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.border}`,color:T.textDim}}><Image size={14}/>Image / GIF</button>
            <p className="font-semibold uppercase tracking-wider mt-3" style={{color:T.textMut,fontSize:9}}>Buttons</p>
            {[{t:BTN_TYPE.PRESS_E,l:"Press E",c:"#ef4444",lb:"E",d:"Walk near, press E"},{t:BTN_TYPE.FLOOR_TOGGLE,l:"Floor Toggle",c:"#f59e0b",lb:"F",d:"Step on to toggle"},{t:BTN_TYPE.FLOOR_HOLD,l:"Floor Hold",c:"#a855f7",lb:"H",d:"Shows while standing"}].map(b=>(
              <button key={b.t} onClick={()=>addBtn(b.t)} className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs hover:brightness-110 text-left" style={{border:`1px solid ${T.border}`}}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white font-bold" style={{background:b.c,fontSize:9}}>{b.lb}</div>
                <div><p style={{color:T.textDim}} className="font-medium">{b.l}</p><p style={{color:T.textMut,fontSize:10}}>{b.d}</p></div>
              </button>))}
            <div className="mt-3 pt-3 space-y-1.5" style={{borderTop:`1px solid ${T.border}`}}>
              <p className="font-semibold uppercase tracking-wider" style={{color:T.textMut,fontSize:9}}>Room</p>
              <SliderRow label="Width" value={room.width} onChange={v=>chgRoom("width",v)} min={400} max={5000} step={100}/>
              <SliderRow label="Height" value={room.height} onChange={v=>chgRoom("height",v)} min={400} max={5000} step={100}/>
              <SliderRow label="Grid" value={room.gridSize} onChange={v=>chgRoom("gridSize",v)} min={8} max={128} step={8}/>
            </div>
            <div className="mt-3 pt-3" style={{borderTop:`1px solid ${T.border}`}}>
              <p className="font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{color:T.textMut,fontSize:9}}><Layers size={10}/>Objects ({room.objects.length})</p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {room.sorted().map(o=>(<button key={o.id} onClick={()=>{setSelId(o.id);setTab("props")}}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left"
                  style={{background:o.id===selId?T.accentDim:"transparent",color:o.id===selId?T.accent:T.textDim}}>
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:o.type==="text"?"#22c55e":o.type==="image"?"#3b82f6":"#f59e0b"}}/>
                  <span className="truncate flex-1">{o.name}</span>
                  {!o.visible&&<EyeOff size={9} className="opacity-40"/>}
                  <span className="opacity-30 text-[10px]">{o.zIndex}</span>
                </button>))}
              </div>
            </div>
          </div>)}
          {tab==="props"&&<PropPanel obj={selObj} room={room} onChange={chgProp} onDelete={delObj} onUnlinkAll={unlinkAll} linking={linking} onToggleLink={()=>setLinking(p=>!p)}/>}
        </div>)}

        {/* CANVAS */}
        <div ref={contRef} className="flex-1 relative overflow-hidden" style={{cursor:editor?"crosshair":"default"}}>
          <canvas ref={canvasRef} className="w-full h-full block"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel}
            onTouchStart={e=>{if(e.touches.length===1){const t=e.touches[0];onDown({clientX:t.clientX,clientY:t.clientY})}}}
            onTouchMove={e=>{if(e.touches.length===1){const t=e.touches[0];onMove({clientX:t.clientX,clientY:t.clientY})}}}
            onTouchEnd={onUp}/>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider select-none"
            style={{background:editor?T.accentDim:T.successDim,border:`1px solid ${editor?T.accentBrd:`${T.success}40`}`,color:editor?T.accent:T.success}}>
            {editor?"EDITOR":"PLAY"}</div>
          {linking&&(<div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold select-none"
            style={{background:T.warnDim,border:`1px solid ${T.warn}50`,color:T.warn,animation:"pulse 2s infinite"}}>
            🔗 Click objects to link/unlink · ESC to cancel</div>)}
          {!editor&&!mobile&&(<div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs select-none"
            style={{background:`${T.surface}dd`,color:T.textDim}}>
            <b style={{color:T.text}}>WASD</b> Move <b style={{color:T.warn}}>E</b> Interact <b style={{color:T.text}}>Scroll</b> Zoom</div>)}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-[10px] select-none" style={{background:`${T.surface}cc`,color:T.textMut}}>
            {Math.round(room.player.x)},{Math.round(room.player.y)} · {Math.round(zoom*100)}%</div>
        </div>
      </div>

      {mobile&&!editor&&<DPad onDir={dpadH}/>}
      {showSave&&<div className="fixed inset-0 z-40" onClick={()=>setShowSave(false)}/>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
    </div>
    </ThemeCtx.Provider>
  );
}
