import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import {
  Play, Pencil, Eye, EyeOff, Grid3X3, Undo2, Redo2, Save, Upload, Share2,
  Type, Image, Trash2, Unlink, Camera, CameraOff,
  Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Download, X, Copy, Move,
  ZoomIn, ZoomOut, MousePointer, Settings, Menu, Maximize2,
  Sun, Moon, Cloud, CloudOff, ExternalLink, RotateCw, FlipHorizontal, FlipVertical,
  Check, Volume2, VolumeX, HelpCircle, Sliders,
  Bold, Italic, Underline, Strikethrough, Search, Globe, Lock, ClipboardCopy, Eye as EyeIcon
} from "lucide-react";

/*╔══════════════════════════════════════════════════════════════╗
  ║  SUPABASE — Replace these two lines before deploying        ║
  ╚══════════════════════════════════════════════════════════════╝*/
const SB_URL = "https://hnrkgqjedimvbnvvetwh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucmtncWplZGltdmJudnZldHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDg3NzEsImV4cCI6MjA5MDAyNDc3MX0.d6MHuoWFshhTlKy_LJWOLjJU5UcMWeUPj924dqllmWQ";

/*  SQL to run in Supabase SQL Editor:
  CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Untitled',
    nickname TEXT DEFAULT 'Anonymous',
    public BOOLEAN DEFAULT true,
    visits INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "read" ON rooms FOR SELECT USING (true);
  CREATE POLICY "insert" ON rooms FOR INSERT WITH CHECK (true);
  CREATE POLICY "update" ON rooms FOR UPDATE USING (true);
  -- Storage: bucket "room-assets" (public), SELECT+INSERT policies = true
*/

// ── Constants ──
const ROOM_W=1600,ROOM_H=1200,GRID=32,MIN_Z=0.15,MAX_Z=4,IR=52;
const LY={BG:0,OBJ:1,PL:2};
const BT={E:"pressE",FT:"floorToggle",FH:"floorHold"};
let _u=Date.now();const uid=()=>`o${_u++}_${Math.random().toString(36).slice(2,6)}`;

// ── Image cache (keeps GIFs animating — appended to hidden DOM node) ──
const _IC=new Map();
let _gifContainer=null;
function _ensureGifContainer(){
  if(_gifContainer)return;
  _gifContainer=document.createElement("div");
  _gifContainer.style.cssText="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0";
  document.body.appendChild(_gifContainer);
}
function gImg(s){if(!s)return null;if(_IC.has(s))return _IC.get(s);
  _ensureGifContainer();
  const i=new window.Image();i.crossOrigin="anonymous";i.src=s;
  _IC.set(s,i);
  // Append to hidden DOM so browser keeps GIF frames cycling
  _gifContainer.appendChild(i);
  return i;
}

const FONTS=[{v:"sans-serif",l:"Sans Serif"},{v:"serif",l:"Serif"},{v:"monospace",l:"Monospace"},{v:"cursive",l:"Cursive"},{v:"fantasy",l:"Fantasy"},{v:"'Georgia',serif",l:"Georgia"},{v:"'Courier New',monospace",l:"Courier"},{v:"'Trebuchet MS',sans-serif",l:"Trebuchet"},{v:"'Palatino',serif",l:"Palatino"},{v:"'Comic Sans MS',cursive",l:"Comic Sans"}];

// ── Themes ──
const TH={
  light:{label:"Light",bg:"#f5f5f8",sf:"#fff",bd:"#dddde6",tx:"#1a1a2e",txD:"#5a5a72",txM:"#9999aa",ac:"#0087a8",acD:"rgba(0,135,168,0.08)",acB:"rgba(0,135,168,0.3)",wn:"#d97706",wnD:"rgba(217,119,6,0.08)",dg:"#dc2626",dgD:"rgba(220,38,38,0.06)",sc:"#16a34a",scD:"rgba(22,163,74,0.06)",cv:"#e4e4ec",bBg:"rgba(0,0,0,0.03)",bBd:"rgba(0,0,0,0.08)",gl:"rgba(0,0,0,0.06)"},
  dark:{label:"Dark",bg:"#0d0d18",sf:"#13131f",bd:"#222236",tx:"#e0e0ec",txD:"#8888a0",txM:"#555570",ac:"#00d4f5",acD:"rgba(0,212,245,0.1)",acB:"rgba(0,212,245,0.3)",wn:"#fbbf24",wnD:"rgba(251,191,36,0.1)",dg:"#ef4444",dgD:"rgba(239,68,68,0.08)",sc:"#22c55e",scD:"rgba(34,197,94,0.08)",cv:"#0f0f1e",bBg:"rgba(255,255,255,0.04)",bBd:"rgba(255,255,255,0.08)",gl:"rgba(255,255,255,0.04)"},
  ocean:{label:"Ocean",bg:"#0b1628",sf:"#0f1d33",bd:"#1a3050",tx:"#d0e8ff",txD:"#7aa8cc",txM:"#4a7090",ac:"#00bcd4",acD:"rgba(0,188,212,0.12)",acB:"rgba(0,188,212,0.35)",wn:"#ff9800",wnD:"rgba(255,152,0,0.1)",dg:"#f44336",dgD:"rgba(244,67,54,0.08)",sc:"#4caf50",scD:"rgba(76,175,80,0.08)",cv:"#081220",bBg:"rgba(255,255,255,0.04)",bBd:"rgba(255,255,255,0.06)",gl:"rgba(100,180,255,0.05)"},
  forest:{label:"Forest",bg:"#0f1a0f",sf:"#152015",bd:"#2a3a2a",tx:"#d4e8d0",txD:"#88aa84",txM:"#557755",ac:"#66bb6a",acD:"rgba(102,187,106,0.12)",acB:"rgba(102,187,106,0.35)",wn:"#ffb74d",wnD:"rgba(255,183,77,0.1)",dg:"#e57373",dgD:"rgba(229,115,115,0.08)",sc:"#81c784",scD:"rgba(129,199,132,0.08)",cv:"#0a140a",bBg:"rgba(255,255,255,0.04)",bBd:"rgba(255,255,255,0.06)",gl:"rgba(100,200,100,0.05)"},
  sunset:{label:"Sunset",bg:"#1a0f0a",sf:"#241410",bd:"#4a2820",tx:"#f0d8cc",txD:"#c09080",txM:"#806050",ac:"#ff7043",acD:"rgba(255,112,67,0.12)",acB:"rgba(255,112,67,0.35)",wn:"#ffd54f",wnD:"rgba(255,213,79,0.1)",dg:"#ef5350",dgD:"rgba(239,83,80,0.08)",sc:"#66bb6a",scD:"rgba(102,187,106,0.08)",cv:"#140a06",bBg:"rgba(255,255,255,0.04)",bBd:"rgba(255,255,255,0.06)",gl:"rgba(255,150,100,0.05)"},
  lavender:{label:"Lavender",bg:"#f5f0fa",sf:"#fff",bd:"#d8d0e8",tx:"#2a1a40",txD:"#6a5a80",txM:"#9990aa",ac:"#7c4dff",acD:"rgba(124,77,255,0.08)",acB:"rgba(124,77,255,0.3)",wn:"#f59e0b",wnD:"rgba(245,158,11,0.08)",dg:"#e11d48",dgD:"rgba(225,29,72,0.06)",sc:"#059669",scD:"rgba(5,150,105,0.06)",cv:"#ece4f4",bBg:"rgba(100,50,200,0.03)",bBd:"rgba(100,50,200,0.08)",gl:"rgba(100,50,200,0.06)"}
};
const TC=createContext(TH.light);

// ── Sound ──
let _ac=null;function gAc(){if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();return _ac}
function dSnd(t){try{const c=gAc(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);const cfg={[BT.E]:[660,"square",0.12,0.12],[BT.FT]:[440,"triangle",0.1,0.18],[BT.FH]:[330,"sine",0.08,0.25]};const[f,tp,vol,dur]=cfg[t]||cfg[BT.E];o.frequency.value=f;o.type=tp;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.start(c.currentTime);o.stop(c.currentTime+dur+0.05)}catch(e){}}
function bSnd(b,m){if(m)return;b.customSound?(()=>{try{new Audio(b.customSound).play().catch(()=>{})}catch{}})():dSnd(b.buttonType)}

// ── OOP Classes ──
class GO{constructor(p={}){this.id=p.id||uid();this.type=p.type||"base";this.x=p.x??100;this.y=p.y??100;this.width=p.width??64;this.height=p.height??64;this.rotation=p.rotation??0;this.scaleX=p.scaleX??1;this.scaleY=p.scaleY??1;this.zIndex=p.zIndex??0;this.layer=p.layer??LY.OBJ;this.visible=p.visible!==undefined?p.visible:true;this.name=p.name||"Object";this.link=p.link||""}ctr(){return{x:this.x+this.width/2,y:this.y+this.height/2}}hits(wx,wy){return wx>=this.x&&wx<=this.x+this.width&&wy>=this.y&&wy<=this.y+this.height}snap(g){this.x=Math.round(this.x/g)*g;this.y=Math.round(this.y/g)*g}_tf(c){c.translate(this.x+this.width/2,this.y+this.height/2);c.rotate(this.rotation*Math.PI/180);c.scale(this.scaleX,this.scaleY)}_sel(c){c.strokeStyle="#00d4f5";c.lineWidth=2;c.setLineDash([6,3]);c.strokeRect(-this.width/2-4,-this.height/2-4,this.width+8,this.height+8);c.setLineDash([]);c.fillStyle="#00d4f5";const w=this.width/2+4,h=this.height/2+4;for(const[x,y]of[[-w,-h],[w,-h],[-w,h],[w,h]])c.fillRect(x-3,y-3,6,6)}draw(c,e,s,sh){c.save();this._tf(c);if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}c.fillStyle="#888";c.fillRect(-this.width/2,-this.height/2,this.width,this.height);if(s)this._sel(c);c.restore()}toJSON(){return{id:this.id,type:this.type,x:this.x,y:this.y,width:this.width,height:this.height,rotation:this.rotation,scaleX:this.scaleX,scaleY:this.scaleY,zIndex:this.zIndex,layer:this.layer,visible:this.visible,name:this.name,link:this.link}}}

class TxO extends GO{constructor(p={}){super({...p,type:"text"});this.text=p.text||"Hello";this.fontSize=p.fontSize??24;this.color=p.color||"#222";this.bgColor=p.bgColor||"";this.fontFamily=p.fontFamily||"sans-serif";this.bold=p.bold??false;this.italic=p.italic??false;this.underline=p.underline??false;this.strike=p.strike??false;this.name=p.name||"Text";this.width=p.width??Math.max(48,this.text.length*this.fontSize*0.5);this.height=p.height??(this.fontSize+20)}draw(c,e,s,sh){c.save();this._tf(c);if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}if(this.bgColor){c.fillStyle=this.bgColor;c.beginPath();c.roundRect(-this.width/2,-this.height/2,this.width,this.height,4);c.fill()}else if(e){c.fillStyle="rgba(128,128,128,0.05)";c.fillRect(-this.width/2,-this.height/2,this.width,this.height)}c.fillStyle=this.color;c.font=`${this.italic?"italic ":""}${this.bold?"bold ":""}${this.fontSize}px ${this.fontFamily}`;c.textAlign="center";c.textBaseline="middle";const ws=this.text.split(' '),lh=this.fontSize*1.25,ls=[];let cu='';for(const w of ws){const t=cu?cu+' '+w:w;if(c.measureText(t).width>this.width-10&&cu){ls.push(cu);cu=w}else cu=t}if(cu)ls.push(cu);const sy=-ls.length*lh/2+lh/2;ls.forEach((l,i)=>{const ly=sy+i*lh;c.fillText(l,0,ly);const tw=c.measureText(l).width;if(this.underline){c.strokeStyle=this.color;c.lineWidth=1.5;c.beginPath();c.moveTo(-tw/2,ly+this.fontSize*.35);c.lineTo(tw/2,ly+this.fontSize*.35);c.stroke()}if(this.strike){c.strokeStyle=this.color;c.lineWidth=1.5;c.beginPath();c.moveTo(-tw/2,ly);c.lineTo(tw/2,ly);c.stroke()}});if(s)this._sel(c);c.restore()}toJSON(){return{...super.toJSON(),text:this.text,fontSize:this.fontSize,color:this.color,bgColor:this.bgColor,fontFamily:this.fontFamily,bold:this.bold,italic:this.italic,underline:this.underline,strike:this.strike}}}

class ImO extends GO{constructor(p={}){super({...p,type:"image"});this.src=p.src||"";this.name=p.name||"Image"}draw(c,e,s,sh){c.save();this._tf(c);if(!this.visible&&sh)c.globalAlpha=0.3;else if(!this.visible){c.restore();return}const img=gImg(this.src);if(img&&img.complete&&img.naturalWidth)c.drawImage(img,-this.width/2,-this.height/2,this.width,this.height);else{c.fillStyle="#2a2a3a";c.fillRect(-this.width/2,-this.height/2,this.width,this.height);c.fillStyle="#666";c.font="11px monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("Loading...",0,0)}if(s)this._sel(c);c.restore()}toJSON(){return{...super.toJSON(),src:this.src}}}

class BnO extends GO{constructor(p={}){super({...p,type:"button",width:p.width??44,height:p.height??44});this.buttonType=p.buttonType||BT.E;this.linkedIds=p.linkedIds||[];this.isActive=p.isActive??false;this.visible=true;this.name=p.name||"Button";this.imgActive=p.imgActive||"";this.imgInactive=p.imgInactive||"";this.customSound=p.customSound||""}toggle(o,m){this.isActive=!this.isActive;this._s(o);bSnd(this,m)}activate(o,m){if(!this.isActive){this.isActive=true;this._s(o);bSnd(this,m)}}deactivate(o){if(this.isActive){this.isActive=false;this._s(o)}}_s(o){for(const x of o)if(this.linkedIds.includes(x.id))x.visible=this.isActive}link(id){if(!this.linkedIds.includes(id))this.linkedIds.push(id)}unlink(id){this.linkedIds=this.linkedIds.filter(i=>i!==id)}draw(c,e,s){c.save();this._tf(c);const r=this.width/2;const iA=this.isActive&&this.imgActive?gImg(this.imgActive):null;const iI=!this.isActive&&this.imgInactive?gImg(this.imgInactive):null;if((iA&&iA.complete&&iA.naturalWidth)||(iI&&iI.complete&&iI.naturalWidth)){const img=this.isActive?iA:iI;if(img)c.drawImage(img,-this.width/2,-this.height/2,this.width,this.height)}else{const co={[BT.E]:this.isActive?"#22c55e":"#ef4444",[BT.FT]:this.isActive?"#84cc16":"#f59e0b",[BT.FH]:this.isActive?"#06b6d4":"#a855f7"};c.fillStyle=co[this.buttonType]||"#888";c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();const g=c.createRadialGradient(0,-r*.3,0,0,0,r);g.addColorStop(0,"rgba(255,255,255,0.25)");g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.fillStyle="#fff";c.font=`bold ${Math.max(10,r*.5)}px monospace`;c.textAlign="center";c.textBaseline="middle";c.fillText({[BT.E]:"E",[BT.FT]:"F",[BT.FH]:"H"}[this.buttonType]||"?",0,1)}if(s){c.strokeStyle="#00d4f5";c.lineWidth=2.5;c.setLineDash([6,3]);c.beginPath();c.arc(0,0,r+6,0,Math.PI*2);c.stroke();c.setLineDash([])}c.restore()}toJSON(){return{...super.toJSON(),buttonType:this.buttonType,linkedIds:[...this.linkedIds],isActive:this.isActive,imgActive:this.imgActive,imgInactive:this.imgInactive,customSound:this.customSound}}}

class Player{constructor(p={}){this.x=p.x??400;this.y=p.y??300;this.size=p.size??26;this.speed=p.speed??3;this.color=p.color??"#00d4f5";this.dir="down";this.sprite1=p.sprite1||"";this.sprite2=p.sprite2||"";this._f=0;this._t=0}bounds(){const h=this.size/2;return{x:this.x-h,y:this.y-h,width:this.size,height:this.size}}move(dx,dy,rw,rh){const h=this.size/2;this.x=Math.max(h,Math.min(rw-h,this.x+dx));this.y=Math.max(h,Math.min(rh-h,this.y+dy));if(Math.abs(dx)>Math.abs(dy))this.dir=dx>0?"right":"left";else if(dy!==0)this.dir=dy>0?"down":"up";this._t++;if(this._t%10===0)this._f=1-this._f}draw(c){c.save();c.translate(this.x,this.y);const s1=this.sprite1?gImg(this.sprite1):null;if(s1&&s1.complete&&s1.naturalWidth){c.scale(this.dir==="left"?-1:1,1);const s2=this.sprite2?gImg(this.sprite2):null;c.drawImage((this._f===1&&s2&&s2.complete)?s2:s1,-this.size/2,-this.size/2,this.size,this.size)}else{c.fillStyle="rgba(0,0,0,0.1)";c.beginPath();c.ellipse(0,this.size*.4,this.size*.4,this.size*.12,0,0,Math.PI*2);c.fill();c.fillStyle=this.color;c.beginPath();c.arc(0,0,this.size/2,0,Math.PI*2);c.fill();c.strokeStyle="rgba(0,0,0,0.2)";c.lineWidth=1.5;c.stroke();const ig=c.createRadialGradient(-this.size*.1,-this.size*.1,0,0,0,this.size/2);ig.addColorStop(0,"rgba(255,255,255,0.3)");ig.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=ig;c.beginPath();c.arc(0,0,this.size/2,0,Math.PI*2);c.fill();c.fillStyle="#fff";const a=this.size*.2,dd={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},[dx,dy]=dd[this.dir]||[0,1],t=this.size*.3;c.beginPath();c.moveTo(dx*t,dy*t);c.lineTo(dx*t-dy*a*.5-dx*a,dy*t+dx*a*.5-dy*a);c.lineTo(dx*t+dy*a*.5-dx*a,dy*t-dx*a*.5-dy*a);c.closePath();c.fill()}c.restore()}toJSON(){return{x:this.x,y:this.y,size:this.size,speed:this.speed,color:this.color,sprite1:this.sprite1,sprite2:this.sprite2}}}

// ── Room ──
class Room{constructor(p={}){this.width=p.width??ROOM_W;this.height=p.height??ROOM_H;this.gridSize=p.gridSize??GRID;this.gridOn=p.gridOn??false;this.bgColor=p.bgColor||"#ffffff";this.roomName=p.roomName||"My Room";this.objects=p.objects||[];this.player=p.player||new Player({x:this.width/2,y:this.height/2});this.soundMuted=p.soundMuted??false}add(o){this.objects.push(o)}remove(id){for(const o of this.objects)if(o instanceof BnO)o.unlink(id);this.objects=this.objects.filter(o=>o.id!==id)}find(id){return this.objects.find(o=>o.id===id)}unlinkAll(id){for(const o of this.objects)if(o instanceof BnO)o.unlink(id)}sorted(){return[...this.objects].sort((a,b)=>a.layer!==b.layer?a.layer-b.layer:a.zIndex-b.zIndex)}hitTest(wx,wy){return this.sorted().reverse().find(o=>o.hits(wx,wy))||null}dup(id){const o=this.find(id);if(!o)return null;const j=o.toJSON();j.id=uid();j.x+=20;j.y+=20;j.name+=" copy";const n=Room._mk(j);this.objects.push(n);return n}toJSON(){return{width:this.width,height:this.height,gridSize:this.gridSize,gridOn:this.gridOn,bgColor:this.bgColor,roomName:this.roomName,objects:this.objects.map(o=>o.toJSON()),player:this.player.toJSON(),soundMuted:this.soundMuted}}static _mk(o){switch(o.type){case"text":return new TxO(o);case"image":return new ImO(o);case"button":return new BnO(o);default:return new GO(o)}}static fromJSON(d){return new Room({...d,objects:(d.objects||[]).map(Room._mk),player:new Player(d.player||{})})}}

// ── Tutorial ──
// Inline SVG data URLs for demo images (no external deps needed)
const _SVG_STAR='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#fef3c7"/><text x="50" y="58" text-anchor="middle" font-size="48">⭐</text></svg>');
const _SVG_TREE='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#dcfce7"/><text x="50" y="58" text-anchor="middle" font-size="48">🌳</text></svg>');
const _SVG_CAT='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#ede9fe"/><text x="50" y="58" text-anchor="middle" font-size="48">🐱</text></svg>');
const _SVG_LINK='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50"><rect width="120" height="50" rx="8" fill="#dbeafe"/><text x="60" y="30" text-anchor="middle" font-size="14" fill="#1e40af" font-family="sans-serif">Click me! 🔗</text></svg>');

function mkTut(){
  const w=2800,h=2400;
  // px = player X center, py = player Y center
  const px=700,py=900;
  // Text helper: creates a styled text label
  const t=(id,x,y,text,o={})=>new TxO({id,x,y,width:o.w||220,height:o.h||34,text,fontSize:o.fs||15,color:o.c||"#333",bgColor:o.bg||"",name:o.n||text.slice(0,20),zIndex:o.z||5,fontFamily:o.ff||"sans-serif",bold:o.b||false,italic:o.it||false,underline:o.ul||false,strike:o.st||false,...o});

  const objs=[
  // ╔═══════════════════════════════════════════════╗
  // ║  ZONE 1: WELCOME & CONTROLS (near player)    ║
  // ╚═══════════════════════════════════════════════╝

  // Welcome banner (big, right above player)
  t("w1",px-250,py-220,"Welcome to Room Builder!",{w:500,h:65,fs:34,bg:"#e0f7fa",c:"#00695c",b:true,n:"Welcome"}),
  t("w2",px-180,py-148,"Use WASD to move. Explore the room!",{w:360,h:32,fs:16,bg:"",c:"#546e7a",n:"Explore hint"}),

  // Player spawn marker
  t("w3",px-70,py+30,"↑ You spawn here",{w:140,h:28,fs:14,bg:"rgba(0,135,168,0.1)",c:"#0087a8",n:"Spawn"}),

  // Objects spawn marker (center of room)
  t("w3b",w/2-100,h/2-14,"New objects appear here",{w:200,h:28,fs:13,bg:"rgba(156,39,176,0.08)",c:"#7b1fa2",n:"Obj spawn"}),
  t("w3c",w/2-20,h/2+18,"✦",{w:40,h:28,fs:20,bg:"",c:"#7b1fa2",n:"Obj dot"}),

  // Controls box (right next to player)
  t("c0",px+120,py-180,"🎮 Controls",{w:200,h:40,fs:22,bg:"#e3f2fd",c:"#0d47a1",b:true,n:"Controls"}),
  t("c1",px+120,py-132,"W A S D  =  Move around",{w:240,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"WASD"}),
  t("c2",px+120,py-100,"E  =  Interact with buttons",{w:260,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"E key"}),
  t("c3",px+120,py-68,"Scroll  =  Zoom in / out",{w:240,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"Scroll"}),
  t("c4",px+120,py-36,"Delete  =  Remove object",{w:240,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"Delete"}),
  t("c5",px+120,py-4,"Ctrl+D  =  Duplicate",{w:220,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"Ctrl+D"}),
  t("c6",px+120,py+28,"Ctrl+Z  =  Undo",{w:200,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"Ctrl+Z"}),
  t("c7",px+120,py+60,"Escape  =  Deselect",{w:220,h:28,fs:15,bg:"#e3f2fd",c:"#1565c0",n:"Escape"}),

  t("c8",px+120,py+110,"Walk around and explore!",{w:260,h:34,fs:16,bg:"",c:"#f57f17",b:true,it:true,n:"Explore CTA"}),
  t("c9",px+120,py+148,"Each zone teaches a feature →",{w:290,h:28,fs:14,bg:"",c:"#888",n:"Zones hint"}),

  // ╔═══════════════════════════════════════════════╗
  // ║  ZONE 2: TOOLBAR (top area, arrows point up) ║
  // ╚═══════════════════════════════════════════════╝

  // Section header
  t("tb0",100,60,"📐 Toolbar Guide",{w:240,h:40,fs:22,bg:"#fff9c4",c:"#f57f17",b:true,z:10,n:"Toolbar title"}),

  // Top-left group
  t("tb1",30,115,"⬆️ Play / Edit",{w:140,h:30,fs:14,bg:"#fff9c4",c:"#e65100",n:"Mode"}),
  t("tb1d",30,150,"Switch between building and playing",{w:260,h:26,fs:12,bg:"",c:"#777",n:"Mode desc"}),

  t("tb2",190,115,"⬆️ Camera",{w:110,h:30,fs:14,bg:"#fff9c4",c:"#e65100",n:"Camera"}),
  t("tb2d",190,150,"Follow player or pan freely",{w:230,h:26,fs:12,bg:"",c:"#777",n:"Cam desc"}),

  t("tb3",320,115,"⬆️ Grid",{w:80,h:30,fs:14,bg:"#fff9c4",c:"#e65100",n:"Grid"}),
  t("tb4",415,115,"⬆️ Hidden",{w:100,h:30,fs:14,bg:"#fff9c4",c:"#e65100",n:"Hidden"}),
  t("tb34d",320,150,"Grid snaps objects. Hidden shows invisible ones.",{w:350,h:26,fs:12,bg:"",c:"#777",n:"Grid desc"}),

  t("tb5",540,115,"⬆️ Undo",{w:80,h:30,fs:14,bg:"#c8e6c9",c:"#2e7d32",n:"Undo"}),
  t("tb6",630,115,"⬆️ Redo",{w:80,h:30,fs:14,bg:"#c8e6c9",c:"#2e7d32",n:"Redo"}),
  t("tb7",720,115,"⬆️ Zoom",{w:80,h:30,fs:14,bg:"#c8e6c9",c:"#2e7d32",n:"Zoom"}),

  // Top-right group
  t("tb8",w-450,115,"⬆️ Settings",{w:110,h:30,fs:14,bg:"#fce4ec",c:"#c62828",n:"Settings"}),
  t("tb9",w-330,115,"⬆️ Save",{w:80,h:30,fs:14,bg:"#fce4ec",c:"#c62828",n:"Save"}),
  t("tb10",w-240,115,"⬆️ Share",{w:90,h:30,fs:14,bg:"#fce4ec",c:"#c62828",n:"Share"}),
  t("tbrd",w-450,150,"Save locally, export JSON, or share online",{w:340,h:26,fs:12,bg:"",c:"#777",n:"Save desc"}),

  // ╔═══════════════════════════════════════════════╗
  // ║  ZONE 3: SIDEBAR (left area)                  ║
  // ╚═══════════════════════════════════════════════╝

  t("sb0",30,240,"⬅️ Sidebar (Edit mode)",{w:260,h:40,fs:20,bg:"#e8eaf6",c:"#283593",b:true,n:"Sidebar"}),
  t("sb1",30,290,"Add Tab:",{w:100,h:28,fs:15,bg:"",c:"#333",b:true,n:"Add tab"}),
  t("sb2",30,322,"• Add text labels",{w:180,h:26,fs:14,bg:"",c:"#555",n:"Add text"}),
  t("sb3",30,350,"• Add images & GIFs",{w:190,h:26,fs:14,bg:"",c:"#555",n:"Add img"}),
  t("sb4",30,378,"• Add interactive buttons",{w:230,h:26,fs:14,bg:"",c:"#555",n:"Add btn"}),
  t("sb5",30,406,"• Set room size & grid",{w:210,h:26,fs:14,bg:"",c:"#555",n:"Room size"}),
  t("sb6",30,436,"• Browse all objects",{w:190,h:26,fs:14,bg:"",c:"#555",n:"Obj list"}),
  t("sb7",30,476,"Props Tab:",{w:120,h:28,fs:15,bg:"",c:"#333",b:true,n:"Props tab"}),
  t("sb8",30,508,"• Move, resize, rotate",{w:210,h:26,fs:14,bg:"",c:"#555",n:"Transform"}),
  t("sb9",30,536,"• All controls have sliders!",{w:260,h:26,fs:14,bg:"",c:"#555",n:"Sliders"}),
  t("sb10",30,564,"• Change fonts & colors",{w:220,h:26,fs:14,bg:"",c:"#555",n:"Fonts"}),
  t("sb11",30,592,"• Link buttons to objects",{w:240,h:26,fs:14,bg:"",c:"#555",n:"Link"}),
  t("sb12",30,620,"• Embed URLs on objects",{w:230,h:26,fs:14,bg:"",c:"#555",n:"Embed"}),
  t("sb13",30,648,"• Set layers & z-index",{w:210,h:26,fs:14,bg:"",c:"#555",n:"Layers"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 4: INTERACTIVE BUTTONS (right of player)      ║
  // ╚══════════════════════════════════════════════════════╝

  t("bt0",1150,200,"🎯 Interactive Buttons",{w:340,h:48,fs:26,bg:"#f3e5f5",c:"#4a148c",b:true,n:"Buttons title"}),
  t("bt0d",1150,255,"Buttons control object visibility.",{w:340,h:28,fs:15,bg:"",c:"#666",n:"Btn intro"}),
  t("bt0e",1150,285,"Link a button to objects — they hide/show!",{w:370,h:28,fs:14,bg:"",c:"#888",n:"Btn intro 2"}),

  // ── Press E ──
  t("be0",1150,340,"🔴 Press E Button",{w:220,h:36,fs:19,bg:"#ffebee",c:"#b71c1c",b:true,n:"E title"}),
  t("be1",1150,382,"Walk near it, then press E.",{w:270,h:28,fs:15,bg:"",c:"#555",n:"E instr"}),
  t("be2",1150,414,"It toggles on/off each press.",{w:280,h:28,fs:14,bg:"",c:"#888",n:"E detail"}),
  t("be3",1150,450,"Try it! →",{w:100,h:28,fs:16,bg:"",c:"#b71c1c",b:true,n:"E try"}),
  new BnO({id:"tbe",x:1270,y:446,width:52,height:52,buttonType:BT.E,linkedIds:["tbe_s"],name:"Demo Press E"}),
  new TxO({id:"tbe_s",x:1340,y:450,width:200,height:40,text:"🎉 You pressed E!",fontSize:18,color:"#2e7d32",bgColor:"#e8f5e9",visible:false,name:"E revealed"}),

  // ── Floor Toggle ──
  t("bf0",1150,530,"🟠 Floor Toggle",{w:200,h:36,fs:19,bg:"#fff3e0",c:"#e65100",b:true,n:"FT title"}),
  t("bf1",1150,572,"Walk onto the button.",{w:220,h:28,fs:15,bg:"",c:"#555",n:"FT instr"}),
  t("bf2",1150,604,"Toggles each time you step on it.",{w:310,h:28,fs:14,bg:"",c:"#888",n:"FT detail"}),
  t("bf3",1150,640,"Step on! →",{w:110,h:28,fs:16,bg:"",c:"#e65100",b:true,n:"FT try"}),
  new BnO({id:"tbf",x:1280,y:636,width:56,height:56,buttonType:BT.FT,linkedIds:["tbf_s"],name:"Demo Floor Toggle"}),
  new TxO({id:"tbf_s",x:1350,y:642,width:220,height:40,text:"🔀 Toggled by walking!",fontSize:17,color:"#e65100",bgColor:"#fff3e0",visible:false,name:"FT revealed"}),

  // ── Floor Hold ──
  t("bh0",1150,720,"🟣 Floor Hold",{w:180,h:36,fs:19,bg:"#f3e5f5",c:"#6a1b9a",b:true,n:"FH title"}),
  t("bh1",1150,762,"Stand on the button.",{w:220,h:28,fs:15,bg:"",c:"#555",n:"FH instr"}),
  t("bh2",1150,794,"Only visible while you stand on it!",{w:320,h:28,fs:14,bg:"",c:"#888",n:"FH detail"}),
  t("bh3",1150,830,"Stand here! →",{w:130,h:28,fs:16,bg:"",c:"#6a1b9a",b:true,n:"FH try"}),
  new BnO({id:"tbh",x:1300,y:826,width:56,height:56,buttonType:BT.FH,linkedIds:["tbh_s"],name:"Demo Floor Hold"}),
  new TxO({id:"tbh_s",x:1370,y:830,width:240,height:40,text:"👀 Only while standing!",fontSize:17,color:"#6a1b9a",bgColor:"#f3e5f5",visible:false,name:"FH revealed"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 5: TEXT STYLING SHOWCASE (below player)       ║
  // ╚══════════════════════════════════════════════════════╝

  t("ts0",100,800,"✏️ Text Styling Examples",{w:340,h:48,fs:24,bg:"#e8f5e9",c:"#1b5e20",b:true,n:"Text title"}),
  t("ts0d",100,855,"In Edit mode, select text → Props tab",{w:340,h:28,fs:14,bg:"",c:"#666",n:"Text how"}),

  // Font examples
  t("ts1",100,900,"Sans Serif (default)",{w:240,h:34,fs:18,bg:"#f1f8e9",c:"#33691e",ff:"sans-serif",n:"Sans"}),
  t("ts2",100,940,"Serif — elegant",{w:220,h:34,fs:18,bg:"#f1f8e9",c:"#33691e",ff:"serif",n:"Serif"}),
  t("ts3",100,980,"Monospace — code",{w:230,h:34,fs:18,bg:"#f1f8e9",c:"#33691e",ff:"monospace",n:"Mono"}),
  t("ts4",100,1020,"Cursive — fancy",{w:210,h:34,fs:18,bg:"#f1f8e9",c:"#33691e",ff:"cursive",n:"Cursive"}),
  t("ts5",100,1060,"Georgia — classic",{w:220,h:34,fs:18,bg:"#f1f8e9",c:"#33691e",ff:"'Georgia',serif",n:"Georgia"}),

  // Style examples
  t("ts6",100,1110,"Bold text",{w:140,h:34,fs:18,bg:"#e3f2fd",c:"#0d47a1",b:true,n:"Bold ex"}),
  t("ts7",250,1110,"Italic text",{w:140,h:34,fs:18,bg:"#e3f2fd",c:"#0d47a1",it:true,n:"Italic ex"}),
  t("ts8",400,1110,"Underlined",{w:150,h:34,fs:18,bg:"#e3f2fd",c:"#0d47a1",ul:true,n:"Under ex"}),
  t("ts9",560,1110,"Strikethrough",{w:170,h:34,fs:18,bg:"#e3f2fd",c:"#0d47a1",st:true,n:"Strike ex"}),

  // Color examples
  t("ts10",100,1160,"Red text",{w:120,h:34,fs:18,bg:"",c:"#d32f2f",b:true,n:"Red"}),
  t("ts11",230,1160,"Blue text",{w:120,h:34,fs:18,bg:"",c:"#1565c0",b:true,n:"Blue"}),
  t("ts12",360,1160,"Green text",{w:130,h:34,fs:18,bg:"",c:"#2e7d32",b:true,n:"Green"}),

  // BG color examples
  t("ts13",100,1210,"Background colors →",{w:210,h:32,fs:15,bg:"",c:"#555",n:"BG intro"}),
  t("ts14",320,1210,"Yellow BG",{w:120,h:32,fs:15,bg:"#fff9c4",c:"#333",n:"BG yellow"}),
  t("ts15",450,1210,"Pink BG",{w:110,h:32,fs:15,bg:"#fce4ec",c:"#333",n:"BG pink"}),
  t("ts16",570,1210,"Blue BG",{w:110,h:32,fs:15,bg:"#bbdefb",c:"#333",n:"BG blue"}),

  // Size examples
  t("ts17",100,1260,"Size 12",{w:80,h:22,fs:12,bg:"",c:"#666",n:"S12"}),
  t("ts18",190,1255,"Size 20",{w:110,h:30,fs:20,bg:"",c:"#444",n:"S20"}),
  t("ts19",310,1248,"Size 28",{w:140,h:40,fs:28,bg:"",c:"#333",n:"S28"}),
  t("ts20",460,1240,"Big!",{w:110,h:52,fs:40,bg:"",c:"#222",b:true,n:"Big"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 6: IMAGES & EMBEDS (bottom right)             ║
  // ╚══════════════════════════════════════════════════════╝

  t("im0",1150,950,"🖼️ Images & Embeds",{w:300,h:48,fs:24,bg:"#ede9fe",c:"#4a148c",b:true,n:"Img title"}),
  t("im1",1150,1005,"Upload images, GIFs, and SVGs!",{w:310,h:28,fs:15,bg:"",c:"#666",n:"Img desc"}),
  t("im2",1150,1040,"Example images (SVG icons):",{w:280,h:28,fs:14,bg:"",c:"#888",n:"Img examples"}),

  // Demo images
  new ImO({id:"timg1",x:1150,y:1080,width:80,height:80,src:_SVG_STAR,name:"Star image"}),
  new ImO({id:"timg2",x:1250,y:1080,width:80,height:80,src:_SVG_TREE,name:"Tree image"}),
  new ImO({id:"timg3",x:1350,y:1080,width:80,height:80,src:_SVG_CAT,name:"Cat image"}),

  t("im3",1150,1175,"Images can be resized, rotated,",{w:310,h:28,fs:14,bg:"",c:"#666",n:"Img feat 1"}),
  t("im4",1150,1205,"flipped, and layered!",{w:220,h:28,fs:14,bg:"",c:"#666",n:"Img feat 2"}),

  // Embed link demo
  t("em0",1150,1260,"🔗 Embed Links",{w:220,h:40,fs:20,bg:"#dbeafe",c:"#1e40af",b:true,n:"Embed title"}),
  t("em1",1150,1310,"Add URLs to text or images.",{w:280,h:28,fs:15,bg:"",c:"#555",n:"Embed desc"}),
  t("em2",1150,1342,"In Play mode, click to open link!",{w:300,h:28,fs:14,bg:"",c:"#888",n:"Embed how"}),
  t("em3",1150,1376,"Cursor changes to pointer →",{w:270,h:28,fs:14,bg:"",c:"#888",n:"Embed cursor"}),

  // Clickable demo link image
  new ImO({id:"tembed",x:1440,y:1364,width:140,height:50,src:_SVG_LINK,name:"Link demo",link:"https://github.com"}),

  // Button with image demo
  t("bi0",1150,1440,"🎨 Custom Button Images",{w:310,h:40,fs:20,bg:"#fce4ec",c:"#880e4f",b:true,n:"Btn img title"}),
  t("bi1",1150,1490,"Upload images for ON and OFF states!",{w:340,h:28,fs:14,bg:"",c:"#666",n:"Btn img desc"}),
  t("bi2",1150,1522,"Select button → Props → Images",{w:300,h:28,fs:14,bg:"",c:"#888",n:"Btn img how"}),
  t("bi3",1150,1554,"Also upload custom sound effects!",{w:300,h:28,fs:14,bg:"",c:"#888",n:"Btn snd desc"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 7: SETTINGS GUIDE (bottom left)               ║
  // ╚══════════════════════════════════════════════════════╝

  t("st0",100,1380,"⚙️ Settings (gear icon, top right)",{w:380,h:48,fs:22,bg:"#fce4ec",c:"#880e4f",b:true,n:"Settings title"}),

  t("st1",100,1440,"🎨 Color Themes",{w:190,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Theme"}),
  t("st1d",100,1478,"Light, Dark, Ocean, Forest, Sunset, Lavender",{w:400,h:28,fs:14,bg:"",c:"#666",n:"Theme list"}),

  t("st2",100,1520,"🏃 Player Settings",{w:200,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Player set"}),
  t("st2d",100,1558,"Speed slider, size, color picker",{w:310,h:28,fs:14,bg:"",c:"#666",n:"Player opts"}),
  t("st2e",100,1590,"Upload 2-frame custom sprites!",{w:290,h:28,fs:14,bg:"",c:"#666",n:"Sprites"}),
  t("st2f",100,1622,"Sprite flips horizontally — stays upright",{w:360,h:28,fs:14,bg:"",c:"#888",n:"Sprite flip"}),

  t("st3",100,1664,"🔊 Audio",{w:120,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Audio"}),
  t("st3d",100,1702,"Mute/unmute all button sounds",{w:300,h:28,fs:14,bg:"",c:"#666",n:"Mute"}),

  t("st4",100,1744,"🎨 Room Background",{w:220,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Room bg"}),
  t("st4d",100,1782,"Change the room background color",{w:310,h:28,fs:14,bg:"",c:"#666",n:"BG color"}),

  t("st5",100,1824,"☁️ Cloud Status",{w:190,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Cloud"}),
  t("st5d",100,1862,"Shows if Supabase is connected",{w:300,h:28,fs:14,bg:"",c:"#666",n:"Cloud desc"}),

  t("st6",100,1904,"🗑️ Reset / Tutorial",{w:220,h:32,fs:16,bg:"#fce4ec",c:"#ad1457",b:true,n:"Reset"}),
  t("st6d",100,1942,"Clear room or restore this tutorial",{w:320,h:28,fs:14,bg:"",c:"#666",n:"Reset desc"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 8: CLOUD SHARING GUIDE (bottom center)        ║
  // ╚══════════════════════════════════════════════════════╝

  t("cl0",700,1440,"☁️ Cloud Sharing",{w:270,h:48,fs:24,bg:"#e3f2fd",c:"#0d47a1",b:true,n:"Cloud title"}),

  t("cl1",700,1500,"Share Tab",{w:120,h:32,fs:16,bg:"#e3f2fd",c:"#1565c0",b:true,n:"Share tab"}),
  t("cl1d",700,1538,"Enter nickname + room name",{w:280,h:28,fs:14,bg:"",c:"#666",n:"Share nick"}),
  t("cl1e",700,1568,"Choose Public or ID-Only",{w:260,h:28,fs:14,bg:"",c:"#666",n:"Share pub"}),
  t("cl1f",700,1598,"All images upload to cloud!",{w:270,h:28,fs:14,bg:"",c:"#666",n:"Share img"}),
  t("cl1g",700,1628,"Copy Link or Copy ID buttons",{w:280,h:28,fs:14,bg:"",c:"#666",n:"Share copy"}),

  t("cl2",700,1676,"Browse Tab",{w:130,h:32,fs:16,bg:"#e3f2fd",c:"#1565c0",b:true,n:"Browse tab"}),
  t("cl2d",700,1714,"See all public rooms",{w:210,h:28,fs:14,bg:"",c:"#666",n:"Browse desc"}),
  t("cl2e",700,1744,"Search by name",{w:170,h:28,fs:14,bg:"",c:"#666",n:"Browse search"}),
  t("cl2f",700,1774,"Shows creator + visit count",{w:270,h:28,fs:14,bg:"",c:"#666",n:"Browse visits"}),

  t("cl3",700,1822,"Load ID Tab",{w:130,h:32,fs:16,bg:"#e3f2fd",c:"#1565c0",b:true,n:"Load tab"}),
  t("cl3d",700,1860,"Paste a room ID or URL to load it",{w:310,h:28,fs:14,bg:"",c:"#666",n:"Load desc"}),

  // ╔══════════════════════════════════════════════════════╗
  // ║  ZONE 9: TIPS & TRICKS (bottom area)                ║
  // ╚══════════════════════════════════════════════════════╝

  t("tp0",700,1940,"💡 Tips & Tricks",{w:240,h:44,fs:22,bg:"#fff9c4",c:"#f57f17",b:true,n:"Tips title"}),

  t("tp1",700,1996,"• Toggle Grid for precise placement",{w:340,h:28,fs:15,bg:"",c:"#555",n:"Tip grid"}),
  t("tp2",700,2028,"• Use Show Hidden to see invisible objects",{w:400,h:28,fs:15,bg:"",c:"#555",n:"Tip hidden"}),
  t("tp3",700,2060,"• Layer + Z-index control what's on top",{w:370,h:28,fs:15,bg:"",c:"#555",n:"Tip layers"}),
  t("tp4",700,2092,"• Save often! Export JSON as backup",{w:350,h:28,fs:15,bg:"",c:"#555",n:"Tip save"}),
  t("tp5",700,2124,"• Mobile has a touchscreen D-pad",{w:330,h:28,fs:15,bg:"",c:"#555",n:"Tip mobile"}),
  t("tp6",700,2156,"• Restore this tutorial from Settings anytime",{w:400,h:28,fs:15,bg:"",c:"#555",n:"Tip restore"}),

  // Done message
  t("dn",w/2-200,h-80,"You've seen everything! Switch to Edit mode and start building!",{w:400,h:40,fs:16,bg:"#e0f7fa",c:"#00695c",b:true,n:"Done"}),
  ];

  return new Room({width:w,height:h,roomName:"Tutorial Room",bgColor:"#f8f9fc",
    player:new Player({x:px,y:py,speed:3}),objects:objs});
}
class Hist{constructor(m=60){this.u=[];this.r=[];this.m=m}push(j){this.u.push(JSON.stringify(j));if(this.u.length>this.m)this.u.shift();this.r=[]}undo(c){if(!this.u.length)return null;this.r.push(JSON.stringify(c));return JSON.parse(this.u.pop())}redo(c){if(!this.r.length)return null;this.u.push(JSON.stringify(c));return JSON.parse(this.r.pop())}}

// ── Cloud ──
class Cld{constructor(u,k){this.url=u?.replace(/\/$/,"");this.key=k;this.bk="room-assets"}get ok(){return!!(this.url&&this.key&&!this.url.includes("YOUR_PROJECT"))}h(ct){const h={Authorization:`Bearer ${this.key}`,apikey:this.key};if(ct)h["Content-Type"]=ct;return h}async upB(d,n){const r=await fetch(d);const b=await r.blob();const p=`${Date.now()}_${n}.${b.type.split("/")[1]||"bin"}`;const res=await fetch(`${this.url}/storage/v1/object/${this.bk}/${p}`,{method:"POST",headers:{...this.h(b.type),"x-upsert":"true"},body:b});if(!res.ok)throw new Error(await res.text());return`${this.url}/storage/v1/object/public/${this.bk}/${p}`}async _as(d){for(let i=0;i<d.objects.length;i++){const o=d.objects[i];if(o.type==="image"&&o.src?.startsWith("data:"))o.src=await this.upB(o.src,`i${o.id}`);if(o.type==="button"){if(o.imgActive?.startsWith("data:"))o.imgActive=await this.upB(o.imgActive,`bA${o.id}`);if(o.imgInactive?.startsWith("data:"))o.imgInactive=await this.upB(o.imgInactive,`bI${o.id}`);if(o.customSound?.startsWith("data:"))o.customSound=await this.upB(o.customSound,`s${o.id}`)}}const p=d.player;if(p.sprite1?.startsWith("data:"))p.sprite1=await this.upB(p.sprite1,"sp1");if(p.sprite2?.startsWith("data:"))p.sprite2=await this.upB(p.sprite2,"sp2");return d}async saveRoom(roomData,nick,pub){if(!this.ok)throw new Error("Not configured");let d=JSON.parse(JSON.stringify(roomData));d=await this._as(d);const id=crypto.randomUUID();const res=await fetch(`${this.url}/rest/v1/rooms`,{method:"POST",headers:{...this.h("application/json"),Prefer:"resolution=merge-duplicates"},body:JSON.stringify({id,name:d.roomName||"Untitled",nickname:nick||"Anonymous",public:pub,visits:0,data:d})});if(!res.ok)throw new Error(await res.text());return id}async loadRoom(id){if(!this.ok)throw new Error("Not configured");const res=await fetch(`${this.url}/rest/v1/rooms?id=eq.${id}&select=*`,{headers:this.h("application/json")});if(!res.ok)throw new Error("Load failed");const rows=await res.json();if(!rows.length)throw new Error("Not found");try{await fetch(`${this.url}/rest/v1/rooms?id=eq.${id}`,{method:"PATCH",headers:this.h("application/json"),body:JSON.stringify({visits:(rows[0].visits||0)+1})})}catch{}return Room.fromJSON(rows[0].data)}async list(n=30,q=""){if(!this.ok)return[];let u=`${this.url}/rest/v1/rooms?select=id,name,nickname,visits,created_at&public=eq.true&order=created_at.desc&limit=${n}`;if(q)u+=`&name=ilike.*${encodeURIComponent(q)}*`;const r=await fetch(u,{headers:this.h("application/json")});return r.ok?r.json():[]}}

// ── Local ──
function safeJSON(r){try{return typeof r.toJSON==="function"?r.toJSON():JSON.parse(JSON.stringify(r))}catch{return JSON.parse(JSON.stringify(r))}}
const Ser={save(r,s="room_default"){try{localStorage.setItem(s,JSON.stringify(safeJSON(r)));return true}catch{return false}},load(s="room_default"){try{const d=localStorage.getItem(s);return d?Room.fromJSON(JSON.parse(d)):null}catch{return null}},exp(r,fn){const b=new Blob([JSON.stringify(safeJSON(r),null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u)},imp(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(Room.fromJSON(JSON.parse(r.result)))}catch(e){rej(e)}};r.onerror=rej;r.readAsText(f)})}};

// ── Renderer ──
class Rnd{constructor(c){this.c=c;this.x=c.getContext("2d")}render({room:rm,camX:cx,camY:cy,zoom:z,ed,selId,showH,linking:lk,hovId,vw,vh,T}){const c=this.x,d=window.devicePixelRatio||1;this.c.width=vw*d;this.c.height=vh*d;c.setTransform(d,0,0,d,0,0);c.fillStyle=T.cv;c.fillRect(0,0,vw,vh);c.save();c.translate(vw/2,vh/2);c.scale(z,z);c.translate(-cx,-cy);c.fillStyle=rm.bgColor;c.fillRect(0,0,rm.width,rm.height);c.strokeStyle=T.bd;c.lineWidth=2;c.strokeRect(0,0,rm.width,rm.height);if(rm.gridOn){c.strokeStyle=T.gl;c.lineWidth=1;for(let x=0;x<=rm.width;x+=rm.gridSize){c.beginPath();c.moveTo(x,0);c.lineTo(x,rm.height);c.stroke()}for(let y=0;y<=rm.height;y+=rm.gridSize){c.beginPath();c.moveTo(0,y);c.lineTo(rm.width,y);c.stroke()}}for(const o of rm.sorted())o.draw(c,ed,o.id===selId,showH);if(ed)for(const o of rm.objects){if(!(o instanceof BnO)||!o.linkedIds.length)continue;const f=o.ctr();for(const lid of o.linkedIds){const t=rm.find(lid);if(!t)continue;const tc=t.ctr();const hi=o.id===selId||lk;c.strokeStyle=hi?"#fbbf24":"rgba(251,191,36,0.2)";c.lineWidth=hi?2.5:1.5;c.setLineDash([8,4]);c.beginPath();c.moveTo(f.x,f.y);c.lineTo(tc.x,tc.y);c.stroke();c.setLineDash([]);c.fillStyle=hi?"#fbbf24":"rgba(251,191,36,0.35)";c.beginPath();c.arc(tc.x,tc.y,4,0,Math.PI*2);c.fill()}}if(!ed){const px=rm.player.x,py=rm.player.y;for(const o of rm.objects){if(!(o instanceof BnO)||o.buttonType!==BT.E)continue;const ct=o.ctr();if(Math.hypot(ct.x-px,ct.y-py)<IR+o.width/2){c.fillStyle="rgba(0,0,0,0.75)";c.beginPath();c.roundRect(ct.x-38,ct.y-o.height/2-34,76,24,6);c.fill();c.fillStyle="#fbbf24";c.font="bold 11px monospace";c.textAlign="center";c.textBaseline="middle";c.fillText("⏎ Press E",ct.x,ct.y-o.height/2-22)}}}rm.player.draw(c);if(ed&&lk&&hovId){const h=rm.find(hovId);if(h&&h.type!=="button"){c.strokeStyle="#fbbf24";c.lineWidth=3;c.setLineDash([5,5]);c.strokeRect(h.x-3,h.y-3,h.width+6,h.height+6);c.setLineDash([])}}c.restore()}s2w(sx,sy,cx,cy,z,vw,vh){return{wx:(sx-vw/2)/z+cx,wy:(sy-vh/2)/z+cy}}}

// ── UI Helpers ──
function Btn({children,active,onClick,title,style,className=""}){const T=useContext(TC);return(<button onClick={onClick} title={title} className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110 active:scale-95 ${className}`} style={{background:active?T.acD:T.bBg,border:`1px solid ${active?T.acB:T.bBd}`,color:active?T.ac:T.txD,...style}}>{children}</button>)}
function SR({label,value,onChange,min,max,step=1}){const T=useContext(TC);return(<div className="space-y-0.5"><div className="flex items-center justify-between"><span className="text-xs" style={{color:T.txD}}>{label}</span><input type="number" value={value} min={min} max={max} step={step} className="w-16 px-1 py-0.5 rounded text-right text-xs outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>onChange(parseFloat(e.target.value)||0)}/></div><input type="range" min={min} max={max} step={step} value={value} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{background:T.bd,accentColor:T.ac}} onChange={e=>onChange(parseFloat(e.target.value))}/></div>)}
function rF(a){return new Promise(r=>{const i=document.createElement("input");i.type="file";i.accept=a;i.onchange=()=>{const f=i.files?.[0];if(!f){r(null);return}const rd=new FileReader();rd.onload=()=>r({data:rd.result,name:f.name});rd.readAsDataURL(f)};i.click()})}
function iDm(s){return new Promise(r=>{const i=new window.Image();i.onload=()=>r({w:i.width,h:i.height});i.onerror=()=>r({w:200,h:200});i.src=s})}
function Sec({title,children}){const T=useContext(TC);return(<div className="space-y-1.5"><p className="font-semibold uppercase tracking-wider" style={{color:T.txM,fontSize:9}}>{title}</p>{children}</div>)}
function Toast({msg,type="info",onDone}){const T=useContext(TC);useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t)},[onDone]);return(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2" style={{background:T.sf,border:`1px solid ${T.bd}`,color:T.tx}}><div className="w-2 h-2 rounded-full" style={{background:{info:T.ac,error:T.dg,success:T.sc}[type]||T.ac}}/>{msg}</div>)}
function DPad({onDir}){const T=useContext(TC);const bc="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform select-none";const bs={background:T.acD,border:`1px solid ${T.acB}`};const h=d=>e=>{e.preventDefault();onDir(d,true)};const r=d=>e=>{e.preventDefault();onDir(d,false)};return(<div className="fixed bottom-6 left-6 z-50 select-none" style={{touchAction:"none"}}><div className="grid grid-cols-3 gap-1" style={{width:156}}><div/><button className={bc} style={bs} onTouchStart={h("up")} onTouchEnd={r("up")} onMouseDown={h("up")} onMouseUp={r("up")}><ChevronUp size={22} color={T.ac}/></button><div/><button className={bc} style={bs} onTouchStart={h("left")} onTouchEnd={r("left")} onMouseDown={h("left")} onMouseUp={r("left")}><ChevronLeft size={22} color={T.ac}/></button><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:T.bBg}}><Move size={14} color={T.txM}/></div><button className={bc} style={bs} onTouchStart={h("right")} onTouchEnd={r("right")} onMouseDown={h("right")} onMouseUp={r("right")}><ChevronRight size={22} color={T.ac}/></button><div/><button className={bc} style={bs} onTouchStart={h("down")} onTouchEnd={r("down")} onMouseDown={h("down")} onMouseUp={r("down")}><ChevronDown size={22} color={T.ac}/></button><div/></div><button className="mt-2 w-full h-11 rounded-xl font-bold text-sm tracking-widest select-none active:scale-95" style={{background:T.wnD,border:`1px solid ${T.wn}`,color:T.wn}} onTouchStart={e=>{e.preventDefault();onDir("interact",true)}} onTouchEnd={e=>{e.preventDefault();onDir("interact",false)}} onMouseDown={()=>onDir("interact",true)} onMouseUp={()=>onDir("interact",false)}>⏎ INTERACT</button></div>)}

// ── Property Panel ──
function PP({obj,room,onChange,onDelete,onUA,lk,onTL}){const T=useContext(TC);if(!obj)return(<div className="p-4 flex flex-col items-center h-32 justify-center" style={{color:T.txM}}><MousePointer size={20} className="mb-2 opacity-40"/><p className="text-xs">Click to select</p></div>);const ch=(k,v)=>onChange(obj.id,k,v);return(<div className="p-3 space-y-3 text-xs overflow-y-auto" style={{maxHeight:"calc(100vh-160px)"}}>
<div><input value={obj.name} className="w-full px-2 py-1.5 rounded text-sm font-semibold outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("name",e.target.value)}/><p className="mt-0.5 uppercase tracking-widest font-semibold" style={{color:T.txM,fontSize:9}}>{obj.type}</p></div>
{(obj.type==="text"||obj.type==="image")&&<Sec title="Embed Link"><div className="flex gap-1"><input value={obj.link||""} placeholder="https://..." className="flex-1 px-2 py-1 rounded text-xs outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("link",e.target.value)}/>{obj.link&&<button onClick={()=>window.open(obj.link,"_blank")} className="p-1 rounded" style={{color:T.ac}}><ExternalLink size={12}/></button>}</div></Sec>}
<Sec title="Transform"><SR label="X" value={obj.x} onChange={v=>ch("x",v)} min={-200} max={room.width+200}/><SR label="Y" value={obj.y} onChange={v=>ch("y",v)} min={-200} max={room.height+200}/><SR label="W" value={obj.width} onChange={v=>ch("width",v)} min={8} max={2000}/><SR label="H" value={obj.height} onChange={v=>ch("height",v)} min={8} max={2000}/><SR label="Rotation" value={obj.rotation} onChange={v=>ch("rotation",v)} min={-180} max={180}/><SR label="Scale X" value={obj.scaleX} onChange={v=>ch("scaleX",v)} min={-5} max={5} step={0.1}/><SR label="Scale Y" value={obj.scaleY} onChange={v=>ch("scaleY",v)} min={-5} max={5} step={0.1}/><div className="flex gap-1 pt-1"><Btn onClick={()=>ch("rotation",0)}><RotateCw size={11}/> 0°</Btn><Btn onClick={()=>ch("scaleX",obj.scaleX*-1)}><FlipHorizontal size={11}/></Btn><Btn onClick={()=>ch("scaleY",obj.scaleY*-1)}><FlipVertical size={11}/></Btn></div></Sec>
<Sec title="Order"><label className="flex items-center justify-between"><span style={{color:T.txD}}>Layer</span><select value={obj.layer} className="px-1.5 py-0.5 rounded text-xs outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("layer",parseInt(e.target.value))}><option value={LY.BG}>Background</option><option value={LY.OBJ}>Objects</option></select></label><SR label="Z" value={obj.zIndex} onChange={v=>ch("zIndex",v)} min={-50} max={50}/></Sec>
{obj.type==="text"&&<Sec title="Text"><textarea value={obj.text} rows={2} className="w-full px-2 py-1.5 rounded text-xs outline-none resize-y" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("text",e.target.value)}/><SR label="Size" value={obj.fontSize} onChange={v=>ch("fontSize",v)} min={8} max={120}/><label className="flex items-center justify-between"><span style={{color:T.txD}}>Font</span><select value={obj.fontFamily} className="px-1 py-0.5 rounded text-xs outline-none max-w-[120px]" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("fontFamily",e.target.value)}>{FONTS.map(f=><option key={f.v} value={f.v}>{f.l}</option>)}</select></label><div className="flex gap-1">{[["bold",Bold],["italic",Italic],["underline",Underline],["strike",Strikethrough]].map(([k,Ic])=><button key={k} onClick={()=>ch(k,!obj[k])} className="flex-1 py-1.5 rounded flex items-center justify-center" style={{background:obj[k]?T.acD:T.bBg,border:`1px solid ${obj[k]?T.acB:T.bBd}`,color:obj[k]?T.ac:T.txD}}><Ic size={12}/></button>)}</div><label className="flex items-center justify-between"><span style={{color:T.txD}}>Color</span><input type="color" value={obj.color} onChange={e=>ch("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label><label className="flex items-center justify-between"><span style={{color:T.txD}}>BG</span><div className="flex items-center gap-1">{obj.bgColor&&<button onClick={()=>ch("bgColor","")} className="text-xs px-1 rounded" style={{color:T.dg}}>×</button>}<input type="color" value={obj.bgColor||"#fff"} onChange={e=>ch("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></div></label></Sec>}
{obj.type==="button"&&<Sec title="Button"><label className="flex items-center justify-between"><span style={{color:T.txD}}>Type</span><select value={obj.buttonType} className="px-1 py-0.5 rounded text-xs outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}} onChange={e=>ch("buttonType",e.target.value)}><option value={BT.E}>Press E</option><option value={BT.FT}>Floor Toggle</option><option value={BT.FH}>Floor Hold</option></select></label><p className="uppercase tracking-wider pt-1" style={{color:T.txM,fontSize:9}}>Images</p><div className="flex gap-2">{["Inactive","Active"].map((lb,i)=>{const k=i?"imgActive":"imgInactive";const v=obj[k];return<div key={k} className="flex-1"><p style={{color:T.txD,fontSize:10}} className="mb-0.5">{lb}</p>{v?<div className="relative group"><img src={v} alt="" className="w-full h-10 object-contain rounded" style={{background:T.bg}}/><button onClick={()=>ch(k,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100" style={{background:T.dg}}><X size={9} color="#fff"/></button></div>:<button onClick={async()=>{const r=await rF("image/*");if(r)ch(k,r.data)}} className="w-full h-10 rounded flex items-center justify-center" style={{border:`1px dashed ${T.bd}`,color:T.txM,fontSize:10}}><Upload size={10} className="mr-1"/>Up</button>}</div>})}</div><p className="uppercase tracking-wider pt-1" style={{color:T.txM,fontSize:9}}>Sound</p>{obj.customSound?<div className="flex items-center gap-1"><Volume2 size={12} color={T.sc}/><span style={{color:T.txD}}>Custom</span><button onClick={()=>ch("customSound","")} className="ml-auto" style={{color:T.dg}}><X size={11}/></button></div>:<div className="flex items-center gap-1"><span style={{color:T.txM,fontSize:10}}>Default</span><button onClick={async()=>{const r=await rF("audio/*");if(r)ch("customSound",r.data)}} className="ml-auto px-2 py-0.5 rounded text-xs" style={{border:`1px solid ${T.bd}`,color:T.txD}}><Upload size={10} className="inline mr-1"/>Upload</button></div>}<button onClick={onTL} className="w-full py-2 rounded-md text-xs font-semibold mt-1" style={{background:lk?T.wnD:T.acD,border:`1px solid ${lk?T.wn:T.acB}`,color:lk?T.wn:T.txD}}>{lk?"✓ Click targets":"🔗 Link"}</button><div className="pt-0.5"><p style={{color:T.txM}}>{obj.linkedIds.length} linked</p>{obj.linkedIds.map(lid=>{const lo=room.find(lid);return lo?<div key={lid} className="flex items-center justify-between py-0.5 pl-1"><span style={{color:T.txD}} className="truncate">{lo.name}</span><button onClick={()=>ch("_unlink",lid)} style={{color:T.dg}}><X size={11}/></button></div>:null})}</div></Sec>}
{obj.type!=="button"&&<label className="flex items-center justify-between px-1"><span style={{color:T.txD}}>Visible</span><button onClick={()=>ch("visible",!obj.visible)} className="p-1 rounded" style={{background:obj.visible?T.scD:T.dgD}}>{obj.visible?<Eye size={13} color={T.sc}/>:<EyeOff size={13} color={T.dg}/>}</button></label>}
<div className="space-y-1.5 pt-2" style={{borderTop:`1px solid ${T.bd}`}}><button onClick={()=>onUA(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5" style={{background:T.wnD,border:`1px solid ${T.wn}30`,color:T.wn}}><Unlink size={11}/>Unlink All</button><button onClick={()=>onDelete(obj.id)} className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5" style={{background:T.dgD,border:`1px solid ${T.dg}30`,color:T.dg}}><Trash2 size={11}/>Delete</button></div></div>)}

// ── Share Modal ──
function SM({room,cloud,onClose,dt,onLoad,pH}){const T=useContext(TC);const[sav,setSav]=useState(false);const[sid,setSid]=useState(null);const[lid,setLid]=useState("");const[ldg,setLdg]=useState(false);const[rc,setRc]=useState([]);const[tab,setTab]=useState("share");const[nick,setNick]=useState(()=>localStorage.getItem("rb_nick")||"");const[rn,setRn]=useState(room.roomName);const[pub,setPub]=useState(true);const[srch,setSrch]=useState("");const doS=useCallback(q=>{if(cloud.ok)cloud.list(30,q).then(setRc).catch(()=>{})},[cloud]);useEffect(()=>{doS("")},[doS]);
const share=async()=>{if(!nick.trim()){dt("Enter nickname","error");return}localStorage.setItem("rb_nick",nick);setSav(true);try{const data=safeJSON(room);data.roomName=rn;const id=await cloud.saveRoom(data,nick.trim(),pub);setSid(id);try{await navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${id}`);dt("Link copied!","success")}catch{dt("Shared!","success")}}catch(e){dt("Failed: "+e.message,"error")}setSav(false)};
const load=async id=>{setLdg(true);try{pH();const r=await cloud.loadRoom(id);onLoad(r);dt("Loaded!","success");onClose()}catch(e){dt("Failed","error")}setLdg(false)};
return(<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}><div className="absolute inset-0 bg-black/50"/><div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" style={{background:T.sf,border:`1px solid ${T.bd}`}} onClick={e=>e.stopPropagation()}>
<div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${T.bd}`}}><div className="flex items-center gap-2"><Cloud size={16} color={T.ac}/><span className="font-semibold text-sm" style={{color:T.tx}}>Cloud</span></div><button onClick={onClose} style={{color:T.txM}}><X size={16}/></button></div>
<div className="flex" style={{borderBottom:`1px solid ${T.bd}`}}>{[["share","Share"],["browse","Browse"],["load","Load ID"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} className="flex-1 py-2 text-xs font-medium" style={{color:tab===id?T.ac:T.txM,borderBottom:tab===id?`2px solid ${T.ac}`:"2px solid transparent"}}>{l}</button>)}</div>
<div className="p-4 space-y-3 max-h-80 overflow-y-auto">
{tab==="share"&&<><div className="space-y-2"><div><label className="text-xs font-medium" style={{color:T.txD}}>Nickname</label><input value={nick} onChange={e=>setNick(e.target.value)} placeholder="Your name..." className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}}/></div><div><label className="text-xs font-medium" style={{color:T.txD}}>Room Name</label><input value={rn} onChange={e=>setRn(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}}/></div></div>
<div className="flex gap-2"><button onClick={()=>setPub(true)} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5" style={{background:pub?T.acD:T.bBg,border:`1px solid ${pub?T.acB:T.bBd}`,color:pub?T.ac:T.txD}}><Globe size={12}/>Public</button><button onClick={()=>setPub(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5" style={{background:!pub?T.wnD:T.bBg,border:`1px solid ${!pub?T.wn:T.bBd}`,color:!pub?T.wn:T.txD}}><Lock size={12}/>ID Only</button></div>
<p className="text-xs" style={{color:T.txM}}>{pub?"Shows in Browse":"Direct link only"}</p>
<button onClick={share} disabled={sav} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{background:T.acD,border:`1px solid ${T.acB}`,color:T.ac}}>{sav?"Uploading...":"Share"}</button>
{sid&&<><div className="p-2 rounded text-xs" style={{background:T.scD,color:T.sc}}><Check size={12} className="inline mr-1"/>Shared!</div><div className="flex gap-1.5"><button onClick={()=>{navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${sid}`).then(()=>dt("Link copied!","success"))}} className="flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1" style={{background:T.acD,border:`1px solid ${T.acB}`,color:T.ac}}><ClipboardCopy size={11}/>Copy Link</button><button onClick={()=>{navigator.clipboard.writeText(sid).then(()=>dt("ID copied!","success"))}} className="flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1" style={{background:T.bBg,border:`1px solid ${T.bBd}`,color:T.txD}}><Copy size={11}/>Copy ID</button></div></>}</>}
{tab==="browse"&&<><div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{background:T.bg,border:`1px solid ${T.bd}`}}><Search size={13} color={T.txM}/><input value={srch} onChange={e=>{setSrch(e.target.value);doS(e.target.value)}} placeholder="Search..." className="flex-1 text-xs outline-none bg-transparent" style={{color:T.tx}}/>{srch&&<button onClick={()=>{setSrch("");doS("")}} style={{color:T.txM}}><X size={12}/></button>}</div>{rc.length===0&&<p className="text-xs text-center py-4" style={{color:T.txM}}>No public rooms</p>}{rc.map(r=><button key={r.id} onClick={()=>load(r.id)} className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:brightness-110" style={{background:T.bg,border:`1px solid ${T.bd}`}}><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate" style={{color:T.tx}}>{r.name}</p><p className="text-xs mt-0.5 flex items-center gap-1.5" style={{color:T.txM}}>by {r.nickname||"Anon"} · <EyeIcon size={10}/>{r.visits||0} · {new Date(r.created_at).toLocaleDateString()}</p></div><ExternalLink size={14} color={T.txM} className="ml-2 flex-shrink-0"/></button>)}</>}
{tab==="load"&&<><input value={lid} onChange={e=>setLid(e.target.value)} placeholder="Room ID or URL..." className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}}/><button onClick={()=>{let id=lid.trim();if(id.includes("room="))id=id.split("room=")[1].split("&")[0];if(id)load(id)}} disabled={ldg||!lid.trim()} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{background:T.acD,border:`1px solid ${T.acB}`,color:T.ac}}>{ldg?"Loading...":"Load"}</button></>}
</div></div></div>)}

// ── MAIN APP ──
export default function App(){const[tn,setTn]=useState(()=>localStorage.getItem("rb_theme")||"light");const T=TH[tn]||TH.light;const cloud=useMemo(()=>new Cld(SB_URL,SB_KEY),[]);const[room,setRoom]=useState(()=>{if(!localStorage.getItem("rb_v5")){localStorage.setItem("rb_v5","1");return mkTut()}return Ser.load()||mkTut()});const[ed,setEd]=useState(false);const[si,setSi]=useState(null);const[sH,setSH]=useState(false);const[cF,setCF]=useState(true);const[zm,setZm]=useState(0.85);const[cP,setCP]=useState({x:ROOM_W/2,y:ROOM_H/2});const[lk,setLk]=useState(false);const[hI,setHI]=useState(null);const[toast,setToast]=useState(null);const[tT,setTT]=useState("info");const[sSv,setSSv]=useState(false);const[sSh,setSSh]=useState(false);const[sSt,setSSt]=useState(false);const[mob,setMob]=useState(false);const[sb,setSb]=useState(true);const[tab,setTab]=useState("add");const[cur,setCur]=useState("crosshair");
const cR=useRef(null);const rR=useRef(null);const rmR=useRef(room);const kR=useRef({});const hR=useRef(new Hist());const dR=useRef(null);const aR=useRef(null);const ctR=useRef(null);const[vp,setVp]=useState({w:800,h:600});const fR=useRef(null);rmR.current=room;const dt=useCallback((m,t="info")=>{setToast(m);setTT(t)},[]);
useEffect(()=>{setMob("ontouchstart"in window||navigator.maxTouchPoints>0)},[]);
useEffect(()=>{const p=new URLSearchParams(location.search);const rid=p.get("room");if(rid&&cloud.ok)cloud.loadRoom(rid).then(r=>{setRoom(r);setCP({x:r.width/2,y:r.height/2});dt("Loaded!","success");setEd(false)}).catch(()=>dt("Load failed","error"))},[]);
useEffect(()=>{const el=ctR.current;if(!el)return;const ro=new ResizeObserver(e=>{const{width:w,height:h}=e[0].contentRect;setVp({w,h})});ro.observe(el);return()=>ro.disconnect()},[]);
useEffect(()=>{if(cR.current)rR.current=new Rnd(cR.current)},[]);
useEffect(()=>{const kd=e=>{const k=e.key.toLowerCase();kR.current[k]=true;if((e.ctrlKey||e.metaKey)&&k==="z"&&!e.shiftKey){e.preventDefault();doU()}if((e.ctrlKey||e.metaKey)&&k==="z"&&e.shiftKey){e.preventDefault();doR()}if((e.ctrlKey||e.metaKey)&&k==="y"){e.preventDefault();doR()}if((e.ctrlKey||e.metaKey)&&k==="d"){e.preventDefault();dupS()}if(k==="e"&&!ed)intr();if((e.key==="Delete"||e.key==="Backspace")&&ed&&si&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){e.preventDefault();delO(si)}if(e.key==="Escape"){setLk(false);setSi(null)}};const ku=e=>{kR.current[e.key.toLowerCase()]=false};window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);return()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku)}},[ed,si]);
useEffect(()=>{let run=true;const loop=()=>{if(!run)return;const r=rmR.current,k=kR.current;if(!ed){let dx=0,dy=0;if(k.w||k.arrowup)dy-=r.player.speed;if(k.s||k.arrowdown)dy+=r.player.speed;if(k.a||k.arrowleft)dx-=r.player.speed;if(k.d||k.arrowright)dx+=r.player.speed;if(dx&&dy){dx*=.707;dy*=.707}if(dx||dy){r.player.move(dx,dy,r.width,r.height);const pb=r.player.bounds();for(const o of r.objects){if(!(o instanceof BnO))continue;const ov=pb.x<o.x+o.width&&pb.x+pb.width>o.x&&pb.y<o.y+o.height&&pb.y+pb.height>o.y;if(o.buttonType===BT.FT){if(ov&&!o._w){o.toggle(r.objects,r.soundMuted);o._w=true}else if(!ov)o._w=false}else if(o.buttonType===BT.FH){if(ov)o.activate(r.objects,r.soundMuted);else o.deactivate(r.objects)}}}}const cx=cF?r.player.x:cP.x,cy=cF?r.player.y:cP.y;if(rR.current)rR.current.render({room:r,camX:cx,camY:cy,zoom:zm,ed,selId:si,showH:sH,linking:lk,hovId:hI,vw:vp.w,vh:vp.h,T});aR.current=requestAnimationFrame(loop)};aR.current=requestAnimationFrame(loop);return()=>{run=false;if(aR.current)cancelAnimationFrame(aR.current)}},[ed,si,sH,lk,hI,cF,cP,zm,vp,T]);
const pH=useCallback(()=>{hR.current.push(safeJSON(rmR.current))},[]);const doU=useCallback(()=>{const p=hR.current.undo(safeJSON(rmR.current));if(p){setRoom(Room.fromJSON(p));setSi(null)}},[]);const doR=useCallback(()=>{const n=hR.current.redo(safeJSON(rmR.current));if(n){setRoom(Room.fromJSON(n));setSi(null)}},[]);
const chP=useCallback((id,k,v)=>{pH();const r=rmR.current,o=r.find(id);if(!o)return;if(k==="_unlink"&&o instanceof BnO)o.unlink(v);else o[k]=v;if((k==="x"||k==="y")&&r.gridOn)o.snap(r.gridSize);setRoom(Room.fromJSON(safeJSON(r)))},[pH]);
const addT=useCallback(()=>{pH();const r=rmR.current;const o=new TxO({x:r.width/2-80,y:r.height/2-20,text:"New Text",fontSize:24,color:"#333"});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(safeJSON(r)));setSi(o.id);setTab("props")},[pH]);
const addI=useCallback(async()=>{const res=await rF("image/png,image/jpeg,image/gif,image/webp");if(!res)return;pH();const r=rmR.current;const d=await iDm(res.data);let w=d.w,h=d.h;const mx=400;if(w>mx||h>mx){const s=mx/Math.max(w,h);w*=s;h*=s}const o=new ImO({x:r.width/2-w/2,y:r.height/2-h/2,width:w,height:h,src:res.data,name:res.name||"Image"});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(safeJSON(r)));setSi(o.id);setTab("props")},[pH]);
const addB=useCallback(bt=>{pH();const r=rmR.current;const o=new BnO({x:r.width/2-22,y:r.height/2-22,buttonType:bt});if(r.gridOn)o.snap(r.gridSize);r.add(o);setRoom(Room.fromJSON(safeJSON(r)));setSi(o.id);setTab("props")},[pH]);
const delO=useCallback(id=>{pH();rmR.current.remove(id);setRoom(Room.fromJSON(safeJSON(rmR.current)));setSi(null);setLk(false)},[pH]);
const uA=useCallback(id=>{pH();rmR.current.unlinkAll(id);setRoom(Room.fromJSON(safeJSON(rmR.current)))},[pH]);
const dupS=useCallback(()=>{if(!si)return;pH();const n=rmR.current.dup(si);if(n){setRoom(Room.fromJSON(safeJSON(rmR.current)));setSi(n.id)}},[si,pH]);
const intr=useCallback(()=>{const r=rmR.current;for(const o of r.objects){if(!(o instanceof BnO)||o.buttonType!==BT.E)continue;const c=o.ctr();if(Math.hypot(c.x-r.player.x,c.y-r.player.y)<IR+o.width/2){o.toggle(r.objects,r.soundMuted);break}}},[]);
const chRm=useCallback((k,v)=>{setRoom(p=>{const d=safeJSON(p);d[k]=v;return Room.fromJSON(d)})},[]);
const chPl=useCallback((k,v)=>{setRoom(p=>{const d=safeJSON(p);d.player[k]=v;return Room.fromJSON(d)})},[]);
const w2s=useCallback((cx,cy)=>{if(!cR.current||!rR.current)return{wx:0,wy:0};const rect=cR.current.getBoundingClientRect();return rR.current.s2w(cx-rect.left,cy-rect.top,cF?rmR.current.player.x:cP.x,cF?rmR.current.player.y:cP.y,zm,vp.w,vp.h)},[cF,cP,zm,vp]);
const onD=useCallback(e=>{const{wx,wy}=w2s(e.clientX,e.clientY);const r=rmR.current,hit=r.hitTest(wx,wy);if(!ed){if(hit&&hit.link&&hit.visible)window.open(hit.link,"_blank");return}if(lk&&si){if(hit&&hit.type!=="button"&&hit.id!==si){pH();const b=r.find(si);if(b instanceof BnO){if(b.linkedIds.includes(hit.id))b.unlink(hit.id);else b.link(hit.id);setRoom(Room.fromJSON(safeJSON(r)))}}return}if(hit){setSi(hit.id);setTab("props");pH();dR.current={id:hit.id,ox:wx-hit.x,oy:wy-hit.y}}else{setSi(null);setLk(false);if(!cF)dR.current={id:null,sx:cP.x,sy:cP.y,mx:e.clientX,my:e.clientY}}},[ed,lk,si,w2s,cF,cP,pH]);
const onM=useCallback(e=>{const{wx,wy}=w2s(e.clientX,e.clientY);if(!ed){const h=rmR.current.hitTest(wx,wy);setCur(h&&h.link&&h.visible?"pointer":"default")}else{if(lk){const h=rmR.current.hitTest(wx,wy);setHI(h?.id||null)}setCur(dR.current?"grabbing":"crosshair")}if(!dR.current)return;if(dR.current.id){const o=rmR.current.find(dR.current.id);if(o){let nx=wx-dR.current.ox,ny=wy-dR.current.oy;if(rmR.current.gridOn){const g=rmR.current.gridSize;nx=Math.round(nx/g)*g;ny=Math.round(ny/g)*g}o.x=nx;o.y=ny}}else if(dR.current.sx!==undefined)setCP({x:dR.current.sx-(e.clientX-dR.current.mx)/zm,y:dR.current.sy-(e.clientY-dR.current.my)/zm})},[ed,lk,w2s,zm]);
const onU=useCallback(()=>{if(dR.current?.id)setRoom(Room.fromJSON(safeJSON(rmR.current)));dR.current=null},[]);
const onW=useCallback(e=>{e.preventDefault();setZm(z=>Math.max(MIN_Z,Math.min(MAX_Z,z-e.deltaY*.001)))},[]);
const dpH=useCallback((d,p)=>{const m={up:"w",down:"s",left:"a",right:"d",interact:"e"};kR.current[m[d]]=p;if(d==="interact"&&p&&!ed)intr()},[ed,intr]);
const svL=useCallback(()=>{Ser.save(rmR.current);dt("Saved!","success");setSSv(false)},[dt]);
const ldL=useCallback(()=>{const l=Ser.load();if(l){pH();setRoom(l);setCP({x:l.width/2,y:l.height/2});dt("Loaded!","success")}else dt("No save","error");setSSv(false)},[pH,dt]);
const exF=useCallback(()=>{Ser.exp(rmR.current,(rmR.current.roomName||"room")+".json");dt("Exported!","success");setSSv(false)},[dt]);
const imF=useCallback(async e=>{const f=e.target.files?.[0];if(!f)return;try{pH();const l=await Ser.imp(f);setRoom(l);setCP({x:l.width/2,y:l.height/2});dt("Imported!","success")}catch{dt("Failed","error")}e.target.value="";setSSv(false)},[pH,dt]);
const sO=useMemo(()=>si?room.find(si):null,[room,si]);

return(<TC.Provider value={T}><div className="w-full h-screen flex flex-col overflow-hidden" style={{background:T.bg,fontFamily:"'DM Mono','JetBrains Mono','Fira Code',ui-monospace,monospace",color:T.tx}}>
<input ref={fR} type="file" accept=".json" className="hidden" onChange={imF}/>{toast&&<Toast msg={toast} type={tT} onDone={()=>setToast(null)}/>}{sSh&&cloud.ok&&<SM room={room} cloud={cloud} onClose={()=>setSSh(false)} dt={dt} onLoad={r=>{setRoom(r);setCP({x:r.width/2,y:r.height/2})}} pH={pH}/>}
{/* Settings */}
{sSt&&<div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={()=>setSSt(false)}><div className="absolute inset-0 bg-black/50"/><div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" style={{background:T.sf,border:`1px solid ${T.bd}`}} onClick={e=>e.stopPropagation()}>
<div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{background:T.sf,borderBottom:`1px solid ${T.bd}`}}><div className="flex items-center gap-2"><Settings size={16} color={T.ac}/><span className="font-semibold text-sm" style={{color:T.tx}}>Settings</span></div><button onClick={()=>setSSt(false)} style={{color:T.txM}}><X size={16}/></button></div>
<div className="p-4 space-y-4">
<Sec title="Theme"><div className="grid grid-cols-3 gap-1.5">{Object.entries(TH).map(([k,v])=><button key={k} onClick={()=>{setTn(k);localStorage.setItem("rb_theme",k)}} className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{background:tn===k?T.acD:T.bg,border:`1px solid ${tn===k?T.acB:T.bd}`,color:tn===k?T.ac:T.txD}}><div className="w-3 h-3 rounded-full" style={{background:v.ac}}/>{v.label}</button>)}</div></Sec>
<Sec title="Player"><SR label="Speed" value={room.player.speed} onChange={v=>chPl("speed",v)} min={1} max={10} step={0.5}/><SR label="Size" value={room.player.size} onChange={v=>chPl("size",v)} min={12} max={60}/><label className="flex items-center justify-between"><span className="text-xs" style={{color:T.txD}}>Color</span><input type="color" value={room.player.color} onChange={e=>chPl("color",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label><p className="uppercase tracking-wider pt-1" style={{color:T.txM,fontSize:9}}>Sprite</p><div className="flex gap-2">{[["sprite1","Frame 1"],["sprite2","Frame 2"]].map(([k,l])=>{const v=room.player[k];return<div key={k} className="flex-1"><p style={{color:T.txD,fontSize:10}} className="mb-0.5">{l}</p>{v?<div className="relative group"><img src={v} alt="" className="w-full h-14 object-contain rounded" style={{background:T.bg}}/><button onClick={()=>chPl(k,"")} className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100" style={{background:T.dg}}><X size={9} color="#fff"/></button></div>:<button onClick={async()=>{const r=await rF("image/*");if(r)chPl(k,r.data)}} className="w-full h-14 rounded flex items-center justify-center" style={{border:`1px dashed ${T.bd}`,color:T.txM,fontSize:10}}><Upload size={10} className="mr-1"/>Up</button>}</div>})}</div></Sec>
<Sec title="Audio"><label className="flex items-center justify-between"><span className="text-xs" style={{color:T.txD}}>Mute</span><button onClick={()=>chRm("soundMuted",!room.soundMuted)} className="p-1.5 rounded" style={{background:room.soundMuted?T.dgD:T.scD}}>{room.soundMuted?<VolumeX size={14} color={T.dg}/>:<Volume2 size={14} color={T.sc}/>}</button></label></Sec>
<Sec title="Room"><label className="flex items-center justify-between"><span className="text-xs" style={{color:T.txD}}>Background</span><input type="color" value={room.bgColor} onChange={e=>chRm("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer"/></label></Sec>
<Sec title="Cloud"><div className="flex items-center gap-1.5 text-xs" style={{color:cloud.ok?T.sc:T.txM}}>{cloud.ok?<Cloud size={12}/>:<CloudOff size={12}/>}{cloud.ok?"Connected":"Not configured"}</div></Sec>
<Sec title="Reset"><div className="flex gap-2"><button onClick={()=>{pH();setRoom(new Room());setSi(null);dt("Cleared","info")}} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{background:T.dgD,border:`1px solid ${T.dg}30`,color:T.dg}}><Trash2 size={12}/>Clear</button><button onClick={()=>{pH();setRoom(mkTut());setSi(null);setCF(true);dt("Tutorial!","success")}} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{background:T.acD,border:`1px solid ${T.acB}`,color:T.ac}}><HelpCircle size={12}/>Tutorial</button></div></Sec>
</div></div></div>}

{/* Toolbar */}
<div className="flex items-center gap-1 px-2.5 py-1.5 flex-shrink-0" style={{background:T.sf,borderBottom:`1px solid ${T.bd}`}}>
<div className="flex items-center gap-2 mr-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:`linear-gradient(135deg,${T.ac},#7c4dff)`}}><Maximize2 size={11} color="#fff"/></div><span className="text-xs font-bold tracking-wider hidden md:inline" style={{color:T.tx}}>ROOM&nbsp;BUILDER</span></div>
{ed&&<input value={room.roomName} onChange={e=>chRm("roomName",e.target.value)} className="px-2 py-0.5 rounded text-xs font-medium w-24 outline-none hidden sm:block" style={{background:T.bg,border:`1px solid ${T.bd}`,color:T.tx}}/>}
<div className="w-px h-5 mx-0.5" style={{background:T.bd}}/>
<Btn onClick={()=>{setEd(p=>!p);setSi(null);setLk(false)}}>{ed?<><Play size={12}/><span className="hidden sm:inline">Play</span></>:<><Pencil size={12}/><span className="hidden sm:inline">Edit</span></>}</Btn>
<Btn active={cF} onClick={()=>setCF(p=>!p)}>{cF?<Camera size={12}/>:<CameraOff size={12}/>}<span className="hidden sm:inline">{cF?"Follow":"Fixed"}</span></Btn>
{ed&&<><div className="w-px h-5 mx-0.5" style={{background:T.bd}}/><Btn active={room.gridOn} onClick={()=>chRm("gridOn",!room.gridOn)}><Grid3X3 size={12}/></Btn><Btn active={sH} onClick={()=>setSH(p=>!p)}>{sH?<Eye size={12}/>:<EyeOff size={12}/>}</Btn><div className="w-px h-5 mx-0.5" style={{background:T.bd}}/><Btn onClick={doU}><Undo2 size={12}/></Btn><Btn onClick={doR}><Redo2 size={12}/></Btn>{si&&<Btn onClick={dupS}><Copy size={12}/></Btn>}</>}
<div className="flex items-center gap-0.5 ml-1"><Btn onClick={()=>setZm(z=>Math.max(MIN_Z,z-.2))}><ZoomOut size={12}/></Btn><span className="text-xs w-9 text-center" style={{color:T.txM}}>{Math.round(zm*100)}%</span><Btn onClick={()=>setZm(z=>Math.min(MAX_Z,z+.2))}><ZoomIn size={12}/></Btn></div>
<div className="flex-1"/>
<Btn onClick={()=>setSSt(true)}><Settings size={12}/></Btn>
<div className="relative"><Btn active={sSv} onClick={()=>setSSv(p=>!p)}><Save size={12}/><span className="hidden sm:inline">Save</span></Btn>{sSv&&<div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl py-1 z-50 min-w-[160px]" style={{background:T.sf,border:`1px solid ${T.bd}`}}>{[{i:<Save size={12}/>,l:"Save",a:svL},{i:<Upload size={12}/>,l:"Load",a:ldL},{i:<Download size={12}/>,l:"Export",a:exF},{i:<Upload size={12}/>,l:"Import",a:()=>fR.current?.click()}].map((it,i)=><button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:brightness-110" style={{color:T.txD}} onClick={it.a}>{it.i}{it.l}</button>)}</div>}</div>
<Btn onClick={()=>{if(!cloud.ok){dt("Configure Supabase in code","error");return}setSSh(true)}}><Cloud size={12}/><span className="hidden sm:inline">Share</span></Btn>
<Btn className="sm:hidden" onClick={()=>setSb(p=>!p)}><Menu size={12}/></Btn>
</div>

{/* Main */}
<div className="flex flex-1 overflow-hidden relative">
{ed&&<div className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${sb?"w-56":"w-0 sm:w-56"}`} style={{background:T.sf,borderRight:`1px solid ${T.bd}`}}>
<div className="flex" style={{borderBottom:`1px solid ${T.bd}`}}>{[["add","Add",<Plus size={12} key="a"/>],["props","Props",<Sliders size={12} key="p"/>]].map(([id,l,ic])=><button key={id} onClick={()=>setTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium" style={{color:tab===id?T.ac:T.txM,borderBottom:tab===id?`2px solid ${T.ac}`:"2px solid transparent"}}>{ic}{l}</button>)}</div>
{tab==="add"&&<div className="p-3 space-y-2 overflow-y-auto flex-1">
<p className="uppercase tracking-wider font-semibold" style={{color:T.txM,fontSize:9}}>Objects</p>
<button onClick={addT} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.bd}`,color:T.txD}}><Type size={14}/>Text</button>
<button onClick={addI} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium hover:brightness-110" style={{border:`1px solid ${T.bd}`,color:T.txD}}><Image size={14}/>Image / GIF</button>
<p className="uppercase tracking-wider font-semibold mt-3" style={{color:T.txM,fontSize:9}}>Buttons</p>
{[{t:BT.E,l:"Press E",c:"#ef4444",b:"E",d:"Near + press E"},{t:BT.FT,l:"Floor Toggle",c:"#f59e0b",b:"F",d:"Step on = toggle"},{t:BT.FH,l:"Floor Hold",c:"#a855f7",b:"H",d:"Shows while on it"}].map(b=><button key={b.t} onClick={()=>addB(b.t)} className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs hover:brightness-110 text-left" style={{border:`1px solid ${T.bd}`}}><div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white font-bold" style={{background:b.c,fontSize:9}}>{b.b}</div><div><p style={{color:T.txD}} className="font-medium">{b.l}</p><p style={{color:T.txM,fontSize:10}}>{b.d}</p></div></button>)}
<div className="mt-3 pt-3 space-y-1.5" style={{borderTop:`1px solid ${T.bd}`}}><p className="uppercase tracking-wider font-semibold" style={{color:T.txM,fontSize:9}}>Room</p><SR label="W" value={room.width} onChange={v=>chRm("width",v)} min={400} max={5000} step={100}/><SR label="H" value={room.height} onChange={v=>chRm("height",v)} min={400} max={5000} step={100}/><SR label="Grid" value={room.gridSize} onChange={v=>chRm("gridSize",v)} min={8} max={128} step={8}/></div>
<div className="mt-3 pt-3" style={{borderTop:`1px solid ${T.bd}`}}><p className="uppercase tracking-wider font-semibold mb-1 flex items-center gap-1" style={{color:T.txM,fontSize:9}}><Layers size={10}/>Objects ({room.objects.length})</p><div className="space-y-0.5 max-h-48 overflow-y-auto">{room.sorted().map(o=><button key={o.id} onClick={()=>{setSi(o.id);setTab("props")}} className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left" style={{background:o.id===si?T.acD:"transparent",color:o.id===si?T.ac:T.txD}}><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:o.type==="text"?"#22c55e":o.type==="image"?"#3b82f6":"#f59e0b"}}/><span className="truncate flex-1">{o.name}</span>{!o.visible&&<EyeOff size={9} className="opacity-40"/>}<span className="opacity-30 text-[10px]">{o.zIndex}</span></button>)}</div></div>
</div>}
{tab==="props"&&<PP obj={sO} room={room} onChange={chP} onDelete={delO} onUA={uA} lk={lk} onTL={()=>setLk(p=>!p)}/>}
</div>}

<div ref={ctR} className="flex-1 relative overflow-hidden" style={{cursor:cur}}>
<canvas ref={cR} className="w-full h-full block" onMouseDown={onD} onMouseMove={onM} onMouseUp={onU} onMouseLeave={onU} onWheel={onW} onTouchStart={e=>{if(e.touches.length===1){const t=e.touches[0];onD({clientX:t.clientX,clientY:t.clientY})}}} onTouchMove={e=>{if(e.touches.length===1){const t=e.touches[0];onM({clientX:t.clientX,clientY:t.clientY})}}} onTouchEnd={onU}/>
<div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider select-none" style={{background:ed?T.acD:T.scD,border:`1px solid ${ed?T.acB:`${T.sc}40`}`,color:ed?T.ac:T.sc}}>{ed?"EDITOR":"PLAY"}</div>
{lk&&<div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold select-none" style={{background:T.wnD,border:`1px solid ${T.wn}50`,color:T.wn,animation:"pulse 2s infinite"}}>🔗 Click to link · ESC cancel</div>}
{!ed&&!mob&&<div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs select-none" style={{background:`${T.sf}dd`,color:T.txD}}><b style={{color:T.tx}}>WASD</b> Move <b style={{color:T.wn}}>E</b> Interact <b style={{color:T.tx}}>Scroll</b> Zoom</div>}
<div className="absolute bottom-3 right-3 px-2 py-1 rounded text-[10px] select-none" style={{background:`${T.sf}cc`,color:T.txM}}>{Math.round(room.player.x)},{Math.round(room.player.y)} · {Math.round(zm*100)}%</div>
</div></div>
{mob&&!ed&&<DPad onDir={dpH}/>}{sSv&&<div className="fixed inset-0 z-40" onClick={()=>setSSv(false)}/>}
<style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
</div></TC.Provider>)}
