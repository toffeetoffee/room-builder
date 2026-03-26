import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import {
  Play, Pencil, Eye, EyeOff, Grid3X3, Undo2, Redo2, Save, Upload, Share2,
  Type, Image, Trash2, Link2, Unlink, Camera, CameraOff,
  Plus, Minus, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Download, X, Copy, ZoomIn, ZoomOut, MousePointer, Settings, Menu,
  Maximize2, Sun, Moon, Cloud, CloudOff, ExternalLink, RotateCw,
  FlipHorizontal, FlipVertical, Check, Volume2, VolumeX, Palette,
  HelpCircle, Sliders, Search, Globe, Lock, ClipboardCopy,
  Bold, Italic, Underline, Strikethrough, Users
} from "lucide-react";

/*╔══════════════════════════════════════════════════════════════╗
  ║  SUPABASE CREDENTIALS — Replace with your actual values     ║
  ╚══════════════════════════════════════════════════════════════╝*/
const SB_URL = "https://hnrkgqjedimvbnvvetwh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucmtncWplZGltdmJudnZldHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDg3NzEsImV4cCI6MjA5MDAyNDc3MX0.d6MHuoWFshhTlKy_LJWOLjJU5UcMWeUPj924dqllmWQ";

/*╔══════════════════════════════════════════════════════════════╗
  ║  CONSTANTS                                                   ║
  ╚══════════════════════════════════════════════════════════════╝*/
const RW=1600,RH=1200,GRID=32,MINZ=0.15,MAXZ=4,INTERACT_R=52;
const LY={BG:0,OBJ:1,PLR:2};
const BT={E:"pressE",FT:"floorToggle",FH:"floorHold"};
let _u=Date.now(); const uid=()=>`o${_u++}_${Math.random().toString(36).slice(2,6)}`;

// Font choices available for text objects
const FONTS=["sans-serif","serif","monospace","Georgia","Palatino","Garamond","Courier New","Comic Sans MS","Impact","Trebuchet MS","Verdana","Tahoma"];

/*╔══════════════════════════════════════════════════════════════╗
  ║  THEMES                                                      ║
  ╚══════════════════════════════════════════════════════════════╝*/
const TH={
  light:{label:"Light",bg:"#f5f5f8",srf:"#ffffff",border:"#dddde6",text:"#1a1a2e",dim:"#5a5a72",mut:"#9999aa",acc:"#0087a8",accD:"rgba(0,135,168,0.08)",accB:"rgba(0,135,168,0.3)",warn:"#d97706",warnD:"rgba(217,119,6,0.08)",dng:"#dc2626",dngD:"rgba(220,38,38,0.06)",ok:"#16a34a",okD:"rgba(22,163,74,0.06)",cvs:"#e4e4ec",bBg:"rgba(0,0,0,0.03)",bBr:"rgba(0,0,0,0.08)",gL:"rgba(0,0,0,0.06)"},
  dark:{label:"Dark",bg:"#0d0d18",srf:"#13131f",border:"#222236",text:"#e0e0ec",dim:"#8888a0",mut:"#555570",acc:"#00d4f5",accD:"rgba(0,212,245,0.1)",accB:"rgba(0,212,245,0.3)",warn:"#fbbf24",warnD:"rgba(251,191,36,0.1)",dng:"#ef4444",dngD:"rgba(239,68,68,0.08)",ok:"#22c55e",okD:"rgba(34,197,94,0.08)",cvs:"#0f0f1e",bBg:"rgba(255,255,255,0.04)",bBr:"rgba(255,255,255,0.08)",gL:"rgba(255,255,255,0.04)"},
  ocean:{label:"Ocean",bg:"#0b1628",srf:"#0f1d33",border:"#1a3050",text:"#d0e8ff",dim:"#7aa8cc",mut:"#4a7090",acc:"#00bcd4",accD:"rgba(0,188,212,0.12)",accB:"rgba(0,188,212,0.35)",warn:"#ff9800",warnD:"rgba(255,152,0,0.1)",dng:"#f44336",dngD:"rgba(244,67,54,0.08)",ok:"#4caf50",okD:"rgba(76,175,80,0.08)",cvs:"#081220",bBg:"rgba(255,255,255,0.04)",bBr:"rgba(255,255,255,0.06)",gL:"rgba(100,180,255,0.05)"},
  forest:{label:"Forest",bg:"#0f1a0f",srf:"#152015",border:"#2a3a2a",text:"#d4e8d0",dim:"#88aa84",mut:"#557755",acc:"#66bb6a",accD:"rgba(102,187,106,0.12)",accB:"rgba(102,187,106,0.35)",warn:"#ffb74d",warnD:"rgba(255,183,77,0.1)",dng:"#e57373",dngD:"rgba(229,115,115,0.08)",ok:"#81c784",okD:"rgba(129,199,132,0.08)",cvs:"#0a140a",bBg:"rgba(255,255,255,0.04)",bBr:"rgba(255,255,255,0.06)",gL:"rgba(100,200,100,0.05)"},
  sunset:{label:"Sunset",bg:"#1a0f0a",srf:"#241410",border:"#4a2820",text:"#f0d8cc",dim:"#c09080",mut:"#806050",acc:"#ff7043",accD:"rgba(255,112,67,0.12)",accB:"rgba(255,112,67,0.35)",warn:"#ffd54f",warnD:"rgba(255,213,79,0.1)",dng:"#ef5350",dngD:"rgba(239,83,80,0.08)",ok:"#66bb6a",okD:"rgba(102,187,106,0.08)",cvs:"#140a06",bBg:"rgba(255,255,255,0.04)",bBr:"rgba(255,255,255,0.06)",gL:"rgba(255,150,100,0.05)"},
  lavender:{label:"Lavender",bg:"#f5f0fa",srf:"#ffffff",border:"#d8d0e8",text:"#2a1a40",dim:"#6a5a80",mut:"#9990aa",acc:"#7c4dff",accD:"rgba(124,77,255,0.08)",accB:"rgba(124,77,255,0.3)",warn:"#f59e0b",warnD:"rgba(245,158,11,0.08)",dng:"#e11d48",dngD:"rgba(225,29,72,0.06)",ok:"#059669",okD:"rgba(5,150,105,0.06)",cvs:"#ece4f4",bBg:"rgba(100,50,200,0.03)",bBr:"rgba(100,50,200,0.08)",gL:"rgba(100,50,200,0.06)"}
};
const TC=createContext(TH.light);

/*╔══════════════════════════════════════════════════════════════╗
  ║  GIF ANIMATION ENGINE                                        ║
  ║  Inserts hidden <img> elements into the DOM so browsers      ║
  ║  animate the GIF frames. Canvas drawImage then captures      ║
  ║  the current frame each requestAnimationFrame tick.           ║
  ╚══════════════════════════════════════════════════════════════╝*/
let _gifContainer = null;
function getGifContainer(){
  if(!_gifContainer){
    _gifContainer=document.createElement("div");
    _gifContainer.style.cssText="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0";
    document.body.appendChild(_gifContainer);
  }
  return _gifContainer;
}
/** Create an image element that animates GIFs by living in the DOM */
function createAnimatedImage(src){
  const img=document.createElement("img");
  img.crossOrigin="anonymous";
  img.src=src;
  getGifContainer().appendChild(img);
  return img;
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  SOUND SYSTEM                                                ║
  ╚══════════════════════════════════════════════════════════════╝*/
let _ac=null;
function ac(){if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();return _ac}
function defSound(t){try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
  if(t===BT.E){o.frequency.value=660;o.type="square";g.gain.setValueAtTime(0.12,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.12)}
  else if(t===BT.FT){o.frequency.value=440;o.type="triangle";g.gain.setValueAtTime(0.1,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.18)}
  else{o.frequency.value=330;o.type="sine";g.gain.setValueAtTime(0.08,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.25)}
  o.start(c.currentTime);o.stop(c.currentTime+0.3)}catch(e){}}
function customSound(d){try{const a=new Audio(d);a.volume=0.3;a.play().catch(()=>{})}catch(e){}}
function btnSnd(b,m){if(m)return;b.customSound?customSound(b.customSound):defSound(b.buttonType)}

/*╔══════════════════════════════════════════════════════════════╗
  ║  OOP CLASSES                                                 ║
  ╚══════════════════════════════════════════════════════════════╝*/
class GO{
  constructor(p={}){this.id=p.id||uid();this.type=p.type||"base";this.x=p.x??100;this.y=p.y??100;
    this.width=p.width??64;this.height=p.height??64;this.rotation=p.rotation??0;
    this.scaleX=p.scaleX??1;this.scaleY=p.scaleY??1;this.zIndex=p.zIndex??0;
    this.layer=p.layer??LY.OBJ;this.visible=p.visible!==undefined?p.visible:true;
    this.name=p.name||"Object";this.link=p.link||""}
  ctr(){return{x:this.x+this.width/2,y:this.y+this.height/2}}
  hits(wx,wy){return wx>=this.x&&wx<=this.x+this.width&&wy>=this.y&&wy<=this.y+this.height}
  snap(g){this.x=Math.round(this.x/g)*g;this.y=Math.round(this.y/g)*g}
  _tf(c){c.translate(this.x+this.width/2,this.y+this.height/2);c.rotate(this.rotation*Math.PI/180);c.scale(this.scaleX,this.scaleY)}
  _sel(c){c.strokeStyle="#00d4f5";c.lineWidth=2;c.setLineDash([6,3]);c.strokeRect(-this.width/2-4,-this.height/2-4,this.width+8,this.height+8);c.setLineDash([]);
    c.fillStyle="#00d4f5";const w=this.width/2+4,h=this.height/2+4;for(const[x,y]of[[-w,-h],[w,-h],[-w,h],[w,h]])c.fillRect(x-3,y-3,6,6)}
  draw(c,e,s,sh){c.save();this._tf(c);if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}
    c.fillStyle="#888";c.fillRect(-this.width/2,-this.height/2,this.width,this.height);if(s)this._sel(c);c.restore()}
  toJSON(){return{id:this.id,type:this.type,x:this.x,y:this.y,width:this.width,height:this.height,rotation:this.rotation,scaleX:this.scaleX,scaleY:this.scaleY,zIndex:this.zIndex,layer:this.layer,visible:this.visible,name:this.name,link:this.link}}
}

/** Text with font styling: bold, italic, underline, strikethrough, font family, bg color */
class TxtObj extends GO{
  constructor(p={}){super({...p,type:"text"});this.text=p.text||"Hello";this.fontSize=p.fontSize??24;
    this.color=p.color||"#222";this.bgColor=p.bgColor||"";this.fontFamily=p.fontFamily||"sans-serif";
    this.bold=p.bold??false;this.italic=p.italic??false;this.underline=p.underline??false;
    this.strikethrough=p.strikethrough??false;this.name=p.name||"Text";
    this.width=p.width??Math.max(48,this.text.length*this.fontSize*0.55);
    this.height=p.height??(this.fontSize+20)}
  _font(){return`${this.italic?"italic ":""}${this.bold?"bold ":""}${this.fontSize}px ${this.fontFamily}`}
  draw(c,e,s,sh){
    c.save();this._tf(c);
    if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}
    if(this.bgColor){c.fillStyle=this.bgColor;c.beginPath();c.roundRect(-this.width/2,-this.height/2,this.width,this.height,4);c.fill()}
    else if(e){c.fillStyle="rgba(128,128,128,0.06)";c.fillRect(-this.width/2,-this.height/2,this.width,this.height)}
    c.fillStyle=this.color;c.font=this._font();c.textAlign="center";c.textBaseline="middle";
    const words=this.text.split(' '),lh=this.fontSize*1.2,lines=[];let cur='';
    for(const w of words){const t=cur?cur+' '+w:w;if(c.measureText(t).width>this.width-8&&cur){lines.push(cur);cur=w}else cur=t}
    if(cur)lines.push(cur);const sy=-lines.length*lh/2+lh/2;
    lines.forEach((l,i)=>{
      const ly=sy+i*lh;c.fillText(l,0,ly);
      const tw=c.measureText(l).width;
      if(this.underline){c.strokeStyle=this.color;c.lineWidth=1;c.beginPath();c.moveTo(-tw/2,ly+this.fontSize*0.35);c.lineTo(tw/2,ly+this.fontSize*0.35);c.stroke()}
      if(this.strikethrough){c.strokeStyle=this.color;c.lineWidth=1;c.beginPath();c.moveTo(-tw/2,ly);c.lineTo(tw/2,ly);c.stroke()}
    });
    if(s)this._sel(c);c.restore()}
  toJSON(){return{...super.toJSON(),text:this.text,fontSize:this.fontSize,color:this.color,bgColor:this.bgColor,fontFamily:this.fontFamily,bold:this.bold,italic:this.italic,underline:this.underline,strikethrough:this.strikethrough}}
}

/** Image/GIF with DOM-based animation */
class ImgObj extends GO{
  constructor(p={}){super({...p,type:"image"});this.src=p.src||"";this._img=null;this._ok=false;this.name=p.name||"Image";
    if(this.src)this._load()}
  _load(){this._img=createAnimatedImage(this.src);this._img.onload=()=>{this._ok=true}}
  draw(c,e,s,sh){c.save();this._tf(c);if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}
    if(this._ok&&this._img)c.drawImage(this._img,-this.width/2,-this.height/2,this.width,this.height);
    else{c.fillStyle="#2a2a3a";c.fillRect(-this.width/2,-this.height/2,this.width,this.height);c.fillStyle="#666";c.font="11px monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("Loading...",0,0)}
    if(s)this._sel(c);c.restore()}
  toJSON(){return{...super.toJSON(),src:this.src}}
}

/** Interactive button with custom images, sound, linking */
class BtnObj extends GO{
  constructor(p={}){super({...p,type:"button",width:p.width??44,height:p.height??44});
    this.buttonType=p.buttonType||BT.E;this.linkedIds=p.linkedIds||[];this.isActive=p.isActive??false;
    this.visible=true;this.name=p.name||"Button";this.imgActive=p.imgActive||"";this.imgInactive=p.imgInactive||"";
    this.customSound=p.customSound||"";this._iA=null;this._iI=null;this._iAk=false;this._iIk=false;
    if(this.imgActive)this._lA();if(this.imgInactive)this._lI()}
  _lA(){this._iA=createAnimatedImage(this.imgActive);this._iA.onload=()=>{this._iAk=true}}
  _lI(){this._iI=createAnimatedImage(this.imgInactive);this._iI.onload=()=>{this._iIk=true}}
  toggle(o,m){this.isActive=!this.isActive;this._sync(o);btnSnd(this,m)}
  activate(o,m){if(!this.isActive){this.isActive=true;this._sync(o);btnSnd(this,m)}}
  deactivate(o){if(this.isActive){this.isActive=false;this._sync(o)}}
  _sync(o){for(const x of o)if(this.linkedIds.includes(x.id))x.visible=this.isActive}
  link(id){if(!this.linkedIds.includes(id))this.linkedIds.push(id)}
  unlink(id){this.linkedIds=this.linkedIds.filter(i=>i!==id)}
  draw(c,e,s){c.save();this._tf(c);const r=this.width/2;
    const uA=this.isActive&&this._iAk&&this._iA,uI=!this.isActive&&this._iIk&&this._iI;
    if(uA)c.drawImage(this._iA,-this.width/2,-this.height/2,this.width,this.height);
    else if(uI)c.drawImage(this._iI,-this.width/2,-this.height/2,this.width,this.height);
    else{const cols={[BT.E]:this.isActive?"#22c55e":"#ef4444",[BT.FT]:this.isActive?"#84cc16":"#f59e0b",[BT.FH]:this.isActive?"#06b6d4":"#a855f7"};
      c.fillStyle=cols[this.buttonType]||"#888";c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
      const g=c.createRadialGradient(0,-r*0.3,0,0,0,r);g.addColorStop(0,"rgba(255,255,255,0.25)");g.addColorStop(1,"rgba(255,255,255,0)");
      c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
      c.fillStyle="#fff";c.font=`bold ${Math.max(10,r*0.5)}px monospace`;c.textAlign="center";c.textBaseline="middle";
      c.fillText({[BT.E]:"E",[BT.FT]:"F",[BT.FH]:"H"}[this.buttonType]||"?",0,1)}
    if(s){c.strokeStyle="#00d4f5";c.lineWidth=2.5;c.setLineDash([6,3]);c.beginPath();c.arc(0,0,r+6,0,Math.PI*2);c.stroke();c.setLineDash([])}
    c.restore()}
  toJSON(){return{...super.toJSON(),buttonType:this.buttonType,linkedIds:[...this.linkedIds],isActive:this.isActive,imgActive:this.imgActive,imgInactive:this.imgInactive,customSound:this.customSound}}
}

/** Player with custom sprite */
class Player{
  constructor(p={}){this.x=p.x??400;this.y=p.y??300;this.size=p.size??26;this.speed=p.speed??3;
    this.color=p.color??"#00d4f5";this.dir="down";this.sprite1=p.sprite1||"";this.sprite2=p.sprite2||"";
    this._s1=null;this._s2=null;this._s1k=false;this._s2k=false;this._fr=0;this._tk=0;
    if(this.sprite1)this._l1();if(this.sprite2)this._l2()}
  _l1(){this._s1=createAnimatedImage(this.sprite1);this._s1.onload=()=>{this._s1k=true}}
  _l2(){this._s2=createAnimatedImage(this.sprite2);this._s2.onload=()=>{this._s2k=true}}
  bounds(){const h=this.size/2;return{x:this.x-h,y:this.y-h,width:this.size,height:this.size}}
  move(dx,dy,rw,rh){const h=this.size/2;this.x=Math.max(h,Math.min(rw-h,this.x+dx));this.y=Math.max(h,Math.min(rh-h,this.y+dy));
    if(Math.abs(dx)>Math.abs(dy))this.dir=dx>0?"right":"left";else if(dy!==0)this.dir=dy>0?"down":"up";
    this._tk++;if(this._tk%10===0)this._fr=1-this._fr}
  draw(c){c.save();c.translate(this.x,this.y);
    if(this._s1k&&this._s1){const fx=this.dir==="left"?-1:1;c.scale(fx,1);
      const img=(this._fr===1&&this._s2k&&this._s2)?this._s2:this._s1;
      c.drawImage(img,-this.size/2,-this.size/2,this.size,this.size)}
    else{c.fillStyle="rgba(0,0,0,0.12)";c.beginPath();c.ellipse(0,this.size*0.4,this.size*0.42,this.size*0.13,0,0,Math.PI*2);c.fill();
      c.fillStyle=this.color;c.beginPath();c.arc(0,0,this.size/2,0,Math.PI*2);c.fill();
      c.strokeStyle="rgba(0,0,0,0.25)";c.lineWidth=1.5;c.stroke();
      const ig=c.createRadialGradient(-this.size*0.12,-this.size*0.12,0,0,0,this.size/2);ig.addColorStop(0,"rgba(255,255,255,0.3)");ig.addColorStop(1,"rgba(255,255,255,0)");
      c.fillStyle=ig;c.beginPath();c.arc(0,0,this.size/2,0,Math.PI*2);c.fill();
      c.fillStyle="#fff";const a=this.size*0.22;const dd={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
      const[dx,dy]=dd[this.dir]||[0,1];const t=this.size*0.3;
      c.beginPath();c.moveTo(dx*t,dy*t);c.lineTo(dx*t-dy*a*0.5-dx*a,dy*t+dx*a*0.5-dy*a);c.lineTo(dx*t+dy*a*0.5-dx*a,dy*t-dx*a*0.5-dy*a);c.closePath();c.fill()}
    c.restore()}
  toJSON(){return{x:this.x,y:this.y,size:this.size,speed:this.speed,color:this.color,sprite1:this.sprite1,sprite2:this.sprite2}}
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  ROOM & HISTORY                                              ║
  ╚══════════════════════════════════════════════════════════════╝*/
class Room{
  constructor(p={}){this.width=p.width??RW;this.height=p.height??RH;this.gridSize=p.gridSize??GRID;
    this.gridOn=p.gridOn??false;this.bgColor=p.bgColor||"#ffffff";this.roomName=p.roomName||"My Room";
    this.objects=p.objects||[];this.player=p.player||new Player({x:this.width/2,y:this.height/2});this.soundMuted=p.soundMuted??false}
  add(o){this.objects.push(o)}
  rm(id){for(const o of this.objects)if(o instanceof BtnObj)o.unlink(id);this.objects=this.objects.filter(o=>o.id!==id)}
  find(id){return this.objects.find(o=>o.id===id)}
  unlinkAll(id){for(const o of this.objects)if(o instanceof BtnObj)o.unlink(id)}
  sorted(){return[...this.objects].sort((a,b)=>a.layer!==b.layer?a.layer-b.layer:a.zIndex-b.zIndex)}
  hit(wx,wy){return this.sorted().reverse().find(o=>o.hits(wx,wy))||null}
  dup(id){const o=this.find(id);if(!o)return null;const j=o.toJSON();j.id=uid();j.x+=20;j.y+=20;j.name+=" copy";const n=Room.mk(j);this.objects.push(n);return n}
  toJSON(){return{width:this.width,height:this.height,gridSize:this.gridSize,gridOn:this.gridOn,bgColor:this.bgColor,roomName:this.roomName,objects:this.objects.map(o=>o.toJSON()),player:this.player.toJSON(),soundMuted:this.soundMuted}}
  static mk(o){switch(o.type){case"text":return new TxtObj(o);case"image":return new ImgObj(o);case"button":return new BtnObj(o);default:return new GO(o)}}
  static from(d){return new Room({...d,objects:(d.objects||[]).map(Room.mk),player:new Player(d.player||{})})}
}

/** Tutorial Room Factory — many small boxes with arrows */
function tutRoom(){
  const w=1600,h=1200;
  // Helper to create tutorial text boxes
  const t=(id,x,y,width,height,text,opts={})=>new TxtObj({id,x,y,width,height,text,fontSize:opts.fs||13,color:opts.c||"#333",bgColor:opts.bg||"#fff9c4",zIndex:opts.z||5,name:opts.n||"Tip",...opts});
  const objs=[
    // ─── TITLE ───
    t("t0",w/2-220,30,440,50,"Welcome to Room Builder!",{fs:30,c:"#1a1a2e",bg:"#e0f7fa",n:"Title"}),
    t("t0b",w/2-180,90,360,28,"Walk around with WASD. Try the buttons below!",{fs:14,c:"#555",bg:"",n:"Subtitle"}),

    // ─── TOP-LEFT TOOLBAR LABELS ───
    t("tl1",10,130,120,44,"⬆️ Mode\nSwitch Play/Edit",{fs:11,bg:"#bbdefb",n:"Mode tip"}),
    t("tl2",140,130,120,44,"⬆️ Camera\nFollow / Fixed",{fs:11,bg:"#bbdefb",n:"Camera tip"}),
    t("tl3",270,130,100,44,"⬆️ Grid\nSnap to grid",{fs:11,bg:"#c8e6c9",n:"Grid tip"}),
    t("tl4",380,130,110,44,"⬆️ Hidden\nShow hidden objs",{fs:11,bg:"#c8e6c9",n:"Hidden tip"}),
    t("tl5",500,130,120,44,"⬆️ Undo / Redo\nCtrl+Z / Ctrl+Y",{fs:11,bg:"#e1bee7",n:"Undo tip"}),
    t("tl6",630,130,110,44,"⬆️ Zoom\nScroll or +/- btns",{fs:11,bg:"#e1bee7",n:"Zoom tip"}),

    // ─── TOP-RIGHT TOOLBAR LABELS ───
    t("tr1",w-400,130,100,44,"⬆️ Settings\nThemes & player",{fs:11,bg:"#fff3e0",n:"Settings tip"}),
    t("tr2",w-290,130,110,44,"⬆️ Save\nLocal, file, JSON",{fs:11,bg:"#fff3e0",n:"Save tip"}),
    t("tr3",w-170,130,150,44,"⬆️ Cloud Share\nShare rooms online!",{fs:11,bg:"#fce4ec",n:"Share tip"}),

    // ─── SIDEBAR LABELS ───
    t("sl1",20,210,240,36,"⬅️ Sidebar: Add text, images, buttons",{fs:12,bg:"#e8eaf6",n:"Sidebar"}),
    t("sl2",20,256,240,36,"⬅️ Props tab: Edit selected object",{fs:12,bg:"#e8eaf6",n:"Props tip"}),
    t("sl3",20,302,240,60,"⬅️ Object list: Click to select\nDrag to rearrange on canvas",{fs:12,bg:"#e8eaf6",n:"List tip"}),

    // ─── MOVEMENT ───
    t("mv1",20,400,200,36,"🎮 WASD or Arrow Keys to move",{fs:13,bg:"#bbdefb",n:"Move"}),
    t("mv2",20,446,200,36,"📱 Mobile: D-pad appears",{fs:13,bg:"#bbdefb",n:"Mobile"}),
    t("mv3",20,492,200,50,"⚡ Settings → Player\nAdjust speed & sprite",{fs:12,bg:"#b2ebf2",n:"Speed"}),

    // ─── BUTTON DEMOS ───
    t("bt0",540,210,340,32,"Interactive Buttons — Try them!",{fs:20,c:"#1a1a2e",bg:"#f3e5f5",n:"Btns title"}),

    // Press E
    t("be1",540,260,280,28,"🔴 Walk near → Press E to toggle ⬇️",{fs:12,bg:"#ffcdd2",n:"E hint"}),
    new BtnObj({id:"be",x:840,y:258,buttonType:BT.E,linkedIds:["bes"],name:"Demo E"}),
    t("bes",540,296,300,30,"🎉 You toggled this!",{fs:15,c:"#16a34a",bg:"#dcfce7",n:"E secret",visible:false}),

    // Floor Toggle
    t("bf1",540,350,280,28,"🟠 Walk onto this → toggles text ⬇️",{fs:12,bg:"#ffe0b2",n:"F hint"}),
    new BtnObj({id:"bf",x:840,y:348,width:50,height:50,buttonType:BT.FT,linkedIds:["bfs"],name:"Demo Floor"}),
    t("bfs",540,386,300,30,"Floor toggled!",{fs:15,c:"#d97706",bg:"#fef3c7",n:"F msg",visible:false}),

    // Floor Hold
    t("bh1",540,446,280,28,"🟣 Stand on it → visible while on ⬇️",{fs:12,bg:"#e1bee7",n:"H hint"}),
    new BtnObj({id:"bh",x:840,y:444,width:50,height:50,buttonType:BT.FH,linkedIds:["bhs"],name:"Demo Hold"}),
    t("bhs",540,482,300,30,"Only while standing!",{fs:15,c:"#7c3aed",bg:"#ede9fe",n:"H msg",visible:false}),

    // ─── FEATURES GUIDE ───
    t("f1",540,540,200,28,"🖼️ Images & GIFs supported",{fs:12,bg:"#e0f2f1",n:"Img tip"}),
    t("f2",760,540,200,28,"🔗 Embed links on objects",{fs:12,bg:"#e0f2f1",n:"Link tip"}),
    t("f3",540,578,200,28,"🔊 Custom button sounds",{fs:12,bg:"#f1f8e9",n:"Sound tip"}),
    t("f4",760,578,200,28,"🎨 6 color themes",{fs:12,bg:"#f1f8e9",n:"Theme tip"}),
    t("f5",540,616,200,28,"👤 Custom player sprite",{fs:12,bg:"#e3f2fd",n:"Sprite tip"}),
    t("f6",760,616,200,28,"☁️ Cloud sharing",{fs:12,bg:"#e3f2fd",n:"Cloud tip"}),
    t("f7",540,654,200,28,"📐 Grid, layers, z-index",{fs:12,bg:"#fce4ec",n:"Layer tip"}),
    t("f8",760,654,200,28,"↩️ Undo/Redo, Ctrl+D dup",{fs:12,bg:"#fce4ec",n:"Undo tip"}),

    // ─── TIPS ───
    t("tp1",20,570,240,30,"💡 Delete key removes selected",{fs:12,bg:"#fff8e1",n:"Tip 1"}),
    t("tp2",20,610,240,30,"💡 Ctrl+D duplicates objects",{fs:12,bg:"#fff8e1",n:"Tip 2"}),
    t("tp3",20,650,240,30,"💡 Drag empty space to pan",{fs:12,bg:"#fff8e1",n:"Tip 3"}),
    t("tp4",20,690,240,40,"💡 Use 'Show Hidden' in editor\nto see invisible objects",{fs:12,bg:"#fff8e1",n:"Tip 4"}),

    // Start marker
    t("st",w/2-70,h/2+30,140,26,"↑ You start here",{fs:13,c:"#0087a8",bg:"rgba(0,135,168,0.08)",n:"Start"}),
  ];
  return new Room({width:w,height:h,roomName:"Tutorial Room",objects:objs,player:new Player({x:w/2,y:h/2-10}),bgColor:"#f8f9fc"});
}

class Hist{
  constructor(n=60){this.u=[];this.r=[];this.n=n}
  push(j){this.u.push(JSON.stringify(j));if(this.u.length>this.n)this.u.shift();this.r=[]}
  undo(c){if(!this.u.length)return null;this.r.push(JSON.stringify(c));return JSON.parse(this.u.pop())}
  redo(c){if(!this.r.length)return null;this.u.push(JSON.stringify(c));return JSON.parse(this.r.pop())}
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  CLOUD SERVICE (Supabase)                                    ║
  ║  Schema: rooms(id,name,data,created_at,nickname,is_public,visits) ║
  ╚══════════════════════════════════════════════════════════════╝*/
class Cloud{
  constructor(u,k){this.u=u?.replace(/\/$/,"");this.k=k;this.bkt="room-assets"}
  get ok(){return!!(this.u&&this.k&&!this.u.includes("YOUR_PROJECT"))}
  _h(ct){const h={Authorization:`Bearer ${this.k}`,apikey:this.k};if(ct)h["Content-Type"]=ct;return h}
  async upBlob(d,n){const r=await fetch(d);const b=await r.blob();const p=`${Date.now()}_${n}.${b.type.split("/")[1]||"bin"}`;
    const res=await fetch(`${this.u}/storage/v1/object/${this.bkt}/${p}`,{method:"POST",headers:{...this._h(b.type),"x-upsert":"true"},body:b});
    if(!res.ok)throw new Error(await res.text());return`${this.u}/storage/v1/object/public/${this.bkt}/${p}`}
  async _upAssets(d){
    for(let i=0;i<d.objects.length;i++){const o=d.objects[i];
      if(o.type==="image"&&o.src?.startsWith("data:"))o.src=await this.upBlob(o.src,`i${o.id}`);
      if(o.type==="button"){if(o.imgActive?.startsWith("data:"))o.imgActive=await this.upBlob(o.imgActive,`ba${o.id}`);
        if(o.imgInactive?.startsWith("data:"))o.imgInactive=await this.upBlob(o.imgInactive,`bi${o.id}`);
        if(o.customSound?.startsWith("data:"))o.customSound=await this.upBlob(o.customSound,`s${o.id}`)}}
    const p=d.player;if(p.sprite1?.startsWith("data:"))p.sprite1=await this.upBlob(p.sprite1,"sp1");
    if(p.sprite2?.startsWith("data:"))p.sprite2=await this.upBlob(p.sprite2,"sp2");return d}
  async saveRoom(room,nickname,isPublic){
    if(!this.ok)throw new Error("Not configured");let data=JSON.parse(JSON.stringify(room.toJSON()));
    data=await this._upAssets(data);const id=crypto.randomUUID();
    const res=await fetch(`${this.u}/rest/v1/rooms`,{method:"POST",
      headers:{...this._h("application/json"),Prefer:"resolution=merge-duplicates"},
      body:JSON.stringify({id,name:data.roomName||"Untitled",data,nickname:nickname||"Anonymous",is_public:isPublic!==false,visits:0})});
    if(!res.ok)throw new Error(await res.text());return id}
  async loadRoom(id){
    if(!this.ok)throw new Error("Not configured");
    const res=await fetch(`${this.u}/rest/v1/rooms?id=eq.${id}&select=*`,{headers:this._h("application/json")});
    if(!res.ok)throw new Error("Load failed");const rows=await res.json();if(!rows.length)throw new Error("Not found");
    // Increment visits
    try{await fetch(`${this.u}/rest/v1/rpc/increment_visits`,{method:"POST",headers:this._h("application/json"),body:JSON.stringify({room_id:id})})}catch(e){}
    return Room.from(rows[0].data)}
  async listRooms(n=30,search=""){
    if(!this.ok)return[];
    let url=`${this.u}/rest/v1/rooms?select=id,name,nickname,created_at,visits,is_public&is_public=eq.true&order=created_at.desc&limit=${n}`;
    if(search)url+=`&name=ilike.*${encodeURIComponent(search)}*`;
    const r=await fetch(url,{headers:this._h("application/json")});return r.ok?r.json():[]}
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  LOCAL SERIALIZATION                                         ║
  ╚══════════════════════════════════════════════════════════════╝*/
const Ser={
  save(r,s="room_default"){try{localStorage.setItem(s,JSON.stringify(r.toJSON()));return true}catch{return false}},
  load(s="room_default"){try{const d=localStorage.getItem(s);return d?Room.from(JSON.parse(d)):null}catch{return null}},
  exp(r,fn){const b=new Blob([JSON.stringify(r.toJSON(),null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=fn||"room.json";a.click();URL.revokeObjectURL(u)},
  imp(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(Room.from(JSON.parse(r.result)))}catch(e){rej(e)}};r.onerror=rej;r.readAsText(f)})}
};

/*╔══════════════════════════════════════════════════════════════╗
  ║  CANVAS RENDERER                                             ║
  ╚══════════════════════════════════════════════════════════════╝*/
class Ren{
  constructor(c){this.c=c;this.x=c.getContext("2d");this._linkHover=null}
  render({room,cx,cy,z,ed,selId,showH,lnk,hovId,vw,vh,T,mouseWx,mouseWy}){
    const c=this.x,dp=window.devicePixelRatio||1;this.c.width=vw*dp;this.c.height=vh*dp;
    c.setTransform(dp,0,0,dp,0,0);c.fillStyle=T.cvs;c.fillRect(0,0,vw,vh);
    c.save();c.translate(vw/2,vh/2);c.scale(z,z);c.translate(-cx,-cy);
    c.fillStyle=room.bgColor;c.fillRect(0,0,room.width,room.height);
    c.strokeStyle=T.border;c.lineWidth=2;c.strokeRect(0,0,room.width,room.height);
    if(room.gridOn){c.strokeStyle=T.gL;c.lineWidth=1;for(let x=0;x<=room.width;x+=room.gridSize){c.beginPath();c.moveTo(x,0);c.lineTo(x,room.height);c.stroke()}for(let y=0;y<=room.height;y+=room.gridSize){c.beginPath();c.moveTo(0,y);c.lineTo(room.width,y);c.stroke()}}
    for(const o of room.sorted())o.draw(c,ed,o.id===selId,showH);
    if(ed)for(const o of room.objects){if(!(o instanceof BtnObj)||!o.linkedIds.length)continue;const f=o.ctr();for(const lid of o.linkedIds){const t=room.find(lid);if(!t)continue;const tc=t.ctr();const hi=o.id===selId||lnk;c.strokeStyle=hi?"#fbbf24":"rgba(251,191,36,0.2)";c.lineWidth=hi?2.5:1.5;c.setLineDash([8,4]);c.beginPath();c.moveTo(f.x,f.y);c.lineTo(tc.x,tc.y);c.stroke();c.setLineDash([]);c.fillStyle=hi?"#fbbf24":"rgba(251,191,36,0.35)";c.beginPath();c.arc(tc.x,tc.y,4,0,Math.PI*2);c.fill()}}
    // Play mode overlays
    this._linkHover=null;
    if(!ed){const px=room.player.x,py=room.player.y;
      for(const o of room.objects){if(!(o instanceof BtnObj)||o.buttonType!==BT.E)continue;const ct=o.ctr();if(Math.hypot(ct.x-px,ct.y-py)<INTERACT_R+o.width/2){c.fillStyle="rgba(0,0,0,0.75)";c.beginPath();c.roundRect(ct.x-38,ct.y-o.height/2-34,76,24,6);c.fill();c.fillStyle="#fbbf24";c.font="bold 11px monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("⏎ Press E",ct.x,ct.y-o.height/2-22)}}
      // Detect link hover for cursor change
      for(const o of room.objects){if(!o.link||!o.visible)continue;if(o.hits(mouseWx,mouseWy)){this._linkHover=o.id;
        c.strokeStyle="rgba(59,130,246,0.4)";c.lineWidth=2;c.setLineDash([4,3]);c.strokeRect(o.x-1,o.y-1,o.width+2,o.height+2);c.setLineDash([])}}
    }
    room.player.draw(c);
    if(ed&&lnk&&hovId){const h=room.find(hovId);if(h&&h.type!=="button"){c.strokeStyle="#fbbf24";c.lineWidth=3;c.setLineDash([5,5]);c.strokeRect(h.x-3,h.y-3,h.width+6,h.height+6);c.setLineDash([])}}
    c.restore();return this._linkHover}
  s2w(sx,sy,cx,cy,z,vw,vh){return{wx:(sx-vw/2)/z+cx,wy:(sy-vh/2)/z+cy}}
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  UI COMPONENTS                                               ║
  ╚══════════════════════════════════════════════════════════════╝*/
function B({children,active,onClick,title,style,className=""}){const T=useContext(TC);
  return(<button onClick={onClick} title={title} className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110 active:scale-95 ${className}`}
    style={{background:active?T.accD:T.bBg,border:`1px solid ${active?T.accB:T.bBr}`,color:active?T.acc:T.dim,...style}}>{children}</button>)}

function SR({label,value,onChange,min,max,step=1}){const T=useContext(TC);
  return(<div className="space-y-0.5"><div className="flex items-center justify-between"><span className="text-xs" style={{color:T.dim}}>{label}</span>
    <input type="number" value={value} min={min} max={max} step={step} className="w-16 px-1 py-0.5 rounded text-right text-xs outline-none"
      style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}} onChange={e=>onChange(parseFloat(e.target.value)||0)}/></div>
    <input type="range" min={min} max={max} step={step} value={value} className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{background:T.border,accentColor:T.acc}} onChange={e=>onChange(parseFloat(e.target.value))}/></div>)}

function readF(accept){return new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept=accept;i.onchange=()=>{const f=i.files?.[0];if(!f){res(null);return}const r=new FileReader();r.onload=()=>res({data:r.result,name:f.name});r.readAsDataURL(f)};i.click()})}
function imgDims(s){return new Promise(r=>{const i=new window.Image();i.onload=()=>r({w:i.width,h:i.height});i.onerror=()=>r({w:200,h:200});i.src=s})}

function DPad({onDir}){const T=useContext(TC);const bc="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform select-none";
  const bs={background:T.accD,border:`1px solid ${T.accB}`};const h=d=>e=>{e.preventDefault();onDir(d,true)};const r=d=>e=>{e.preventDefault();onDir(d,false)};
  return(<div className="fixed bottom-6 left-6 z-50 select-none" style={{touchAction:"none"}}><div className="grid grid-cols-3 gap-1" style={{width:156}}>
    <div/><button className={bc} style={bs} onTouchStart={h("up")} onTouchEnd={r("up")} onMouseDown={h("up")} onMouseUp={r("up")}><ChevronUp size={22} color={T.acc}/></button><div/>
    <button className={bc} style={bs} onTouchStart={h("left")} onTouchEnd={r("left")} onMouseDown={h("left")} onMouseUp={r("left")}><ChevronLeft size={22} color={T.acc}/></button>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:T.bBg}}><Move size={14} color={T.mut}/></div>
    <button className={bc} style={bs} onTouchStart={h("right")} onTouchEnd={r("right")} onMouseDown={h("right")} onMouseUp={r("right")}><ChevronRight size={22} color={T.acc}/></button>
    <div/><button className={bc} style={bs} onTouchStart={h("down")} onTouchEnd={r("down")} onMouseDown={h("down")} onMouseUp={r("down")}><ChevronDown size={22} color={T.acc}/></button><div/>
  </div><button className="mt-2 w-full h-11 rounded-xl font-bold text-sm tracking-widest select-none active:scale-95"
    style={{background:T.warnD,border:`1px solid ${T.warn}`,color:T.warn}}
    onTouchStart={e=>{e.preventDefault();onDir("interact",true)}} onTouchEnd={e=>{e.preventDefault();onDir("interact",false)}}
    onMouseDown={()=>onDir("interact",true)} onMouseUp={()=>onDir("interact",false)}>⏎ INTERACT</button></div>)}

function Toast({msg,type="info",onDone}){const T=useContext(TC);useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t)},[onDone]);
  return(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2" style={{background:T.srf,border:`1px solid ${T.border}`,color:T.text}}>
    <div className="w-2 h-2 rounded-full" style={{background:{info:T.acc,error:T.dng,success:T.ok}[type]||T.acc}}/>{msg}</div>)}

function Sec({title,children}){const T=useContext(TC);return(<div className="space-y-1.5"><p className="font-semibold uppercase tracking-wider" style={{color:T.mut,fontSize:9}}>{title}</p>{children}</div>)}

/** Property Panel */
function PP({obj,room,onChange,onDel,onUnlink,lnk,onTogLink}){
  const T=useContext(TC);
  if(!obj)return(<div className="p-4 flex flex-col items-center h-32 justify-center" style={{color:T.mut}}><MousePointer size={20} className="mb-2 opacity-40"/><p className="text-xs">Click to select</p></div>);
  const ch=(k,v)=>onChange(obj.id,k,v);
  return(
    <div className="p-3 space-y-3 text-xs overflow-y-auto" style={{maxHeight:"calc(100vh - 160px)"}}>
      <div><input value={obj.name} className="w-full px-2 py-1.5 rounded text-sm font-semibold outline-none"
        style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}} onChange={e=>ch("name",e.target.value)}/>
        <p className="mt-0.5 uppercase tracking-widest font-semibold" style={{color:T.mut,fontSize:9}}>{obj.type}</p></div>

      {(obj.type==="text"||obj.type==="image")&&(<Sec title="Link URL">
        <div className="flex gap-1"><input value={obj.link||""} placeholder="https://..." className="flex-1 px-2 py-1 rounded text-xs outline-none"
          style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}} onChange={e=>ch("link",e.target.value)}/>
          {obj.link&&<button onClick={()=>window.open(obj.link,"_blank")} className="p-1 rounded" style={{color:T.acc}}><ExternalLink size={12}/></button>}</div>
        <p style={{color:T.mut,fontSize:10}}>Click in play mode to open</p></Sec>)}

      <Sec title="Transform">
        <SR label="X" value={obj.x} onChange={v=>ch("x",v)} min={-200} max={room.width+200}/>
        <SR label="Y" value={obj.y} onChange={v=>ch("y",v)} min={-200} max={room.height+200}/>
        <SR label="W" value={obj.width} onChange={v=>ch("width",v)} min={8} max={2000}/>
        <SR label="H" value={obj.height} onChange={v=>ch("height",v)} min={8} max={2000}/>
        <SR label="Rotation" value={obj.rotation} onChange={v=>ch("rotation",v)} min={-180} max={180}/>
        <SR label="Scale X" value={obj.scaleX} onChange={v=>ch("scaleX",v)} min={-5} max={5} step={0.1}/>
        <SR label="Scale Y" value={obj.scaleY} onChange={v=>ch("scaleY",v)} min={-5} max={5} step={0.1}/>
        <div className="flex gap-1 pt-1"><B onClick={()=>ch("rotation",0)}><RotateCw size={11}/> 0°</B>
          <B onClick={()=>ch("scaleX",obj.scaleX*-1)}><FlipHorizontal size={11}/></B>
          <B onClick={()=>ch("scaleY",obj.scaleY*-1)}><FlipVertical size={11}/></B></div></Sec>

      <Sec title="Ordering">
        <label className="flex items-center justify-between"><span style={{color:T.dim}}>Layer</span>
          <select value={obj.layer} className="px-1.5 py-0.5 rounded text-xs outline-none"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
            onChange={e=>ch("layer",parseInt(e.target.value))}><option value={LY.BG}>Background</option><option value={LY.OBJ}>Objects</option></select></label>
        <SR label="Z-Index" value={obj.zIndex} onChange={v=>ch("zIndex",v)} min={-50} max={50}/></Sec>

      {obj.type==="text"&&(<Sec title="Text">
        <textarea value={obj.text} rows={2} className="w-full px-2 py-1.5 rounded text-xs outline-none resize-y"
          style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}} onChange={e=>ch("text",e.target.value)}/>
        <SR label="Font Size" value={obj.fontSize} onChange={v=>ch("fontSize",v)} min={8} max={120}/>
        {/* Font family picker */}
        <label className="flex items-center justify-between"><span style={{color:T.dim}}>Font</span>
          <select value={obj.fontFamily} className="px-1.5 py-0.5 rounded text-xs outline-none max-w-[120px]"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}
            onChange={e=>ch("fontFamily",e.target.value)}>
            {FONTS.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}</select></label>
        {/* Style toggles */}
        <div className="flex gap-1"><B active={obj.bold} onClick={()=>ch("bold",!obj.bold)} title="Bold"><Bold size={12}/></B>
          <B active={obj.italic} onClick={()=>ch("italic",!obj.italic)} title="Italic"><Italic size={12}/></B>
          <B active={obj.underline} onClick={()=>ch("underline",!obj.underline)} title="Underline"><Underline size={12}/></B>
          <B active={obj.strikethrough} onClick={()=>ch("strikethrough",!obj.strikethrough)} title="Strikethrough"><Strikethrough size={12}/></B></div>
        <label className="flex items-center justify-between"><span style={{color:T.dim}}>Text Color</span>
          <input type="color" value={obj.color} onChange={e=>ch("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label>
        <label className="flex items-center justify-between"><span style={{color:T.dim}}>BG Color</span>
          <div className="flex items-center gap-1">{obj.bgColor&&<button onClick={()=>ch("bgColor","")} className="text-xs px-1 rounded" style={{color:T.dng}}>Clear</button>}
            <input type="color" value={obj.bgColor||"#ffffff"} onChange={e=>ch("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></div></label></Sec>)}

      {obj.type==="button"&&(<Sec title="Button">
        <label className="flex items-center justify-between"><span style={{color:T.dim}}>Type</span>
          <select value={obj.buttonType} className="px-1.5 py-0.5 rounded text-xs outline-none"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}} onChange={e=>ch("buttonType",e.target.value)}>
            <option value={BT.E}>Press E</option><option value={BT.FT}>Floor Toggle</option><option value={BT.FH}>Floor Hold</option></select></label>
        <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.mut,fontSize:9}}>Button Images</p>
        <div className="flex gap-2">{["Inactive","Active"].map((lbl,idx)=>{const key=idx===0?"imgInactive":"imgActive";const val=obj[key];
          return(<div key={key} className="flex-1"><p style={{color:T.dim,fontSize:10}} className="mb-0.5">{lbl}</p>
            {val?(<div className="relative group"><img src={val} alt="" className="w-full h-10 object-contain rounded" style={{background:T.bg}}/>
              <button onClick={()=>ch(key,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100" style={{background:T.dng}}><X size={9} color="#fff"/></button></div>)
            :(<button onClick={async()=>{const r=await readF("image/*");if(r)ch(key,r.data)}} className="w-full h-10 rounded flex items-center justify-center" style={{border:`1px dashed ${T.border}`,color:T.mut,fontSize:10}}><Upload size={10} className="mr-1"/>Upload</button>)}</div>)})}</div>
        <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.mut,fontSize:9}}>Sound</p>
        {obj.customSound?(<div className="flex items-center gap-1"><Volume2 size={12} color={T.ok}/><span style={{color:T.dim}}>Custom</span>
          <button onClick={()=>ch("customSound","")} className="ml-auto p-0.5" style={{color:T.dng}}><X size={11}/></button></div>)
        :(<div className="flex items-center gap-1"><span style={{color:T.mut,fontSize:10}}>Default tone</span>
          <button onClick={async()=>{const r=await readF("audio/*");if(r)ch("customSound",r.data)}} className="ml-auto px-2 py-0.5 rounded text-xs" style={{border:`1px solid ${T.border}`,color:T.dim}}><Upload size={10} className="inline mr-1"/>Upload</button></div>)}
        <button onClick={onTogLink} className="w-full py-2 rounded-md text-xs font-semibold mt-1"
          style={{background:lnk?T.warnD:T.accD,border:`1px solid ${lnk?T.warn:T.accB}`,color:lnk?T.warn:T.dim}}>
          {lnk?"✓ Click targets to link":"🔗 Link to Objects"}</button>
        <div className="pt-0.5"><p style={{color:T.mut}}>{obj.linkedIds.length} linked</p>
          {obj.linkedIds.map(lid=>{const lo=room.find(lid);return lo?(<div key={lid} className="flex items-center justify-between py-0.5 pl-1">
            <span style={{color:T.dim}} className="truncate">{lo.name}</span>
            <button onClick={()=>ch("_unlink",lid)} className="p-0.5" style={{color:T.dng}}><X size={11}/></button></div>):null})}</div></Sec>)}

      {obj.type!=="button"&&(<label className="flex items-center justify-between px-1"><span style={{color:T.dim}}>Visible</span>
        <button onClick={()=>ch("visible",!obj.visible)} className="p-1 rounded" style={{background:obj.visible?T.okD:T.dngD}}>
          {obj.visible?<Eye size={13} color={T.ok}/>:<EyeOff size={13} color={T.dng}/>}</button></label>)}

      <div className="space-y-1.5 pt-2" style={{borderTop:`1px solid ${T.border}`}}>
        <button onClick={()=>onUnlink(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5"
          style={{background:T.warnD,border:`1px solid ${T.warn}30`,color:T.warn}}><Unlink size={11}/> Unlink All</button>
        <button onClick={()=>onDel(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5"
          style={{background:T.dngD,border:`1px solid ${T.dng}30`,color:T.dng}}><Trash2 size={11}/> Delete</button></div>
    </div>);
}

/** Share Modal with nickname, public/private, search, visits, copy ID */
function ShareM({room,cloud,onClose,toast:dt,onLoad,pushH}){
  const T=useContext(TC);
  const[tab,setTab]=useState("share");
  const[saving,setSaving]=useState(false);const[shareId,setShareId]=useState(null);
  const[nick,setNick]=useState(()=>localStorage.getItem("rb_nick")||"");
  const[rName,setRName]=useState(room.roomName);
  const[isPub,setIsPub]=useState(true);
  const[loadId,setLoadId]=useState("");const[loading,setLoading]=useState(false);
  const[recent,setRecent]=useState([]);const[search,setSearch]=useState("");
  const doSearch=useCallback(()=>{if(cloud.ok)cloud.listRooms(30,search).then(setRecent).catch(()=>{})},[cloud,search]);
  useEffect(()=>{doSearch()},[doSearch]);

  const handleShare=async()=>{if(!nick.trim()){dt("Enter a nickname","error");return}
    localStorage.setItem("rb_nick",nick);setSaving(true);
    try{const r2={...room};r2.roomName=rName;const id=await cloud.saveRoom(r2,nick,isPub);setShareId(id);
      const url=`${location.origin}${location.pathname}?room=${id}`;
      try{await navigator.clipboard.writeText(url);dt("Link copied!","success")}catch{dt("Shared!","success")}}
    catch(e){dt("Failed: "+e.message,"error")}setSaving(false)};

  const copyId=async()=>{if(!shareId)return;try{await navigator.clipboard.writeText(shareId);dt("ID copied!","success")}catch{dt("Copy failed","error")}};

  const handleLoad=async id=>{setLoading(true);try{pushH();const r=await cloud.loadRoom(id);onLoad(r);dt("Loaded!","success");onClose()}catch(e){dt("Failed: "+e.message,"error")}setLoading(false)};

  return(<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50"/>
    <div className="relative rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" style={{background:T.srf,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-2"><Cloud size={16} color={T.acc}/><span className="font-semibold text-sm" style={{color:T.text}}>Cloud</span></div>
        <button onClick={onClose} style={{color:T.mut}}><X size={16}/></button></div>
      <div className="flex" style={{borderBottom:`1px solid ${T.border}`}}>
        {[["share","Share"],["browse","Browse"],["load","Load ID"]].map(([id,l])=>(<button key={id} onClick={()=>setTab(id)} className="flex-1 py-2 text-xs font-medium" style={{color:tab===id?T.acc:T.mut,borderBottom:tab===id?`2px solid ${T.acc}`:"2px solid transparent"}}>{l}</button>))}</div>
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {tab==="share"&&(<>
          <div className="space-y-2">
            <label className="block"><span className="text-xs font-medium" style={{color:T.dim}}>Your Nickname</span>
              <input value={nick} onChange={e=>setNick(e.target.value)} placeholder="Enter nickname..." className="w-full px-3 py-2 rounded-lg text-sm outline-none mt-1"
                style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/></label>
            <label className="block"><span className="text-xs font-medium" style={{color:T.dim}}>Room Name</span>
              <input value={rName} onChange={e=>setRName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none mt-1"
                style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/></label>
            <div className="flex gap-2">
              <button onClick={()=>setIsPub(true)} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{background:isPub?T.accD:T.bBg,border:`1px solid ${isPub?T.accB:T.bBr}`,color:isPub?T.acc:T.dim}}><Globe size={12}/>Public</button>
              <button onClick={()=>setIsPub(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{background:!isPub?T.accD:T.bBg,border:`1px solid ${!isPub?T.accB:T.bBr}`,color:!isPub?T.acc:T.dim}}><Lock size={12}/>Private (ID only)</button>
            </div></div>
          <div className="p-3 rounded-lg" style={{background:T.bg}}><p className="text-sm font-semibold" style={{color:T.text}}>{rName}</p>
            <p className="text-xs mt-0.5" style={{color:T.mut}}>{room.objects.length} objects · by {nick||"?"}</p>
            <p className="text-xs" style={{color:T.mut}}>{isPub?"Will appear in Browse":"Only accessible via direct link/ID"}</p></div>
          <button onClick={handleShare} disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{background:T.accD,border:`1px solid ${T.accB}`,color:T.acc}}>{saving?"Uploading...":"Share"}</button>
          {shareId&&(<div className="p-3 rounded-lg space-y-2" style={{background:T.okD}}>
            <div className="flex items-center gap-2"><Check size={14} color={T.ok}/><span className="text-sm font-semibold" style={{color:T.ok}}>Shared!</span></div>
            <div className="flex items-center gap-1"><code className="flex-1 text-xs break-all p-1.5 rounded" style={{background:T.bg,color:T.text}}>{shareId}</code>
              <button onClick={copyId} className="p-1.5 rounded-md hover:brightness-110" style={{background:T.accD,border:`1px solid ${T.accB}`}} title="Copy ID"><ClipboardCopy size={14} color={T.acc}/></button></div></div>)}
        </>)}
        {tab==="browse"&&(<>
          <div className="flex gap-1"><div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{background:T.bg,border:`1px solid ${T.border}`}}>
            <Search size={13} color={T.mut}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()}
              placeholder="Search rooms..." className="flex-1 text-xs outline-none bg-transparent" style={{color:T.text}}/></div>
            <B onClick={doSearch}><Search size={12}/></B></div>
          {recent.length===0&&<p className="text-xs text-center py-4" style={{color:T.mut}}>No public rooms found</p>}
          {recent.map(r=>(<button key={r.id} onClick={()=>handleLoad(r.id)} className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:brightness-110" style={{background:T.bg,border:`1px solid ${T.border}`}}>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:T.text}}>{r.name}</p>
              <div className="flex items-center gap-2 mt-0.5"><span className="text-xs" style={{color:T.mut}}><Users size={10} className="inline mr-0.5"/>{r.nickname||"Anon"}</span>
                <span className="text-xs" style={{color:T.mut}}>{r.visits??0} visits</span>
                <span className="text-xs" style={{color:T.mut}}>{new Date(r.created_at).toLocaleDateString()}</span></div></div>
            <ExternalLink size={14} color={T.mut}/></button>))}</>)}
        {tab==="load"&&(<>
          <p className="text-xs" style={{color:T.dim}}>Paste a room ID or full URL</p>
          <input value={loadId} onChange={e=>setLoadId(e.target.value)} placeholder="Room ID or URL..." className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/>
          <button onClick={()=>{let id=loadId.trim();if(id.includes("room="))id=id.split("room=")[1].split("&")[0];if(id)handleLoad(id)}} disabled={loading||!loadId.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{background:T.accD,border:`1px solid ${T.accB}`,color:T.acc}}>{loading?"Loading...":"Load"}</button></>)}
      </div></div></div>);
}

/*╔══════════════════════════════════════════════════════════════╗
  ║  MAIN APP                                                    ║
  ╚══════════════════════════════════════════════════════════════╝*/
export default function App(){
  const[tn,setTn]=useState(()=>localStorage.getItem("rb_theme")||"light");
  const T=TH[tn]||TH.light;
  const cloud=useMemo(()=>new Cloud(SB_URL,SB_KEY),[]);
  const[room,setRoom]=useState(()=>{if(!localStorage.getItem("rb_v")){localStorage.setItem("rb_v","1");return tutRoom()}return Ser.load()||tutRoom()});
  const[ed,setEd]=useState(false);const[selId,setSelId]=useState(null);const[showH,setShowH]=useState(false);
  const[camF,setCamF]=useState(true);const[zoom,setZoom]=useState(1);const[camP,setCamP]=useState({x:RW/2,y:RH/2});
  const[lnk,setLnk]=useState(false);const[hovId,setHovId]=useState(null);
  const[toast,setToast]=useState(null);const[tType,setTT]=useState("info");
  const[showSave,setShowSave]=useState(false);const[showShare,setShowShare]=useState(false);
  const[showSet,setShowSet]=useState(false);const[mob,setMob]=useState(false);
  const[bar,setBar]=useState(true);const[tab,setTab]=useState("add");
  const[cursorLink,setCursorLink]=useState(false);
  const[mouseWorld,setMouseWorld]=useState({x:0,y:0});

  const cvs=useRef(null);const ren=useRef(null);const rr=useRef(room);const ks=useRef({});
  const hist=useRef(new Hist());const drag=useRef(null);const af=useRef(null);
  const cont=useRef(null);const[vp,setVp]=useState({w:800,h:600});const fRef=useRef(null);
  rr.current=room;
  const dt=useCallback((m,t="info")=>{setToast(m);setTT(t)},[]);

  useEffect(()=>{setMob("ontouchstart"in window||navigator.maxTouchPoints>0)},[]);
  useEffect(()=>{const p=new URLSearchParams(location.search);const id=p.get("room");
    if(id&&cloud.ok)cloud.loadRoom(id).then(r=>{setRoom(r);setCamP({x:r.width/2,y:r.height/2});dt("Room loaded!","success");setEd(false)}).catch(()=>dt("Load failed","error"))},[]);
  useEffect(()=>{const el=cont.current;if(!el)return;const ro=new ResizeObserver(e=>{const{width,height}=e[0].contentRect;setVp({w:width,h:height})});ro.observe(el);return()=>ro.disconnect()},[]);
  useEffect(()=>{if(cvs.current)ren.current=new Ren(cvs.current)},[]);

  useEffect(()=>{
    const kd=e=>{const k=e.key.toLowerCase();ks.current[k]=true;
      if((e.ctrlKey||e.metaKey)&&k==="z"&&!e.shiftKey){e.preventDefault();doU()}
      if((e.ctrlKey||e.metaKey)&&k==="z"&&e.shiftKey){e.preventDefault();doR()}
      if((e.ctrlKey||e.metaKey)&&k==="y"){e.preventDefault();doR()}
      if((e.ctrlKey||e.metaKey)&&k==="d"){e.preventDefault();dupS()}
      if(k==="e"&&!ed)intAct();
      if((e.key==="Delete"||e.key==="Backspace")&&ed&&selId&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){e.preventDefault();delO(selId)}
      if(e.key==="Escape"){setLnk(false);setSelId(null)}};
    const ku=e=>{ks.current[e.key.toLowerCase()]=false};
    window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);
    return()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku)}},[ed,selId]);

  // Game loop
  useEffect(()=>{let run=true;const loop=()=>{if(!run)return;const r=rr.current,k=ks.current;
    if(!ed){let dx=0,dy=0;if(k.w||k.arrowup)dy-=r.player.speed;if(k.s||k.arrowdown)dy+=r.player.speed;
      if(k.a||k.arrowleft)dx-=r.player.speed;if(k.d||k.arrowright)dx+=r.player.speed;
      if(dx&&dy){dx*=0.707;dy*=0.707}if(dx||dy){r.player.move(dx,dy,r.width,r.height);
        const pb=r.player.bounds();for(const o of r.objects){if(!(o instanceof BtnObj))continue;
          const ov=pb.x<o.x+o.width&&pb.x+pb.width>o.x&&pb.y<o.y+o.height&&pb.y+pb.height>o.y;
          if(o.buttonType===BT.FT){if(ov&&!o._w){o.toggle(r.objects,r.soundMuted);o._w=true}else if(!ov)o._w=false}
          else if(o.buttonType===BT.FH){if(ov)o.activate(r.objects,r.soundMuted);else o.deactivate(r.objects)}}}}
    const cx=camF?r.player.x:camP.x,cy=camF?r.player.y:camP.y;
    if(ren.current){const linkH=ren.current.render({room:r,cx,cy,z:zoom,ed,selId,showH,lnk,hovId,vw:vp.w,vh:vp.h,T,mouseWx:mouseWorld.x,mouseWy:mouseWorld.y});
      setCursorLink(!!linkH)}
    af.current=requestAnimationFrame(loop)};af.current=requestAnimationFrame(loop);
    return()=>{run=false;if(af.current)cancelAnimationFrame(af.current)}},[ed,selId,showH,lnk,hovId,camF,camP,zoom,vp,T,mouseWorld]);

  const pH=useCallback(()=>{hist.current.push(rr.current.toJSON())},[]);
  const doU=useCallback(()=>{const p=hist.current.undo(rr.current.toJSON());if(p){setRoom(Room.from(p));setSelId(null)}},[]);
  const doR=useCallback(()=>{const n=hist.current.redo(rr.current.toJSON());if(n){setRoom(Room.from(n));setSelId(null)}},[]);
  const chP=useCallback((id,k,v)=>{pH();const r=rr.current,o=r.find(id);if(!o)return;
    if(k==="_unlink"&&o instanceof BtnObj)o.unlink(v);else o[k]=v;
    if(k==="imgActive"&&o instanceof BtnObj)o._lA();if(k==="imgInactive"&&o instanceof BtnObj)o._lI();
    if((k==="x"||k==="y")&&r.gridOn)o.snap(r.gridSize);setRoom(Room.from(r.toJSON()))},[pH]);

  const addT=useCallback(()=>{pH();const r=rr.current;const o=new TxtObj({x:r.width/2-80,y:r.height/2-20,text:"New Text",fontSize:24,color:"#333"});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.from(r.toJSON()));setSelId(o.id);setTab("props")},[pH]);
  const addI=useCallback(async()=>{const res=await readF("image/png,image/jpeg,image/gif,image/webp");if(!res)return;pH();const r=rr.current;const d=await imgDims(res.data);
    let w=d.w,h=d.h;const mx=400;if(w>mx||h>mx){const s=mx/Math.max(w,h);w*=s;h*=s}
    const o=new ImgObj({x:r.width/2-w/2,y:r.height/2-h/2,width:w,height:h,src:res.data,name:res.name||"Image"});
    if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.from(r.toJSON()));setSelId(o.id);setTab("props")},[pH]);
  const addB=useCallback(bt=>{pH();const r=rr.current;const o=new BtnObj({x:r.width/2-22,y:r.height/2-22,buttonType:bt});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.from(r.toJSON()));setSelId(o.id);setTab("props")},[pH]);
  const delO=useCallback(id=>{pH();rr.current.rm(id);setRoom(Room.from(rr.current.toJSON()));setSelId(null);setLnk(false)},[pH]);
  const unlA=useCallback(id=>{pH();rr.current.unlinkAll(id);setRoom(Room.from(rr.current.toJSON()))},[pH]);
  const dupS=useCallback(()=>{if(!selId)return;pH();const n=rr.current.dup(selId);if(n){setRoom(Room.from(rr.current.toJSON()));setSelId(n.id)}},[selId,pH]);
  const intAct=useCallback(()=>{const r=rr.current;for(const o of r.objects){if(!(o instanceof BtnObj)||o.buttonType!==BT.E)continue;const c=o.ctr();if(Math.hypot(c.x-r.player.x,c.y-r.player.y)<INTERACT_R+o.width/2){o.toggle(r.objects,r.soundMuted);break}}},[]);

  const w2s=useCallback((cx,cy)=>{if(!cvs.current||!ren.current)return{wx:0,wy:0};const rect=cvs.current.getBoundingClientRect();const camX=camF?rr.current.player.x:camP.x;const camY=camF?rr.current.player.y:camP.y;return ren.current.s2w(cx-rect.left,cy-rect.top,camX,camY,zoom,vp.w,vp.h)},[camF,camP,zoom,vp]);

  const onDown=useCallback(e=>{const{wx,wy}=w2s(e.clientX,e.clientY);const r=rr.current,hit=r.hit(wx,wy);
    if(!ed){if(hit&&hit.link&&hit.visible){window.open(hit.link,"_blank")}return}
    if(lnk&&selId){if(hit&&hit.type!=="button"&&hit.id!==selId){pH();const btn=r.find(selId);if(btn instanceof BtnObj){if(btn.linkedIds.includes(hit.id))btn.unlink(hit.id);else btn.link(hit.id);setRoom(Room.from(r.toJSON()))}}return}
    if(hit){setSelId(hit.id);setTab("props");pH();drag.current={id:hit.id,ox:wx-hit.x,oy:wy-hit.y}}
    else{setSelId(null);setLnk(false);if(!camF)drag.current={id:null,scx:camP.x,scy:camP.y,smx:e.clientX,smy:e.clientY}}},[ed,lnk,selId,w2s,camF,camP,pH]);

  const onMove=useCallback(e=>{
    const{wx,wy}=w2s(e.clientX,e.clientY);setMouseWorld({x:wx,y:wy});
    if(!ed)return;if(lnk){const h=rr.current.hit(wx,wy);setHovId(h?.id||null)}
    if(!drag.current)return;
    if(drag.current.id){const o=rr.current.find(drag.current.id);if(o){let nx=wx-drag.current.ox,ny=wy-drag.current.oy;
      if(rr.current.gridOn){nx=Math.round(nx/rr.current.gridSize)*rr.current.gridSize;ny=Math.round(ny/rr.current.gridSize)*rr.current.gridSize}o.x=nx;o.y=ny}}
    else if(drag.current.scx!==undefined)setCamP({x:drag.current.scx-(e.clientX-drag.current.smx)/zoom,y:drag.current.scy-(e.clientY-drag.current.smy)/zoom})},[ed,lnk,w2s,zoom]);

  const onUp=useCallback(()=>{if(drag.current?.id)setRoom(Room.from(rr.current.toJSON()));drag.current=null},[]);
  const onWh=useCallback(e=>{e.preventDefault();setZoom(z=>Math.max(MINZ,Math.min(MAXZ,z-e.deltaY*0.001)))},[]);
  const dpad=useCallback((d,p)=>{const km={up:"w",down:"s",left:"a",right:"d",interact:"e"};ks.current[km[d]]=p;if(d==="interact"&&p&&!ed)intAct()},[ed,intAct]);

  const chR=useCallback((k,v)=>{setRoom(prev=>{const d=prev.toJSON();d[k]=v;return Room.from(d)})},[]);
  const chPl=useCallback((k,v)=>{setRoom(prev=>{const d=prev.toJSON();d.player[k]=v;return Room.from(d)})},[]);
  const resetR=useCallback(()=>{pH();setRoom(new Room());setSelId(null);dt("Cleared","info")},[pH,dt]);
  const restTut=useCallback(()=>{pH();setRoom(tutRoom());setSelId(null);setCamF(true);dt("Tutorial restored","success")},[pH,dt]);

  const savL=useCallback(()=>{Ser.save(rr.current);dt("Saved!","success");setShowSave(false)},[dt]);
  const ldL=useCallback(()=>{const l=Ser.load();if(l){pH();setRoom(l);setCamP({x:l.width/2,y:l.height/2});dt("Loaded!","success")}else dt("No save","error");setShowSave(false)},[pH,dt]);
  const expF=useCallback(()=>{Ser.exp(rr.current,(rr.current.roomName||"room")+".json");dt("Exported!","success");setShowSave(false)},[dt]);
  const impF=useCallback(async e=>{const f=e.target.files?.[0];if(!f)return;try{pH();const l=await Ser.imp(f);setRoom(l);setCamP({x:l.width/2,y:l.height/2});dt("Imported!","success")}catch{dt("Failed","error")}e.target.value="";setShowSave(false)},[pH,dt]);

  const selObj=useMemo(()=>selId?room.find(selId):null,[room,selId]);

  // Determine cursor style
  const cursorStyle = ed ? "crosshair" : cursorLink ? "pointer" : "default";

  return(
    <TC.Provider value={T}>
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{background:T.bg,fontFamily:"'DM Mono','Fira Code',ui-monospace,monospace",color:T.text}}>
      <input ref={fRef} type="file" accept=".json" className="hidden" onChange={impF}/>
      {toast&&<Toast msg={toast} type={tType} onDone={()=>setToast(null)}/>}
      {showShare&&cloud.ok&&<ShareM room={room} cloud={cloud} onClose={()=>setShowShare(false)} toast={dt} onLoad={r=>{setRoom(r);setCamP({x:r.width/2,y:r.height/2})}} pushH={pH}/>}

      {/* Settings */}
      {showSet&&(<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={()=>setShowSet(false)}>
        <div className="absolute inset-0 bg-black/50"/>
        <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" style={{background:T.srf,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{background:T.srf,borderBottom:`1px solid ${T.border}`}}>
            <div className="flex items-center gap-2"><Settings size={16} color={T.acc}/><span className="font-semibold text-sm" style={{color:T.text}}>Settings</span></div>
            <button onClick={()=>setShowSet(false)} style={{color:T.mut}}><X size={16}/></button></div>
          <div className="p-4 space-y-4">
            <Sec title="Theme"><div className="grid grid-cols-3 gap-1.5">
              {Object.entries(TH).map(([k,v])=>(<button key={k} onClick={()=>{setTn(k);localStorage.setItem("rb_theme",k)}}
                className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{background:tn===k?T.accD:T.bg,border:`1px solid ${tn===k?T.accB:T.border}`,color:tn===k?T.acc:T.dim}}>
                <div className="w-3 h-3 rounded-full" style={{background:v.acc}}/>{v.label}</button>))}</div></Sec>
            <Sec title="Player">
              <SR label="Speed" value={room.player.speed} onChange={v=>chPl("speed",v)} min={1} max={10} step={0.5}/>
              <SR label="Size" value={room.player.size} onChange={v=>chPl("size",v)} min={12} max={60}/>
              <label className="flex items-center justify-between"><span className="text-xs" style={{color:T.dim}}>Color</span>
                <input type="color" value={room.player.color} onChange={e=>chPl("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label>
              <p className="font-semibold uppercase tracking-wider pt-1" style={{color:T.mut,fontSize:9}}>Sprite (flips H, stays upright)</p>
              <div className="flex gap-2">{[["sprite1","Frame 1"],["sprite2","Frame 2"]].map(([k,l])=>{const v=room.player[k];
                return(<div key={k} className="flex-1"><p style={{color:T.dim,fontSize:10}} className="mb-0.5">{l}</p>
                  {v?(<div className="relative group"><img src={v} alt="" className="w-full h-14 object-contain rounded" style={{background:T.bg}}/>
                    <button onClick={()=>chPl(k,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100" style={{background:T.dng}}><X size={9} color="#fff"/></button></div>)
                  :(<button onClick={async()=>{const r=await readF("image/*");if(r)chPl(k,r.data)}} className="w-full h-14 rounded flex items-center justify-center" style={{border:`1px dashed ${T.border}`,color:T.mut,fontSize:10}}><Upload size={10} className="mr-1"/>Upload</button>)}</div>)})}</div></Sec>
            <Sec title="Audio"><label className="flex items-center justify-between"><span className="text-xs" style={{color:T.dim}}>Mute</span>
              <button onClick={()=>chR("soundMuted",!room.soundMuted)} className="p-1.5 rounded" style={{background:room.soundMuted?T.dngD:T.okD}}>
                {room.soundMuted?<VolumeX size={14} color={T.dng}/>:<Volume2 size={14} color={T.ok}/>}</button></label></Sec>
            <Sec title="Room"><label className="flex items-center justify-between"><span className="text-xs" style={{color:T.dim}}>Background</span>
              <input type="color" value={room.bgColor} onChange={e=>chR("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label></Sec>
            <Sec title="Cloud"><div className="flex items-center gap-1.5 text-xs" style={{color:cloud.ok?T.ok:T.mut}}>
              {cloud.ok?<Cloud size={12}/>:<CloudOff size={12}/>}{cloud.ok?"Connected":"Not configured"}</div></Sec>
            <Sec title="Reset"><div className="flex gap-2">
              <button onClick={resetR} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{background:T.dngD,border:`1px solid ${T.dng}30`,color:T.dng}}><Trash2 size={12}/>Clear</button>
              <button onClick={restTut} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                style={{background:T.accD,border:`1px solid ${T.accB}`,color:T.acc}}><HelpCircle size={12}/>Tutorial</button></div></Sec>
          </div></div></div>)}

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 flex-shrink-0" style={{background:T.srf,borderBottom:`1px solid ${T.border}`}}>
        <div className="flex items-center gap-2 mr-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:`linear-gradient(135deg,${T.acc},#7c4dff)`}}><Maximize2 size={11} color="#fff"/></div>
          <span className="text-xs font-bold tracking-wider hidden md:inline" style={{color:T.text}}>ROOM&nbsp;BUILDER</span></div>
        {ed&&<input value={room.roomName} onChange={e=>chR("roomName",e.target.value)} className="px-2 py-0.5 rounded text-xs font-medium w-24 outline-none hidden sm:block" style={{background:T.bg,border:`1px solid ${T.border}`,color:T.text}}/>}
        <div className="w-px h-5 mx-0.5" style={{background:T.border}}/>
        {/* Mode shows what it SWITCHES TO */}
        <B onClick={()=>{setEd(p=>!p);setSelId(null);setLnk(false)}}>
          {ed?<><Play size={12}/><span className="hidden sm:inline">Play</span></>:<><Pencil size={12}/><span className="hidden sm:inline">Edit</span></>}</B>
        <B active={camF} onClick={()=>setCamF(p=>!p)}>{camF?<Camera size={12}/>:<CameraOff size={12}/>}<span className="hidden sm:inline">{camF?"Follow":"Fixed"}</span></B>
        {ed&&<><div className="w-px h-5 mx-0.5" style={{background:T.border}}/>
          <B active={room.gridOn} onClick={()=>chR("gridOn",!room.gridOn)}><Grid3X3 size={12}/><span className="hidden sm:inline">Grid</span></B>
          <B active={showH} onClick={()=>setShowH(p=>!p)}>{showH?<Eye size={12}/>:<EyeOff size={12}/>}<span className="hidden sm:inline">Hidden</span></B>
          <div className="w-px h-5 mx-0.5" style={{background:T.border}}/>
          <B onClick={doU} title="Undo"><Undo2 size={12}/></B><B onClick={doR} title="Redo"><Redo2 size={12}/></B>
          {selId&&<B onClick={dupS} title="Ctrl+D"><Copy size={12}/></B>}</>}
        <div className="flex items-center gap-0.5 ml-1"><B onClick={()=>setZoom(z=>Math.max(MINZ,z-0.2))}><ZoomOut size={12}/></B>
          <span className="text-xs w-9 text-center" style={{color:T.mut}}>{Math.round(zoom*100)}%</span>
          <B onClick={()=>setZoom(z=>Math.min(MAXZ,z+0.2))}><ZoomIn size={12}/></B></div>
        <div className="flex-1"/>
        <B onClick={()=>setShowSet(true)} title="Settings"><Settings size={12}/></B>
        <div className="relative"><B active={showSave} onClick={()=>setShowSave(p=>!p)}><Save size={12}/><span className="hidden sm:inline">Save</span></B>
          {showSave&&(<div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl py-1 z-50 min-w-[170px]" style={{background:T.srf,border:`1px solid ${T.border}`}}>
            {[{i:<Save size={12}/>,l:"Save Local",a:savL},{i:<Upload size={12}/>,l:"Load Local",a:ldL},{i:<Download size={12}/>,l:"Export JSON",a:expF},{i:<Upload size={12}/>,l:"Import JSON",a:()=>fRef.current?.click()}].map((it,i)=>(
              <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:brightness-110" style={{color:T.dim}} onClick={it.a}>{it.i}{it.l}</button>))}</div>)}</div>
        <B onClick={()=>{if(!cloud.ok){dt("Configure Supabase credentials in the code","error");return}setShowShare(true)}}><Cloud size={12}/><span className="hidden sm:inline">Share</span></B>
        <B className="sm:hidden" onClick={()=>setBar(p=>!p)}><Menu size={12}/></B>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="flex flex-1 overflow-hidden relative">
        {ed&&(<div className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${bar?"w-56":"w-0 sm:w-56"}`} style={{background:T.srf,borderRight:`1px solid ${T.border}`}}>
          <div className="flex" style={{borderBottom:`1px solid ${T.border}`}}>
            {[["add","Add",<Plus size={12} key="a"/>],["props","Props",<Sliders size={12} key="p"/>]].map(([id,l,ic])=>(
              <button key={id} onClick={()=>setTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium"
                style={{color:tab===id?T.acc:T.mut,borderBottom:tab===id?`2px solid ${T.acc}`:"2px solid transparent"}}>{ic}{l}</button>))}</div>
          {tab==="add"&&(<div className="p-3 space-y-2 overflow-y-auto flex-1">
            <p className="font-semibold uppercase tracking-wider" style={{color:T.mut,fontSize:9}}>Objects</p>
            <button onClick={addT} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.border}`,color:T.dim}}><Type size={14}/>Text</button>
            <button onClick={addI} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.border}`,color:T.dim}}><Image size={14}/>Image / GIF</button>
            <p className="font-semibold uppercase tracking-wider mt-3" style={{color:T.mut,fontSize:9}}>Buttons</p>
            {[{t:BT.E,l:"Press E",c:"#ef4444",lb:"E",d:"Walk near, press E"},{t:BT.FT,l:"Floor Toggle",c:"#f59e0b",lb:"F",d:"Step on to toggle"},{t:BT.FH,l:"Floor Hold",c:"#a855f7",lb:"H",d:"Shows while standing"}].map(b=>(
              <button key={b.t} onClick={()=>addB(b.t)} className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs hover:brightness-110 text-left" style={{border:`1px solid ${T.border}`}}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white font-bold" style={{background:b.c,fontSize:9}}>{b.lb}</div>
                <div><p style={{color:T.dim}} className="font-medium">{b.l}</p><p style={{color:T.mut,fontSize:10}}>{b.d}</p></div></button>))}
            <div className="mt-3 pt-3 space-y-1.5" style={{borderTop:`1px solid ${T.border}`}}>
              <p className="font-semibold uppercase tracking-wider" style={{color:T.mut,fontSize:9}}>Room</p>
              <SR label="Width" value={room.width} onChange={v=>chR("width",v)} min={400} max={5000} step={100}/>
              <SR label="Height" value={room.height} onChange={v=>chR("height",v)} min={400} max={5000} step={100}/>
              <SR label="Grid" value={room.gridSize} onChange={v=>chR("gridSize",v)} min={8} max={128} step={8}/></div>
            <div className="mt-3 pt-3" style={{borderTop:`1px solid ${T.border}`}}>
              <p className="font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{color:T.mut,fontSize:9}}><Layers size={10}/>Objects ({room.objects.length})</p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">{room.sorted().map(o=>(<button key={o.id} onClick={()=>{setSelId(o.id);setTab("props")}}
                className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left"
                style={{background:o.id===selId?T.accD:"transparent",color:o.id===selId?T.acc:T.dim}}>
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:o.type==="text"?"#22c55e":o.type==="image"?"#3b82f6":"#f59e0b"}}/>
                <span className="truncate flex-1">{o.name}</span>{!o.visible&&<EyeOff size={9} className="opacity-40"/>}
                <span className="opacity-30 text-[10px]">{o.zIndex}</span></button>))}</div></div></div>)}
          {tab==="props"&&<PP obj={selObj} room={room} onChange={chP} onDel={delO} onUnlink={unlA} lnk={lnk} onTogLink={()=>setLnk(p=>!p)}/>}
        </div>)}

        <div ref={cont} className="flex-1 relative overflow-hidden" style={{cursor:cursorStyle}}>
          <canvas ref={cvs} className="w-full h-full block"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWh}
            onTouchStart={e=>{if(e.touches.length===1){const t=e.touches[0];onDown({clientX:t.clientX,clientY:t.clientY})}}}
            onTouchMove={e=>{if(e.touches.length===1){const t=e.touches[0];onMove({clientX:t.clientX,clientY:t.clientY})}}}
            onTouchEnd={onUp}/>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider select-none"
            style={{background:ed?T.accD:T.okD,border:`1px solid ${ed?T.accB:`${T.ok}40`}`,color:ed?T.acc:T.ok}}>{ed?"EDITOR":"PLAY"}</div>
          {lnk&&<div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold select-none"
            style={{background:T.warnD,border:`1px solid ${T.warn}50`,color:T.warn,animation:"pulse 2s infinite"}}>🔗 Click objects to link/unlink · ESC to exit</div>}
          {!ed&&!mob&&<div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs select-none"
            style={{background:`${T.srf}dd`,color:T.dim}}><b style={{color:T.text}}>WASD</b> Move <b style={{color:T.warn}}>E</b> Interact <b style={{color:T.text}}>Scroll</b> Zoom</div>}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-[10px] select-none" style={{background:`${T.srf}cc`,color:T.mut}}>
            {Math.round(room.player.x)},{Math.round(room.player.y)} · {Math.round(zoom*100)}%</div>
        </div>
      </div>

      {mob&&!ed&&<DPad onDir={dpad}/>}
      {showSave&&<div className="fixed inset-0 z-40" onClick={()=>setShowSave(false)}/>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
    </div></TC.Provider>);
}
