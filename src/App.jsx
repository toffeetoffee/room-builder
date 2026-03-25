import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import {
  Play, Pencil, Eye, EyeOff, Grid3X3, Undo2, Redo2, Save, Upload, Share2,
  Type, Image, Trash2, Link2, Unlink, Camera, CameraOff,
  Plus, Minus, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Download, X, Copy,
  ZoomIn, ZoomOut, MousePointer, Settings, Menu, Maximize2,
  Sun, Moon, Cloud, CloudOff, ExternalLink, RotateCw, FlipHorizontal, FlipVertical, Check
} from "lucide-react";

/*
 * ═══════════════════════════════════════════════════════════════
 *  SECTION 1: SUPABASE CONFIGURATION
 *  
 *  To enable online sharing:
 *  1. Create a free Supabase project at https://supabase.com
 *  2. Create a table called "rooms" with columns:
 *       id (uuid, primary key, default gen_random_uuid())
 *       name (text)
 *       data (jsonb)
 *       created_at (timestamptz, default now())
 *  3. Create a storage bucket called "room-assets" (public)
 *  4. Set RLS policies to allow public read, anon insert/update
 *  5. Enter your URL and anon key in the settings modal
 *  
 *  Without configuration, local save/export/import still work.
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
//  SECTION 2: CONSTANTS & THEME
// ═══════════════════════════════════════════════════════════════

const DEFAULT_ROOM_W = 1600;
const DEFAULT_ROOM_H = 1200;
const DEFAULT_GRID = 32;
const PLAYER_SPEED = 3;
const INTERACT_RADIUS = 52;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 4;
const LAYERS = { BG: 0, OBJ: 1, PLAYER: 2 };
const BTN = { PRESS_E: "pressE", FLOOR_TOGGLE: "floorToggle", FLOOR_HOLD: "floorHold" };
let _uid = Date.now();
const uid = () => `o${_uid++}_${Math.random().toString(36).slice(2,6)}`;

/** Theme definitions for light and dark modes */
const THEMES = {
  dark: {
    name: "dark",
    bg: "#0d0d18", surface: "#13131f", surfaceAlt: "#191928",
    border: "#222236", borderLight: "#2a2a42",
    text: "#e0e0ec", textDim: "#8888a0", textMuted: "#555570",
    accent: "#00d4f5", accentDim: "rgba(0,212,245,0.12)",
    accentBorder: "rgba(0,212,245,0.35)",
    warn: "#f59e0b", warnDim: "rgba(245,158,11,0.12)",
    danger: "#ef4444", dangerDim: "rgba(239,68,68,0.12)",
    success: "#22c55e", successDim: "rgba(34,197,94,0.12)",
    canvasBg: "#0f0f1e", roomDefault: "#ffffff",
    panelShadow: "0 4px 24px rgba(0,0,0,0.5)",
    btnBg: "rgba(255,255,255,0.04)", btnBorder: "rgba(255,255,255,0.08)",
  },
  light: {
    name: "light",
    bg: "#f4f4f8", surface: "#ffffff", surfaceAlt: "#f0f0f5",
    border: "#dddde8", borderLight: "#e8e8f0",
    text: "#1a1a2e", textDim: "#6b6b80", textMuted: "#9999aa",
    accent: "#0091b3", accentDim: "rgba(0,145,179,0.08)",
    accentBorder: "rgba(0,145,179,0.35)",
    warn: "#d97706", warnDim: "rgba(217,119,6,0.08)",
    danger: "#dc2626", dangerDim: "rgba(220,38,38,0.08)",
    success: "#16a34a", successDim: "rgba(22,163,74,0.08)",
    canvasBg: "#e4e4ec", roomDefault: "#ffffff",
    panelShadow: "0 4px 24px rgba(0,0,0,0.08)",
    btnBg: "rgba(0,0,0,0.03)", btnBorder: "rgba(0,0,0,0.08)",
  }
};

const ThemeCtx = createContext(THEMES.dark);

// ═══════════════════════════════════════════════════════════════
//  SECTION 3: OOP CLASSES — Game Objects
// ═══════════════════════════════════════════════════════════════

/**
 * Base class for all placeable room objects.
 * Encapsulates position, transform, layer, z-index, and visibility.
 */
class GameObject {
  constructor(p = {}) {
    this.id = p.id || uid();
    this.type = p.type || "base";
    this.x = p.x ?? 100;
    this.y = p.y ?? 100;
    this.width = p.width ?? 64;
    this.height = p.height ?? 64;
    this.rotation = p.rotation ?? 0;
    this.scaleX = p.scaleX ?? 1;
    this.scaleY = p.scaleY ?? 1;
    this.zIndex = p.zIndex ?? 0;
    this.layer = p.layer ?? LAYERS.OBJ;
    this.visible = p.visible !== undefined ? p.visible : true;
    this.name = p.name || "Object";
  }
  center() { return { x: this.x + this.width / 2, y: this.y + this.height / 2 }; }
  hits(wx, wy) { return wx >= this.x && wx <= this.x + this.width && wy >= this.y && wy <= this.y + this.height; }
  snap(g) { this.x = Math.round(this.x / g) * g; this.y = Math.round(this.y / g) * g; }
  /** Apply canvas transforms centered on this object */
  _applyTransform(ctx) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);
  }
  draw(ctx, ed, sel, showH) {
    ctx.save();
    this._applyTransform(ctx);
    if (!this.visible && showH) ctx.globalAlpha = 0.3;
    else if (!this.visible) { ctx.restore(); return; }
    ctx.fillStyle = "#888";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    if (sel) this._drawSelection(ctx);
    ctx.restore();
  }
  /** Draw the cyan dashed selection rectangle */
  _drawSelection(ctx) {
    ctx.strokeStyle = "#00d4f5";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(-this.width / 2 - 4, -this.height / 2 - 4, this.width + 8, this.height + 8);
    ctx.setLineDash([]);
    // Draw resize handles at corners
    const hw = this.width / 2 + 4, hh = this.height / 2 + 4;
    ctx.fillStyle = "#00d4f5";
    for (const [hx, hy] of [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]]) {
      ctx.fillRect(hx - 3, hy - 3, 6, 6);
    }
  }
  toJSON() {
    return { id: this.id, type: this.type, x: this.x, y: this.y,
      width: this.width, height: this.height, rotation: this.rotation,
      scaleX: this.scaleX, scaleY: this.scaleY, zIndex: this.zIndex,
      layer: this.layer, visible: this.visible, name: this.name };
  }
}

/**
 * Text label object with customizable content, size, and color.
 */
class TextObject extends GameObject {
  constructor(p = {}) {
    super({ ...p, type: "text" });
    this.text = p.text || "Hello";
    this.fontSize = p.fontSize ?? 24;
    this.color = p.color || "#222222";
    this.fontFamily = p.fontFamily || "sans-serif";
    this.name = p.name || "Text";
    this.width = p.width ?? Math.max(48, this.text.length * this.fontSize * 0.55);
    this.height = p.height ?? (this.fontSize + 20);
  }
  draw(ctx, ed, sel, showH) {
    ctx.save();
    this._applyTransform(ctx);
    if (!this.visible && showH) ctx.globalAlpha = 0.3;
    else if (!this.visible) { ctx.restore(); return; }
    if (ed) { ctx.fillStyle = "rgba(128,128,128,0.08)"; ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height); }
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Word-wrap for long text
    const words = this.text.split(' ');
    const lineH = this.fontSize * 1.2;
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > this.width - 8 && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    const totalH = lines.length * lineH;
    const startY = -totalH / 2 + lineH / 2;
    lines.forEach((l, i) => ctx.fillText(l, 0, startY + i * lineH));
    if (sel) this._drawSelection(ctx);
    ctx.restore();
  }
  toJSON() { return { ...super.toJSON(), text: this.text, fontSize: this.fontSize, color: this.color, fontFamily: this.fontFamily }; }
}

/**
 * Image object supporting PNG, JPG, GIF, WebP.
 * Stores source as base64 data URL (local) or cloud URL.
 * GIF animation works because canvas drawImage captures current frame
 * from the HTMLImageElement on each requestAnimationFrame tick.
 */
class ImageObject extends GameObject {
  constructor(p = {}) {
    super({ ...p, type: "image" });
    this.src = p.src || "";
    this._img = null;
    this._ok = false;
    this.name = p.name || "Image";
    if (this.src) this._load();
  }
  _load() {
    this._img = new window.Image();
    this._img.crossOrigin = "anonymous";
    this._img.onload = () => { this._ok = true; };
    this._img.src = this.src;
  }
  draw(ctx, ed, sel, showH) {
    ctx.save();
    this._applyTransform(ctx);
    if (!this.visible && showH) ctx.globalAlpha = 0.3;
    else if (!this.visible) { ctx.restore(); return; }
    if (this._ok && this._img) {
      ctx.drawImage(this._img, -this.width/2, -this.height/2, this.width, this.height);
    } else {
      ctx.fillStyle = "#2a2a3a"; ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height);
      ctx.fillStyle = "#666"; ctx.font = "12px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Loading...", 0, 0);
    }
    if (sel) this._drawSelection(ctx);
    ctx.restore();
  }
  toJSON() { return { ...super.toJSON(), src: this.src }; }
}

/**
 * Interactive button with three behavior types.
 * Supports custom images for active and inactive states.
 * Links to other objects to control their visibility.
 */
class ButtonObject extends GameObject {
  constructor(p = {}) {
    super({ ...p, type: "button", width: p.width ?? 44, height: p.height ?? 44 });
    this.buttonType = p.buttonType || BTN.PRESS_E;
    this.linkedIds = p.linkedIds || p.linkedObjectIds || [];
    this.isActive = p.isActive ?? false;
    this.name = p.name || "Button";
    this.visible = true;
    // Custom images for each state (base64 or URL)
    this.imgActive = p.imgActive || "";
    this.imgInactive = p.imgInactive || "";
    this._imgA = null; this._imgI = null;
    this._imgAOk = false; this._imgIOk = false;
    if (this.imgActive) this._loadA();
    if (this.imgInactive) this._loadI();
  }
  _loadA() {
    this._imgA = new window.Image();
    this._imgA.crossOrigin = "anonymous";
    this._imgA.onload = () => { this._imgAOk = true; };
    this._imgA.src = this.imgActive;
  }
  _loadI() {
    this._imgI = new window.Image();
    this._imgI.crossOrigin = "anonymous";
    this._imgI.onload = () => { this._imgIOk = true; };
    this._imgI.src = this.imgInactive;
  }
  toggle(objs) { this.isActive = !this.isActive; this._sync(objs); }
  activate(objs) { if (!this.isActive) { this.isActive = true; this._sync(objs); } }
  deactivate(objs) { if (this.isActive) { this.isActive = false; this._sync(objs); } }
  _sync(objs) { for (const o of objs) { if (this.linkedIds.includes(o.id)) o.visible = this.isActive; } }
  link(id) { if (!this.linkedIds.includes(id)) this.linkedIds.push(id); }
  unlink(id) { this.linkedIds = this.linkedIds.filter(i => i !== id); }
  draw(ctx, ed, sel, showH) {
    ctx.save();
    this._applyTransform(ctx);
    const r = this.width / 2;
    // Determine which custom image to show
    const useA = this.isActive && this._imgAOk && this._imgA;
    const useI = !this.isActive && this._imgIOk && this._imgI;
    if (useA) {
      ctx.drawImage(this._imgA, -this.width/2, -this.height/2, this.width, this.height);
    } else if (useI) {
      ctx.drawImage(this._imgI, -this.width/2, -this.height/2, this.width, this.height);
    } else {
      // Default appearance: colored circle
      const cols = {
        [BTN.PRESS_E]: this.isActive ? "#22c55e" : "#ef4444",
        [BTN.FLOOR_TOGGLE]: this.isActive ? "#84cc16" : "#f59e0b",
        [BTN.FLOOR_HOLD]: this.isActive ? "#06b6d4" : "#a855f7"
      };
      ctx.fillStyle = cols[this.buttonType] || "#888";
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // Highlight
      const grad = ctx.createRadialGradient(0, -r*0.3, 0, 0, 0, r);
      grad.addColorStop(0, "rgba(255,255,255,0.25)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // Label
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, r*0.55)}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lbl = { [BTN.PRESS_E]: "E", [BTN.FLOOR_TOGGLE]: "F⇅", [BTN.FLOOR_HOLD]: "H◎" };
      ctx.fillText(lbl[this.buttonType] || "?", 0, 1);
    }
    if (sel) {
      ctx.strokeStyle = "#00d4f5"; ctx.lineWidth = 2.5; ctx.setLineDash([6,3]);
      ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  toJSON() {
    return { ...super.toJSON(), buttonType: this.buttonType,
      linkedIds: [...this.linkedIds], isActive: this.isActive,
      imgActive: this.imgActive, imgInactive: this.imgInactive };
  }
}

/**
 * Player character — always rendered on the topmost layer.
 */
class Player {
  constructor(p = {}) {
    this.x = p.x ?? 400; this.y = p.y ?? 300;
    this.size = p.size ?? 26; this.speed = p.speed ?? PLAYER_SPEED;
    this.color = p.color ?? "#00d4f5"; this.dir = "down";
  }
  bounds() { const h = this.size/2; return { x: this.x-h, y: this.y-h, width: this.size, height: this.size }; }
  move(dx, dy, rw, rh) {
    const h = this.size / 2;
    this.x = Math.max(h, Math.min(rw - h, this.x + dx));
    this.y = Math.max(h, Math.min(rh - h, this.y + dy));
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? "right" : "left";
    else if (dy !== 0) this.dir = dy > 0 ? "down" : "up";
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath(); ctx.ellipse(0, this.size*0.4, this.size*0.45, this.size*0.15, 0, 0, Math.PI*2); ctx.fill();
    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, this.size/2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2; ctx.stroke();
    // Inner highlight
    const ig = ctx.createRadialGradient(-this.size*0.15, -this.size*0.15, 0, 0, 0, this.size/2);
    ig.addColorStop(0, "rgba(255,255,255,0.35)"); ig.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(0, 0, this.size/2, 0, Math.PI*2); ctx.fill();
    // Direction arrow
    ctx.fillStyle = "#fff";
    const a = this.size * 0.25;
    const dd = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
    const [ddx, ddy] = dd[this.dir]||[0,1];
    const t = this.size * 0.32;
    ctx.beginPath();
    ctx.moveTo(ddx*t, ddy*t);
    ctx.lineTo(ddx*t - ddy*a*0.5 - ddx*a, ddy*t + ddx*a*0.5 - ddy*a);
    ctx.lineTo(ddx*t + ddy*a*0.5 - ddx*a, ddy*t - ddx*a*0.5 - ddy*a);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  toJSON() { return { x: this.x, y: this.y, size: this.size, speed: this.speed, color: this.color }; }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 4: ROOM STATE & HISTORY
// ═══════════════════════════════════════════════════════════════

class Room {
  constructor(p = {}) {
    this.width = p.width ?? DEFAULT_ROOM_W;
    this.height = p.height ?? DEFAULT_ROOM_H;
    this.gridSize = p.gridSize ?? DEFAULT_GRID;
    this.gridOn = p.gridOn !== undefined ? p.gridOn : false; // Default OFF
    this.bgColor = p.bgColor || "#ffffff";
    this.roomName = p.roomName || "My Room";
    this.objects = p.objects || [];
    this.player = p.player || new Player({ x: this.width/2, y: this.height/2 });
  }
  add(o) { this.objects.push(o); }
  remove(id) {
    for (const o of this.objects) if (o instanceof ButtonObject) o.unlink(id);
    this.objects = this.objects.filter(o => o.id !== id);
  }
  find(id) { return this.objects.find(o => o.id === id); }
  unlinkAll(id) { for (const o of this.objects) if (o instanceof ButtonObject) o.unlink(id); }
  sorted() { return [...this.objects].sort((a,b) => a.layer !== b.layer ? a.layer - b.layer : a.zIndex - b.zIndex); }
  hitTest(wx, wy) { return this.sorted().reverse().find(o => o.hits(wx, wy)) || null; }
  duplicate(id) {
    const o = this.find(id);
    if (!o) return null;
    const j = o.toJSON();
    j.id = uid();
    j.x += 20; j.y += 20;
    j.name = j.name + " (copy)";
    const n = Room._make(j);
    this.objects.push(n);
    return n;
  }
  toJSON() {
    return { width: this.width, height: this.height, gridSize: this.gridSize,
      gridOn: this.gridOn, bgColor: this.bgColor, roomName: this.roomName,
      objects: this.objects.map(o => o.toJSON()), player: this.player.toJSON() };
  }
  static _make(o) {
    switch(o.type) {
      case "text": return new TextObject(o);
      case "image": return new ImageObject(o);
      case "button": return new ButtonObject(o);
      default: return new GameObject(o);
    }
  }
  static fromJSON(d) {
    const objs = (d.objects||[]).map(Room._make);
    return new Room({ ...d, objects: objs, player: new Player(d.player||{}) });
  }
}

/** Snapshot-based undo/redo history */
class History {
  constructor(max = 60) { this.undo = []; this.redo = []; this.max = max; }
  push(j) { this.undo.push(JSON.stringify(j)); if (this.undo.length > this.max) this.undo.shift(); this.redo = []; }
  doUndo(cur) { if (!this.undo.length) return null; this.redo.push(JSON.stringify(cur)); return JSON.parse(this.undo.pop()); }
  doRedo(cur) { if (!this.redo.length) return null; this.undo.push(JSON.stringify(cur)); return JSON.parse(this.redo.pop()); }
  get canUndo() { return this.undo.length > 0; }
  get canRedo() { return this.redo.length > 0; }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 5: CLOUD SERVICE (Supabase Integration)
// ═══════════════════════════════════════════════════════════════

/**
 * Handles all Supabase interactions: uploading images to storage,
 * saving/loading room data from the database.
 * Works entirely via fetch — no SDK dependency.
 */
class CloudService {
  constructor(url, key) {
    this.url = url?.replace(/\/$/, "");
    this.key = key;
    this.bucket = "room-assets";
  }
  get configured() { return !!(this.url && this.key); }
  _headers(ct) {
    const h = { Authorization: `Bearer ${this.key}`, apikey: this.key };
    if (ct) h["Content-Type"] = ct;
    return h;
  }

  /** Upload a base64 data URL to Supabase Storage, returns public URL */
  async uploadImage(dataUrl, filename) {
    if (!this.configured) throw new Error("Cloud not configured");
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.split("/")[1] || "png";
    const path = `${Date.now()}_${filename}.${ext}`;
    const uploadRes = await fetch(
      `${this.url}/storage/v1/object/${this.bucket}/${path}`,
      { method: "POST", headers: { ...this._headers(blob.type), "x-upsert": "true" }, body: blob }
    );
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload failed: ${err}`);
    }
    // Return public URL
    return `${this.url}/storage/v1/object/public/${this.bucket}/${path}`;
  }

  /**
   * Save a room to the database.
   * First uploads all base64 images to storage and replaces
   * them with public URLs for smaller JSON payload.
   */
  async saveRoom(room) {
    if (!this.configured) throw new Error("Cloud not configured");
    const data = room.toJSON();
    // Upload images and replace base64 with URLs
    for (let i = 0; i < data.objects.length; i++) {
      const o = data.objects[i];
      if (o.type === "image" && o.src && o.src.startsWith("data:")) {
        data.objects[i].src = await this.uploadImage(o.src, `img_${o.id}`);
      }
      if (o.type === "button") {
        if (o.imgActive && o.imgActive.startsWith("data:")) {
          data.objects[i].imgActive = await this.uploadImage(o.imgActive, `btn_a_${o.id}`);
        }
        if (o.imgInactive && o.imgInactive.startsWith("data:")) {
          data.objects[i].imgInactive = await this.uploadImage(o.imgInactive, `btn_i_${o.id}`);
        }
      }
    }
    // Upsert room record
    const roomId = data._cloudId || crypto.randomUUID();
    const body = { id: roomId, name: data.roomName || "Untitled", data: data };
    const res = await fetch(`${this.url}/rest/v1/rooms`, {
      method: "POST",
      headers: { ...this._headers("application/json"), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Save failed: ${await res.text()}`);
    return roomId;
  }

  /** Load a room from the database by ID */
  async loadRoom(roomId) {
    if (!this.configured) throw new Error("Cloud not configured");
    const res = await fetch(
      `${this.url}/rest/v1/rooms?id=eq.${roomId}&select=*`,
      { headers: this._headers("application/json") }
    );
    if (!res.ok) throw new Error("Load failed");
    const rows = await res.json();
    if (!rows.length) throw new Error("Room not found");
    const room = Room.fromJSON(rows[0].data);
    return room;
  }

  /** List recently shared rooms */
  async listRooms(limit = 20) {
    if (!this.configured) return [];
    const res = await fetch(
      `${this.url}/rest/v1/rooms?select=id,name,created_at&order=created_at.desc&limit=${limit}`,
      { headers: this._headers("application/json") }
    );
    if (!res.ok) return [];
    return res.json();
  }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 6: LOCAL SERIALIZATION
// ═══════════════════════════════════════════════════════════════

const Serializer = {
  saveLocal(room, slot = "room_default") {
    try { localStorage.setItem(slot, JSON.stringify(room.toJSON())); return true; } catch { return false; }
  },
  loadLocal(slot = "room_default") {
    try { const d = localStorage.getItem(slot); return d ? Room.fromJSON(JSON.parse(d)) : null; } catch { return null; }
  },
  listLocal() {
    const s = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("room_")) s.push(k);
    }
    return s;
  },
  exportFile(room, fn = "room.json") {
    const b = new Blob([JSON.stringify(room.toJSON(), null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = fn; a.click();
    URL.revokeObjectURL(u);
  },
  importFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => { try { res(Room.fromJSON(JSON.parse(r.result))); } catch(e) { rej(e); } };
      r.onerror = rej; r.readAsText(file);
    });
  }
};

// ═══════════════════════════════════════════════════════════════
//  SECTION 7: CANVAS RENDERER
// ═══════════════════════════════════════════════════════════════

class Renderer {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext("2d"); }
  render({ room, camX, camY, zoom, ed, selId, showH, linking, hovId, vw, vh, theme }) {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    this.c.width = vw * dpr; this.c.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Canvas background
    ctx.fillStyle = theme.canvasBg;
    ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(vw/2, vh/2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    // Room bg
    ctx.fillStyle = room.bgColor;
    ctx.fillRect(0, 0, room.width, room.height);
    // Room border
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, room.width, room.height);
    // Grid
    if (room.gridOn) {
      ctx.strokeStyle = theme.name === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= room.width; x += room.gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,room.height); ctx.stroke(); }
      for (let y = 0; y <= room.height; y += room.gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(room.width,y); ctx.stroke(); }
    }
    // Objects
    const sorted = room.sorted();
    for (const o of sorted) o.draw(ctx, ed, o.id === selId, showH);
    // Link lines (editor)
    if (ed) {
      for (const o of room.objects) {
        if (!(o instanceof ButtonObject) || !o.linkedIds.length) continue;
        const f = o.center();
        for (const lid of o.linkedIds) {
          const t = room.find(lid);
          if (!t) continue;
          const tc = t.center();
          const hi = o.id === selId || linking;
          ctx.strokeStyle = hi ? "#fbbf24" : "rgba(251,191,36,0.25)";
          ctx.lineWidth = hi ? 2.5 : 1.5;
          ctx.setLineDash([8,4]);
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(tc.x, tc.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = hi ? "#fbbf24" : "rgba(251,191,36,0.4)";
          ctx.beginPath(); ctx.arc(tc.x, tc.y, 4, 0, Math.PI*2); ctx.fill();
        }
      }
    }
    // Interaction prompts (play mode)
    if (!ed) {
      const px = room.player.x, py = room.player.y;
      for (const o of room.objects) {
        if (!(o instanceof ButtonObject) || o.buttonType !== BTN.PRESS_E) continue;
        const c = o.center();
        if (Math.hypot(c.x-px, c.y-py) < INTERACT_RADIUS + o.width/2) {
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          const bw = 76, bh = 24;
          ctx.beginPath();
          const bx = c.x - bw/2, by = c.y - o.height/2 - 34;
          ctx.roundRect(bx, by, bw, bh, 6);
          ctx.fill();
          ctx.fillStyle = "#fbbf24"; ctx.font = "bold 12px monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("⏎ Press E", c.x, by + bh/2);
        }
      }
    }
    // Player
    room.player.draw(ctx);
    // Hover highlight in link mode
    if (ed && linking && hovId) {
      const h = room.find(hovId);
      if (h && h.type !== "button") {
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3; ctx.setLineDash([5,5]);
        ctx.strokeRect(h.x-3, h.y-3, h.width+6, h.height+6);
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
  s2w(sx, sy, cx, cy, z, vw, vh) {
    return { wx: (sx - vw/2)/z + cx, wy: (sy - vh/2)/z + cy };
  }
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 8: UI SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Reusable icon button with theme awareness */
function Btn({ children, active, onClick, title, style, className = "" }) {
  const T = useContext(ThemeCtx);
  const base = {
    background: active ? T.accentDim : T.btnBg,
    border: `1px solid ${active ? T.accentBorder : T.btnBorder}`,
    color: active ? T.accent : T.textDim,
    ...style
  };
  return (
    <button onClick={onClick} title={title}
      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110 active:scale-95 ${className}`}
      style={base}>
      {children}
    </button>
  );
}

/** Mobile D-Pad overlay */
function DPad({ onDir }) {
  const T = useContext(ThemeCtx);
  const bc = `w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform select-none`;
  const bs = { background: T.accentDim, border: `1px solid ${T.accentBorder}` };
  const h = (d) => (e) => { e.preventDefault(); onDir(d, true); };
  const r = (d) => (e) => { e.preventDefault(); onDir(d, false); };
  return (
    <div className="fixed bottom-6 left-6 z-50 select-none" style={{ touchAction: "none" }}>
      <div className="grid grid-cols-3 gap-1" style={{ width: 160 }}>
        <div />
        <button className={bc} style={bs} onTouchStart={h("up")} onTouchEnd={r("up")} onMouseDown={h("up")} onMouseUp={r("up")}>
          <ChevronUp size={22} color={T.accent} /></button>
        <div />
        <button className={bc} style={bs} onTouchStart={h("left")} onTouchEnd={r("left")} onMouseDown={h("left")} onMouseUp={r("left")}>
          <ChevronLeft size={22} color={T.accent} /></button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: T.btnBg }}>
          <Move size={14} color={T.textMuted} /></div>
        <button className={bc} style={bs} onTouchStart={h("right")} onTouchEnd={r("right")} onMouseDown={h("right")} onMouseUp={r("right")}>
          <ChevronRight size={22} color={T.accent} /></button>
        <div />
        <button className={bc} style={bs} onTouchStart={h("down")} onTouchEnd={r("down")} onMouseDown={h("down")} onMouseUp={r("down")}>
          <ChevronDown size={22} color={T.accent} /></button>
        <div />
      </div>
      <button className="mt-2 w-full h-11 rounded-xl font-bold text-sm tracking-widest select-none active:scale-95"
        style={{ background: T.warnDim, border: `1px solid ${T.warn}`, color: T.warn }}
        onTouchStart={(e)=>{e.preventDefault();onDir("interact",true);}}
        onTouchEnd={(e)=>{e.preventDefault();onDir("interact",false);}}
        onMouseDown={()=>onDir("interact",true)} onMouseUp={()=>onDir("interact",false)}>
        ⏎ INTERACT
      </button>
    </div>
  );
}

/** Toast notification */
function Toast({ msg, onDone, type="info" }) {
  const T = useContext(ThemeCtx);
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const colors = { info: T.accent, error: T.danger, success: T.success };
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-xl flex items-center gap-2"
      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
      <div className="w-2 h-2 rounded-full" style={{ background: colors[type]||T.accent }} />
      {msg}
    </div>
  );
}

/** Image file chooser helper — returns base64 data URL via callback */
function readImageFile(accept = "image/*") {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = accept;
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) { resolve(null); return; }
      const r = new FileReader();
      r.onload = () => resolve({ data: r.result, name: f.name, file: f });
      r.readAsDataURL(f);
    };
    inp.click();
  });
}

/** Read image dimensions from a data URL */
function getImageDims(dataUrl) {
  return new Promise(res => {
    const img = new window.Image();
    img.onload = () => res({ w: img.width, h: img.height });
    img.onerror = () => res({ w: 200, h: 200 });
    img.src = dataUrl;
  });
}

/** Small labeled number input row */
function NumRow({ label, value, onChange, min, max, step = 1, T }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span style={{ color: T.textDim }}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        className="w-20 px-1.5 py-0.5 rounded text-right text-xs outline-none focus:ring-1"
        style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text,
          "--tw-ring-color": T.accent }}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  );
}

/** Property editor sidebar panel */
function PropPanel({ obj, room, onChange, onDelete, onUnlinkAll, linking, onToggleLink }) {
  const T = useContext(ThemeCtx);
  if (!obj) return (
    <div className="p-4 flex flex-col items-center justify-center h-40" style={{ color: T.textMuted }}>
      <MousePointer size={22} className="mb-2 opacity-40" />
      <p className="text-xs">Click an object to edit</p>
    </div>
  );

  const ch = (k, v) => onChange(obj.id, k, v);
  const btnTypeLabels = { [BTN.PRESS_E]: "Press E — Toggle", [BTN.FLOOR_TOGGLE]: "Floor — Toggle", [BTN.FLOOR_HOLD]: "Floor — Hold" };

  return (
    <div className="p-3 space-y-3 text-xs overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
      {/* Name & type */}
      <div>
        <input value={obj.name} className="w-full px-2 py-1.5 rounded text-sm font-semibold outline-none focus:ring-1"
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          onChange={e => ch("name", e.target.value)} />
        <p className="mt-1 uppercase tracking-widest font-semibold" style={{ color: T.textMuted, fontSize: 9 }}>{obj.type}</p>
      </div>

      {/* Transform */}
      <Section title="Transform" T={T}>
        <NumRow label="X" value={obj.x} onChange={v=>ch("x",v)} min={-500} max={room.width+500} T={T} />
        <NumRow label="Y" value={obj.y} onChange={v=>ch("y",v)} min={-500} max={room.height+500} T={T} />
        <NumRow label="W" value={obj.width} onChange={v=>ch("width",v)} min={8} max={3000} T={T} />
        <NumRow label="H" value={obj.height} onChange={v=>ch("height",v)} min={8} max={3000} T={T} />
        <NumRow label="Rotation" value={obj.rotation} onChange={v=>ch("rotation",v)} min={-360} max={360} step={5} T={T} />
        <NumRow label="Scale X" value={obj.scaleX} onChange={v=>ch("scaleX",v)} min={0.1} max={10} step={0.1} T={T} />
        <NumRow label="Scale Y" value={obj.scaleY} onChange={v=>ch("scaleY",v)} min={0.1} max={10} step={0.1} T={T} />
        <div className="flex gap-1 pt-1">
          <Btn onClick={()=>ch("rotation",0)} title="Reset rotation"><RotateCw size={11}/> 0°</Btn>
          <Btn onClick={()=>{ch("scaleX", obj.scaleX*-1);}} title="Flip H"><FlipHorizontal size={11}/></Btn>
          <Btn onClick={()=>{ch("scaleY", obj.scaleY*-1);}} title="Flip V"><FlipVertical size={11}/></Btn>
        </div>
      </Section>

      {/* Ordering */}
      <Section title="Ordering" T={T}>
        <label className="flex items-center justify-between gap-2">
          <span style={{ color: T.textDim }}>Layer</span>
          <select value={obj.layer} className="px-1.5 py-0.5 rounded text-xs outline-none"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
            onChange={e => ch("layer", parseInt(e.target.value))}>
            <option value={LAYERS.BG}>Background</option>
            <option value={LAYERS.OBJ}>Objects</option>
          </select>
        </label>
        <NumRow label="Z-Index" value={obj.zIndex} onChange={v=>ch("zIndex",v)} min={-100} max={100} T={T} />
      </Section>

      {/* Text properties */}
      {obj.type === "text" && (
        <Section title="Text" T={T}>
          <textarea value={obj.text} rows={2} className="w-full px-2 py-1.5 rounded text-xs outline-none resize-y"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
            onChange={e => ch("text", e.target.value)} />
          <NumRow label="Font Size" value={obj.fontSize} onChange={v=>ch("fontSize",v)} min={8} max={200} T={T} />
          <label className="flex items-center justify-between">
            <span style={{ color: T.textDim }}>Color</span>
            <input type="color" value={obj.color} onChange={e => ch("color", e.target.value)} className="w-8 h-6 rounded cursor-pointer" />
          </label>
        </Section>
      )}

      {/* Button properties */}
      {obj.type === "button" && (
        <Section title="Button" T={T}>
          <label className="flex items-center justify-between gap-2">
            <span style={{ color: T.textDim }}>Type</span>
            <select value={obj.buttonType} className="px-1.5 py-0.5 rounded text-xs outline-none"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
              onChange={e => ch("buttonType", e.target.value)}>
              <option value={BTN.PRESS_E}>Press E Toggle</option>
              <option value={BTN.FLOOR_TOGGLE}>Floor Toggle</option>
              <option value={BTN.FLOOR_HOLD}>Floor Hold</option>
            </select>
          </label>
          <p className="text-xs" style={{ color: T.textMuted }}>{btnTypeLabels[obj.buttonType]}</p>

          {/* Custom images for button states */}
          <div className="pt-2 space-y-2">
            <p className="font-semibold uppercase tracking-wider" style={{ color: T.textMuted, fontSize: 9 }}>Button Images (optional)</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <p style={{ color: T.textDim, fontSize: 10 }} className="mb-1">Inactive</p>
                {obj.imgInactive ? (
                  <div className="relative group">
                    <img src={obj.imgInactive} alt="" className="w-full h-12 object-contain rounded" style={{ background: T.bg }} />
                    <button onClick={() => ch("imgInactive", "")}
                      className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: T.danger }}><X size={10} color="#fff" /></button>
                  </div>
                ) : (
                  <button onClick={async () => { const r = await readImageFile("image/*"); if (r) ch("imgInactive", r.data); }}
                    className="w-full h-12 rounded flex items-center justify-center text-xs"
                    style={{ border: `1px dashed ${T.border}`, color: T.textMuted }}>
                    <Upload size={12} className="mr-1" /> Upload
                  </button>
                )}
              </div>
              <div className="flex-1">
                <p style={{ color: T.textDim, fontSize: 10 }} className="mb-1">Active</p>
                {obj.imgActive ? (
                  <div className="relative group">
                    <img src={obj.imgActive} alt="" className="w-full h-12 object-contain rounded" style={{ background: T.bg }} />
                    <button onClick={() => ch("imgActive", "")}
                      className="absolute top-0 right-0 p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: T.danger }}><X size={10} color="#fff" /></button>
                  </div>
                ) : (
                  <button onClick={async () => { const r = await readImageFile("image/*"); if (r) ch("imgActive", r.data); }}
                    className="w-full h-12 rounded flex items-center justify-center text-xs"
                    style={{ border: `1px dashed ${T.border}`, color: T.textMuted }}>
                    <Upload size={12} className="mr-1" /> Upload
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Link mode */}
          <button onClick={onToggleLink}
            className="w-full py-2 rounded-md text-xs font-semibold transition-colors mt-2"
            style={{
              background: linking ? T.warnDim : T.accentDim,
              border: `1px solid ${linking ? T.warn : T.accentBorder}`,
              color: linking ? T.warn : T.textDim
            }}>
            {linking ? "✓ Linking — Click targets" : "🔗 Link to Objects"}
          </button>

          {/* Linked list */}
          <div className="pt-1">
            <p style={{ color: T.textMuted }}>{obj.linkedIds.length} linked</p>
            {obj.linkedIds.map(lid => {
              const lo = room.find(lid);
              return lo ? (
                <div key={lid} className="flex items-center justify-between py-0.5 pl-1">
                  <span style={{ color: T.textDim }} className="truncate">{lo.name}</span>
                  <button onClick={() => ch("_unlink", lid)} className="p-0.5 rounded hover:opacity-70"
                    style={{ color: T.danger }}><X size={11} /></button>
                </div>
              ) : null;
            })}
          </div>
        </Section>
      )}

      {/* Visibility */}
      {obj.type !== "button" && (
        <label className="flex items-center justify-between px-1">
          <span style={{ color: T.textDim }}>Visible</span>
          <button onClick={() => ch("visible", !obj.visible)} className="p-1 rounded transition-colors"
            style={{ background: obj.visible ? T.successDim : T.dangerDim }}>
            {obj.visible ? <Eye size={13} color={T.success} /> : <EyeOff size={13} color={T.danger} />}
          </button>
        </label>
      )}

      {/* Actions */}
      <div className="space-y-1.5 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => onUnlinkAll(obj.id)}
          className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors"
          style={{ background: T.warnDim, border: `1px solid ${T.warn}30`, color: T.warn }}>
          <Unlink size={11} /> Remove All Links
        </button>
        <button onClick={() => onDelete(obj.id)}
          className="w-full py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors"
          style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, color: T.danger }}>
          <Trash2 size={11} /> Delete Object
        </button>
      </div>
    </div>
  );
}

/** Collapsible property section */
function Section({ title, T, children }) {
  return (
    <div className="space-y-1.5">
      <p className="font-semibold uppercase tracking-wider" style={{ color: T.textMuted, fontSize: 9 }}>{title}</p>
      {children}
    </div>
  );
}

/** Cloud Share Modal */
function ShareModal({ room, cloud, onClose, onToast, onLoadRoom, pushHistory }) {
  const T = useContext(ThemeCtx);
  const [saving, setSaving] = useState(false);
  const [shareId, setShareId] = useState(null);
  const [loadId, setLoadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [tab, setTab] = useState("share"); // share | browse | load

  useEffect(() => {
    if (cloud.configured) cloud.listRooms(15).then(setRecent).catch(() => {});
  }, [cloud]);

  const handleShare = async () => {
    setSaving(true);
    try {
      const id = await cloud.saveRoom(room);
      setShareId(id);
      const url = `${window.location.origin}${window.location.pathname}?room=${id}`;
      try { await navigator.clipboard.writeText(url); onToast("Link copied!", "success"); }
      catch { onToast("Shared! ID: " + id, "success"); }
    } catch (e) { onToast("Share failed: " + e.message, "error"); }
    setSaving(false);
  };

  const handleLoad = async (id) => {
    setLoading(true);
    try {
      pushHistory();
      const r = await cloud.loadRoom(id);
      onLoadRoom(r);
      onToast("Room loaded!", "success");
      onClose();
    } catch (e) { onToast("Load failed: " + e.message, "error"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ background: T.surface, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2">
            <Cloud size={16} color={T.accent} />
            <span className="font-semibold text-sm" style={{ color: T.text }}>Cloud Sharing</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: T.textMuted }}><X size={16} /></button>
        </div>
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
          {[["share","Share"],["browse","Browse"],["load","Load by ID"]].map(([id,l]) => (
            <button key={id} onClick={()=>setTab(id)}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{ color: tab===id?T.accent:T.textMuted, borderBottom: tab===id?`2px solid ${T.accent}`:"2px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {tab === "share" && (
            <>
              <p className="text-xs" style={{ color: T.textDim }}>Upload your room to the cloud. Images are stored in Supabase Storage, room data in the database. Anyone with the link can view and play.</p>
              <div className="p-3 rounded-lg" style={{ background: T.bg }}>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{room.roomName}</p>
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>{room.objects.length} objects · {room.width}×{room.height}</p>
              </div>
              <button onClick={handleShare} disabled={saving}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                {saving ? "Uploading..." : "Share to Cloud"}
              </button>
              {shareId && (
                <div className="p-2 rounded text-xs break-all" style={{ background: T.bg, color: T.success }}>
                  <Check size={12} className="inline mr-1" />
                  Shared! ID: {shareId}
                </div>
              )}
            </>
          )}
          {tab === "browse" && (
            <>
              {recent.length === 0 && <p className="text-xs" style={{ color: T.textMuted }}>No shared rooms found.</p>}
              {recent.map(r => (
                <button key={r.id} onClick={() => handleLoad(r.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors hover:brightness-110"
                  style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{r.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <ExternalLink size={14} color={T.textMuted} />
                </button>
              ))}
            </>
          )}
          {tab === "load" && (
            <>
              <p className="text-xs" style={{ color: T.textDim }}>Paste a room ID or full URL to load it.</p>
              <input value={loadId} onChange={e => setLoadId(e.target.value)}
                placeholder="Room ID or URL..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
              <button onClick={() => {
                  let id = loadId.trim();
                  if (id.includes("room=")) id = id.split("room=")[1].split("&")[0];
                  if (id) handleLoad(id);
                }} disabled={loading || !loadId.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                {loading ? "Loading..." : "Load Room"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Settings Modal for Supabase config + app preferences */
function SettingsModal({ onClose, cloud, setCloud, theme, setTheme }) {
  const T = useContext(ThemeCtx);
  const [url, setUrl] = useState(() => localStorage.getItem("sb_url") || "");
  const [key, setKey] = useState(() => localStorage.getItem("sb_key") || "");

  const handleSave = () => {
    localStorage.setItem("sb_url", url);
    localStorage.setItem("sb_key", key);
    setCloud(new CloudService(url, key));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ background: T.surface, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2">
            <Settings size={16} color={T.accent} />
            <span className="font-semibold text-sm" style={{ color: T.text }}>Settings</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: T.textMuted }}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Theme */}
          <Section title="Appearance" T={T}>
            <div className="flex gap-2">
              {["dark","light"].map(t => (
                <button key={t} onClick={() => { setTheme(t); localStorage.setItem("rb_theme", t); }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: theme === t ? T.accentDim : T.bg,
                    border: `1px solid ${theme === t ? T.accentBorder : T.border}`,
                    color: theme === t ? T.accent : T.textDim
                  }}>
                  {t === "dark" ? <Moon size={13} /> : <Sun size={13} />} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Section>

          {/* Supabase config */}
          <Section title="Cloud (Supabase)" T={T}>
            <p className="text-xs" style={{ color: T.textMuted }}>
              Connect a free Supabase project for online sharing with images.
            </p>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxx.supabase.co"
              className="w-full px-2.5 py-1.5 rounded text-xs outline-none"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
            <input value={key} onChange={e => setKey(e.target.value)} placeholder="anon public key"
              className="w-full px-2.5 py-1.5 rounded text-xs outline-none"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
            <button onClick={handleSave}
              className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: T.successDim, border: `1px solid ${T.success}30`, color: T.success }}>
              Save Configuration
            </button>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: cloud.configured ? T.success : T.textMuted }}>
              {cloud.configured ? <Cloud size={12} /> : <CloudOff size={12} />}
              {cloud.configured ? "Connected" : "Not configured — local only"}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 9: MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════

export default function App() {
  // ── Theme ──
  const [themeName, setThemeName] = useState(() => localStorage.getItem("rb_theme") || "dark");
  const T = THEMES[themeName] || THEMES.dark;

  // ── Cloud ──
  const [cloud, setCloud] = useState(() => {
    const u = localStorage.getItem("sb_url"), k = localStorage.getItem("sb_key");
    return new CloudService(u, k);
  });

  // ── Core state ──
  const [room, setRoom] = useState(() => new Room());
  const [editor, setEditor] = useState(true);
  const [selId, setSelId] = useState(null);
  const [showH, setShowH] = useState(false);
  const [camFollow, setCamFollow] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [camPos, setCamPos] = useState({ x: DEFAULT_ROOM_W/2, y: DEFAULT_ROOM_H/2 });
  const [linking, setLinking] = useState(false);
  const [hovId, setHovId] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [showSave, setShowSave] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState("add");

  // ── Refs ──
  const canvasRef = useRef(null);
  const rendRef = useRef(null);
  const roomRef = useRef(room);
  const keysRef = useRef({});
  const histRef = useRef(new History());
  const dragRef = useRef(null);
  const afRef = useRef(null);
  const contRef = useRef(null);
  const [vp, setVp] = useState({ w: 800, h: 600 });
  const fileRef = useRef(null);

  roomRef.current = room;

  const doToast = useCallback((msg, type="info") => { setToast(msg); setToastType(type); }, []);

  // ── Mobile detection ──
  useEffect(() => { setMobile("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);

  // ── Load from URL param on mount ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId && cloud.configured) {
      cloud.loadRoom(roomId).then(r => {
        setRoom(r); setCamPos({ x: r.width/2, y: r.height/2 });
        doToast("Room loaded from link!", "success"); setEditor(false);
      }).catch(e => doToast("Failed to load room: " + e.message, "error"));
    }
  }, []); // eslint-disable-line

  // ── Viewport resize ──
  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => { const {width,height} = e[0].contentRect; setVp({w:width,h:height}); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Init renderer ──
  useEffect(() => { if (canvasRef.current) rendRef.current = new Renderer(canvasRef.current); }, []);

  // ── Keyboard ──
  useEffect(() => {
    const kd = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if ((e.ctrlKey||e.metaKey) && e.key==="z" && !e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="z" && e.shiftKey) { e.preventDefault(); doRedo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="y") { e.preventDefault(); doRedo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="d") { e.preventDefault(); dupSelected(); }
      if (e.key.toLowerCase()==="e" && !editor) interact();
      if ((e.key==="Delete"||e.key==="Backspace") && editor && selId && document.activeElement?.tagName!=="INPUT" && document.activeElement?.tagName!=="TEXTAREA") { e.preventDefault(); delObj(selId); }
      if (e.key==="Escape") { setLinking(false); setSelId(null); }
    };
    const ku = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [editor, selId]); // eslint-disable-line

  // ── Game Loop ──
  useEffect(() => {
    let run = true;
    const loop = () => {
      if (!run) return;
      const r = roomRef.current, k = keysRef.current;
      // Player movement (play mode)
      if (!editor) {
        let dx=0, dy=0;
        if (k["w"]||k["arrowup"]) dy -= r.player.speed;
        if (k["s"]||k["arrowdown"]) dy += r.player.speed;
        if (k["a"]||k["arrowleft"]) dx -= r.player.speed;
        if (k["d"]||k["arrowright"]) dx += r.player.speed;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        if (dx||dy) {
          r.player.move(dx, dy, r.width, r.height);
          // Floor button detection
          const pb = r.player.bounds();
          for (const o of r.objects) {
            if (!(o instanceof ButtonObject)) continue;
            const ov = pb.x < o.x+o.width && pb.x+pb.width > o.x && pb.y < o.y+o.height && pb.y+pb.height > o.y;
            if (o.buttonType === BTN.FLOOR_TOGGLE) {
              if (ov && !o._was) { o.toggle(r.objects); o._was = true; } else if (!ov) o._was = false;
            } else if (o.buttonType === BTN.FLOOR_HOLD) {
              if (ov) o.activate(r.objects); else o.deactivate(r.objects);
            }
          }
        }
      }
      // Camera
      const cx = camFollow ? r.player.x : camPos.x;
      const cy = camFollow ? r.player.y : camPos.y;
      // Render
      if (rendRef.current) {
        rendRef.current.render({ room: r, camX: cx, camY: cy, zoom, ed: editor, selId, showH, linking, hovId, vw: vp.w, vh: vp.h, theme: T });
      }
      afRef.current = requestAnimationFrame(loop);
    };
    afRef.current = requestAnimationFrame(loop);
    return () => { run = false; if (afRef.current) cancelAnimationFrame(afRef.current); };
  }, [editor, selId, showH, linking, hovId, camFollow, camPos, zoom, vp, T]);

  // ── History helpers ──
  const pushH = useCallback(() => { histRef.current.push(roomRef.current.toJSON()); }, []);

  const doUndo = useCallback(() => {
    const p = histRef.current.doUndo(roomRef.current.toJSON());
    if (p) { setRoom(Room.fromJSON(p)); setSelId(null); }
  }, []);

  const doRedo = useCallback(() => {
    const n = histRef.current.doRedo(roomRef.current.toJSON());
    if (n) { setRoom(Room.fromJSON(n)); setSelId(null); }
  }, []);

  // ── Object property change ──
  const chgProp = useCallback((id, k, v) => {
    pushH();
    const r = roomRef.current, o = r.find(id);
    if (!o) return;
    if (k === "_unlink" && o instanceof ButtonObject) o.unlink(v);
    else o[k] = v;
    // Reload button images when changed
    if (k === "imgActive" && o instanceof ButtonObject) o._loadA();
    if (k === "imgInactive" && o instanceof ButtonObject) o._loadI();
    if ((k==="x"||k==="y") && r.gridOn) o.snap(r.gridSize);
    setRoom(Room.fromJSON(r.toJSON()));
  }, [pushH]);

  // ── Add objects ──
  const addText = useCallback(() => {
    pushH();
    const r = roomRef.current;
    const o = new TextObject({ x: r.width/2-80, y: r.height/2-20, text: "New Text", fontSize: 24, color: "#333" });
    if (r.gridOn) o.snap(r.gridSize);
    r.add(o); setRoom(Room.fromJSON(r.toJSON())); setSelId(o.id); setTab("props");
  }, [pushH]);

  const addImage = useCallback(async () => {
    const result = await readImageFile("image/png,image/jpeg,image/gif,image/webp,image/svg+xml");
    if (!result) return;
    pushH();
    const r = roomRef.current;
    const dims = await getImageDims(result.data);
    let w = dims.w, h = dims.h;
    const mx = 400;
    if (w > mx || h > mx) { const s = mx / Math.max(w,h); w *= s; h *= s; }
    const o = new ImageObject({ x: r.width/2-w/2, y: r.height/2-h/2, width: w, height: h, src: result.data, name: result.name || "Image" });
    if (r.gridOn) o.snap(r.gridSize);
    r.add(o); setRoom(Room.fromJSON(r.toJSON())); setSelId(o.id); setTab("props");
  }, [pushH]);

  const addBtn = useCallback((bt) => {
    pushH();
    const r = roomRef.current;
    const o = new ButtonObject({ x: r.width/2-22, y: r.height/2-22, buttonType: bt });
    if (r.gridOn) o.snap(r.gridSize);
    r.add(o); setRoom(Room.fromJSON(r.toJSON())); setSelId(o.id); setTab("props");
  }, [pushH]);

  const delObj = useCallback((id) => {
    pushH(); roomRef.current.remove(id);
    setRoom(Room.fromJSON(roomRef.current.toJSON())); setSelId(null); setLinking(false);
  }, [pushH]);

  const unlinkAll = useCallback((id) => {
    pushH(); roomRef.current.unlinkAll(id);
    setRoom(Room.fromJSON(roomRef.current.toJSON()));
  }, [pushH]);

  const dupSelected = useCallback(() => {
    if (!selId) return;
    pushH();
    const n = roomRef.current.duplicate(selId);
    if (n) { setRoom(Room.fromJSON(roomRef.current.toJSON())); setSelId(n.id); }
  }, [selId, pushH]);

  const interact = useCallback(() => {
    const r = roomRef.current;
    for (const o of r.objects) {
      if (!(o instanceof ButtonObject) || o.buttonType !== BTN.PRESS_E) continue;
      const c = o.center();
      if (Math.hypot(c.x-r.player.x, c.y-r.player.y) < INTERACT_RADIUS + o.width/2) { o.toggle(r.objects); break; }
    }
  }, []);

  // ── Canvas event handlers ──
  const w2s = useCallback((cx, cy) => {
    if (!canvasRef.current || !rendRef.current) return { wx:0, wy:0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = cx - rect.left, sy = cy - rect.top;
    const camX = camFollow ? roomRef.current.player.x : camPos.x;
    const camY = camFollow ? roomRef.current.player.y : camPos.y;
    return rendRef.current.s2w(sx, sy, camX, camY, zoom, vp.w, vp.h);
  }, [camFollow, camPos, zoom, vp]);

  const onDown = useCallback((e) => {
    if (!editor) return;
    const { wx, wy } = w2s(e.clientX, e.clientY);
    const r = roomRef.current, hit = r.hitTest(wx, wy);
    if (linking && selId) {
      if (hit && hit.type !== "button" && hit.id !== selId) {
        pushH();
        const btn = r.find(selId);
        if (btn instanceof ButtonObject) {
          if (btn.linkedIds.includes(hit.id)) btn.unlink(hit.id); else btn.link(hit.id);
          setRoom(Room.fromJSON(r.toJSON()));
        }
      }
      return;
    }
    if (hit) {
      setSelId(hit.id); setTab("props"); pushH();
      dragRef.current = { id: hit.id, ox: wx-hit.x, oy: wy-hit.y };
    } else {
      setSelId(null); setLinking(false);
      if (!camFollow) dragRef.current = { id: null, scx: camPos.x, scy: camPos.y, smx: e.clientX, smy: e.clientY };
    }
  }, [editor, linking, selId, w2s, camFollow, camPos, pushH]);

  const onMove = useCallback((e) => {
    if (!editor) return;
    const { wx, wy } = w2s(e.clientX, e.clientY);
    if (linking) { const h = roomRef.current.hitTest(wx, wy); setHovId(h?.id||null); }
    if (!dragRef.current) return;
    if (dragRef.current.id) {
      const o = roomRef.current.find(dragRef.current.id);
      if (o) {
        let nx = wx - dragRef.current.ox, ny = wy - dragRef.current.oy;
        if (roomRef.current.gridOn) { nx = Math.round(nx/roomRef.current.gridSize)*roomRef.current.gridSize; ny = Math.round(ny/roomRef.current.gridSize)*roomRef.current.gridSize; }
        o.x = nx; o.y = ny;
      }
    } else if (dragRef.current.scx !== undefined) {
      setCamPos({ x: dragRef.current.scx - (e.clientX-dragRef.current.smx)/zoom, y: dragRef.current.scy - (e.clientY-dragRef.current.smy)/zoom });
    }
  }, [editor, linking, w2s, zoom]);

  const onUp = useCallback(() => {
    if (dragRef.current?.id) setRoom(Room.fromJSON(roomRef.current.toJSON()));
    dragRef.current = null;
  }, []);

  const onWheel = useCallback((e) => { e.preventDefault(); setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.001))); }, []);

  const dpadHandler = useCallback((d, p) => {
    const km = { up:"w", down:"s", left:"a", right:"d", interact:"e" };
    keysRef.current[km[d]] = p;
    if (d==="interact" && p && !editor) interact();
  }, [editor, interact]);

  // ── Room settings ──
  const chgRoom = useCallback((k, v) => { setRoom(prev => { const d = prev.toJSON(); d[k] = v; return Room.fromJSON(d); }); }, []);

  // ── Save/Load ──
  const saveLocal = useCallback(() => { Serializer.saveLocal(roomRef.current); doToast("Saved locally!", "success"); setShowSave(false); }, [doToast]);
  const loadLocal = useCallback(() => {
    const l = Serializer.loadLocal();
    if (l) { pushH(); setRoom(l); setCamPos({x:l.width/2,y:l.height/2}); doToast("Loaded!", "success"); }
    else doToast("No local save found", "error");
    setShowSave(false);
  }, [pushH, doToast]);
  const exportFile = useCallback(() => { Serializer.exportFile(roomRef.current, (roomRef.current.roomName||"room")+".json"); doToast("Exported!", "success"); setShowSave(false); }, [doToast]);
  const importFile = useCallback(async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { pushH(); const l = await Serializer.importFile(f); setRoom(l); setCamPos({x:l.width/2,y:l.height/2}); doToast("Imported!", "success"); }
    catch { doToast("Import failed", "error"); }
    e.target.value = ""; setShowSave(false);
  }, [pushH, doToast]);

  const selObj = useMemo(() => selId ? room.find(selId) : null, [room, selId]);

  // ── Render ──
  return (
    <ThemeCtx.Provider value={T}>
      <div className="w-full h-screen flex flex-col overflow-hidden"
        style={{ background: T.bg, fontFamily: "'DM Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace", color: T.text }}>
        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importFile} />

        {/* Toast */}
        {toast && <Toast msg={toast} type={toastType} onDone={() => setToast(null)} />}

        {/* Modals */}
        {showShare && cloud.configured && (
          <ShareModal room={room} cloud={cloud} onClose={() => setShowShare(false)} onToast={doToast}
            onLoadRoom={(r) => { setRoom(r); setCamPos({x:r.width/2,y:r.height/2}); }} pushHistory={pushH} />
        )}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} cloud={cloud} setCloud={setCloud}
            theme={themeName} setTheme={setThemeName} />
        )}

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 flex-shrink-0"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.accent}, #7c4dff)` }}>
              <Maximize2 size={11} color="#fff" />
            </div>
            <span className="text-xs font-bold tracking-wider hidden md:inline" style={{ color: T.text }}>ROOM&nbsp;BUILDER</span>
          </div>

          {/* Room name (editable) */}
          {editor && (
            <input value={room.roomName} onChange={e => chgRoom("roomName", e.target.value)}
              className="px-2 py-0.5 rounded text-xs font-medium w-28 outline-none hidden sm:block"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
              title="Room name" />
          )}

          <div className="w-px h-5 mx-1" style={{ background: T.border }} />

          {/* Mode */}
          <Btn active={editor} onClick={() => { setEditor(p=>!p); setSelId(null); setLinking(false); }}>
            {editor ? <><Pencil size={12}/> <span className="hidden sm:inline">Edit</span></> : <><Play size={12}/> <span className="hidden sm:inline">Play</span></>}
          </Btn>
          <Btn active={camFollow} onClick={() => setCamFollow(p=>!p)}>
            {camFollow ? <Camera size={12}/> : <CameraOff size={12}/>}
            <span className="hidden sm:inline">{camFollow ? "Follow" : "Fixed"}</span>
          </Btn>

          {editor && <>
            <div className="w-px h-5 mx-0.5" style={{ background: T.border }} />
            <Btn active={room.gridOn} onClick={() => chgRoom("gridOn", !room.gridOn)}>
              <Grid3X3 size={12}/><span className="hidden sm:inline">Grid</span>
            </Btn>
            <Btn active={showH} onClick={() => setShowH(p=>!p)}>
              {showH ? <Eye size={12}/> : <EyeOff size={12}/>}<span className="hidden sm:inline">Hidden</span>
            </Btn>
            <div className="w-px h-5 mx-0.5" style={{ background: T.border }} />
            <Btn onClick={doUndo} title="Undo (Ctrl+Z)"><Undo2 size={12}/></Btn>
            <Btn onClick={doRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 size={12}/></Btn>
            {selId && <Btn onClick={dupSelected} title="Duplicate (Ctrl+D)"><Copy size={12}/></Btn>}
          </>}

          {/* Zoom */}
          <div className="flex items-center gap-0.5 ml-1">
            <Btn onClick={() => setZoom(z=>Math.max(MIN_ZOOM,z-0.2))}><ZoomOut size={12}/></Btn>
            <span className="text-xs w-10 text-center" style={{ color: T.textMuted }}>{Math.round(zoom*100)}%</span>
            <Btn onClick={() => setZoom(z=>Math.min(MAX_ZOOM,z+0.2))}><ZoomIn size={12}/></Btn>
          </div>

          <div className="flex-1" />

          {/* Theme toggle */}
          <Btn onClick={() => { const n = themeName==="dark"?"light":"dark"; setThemeName(n); localStorage.setItem("rb_theme",n); }}>
            {themeName==="dark" ? <Sun size={12}/> : <Moon size={12}/>}
          </Btn>

          {/* Settings */}
          <Btn onClick={() => setShowSettings(true)}><Settings size={12}/></Btn>

          {/* Save menu */}
          <div className="relative">
            <Btn active={showSave} onClick={() => setShowSave(p=>!p)}><Save size={12}/> <span className="hidden sm:inline">Save</span></Btn>
            {showSave && (
              <div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl py-1 z-50 min-w-[190px]"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.panelShadow }}>
                {[
                  { icon: <Save size={12}/>, label: "Save Locally", action: saveLocal },
                  { icon: <Upload size={12}/>, label: "Load Local", action: loadLocal },
                  { icon: <Download size={12}/>, label: "Export JSON", action: exportFile },
                  { icon: <Upload size={12}/>, label: "Import JSON", action: () => fileRef.current?.click() },
                ].map((it,i) => (
                  <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:brightness-110"
                    style={{ color: T.textDim }} onClick={it.action}>{it.icon} {it.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Cloud share */}
          <Btn onClick={() => {
            if (!cloud.configured) { setShowSettings(true); doToast("Configure Supabase first", "info"); }
            else setShowShare(true);
          }}>
            {cloud.configured ? <Cloud size={12}/> : <CloudOff size={12}/>}
            <span className="hidden sm:inline">Share</span>
          </Btn>

          {/* Mobile menu */}
          <Btn className="sm:hidden" onClick={() => setSidebar(p=>!p)}><Menu size={12}/></Btn>
        </div>

        {/* ═══ MAIN AREA ═══ */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* ── SIDEBAR ── */}
          {editor && (
            <div className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200
              ${sidebar ? "w-56" : "w-0 sm:w-56"}`}
              style={{ background: T.surface, borderRight: `1px solid ${T.border}` }}>
              {/* Tabs */}
              <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
                {[["add","Add",<Plus size={12} key="a"/>],["props","Props",<Settings size={12} key="p"/>]].map(([id,l,ic]) => (
                  <button key={id} onClick={()=>setTab(id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors"
                    style={{ color: tab===id?T.accent:T.textMuted, borderBottom: tab===id?`2px solid ${T.accent}`:"2px solid transparent" }}>
                    {ic} {l}
                  </button>
                ))}
              </div>

              {/* ADD TAB */}
              {tab === "add" && (
                <div className="p-3 space-y-2 overflow-y-auto flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted, fontSize: 9 }}>Objects</p>
                  <button onClick={addText}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors hover:brightness-110"
                    style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
                    <Type size={14}/> Text Label
                  </button>
                  <button onClick={addImage}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors hover:brightness-110"
                    style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
                    <Image size={14}/> Image / GIF
                  </button>

                  <p className="text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: T.textMuted, fontSize: 9 }}>Interactive Buttons</p>
                  {[
                    { t: BTN.PRESS_E, l: "Press E Toggle", c: "#ef4444", lbl: "E", d: "Walk near, press E to toggle" },
                    { t: BTN.FLOOR_TOGGLE, l: "Floor Toggle", c: "#f59e0b", lbl: "F⇅", d: "Step on to toggle on/off" },
                    { t: BTN.FLOOR_HOLD, l: "Floor Hold", c: "#a855f7", lbl: "H◎", d: "Visible only while standing on" },
                  ].map(b => (
                    <button key={b.t} onClick={() => addBtn(b.t)}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors hover:brightness-110 text-left"
                      style={{ border: `1px solid ${T.border}` }}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white font-bold"
                        style={{ background: b.c, fontSize: 8 }}>{b.lbl}</div>
                      <div>
                        <p style={{ color: T.textDim }} className="font-medium">{b.l}</p>
                        <p style={{ color: T.textMuted, fontSize: 10 }}>{b.d}</p>
                      </div>
                    </button>
                  ))}

                  {/* Room settings */}
                  <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${T.border}` }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted, fontSize: 9 }}>Room</p>
                    <NumRow label="Width" value={room.width} onChange={v=>chgRoom("width",v)} min={200} max={5000} T={T} />
                    <NumRow label="Height" value={room.height} onChange={v=>chgRoom("height",v)} min={200} max={5000} T={T} />
                    <NumRow label="Grid" value={room.gridSize} onChange={v=>chgRoom("gridSize",v)} min={8} max={128} T={T} />
                    <label className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: T.textDim }}>BG Color</span>
                      <input type="color" value={room.bgColor} onChange={e=>chgRoom("bgColor",e.target.value)} className="w-7 h-5 rounded cursor-pointer" />
                    </label>
                  </div>

                  {/* Object list */}
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                      style={{ color: T.textMuted, fontSize: 9 }}>
                      <Layers size={10}/> Objects ({room.objects.length})
                    </p>
                    <div className="space-y-0.5 max-h-52 overflow-y-auto">
                      {room.sorted().map(o => (
                        <button key={o.id} onClick={() => { setSelId(o.id); setTab("props"); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left"
                          style={{ background: o.id===selId ? T.accentDim : "transparent", color: o.id===selId ? T.accent : T.textDim }}>
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{
                            background: o.type==="text" ? "#22c55e" : o.type==="image" ? "#3b82f6" : "#f59e0b" }} />
                          <span className="truncate flex-1">{o.name}</span>
                          {!o.visible && <EyeOff size={9} className="opacity-40" />}
                          <span className="opacity-30 text-[10px]">{o.zIndex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PROPS TAB */}
              {tab === "props" && (
                <PropPanel obj={selObj} room={room} onChange={chgProp} onDelete={delObj}
                  onUnlinkAll={unlinkAll} linking={linking} onToggleLink={() => setLinking(p=>!p)} />
              )}
            </div>
          )}

          {/* ── CANVAS ── */}
          <div ref={contRef} className="flex-1 relative overflow-hidden" style={{ cursor: editor ? "crosshair" : "default" }}>
            <canvas ref={canvasRef} className="w-full h-full block"
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onWheel={onWheel}
              onTouchStart={(e) => { if (e.touches.length===1) { const t=e.touches[0]; onDown({clientX:t.clientX,clientY:t.clientY}); } }}
              onTouchMove={(e) => { if (e.touches.length===1) { const t=e.touches[0]; onMove({clientX:t.clientX,clientY:t.clientY}); } }}
              onTouchEnd={onUp} />

            {/* Mode badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider select-none"
              style={{
                background: editor ? T.accentDim : T.successDim,
                border: `1px solid ${editor ? T.accentBorder : T.success}40`,
                color: editor ? T.accent : T.success
              }}>
              {editor ? "EDITOR" : "PLAY"}
            </div>

            {/* Link mode banner */}
            {linking && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold select-none"
                style={{ background: T.warnDim, border: `1px solid ${T.warn}50`, color: T.warn, animation: "pulse 2s infinite" }}>
                🔗 LINKING — Click objects to link/unlink · ESC to cancel
              </div>
            )}

            {/* Play controls hint */}
            {!editor && !mobile && (
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs select-none"
                style={{ background: `${T.surface}dd`, color: T.textDim }}>
                <b style={{ color: T.text }}>WASD</b> Move&nbsp; <b style={{ color: T.warn }}>E</b> Interact&nbsp; <b style={{ color: T.text }}>Scroll</b> Zoom
              </div>
            )}

            {/* Coords */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-[10px] select-none"
              style={{ background: `${T.surface}cc`, color: T.textMuted }}>
              {Math.round(room.player.x)},{Math.round(room.player.y)} · {Math.round(zoom*100)}%
            </div>
          </div>
        </div>

        {/* Mobile DPad */}
        {mobile && !editor && <DPad onDir={dpadHandler} />}

        {/* Click-away */}
        {showSave && <div className="fixed inset-0 z-40" onClick={() => setShowSave(false)} />}

        {/* Pulse animation for link mode */}
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.7 } }`}</style>
      </div>
    </ThemeCtx.Provider>
  );
}
