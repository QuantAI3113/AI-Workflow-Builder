import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow'

import 'reactflow/dist/style.css'

import WorkflowNode from './components/WorkflowNode'

const API_BASE = 'http://localhost:5000'
const VOICE_SESSION_URL = 'http://localhost:5000/session'
const VOICE_BACKEND_BASE = 'http://localhost:5000'
const OPENAI_REALTIME_MODEL = 'gpt-4o-mini-realtime-preview-2024-12-17'

const nodeTypes = {
  workflow: WorkflowNode,
}

/* ─── Injected global styles ─────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-void:       #070810;
    --bg-deep:       #0c0e1a;
    --bg-surface:    #111320;
    --bg-raised:     #181b2e;
    --bg-hover:      #1f2340;
    --border-dim:    rgba(255,255,255,0.06);
    --border-glow:   rgba(99,102,241,0.35);
    --accent:        #6366f1;
    --accent-bright: #818cf8;
    --accent-soft:   rgba(99,102,241,0.15);
    --accent-glow:   rgba(99,102,241,0.08);
    --success:       #10b981;
    --danger:        #f43f5e;
    --danger-soft:   rgba(244,63,94,0.12);
    --text-primary:  #f1f5f9;
    --text-secondary:#94a3b8;
    --text-muted:    #475569;
    --font-display:  'Syne', sans-serif;
    --font-mono:     'JetBrains Mono', monospace;
    --font-ui:       'Nunito Sans', sans-serif;
    --radius-sm:     6px;
    --radius-md:     10px;
    --radius-lg:     16px;
    --shadow-float:  0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
    --shadow-glow:   0 0 24px rgba(99,102,241,0.2);
    --transition:    cubic-bezier(0.16,1,0.3,1);
  }

  html, body, #root {
    width: 100%;
    height: 100%;
  }

  body {
    background: var(--bg-void);
    color: var(--text-primary);
    font-family: var(--font-display);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .hidden { display: none !important; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 4px; }

  /* ── React Flow overrides ── */
  .react-flow__background { background: var(--bg-void) !important; }
  .react-flow__background pattern { color: rgba(255,255,255,0.035) !important; }

  .react-flow__controls {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-dim) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--shadow-float) !important;
    overflow: hidden;
  }
  .react-flow__controls-button {
    background: transparent !important;
    border: none !important;
    border-bottom: 1px solid var(--border-dim) !important;
    color: var(--text-secondary) !important;
    fill: var(--text-secondary) !important;
    transition: background 0.2s, fill 0.2s !important;
  }
  .react-flow__controls-button:hover {
    background: var(--bg-hover) !important;
    fill: var(--accent-bright) !important;
  }
  .react-flow__controls-button:last-child { border-bottom: none !important; }

  .react-flow__minimap {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-dim) !important;
    border-radius: var(--radius-md) !important;
    overflow: hidden;
  }
  .react-flow__minimap-mask { fill: rgba(7,8,16,0.7) !important; }
  .react-flow__minimap-node { fill: var(--accent) !important; }

  .react-flow__edge-path { stroke: var(--accent) !important; stroke-width: 2 !important; }
  .react-flow__connection-path { stroke: var(--accent-bright) !important; stroke-width: 2 !important; }
  .react-flow__handle {
    width: 10px !important; height: 10px !important;
    border: 2px solid var(--accent) !important;
    background: var(--bg-surface) !important;
    transition: transform 0.2s var(--transition), background 0.2s !important;
  }
  .react-flow__handle:hover {
    background: var(--accent) !important;
    transform: scale(1.4) !important;
  }

  /* ── Animations ── */
  @keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes fadeUp {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes chatBarRise {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes toastSlide {
    0%   { transform: translateY(8px); opacity: 0; }
    15%  { transform: translateY(0);   opacity: 1; }
    85%  { transform: translateY(0);   opacity: 1; }
    100% { transform: translateY(-4px); opacity: 0; }
  }

  .sidebar-enter { animation: slideIn 0.4s var(--transition) both; }
  .file-item     { animation: fadeUp 0.3s var(--transition) both; }
  .chat-bar-enter { animation: chatBarRise 0.5s var(--transition) both; }

  /* ── Gradient mesh background ── */
  .canvas-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 20%, rgba(99,102,241,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 60% 10%, rgba(244,63,94,0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Button styles ── */
  .btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.02em;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s var(--transition);
    position: relative;
    overflow: hidden;
  }
  .btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255,255,255,0.06), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .btn:hover::after { opacity: 1; }
  .btn:active { transform: scale(0.97); }

  .btn-primary {
    background: var(--accent);
    color: white;
    padding: 10px 16px;
    width: 100%;
    box-shadow: 0 2px 12px rgba(99,102,241,0.3);
  }
  .btn-primary:hover {
    background: var(--accent-bright);
    box-shadow: 0 4px 20px rgba(99,102,241,0.45);
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-dim);
    padding: 10px 16px;
    width: 100%;
  }
  .btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--border-glow);
    transform: translateY(-1px);
  }

  .btn-danger {
    background: var(--danger-soft);
    color: var(--danger);
    border: 1px solid rgba(244,63,94,0.2);
    padding: 6px 10px;
    font-size: 11px;
    border-radius: var(--radius-sm);
  }
  .btn-danger:hover {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-dim);
    padding: 8px 12px;
    border-radius: var(--radius-md);
  }
  .btn-ghost:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-glow);
  }

  /* ── Input ── */
  .input-field {
    width: 100%;
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 10px 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .input-field::placeholder { color: var(--text-muted); }
  .input-field:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  /* ── Publish shimmer ── */
  .btn-publish {
    background: linear-gradient(
      90deg,
      var(--accent) 0%,
      var(--accent-bright) 30%,
      #a78bfa 50%,
      var(--accent-bright) 70%,
      var(--accent) 100%
    );
    background-size: 200% auto;
    color: white;
    padding: 10px 16px;
    width: 100%;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 2px 16px rgba(99,102,241,0.4);
  }
  .btn-publish:hover {
    animation: shimmer 1.5s linear infinite;
    box-shadow: 0 4px 24px rgba(99,102,241,0.6);
    transform: translateY(-1px);
  }

  /* ── Tag / badge ── */
  .badge {
    display: inline-flex; align-items: center;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 100px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .badge-accent {
    background: var(--accent-soft);
    color: var(--accent-bright);
    border: 1px solid var(--border-glow);
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-dim) 20%, var(--border-dim) 80%, transparent);
    margin: 16px 0;
  }

  /* ── Flow file card ── */
  .flow-card {
    background: var(--bg-raised);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s var(--transition);
    cursor: default;
  }
  .flow-card:hover {
    background: var(--bg-hover);
    border-color: var(--border-glow);
    transform: translateX(2px);
    box-shadow: -3px 0 0 var(--accent);
  }
  .flow-card-name {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    background: none;
    border: none;
    text-align: left;
    padding: 0;
    transition: color 0.2s;
  }
  .flow-card-name:hover { color: var(--accent-bright); }
  .flow-card-name.loading { color: var(--accent); animation: pulse-ring 1.5s infinite; }

  /* ── Section header ── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-dim);
  }

  /* ── Toggle sidebar button ── */
  .toggle-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 1000;
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    padding: 8px 14px;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s var(--transition);
    box-shadow: var(--shadow-float);
    backdrop-filter: blur(12px);
  }
  .toggle-btn:hover {
    background: var(--bg-raised);
    border-color: var(--border-glow);
    color: var(--text-primary);
    transform: translateY(-1px);
  }
  .toggle-btn.sidebar-open { left: 316px; }

  /* ── Logo mark ── */
  .logo-mark {
    width: 28px; height: 28px;
    background: var(--accent);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 12px rgba(99,102,241,0.4);
    flex-shrink: 0;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 20px 12px;
    color: var(--text-muted);
    font-size: 12px;
    font-family: var(--font-mono);
    border: 1px dashed var(--border-dim);
    border-radius: var(--radius-md);
    line-height: 1.6;
  }

  /* ── Node count indicator ── */
  .stat-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .stat-chip {
    flex: 1;
    background: var(--bg-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    text-align: center;
  }
  .stat-chip-value {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 400;
    color: var(--accent-bright);
    line-height: 1;
  }
  .stat-chip-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* ── Chat bar ── */
  .chat-bar-wrapper {
    position: fixed;
    bottom: 24px;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    z-index: 998;
    width: min(680px, calc(100vw - 48px));
  }

  .chat-bar {
    background: rgba(17, 19, 32, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 18px;
    box-shadow:
      0 8px 40px rgba(0,0,0,0.7),
      0 0 0 1px rgba(99,102,241,0.08),
      0 0 32px rgba(99,102,241,0.06);
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .chat-bar:focus-within {
    border-color: rgba(99,102,241,0.45);
    box-shadow:
      0 8px 40px rgba(0,0,0,0.7),
      0 0 0 1px rgba(99,102,241,0.15),
      0 0 40px rgba(99,102,241,0.12);
  }

  .chat-bar-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .chat-bar-flow-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px;
    padding: 3px 10px 3px 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent-bright);
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .chat-bar-flow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 6px rgba(99,102,241,0.6);
    flex-shrink: 0;
  }

  .chat-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    max-height: 160px;
    overflow-y: auto;
    padding: 4px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--border-glow) transparent;
  }
  .chat-textarea::placeholder {
    color: var(--text-muted);
    font-style: italic;
  }
  .chat-textarea::-webkit-scrollbar { width: 3px; }
  .chat-textarea::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 4px; }

  .chat-send-btn {
    width: 38px; height: 38px;
    flex-shrink: 0;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s var(--transition);
    position: relative;
    overflow: hidden;
  }
  .chat-send-btn.idle {
    background: var(--bg-raised);
    color: var(--text-muted);
    border: 1px solid var(--border-dim);
  }
  .chat-send-btn.ready {
    background: var(--accent);
    color: white;
    box-shadow: 0 2px 14px rgba(99,102,241,0.4);
  }
  .chat-send-btn.ready:hover {
    background: var(--accent-bright);
    box-shadow: 0 4px 20px rgba(99,102,241,0.55);
    transform: translateY(-1px) scale(1.04);
  }
  .chat-send-btn.sending {
    background: var(--accent-soft);
    color: var(--accent-bright);
    border: 1px solid var(--border-glow);
    cursor: wait;
  }
  .chat-send-btn:active:not(.sending):not(.idle) { transform: scale(0.94); }

  /* ── Toast notification ── */
  .toast {
    position: fixed;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    padding: 10px 18px;
    border-radius: 100px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    animation: toastSlide 3s var(--transition) forwards;
    white-space: nowrap;
    pointer-events: none;
  }
  .toast-success {
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.3);
    color: #34d399;
    box-shadow: 0 4px 24px rgba(16,185,129,0.15);
  }
  .toast-error {
    background: rgba(244,63,94,0.12);
    border: 1px solid rgba(244,63,94,0.25);
    color: #fb7185;
    box-shadow: 0 4px 24px rgba(244,63,94,0.12);
  }

  /* ── Voice assistant dock ── */
  .voice-shell {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 997;
    width: 340px;
    border-radius: 22px;
    background: rgba(17, 19, 32, 0.9);
    border: 1px solid rgba(99,102,241,0.16);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 16px 50px rgba(0,0,0,0.55);
    padding: 16px;
    color: var(--text-primary);
    font-family: var(--font-ui);
  }

  .voice-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .voice-title h2 {
    font-size: 18px;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-weight: 800;
    color: #f8fafc;
  }

  .voice-status {
    font-size: 10px;
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .voice-avatar-wrap {
    position: relative;
    width: 128px;
    height: 128px;
    margin: 12px auto 16px auto;
    border-radius: 999px;
    display: grid;
    place-items: center;
  }

  .voice-avatar {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.1), 0 10px 30px rgba(0,0,0,0.45);
    position: relative;
    z-index: 2;
  }

  .wave {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(198, 199, 199, 0.18);
    opacity: 0;
    animation: waveAnimation 2s infinite ease-out;
    top: 14px;
    left: 14px;
    z-index: 1;
  }

  .wave:nth-child(1) { animation-delay: 0s; }
  .wave:nth-child(2) { animation-delay: 0.5s; }
  .wave:nth-child(3) { animation-delay: 1s; }

  @keyframes waveAnimation {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .voice-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    max-width: 300px;
    margin: 0 auto;
  }

  .voice-btn {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(38, 41, 56, 0.95);
    color: rgba(226,232,240,0.85);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  .voice-btn:hover {
    transform: translateY(-1px);
    background: rgba(49, 53, 70, 0.95);
    box-shadow: inset 0 0 0 1px rgba(99,102,241,0.12), 0 8px 18px rgba(0,0,0,0.22);
  }
  .voice-btn:active {
    transform: translateY(0px) scale(0.98);
  }
  .voice-btn.active {
    background: rgba(16, 185, 129, 0.12);
    color: #a7f3d0;
  }
  .voice-btn.danger {
    background: rgba(244, 63, 94, 0.12);
    color: #fb7185;
  }

  .transcription-drawer {
    position: fixed;
    top: 16px;
    right: 16px;
    width: min(360px, calc(100vw - 32px));
    height: calc(100vh - 32px);
    z-index: 996;
    background: rgba(17, 19, 32, 0.96);
    border: 1px solid rgba(99,102,241,0.14);
    border-radius: 20px;
    box-shadow: 0 16px 50px rgba(0,0,0,0.55);
    padding: 56px 16px 16px 16px;
    overflow-y: auto;
  }

  .transcription-close {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 999px;
    position: absolute;
    right: 14px;
    top: 14px;
    cursor: pointer;
    background: rgba(38, 41, 56, 0.95);
    color: #9ca3af;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .transcript-text {
    white-space: pre-wrap;
    color: #f8fafc;
    font-family: var(--font-ui);
    font-size: 15px;
    line-height: 1.8;
  }

  .voice-subline {
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    margin-top: 10px;
  }
`

function StyleInjector() {
  useEffect(() => {
    const tag = document.createElement('style')
    tag.textContent = GLOBAL_STYLES
    document.head.appendChild(tag)
    return () => document.head.removeChild(tag)
  }, [])
  return null
}

/* ─── Icon helpers ────────────────────────────────────────────── */
const Icon = ({ d, size = 14, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={d} />
  </svg>
)

const IconPlus    = (p) => <Icon d="M12 5v14M5 12h14" {...p} />
const IconUpload  = (p) => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" {...p} />
const IconTrash   = (p) => <Icon d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" {...p} />
const IconFolder  = (p) => <Icon d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" {...p} />
const IconChevron = (p) => <Icon d="M15 18l-6-6 6-6" {...p} />
const IconFlow    = (p) => <Icon d="M5 12h14M12 5l7 7-7 7" {...p} />

const IconSpinner = (p) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: 'spin 0.8s linear infinite' }}
    {...p}
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

const IconSend = (p) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
  </svg>
)

const IconBolt = (p) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const IconPlay = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
)

const IconPause = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
  </svg>
)

const IconMic = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
  </svg>
)

const IconMicOff = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 1l22 22" />
    <path d="M9 9v2a3 3 0 005.1 2.1" />
    <path d="M12 1a3 3 0 00-3 3v4" />
    <path d="M19 10v2a7 7 0 01-1 3.6" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
  </svg>
)

const IconMessage = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
  </svg>
)

const IconClose = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

/* ─── Toast component ────────────────────────────────────────── */
function Toast({ message, type, key: k }) {
  return (
    <div key={k} className={`toast toast-${type}`}>
      {type === 'success' ? '✓ ' : '✕ '}{message}
    </div>
  )
}

/* ─── Voice Assistant component ──────────────────────────────── */
function VoiceAssistant({ selectedFlowFile }) {
  const [isRunning, setIsRunning] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showTranscription, setShowTranscription] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState('click to start')
  const [connecting, setConnecting] = useState(false)

  const peerConnectionRef = useRef(null)
  const audioStreamRef = useRef(null)
  const dataChannelRef = useRef(null)
  const audioElRef = useRef(null)
  const transcriptBoxRef = useRef(null)  

  const appendTranscript = useCallback((text) => {
    if (!text) return
    setTranscript((prev) => (prev ? `${prev} ${text}` : text))
  }, [])

  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight
    }
  }, [transcript])

  const sendMessage = useCallback((message) => {
    const channel = dataChannelRef.current
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(message))
      console.log('Sent message:', message)
    }
  }, [])

  const sendResponseCreate = useCallback(() => {
    sendMessage({ type: 'response.create' })
  }, [sendMessage])

  const sendFunctionOutput = useCallback((callId, data) => {
    sendMessage({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(data),
      },
    })
  }, [sendMessage])

  const sendSessionUpdate = useCallback(() => {
    sendMessage({
      type: 'session.update',
      session: {
        input_audio_transcription: {
          model: 'whisper-1',
        },
        tools: [
          {
            type: 'function',
            name: 'get_weather',
            description: 'Get the current weather. Works only for Earth',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
              required: ['location'],
            },
          },
        ],
        tool_choice: 'auto',
      },
    })
  }, [sendMessage])

  const sendInitialMessage = useCallback(() => {
    sendMessage({
      type: 'conversation.item.create',
      previous_item_id: null,
      item: {
        id: `msg_${Date.now()}`,
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: "You are a AI named Kaviya, you only speak english, always follow the workflow",
          },
        ],
      },
    })
  }, [sendMessage])

  const saveGPTResponseToBackEnd = useCallback((message) => {
    const output =
      message?.content?.[0]?.transcript ||
      message?.content?.[0]?.text ||
      ''

    if (!output) return

    fetch(`${VOICE_BACKEND_BASE}/save-transcription-gpt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: output }),
    }).catch((error) => {
      console.error('Error saving GPT transcription:', error.message)
    })
  }, [])

  const handleWeatherFunction = useCallback(async (output) => {
    try {
      const args = JSON.parse(output.arguments)
      const location = args.location

      const response = await fetch(
        `${VOICE_BACKEND_BASE}/weather/${encodeURIComponent(location)}`
      )
      const data = await response.json()

      sendFunctionOutput(output.call_id, {
        temperature: data.temperature,
        unit: data.unit,
        location,
      })

      sendResponseCreate()
    } catch (error) {
      console.error('Weather function error:', error)
    }
  }, [sendFunctionOutput, sendResponseCreate])

  const handleFunctionCall = useCallback((output) => {
    if (output?.type === 'function_call') {
      if (output?.name === 'get_weather' && output?.call_id) {
        console.log('Weather function call found:', output)
        handleWeatherFunction(output)
      }
    }
  }, [handleWeatherFunction])

  const handleAudioTranscriptionComplete = useCallback((message) => {
    try {
      const text = message?.transcript
      if (!text) return

      appendTranscript(text)

      fetch(`${VOICE_BACKEND_BASE}/save-transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: text }),
      }).catch((error) => {
        console.error('Error saving transcription:', error.message)
      })
    } catch (error) {
      console.error('Error handling audio transcription:', error.message)
    }
  }, [appendTranscript])

  const handleTranscript = useCallback((message) => {
    const text = message?.response?.output?.[0]?.content?.[0]?.transcript
    if (text) {
      appendTranscript(text)
    }
  }, [appendTranscript])

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data)
      console.log('Received message:', message)

      switch (message.type) {
        case 'response.done': {
          handleTranscript(message)
          const output = message.response?.output?.[0]
          saveGPTResponseToBackEnd(output)
          if (output) handleFunctionCall(output)
          break
        }

        case 'conversation.item.input_audio_transcription.completed':
          handleAudioTranscriptionComplete(message)
          break

        default:
          console.log('Unhandled message type:', message.type)
      }
    } catch (error) {
      console.error('Error processing message:', error.message)
    }
  }, [
    handleTranscript,
    handleFunctionCall,
    handleAudioTranscriptionComplete,
    saveGPTResponseToBackEnd,
  ])

  const setupAudio = useCallback(async (pc) => {
    const audioEl = audioElRef.current
    if (audioEl) audioEl.autoplay = true

    pc.ontrack = (e) => {
      if (audioEl) audioEl.srcObject = e.streams[0]
    }

    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioStreamRef.current = audioStream
    audioStream.getTracks().forEach((track) => pc.addTrack(track, audioStream))
  }, [])

  const onDataChannelOpen = useCallback(() => {
    setStatus('Connected')
    sendSessionUpdate()
    sendInitialMessage()
  }, [sendInitialMessage, sendSessionUpdate])

  const setupDataChannel = useCallback((pc) => {
    const channel = pc.createDataChannel('oai-events')
    dataChannelRef.current = channel
    channel.onopen = onDataChannelOpen
    channel.addEventListener('message', handleMessage)
  }, [handleMessage, onDataChannelOpen])

  const cleanupConnection = useCallback(() => {
    try {
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
        dataChannelRef.current = null
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      if (audioElRef.current) {
        audioElRef.current.srcObject = null
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const stream = audioStreamRef.current
    if (!stream?.getTracks?.()?.length) return

    const track = stream.getTracks()[0]
    if (!track) return

    const nextMuted = !isMuted
    track.enabled = isMuted
    setIsMuted(nextMuted)

    if (nextMuted) {
      setStatus('Muted')
    } else {
      setStatus('Connected')
    }
  }, [isMuted])

  const init = useCallback(async () => {
    if (connecting || isRunning) return

    setConnecting(true)
    setStatus('Connecting…')

    try {
      console.log("flowName", selectedFlowFile)
      const tokenResponse = await fetch(
        `${VOICE_SESSION_URL}?workflowName=${selectedFlowFile}`
      )

      const data = await tokenResponse.json()
      const ephemeralKey = data.client_secret.value

      const pc = new RTCPeerConnection()
      peerConnectionRef.current = pc

      await setupAudio(pc)
      setupDataChannel(pc)

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
        }
      )

      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      }

      await pc.setRemoteDescription(answer)

      setIsRunning(true)
      setStatus('Listening')
    } catch (error) {
      console.error('Initialization error:', error)
      setStatus('Failed to connect')
      cleanupConnection()
    } finally {
      setConnecting(false)
    }
  }, [cleanupConnection, connecting, isRunning, setupAudio, setupDataChannel])

  const triggerMail = useCallback(async () => {
    try {
      await fetch(`${VOICE_BACKEND_BASE}/sendMailAfterCall`)
    } catch (error) {
      console.error('Error triggering mail:', error)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    await triggerMail()
    cleanupConnection()
    setIsRunning(false)
    setIsMuted(false)
    setStatus('Ready to start')
  }, [cleanupConnection, triggerMail])

  useEffect(() => {
    return () => {
      cleanupConnection()
    }
  }, [cleanupConnection])

  return (
    <div className="voice-shell">
      <div className="voice-title">
        <div>
          <h2>Test Workflow</h2>
          <div className="voice-status">{status}</div>
        </div>
        <button
          className="voice-btn"
          onClick={() => setShowTranscription((s) => !s)}
          title="Show transcription"
          type="button"
        >
          <IconMessage />
        </button>
      </div>

      <div className="voice-avatar-wrap">
        {isRunning && !isMuted && (
          <>
            <div className="wave" />
            <div className="wave" />
            <div className="wave" />
          </>
        )}

        <img
          src="/assets/logo.png"
          alt="Voice assistant"
          className="voice-avatar"
        />
      </div>

      <div className="voice-controls">
        {!isRunning ? (
          <button
            className="voice-btn active"
            title="Start"
            onClick={init}
            disabled={connecting}
            type="button"
          >
            {connecting ? <IconSpinner /> : <IconPlay />}
          </button>
        ) : (
          <button
            className="voice-btn danger"
            title="Pause"
            onClick={stopRecording}
            type="button"
          >
            <IconPause />
          </button>
        )}

        <button
          className={`voice-btn ${isMuted ? 'active' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
          onClick={toggleMute}
          disabled={!isRunning}
          type="button"
        >
          {isMuted ? <IconMicOff /> : <IconMic />}
        </button>

        <button
          className="voice-btn"
          title="Transcription"
          onClick={() => setShowTranscription((s) => !s)}
          type="button"
        >
          <IconMessage />
        </button>
      </div>

      <div className="voice-subline">
        {isRunning ? '⌘↵ available in chat bar' : 'click to start'}
      </div>

      <audio ref={audioElRef} autoPlay className="hidden" />

      {showTranscription && (
        <div className="transcription-drawer">
          <button
            className="transcription-close"
            onClick={() => setShowTranscription(false)}
            type="button"
          >
            <IconClose />
          </button>
          <p ref={transcriptBoxRef} className="transcript-text">
            {transcript || 'No transcription yet.'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Chat Bar component ─────────────────────────────────────── */
function ChatBar({ flowName, onSuccess }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  const handleInput = (e) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/api/flows/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_name: flowName, paragraph: trimmed }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      onSuccess(data.message || 'Flow generated successfully')
    } catch (err) {
      onSuccess(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const hasText = text.trim().length > 0

  return (
    <div className="chat-bar-wrapper chat-bar-enter">
      <div className="chat-bar-meta">
        <div className="chat-bar-flow-pill">
          <div className="chat-bar-flow-dot" />
          <IconBolt style={{ opacity: 0.7 }} />
          {flowName || 'untitled-flow'}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          ⌘↵ to send
        </span>
      </div>

      <div className="chat-bar">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe what this flow should do… paste a paragraph or instructions"
          rows={1}
          disabled={sending}
        />

        <button
          className={`chat-send-btn ${sending ? 'sending' : hasText ? 'ready' : 'idle'}`}
          onClick={handleSend}
          disabled={!hasText || sending}
          title={sending ? 'Generating…' : 'Send (⌘↵)'}
          type="button"
        >
          {sending ? <IconSpinner /> : <IconSend />}
        </button>
      </div>
    </div>
  )
}

/* ─── Main App ────────────────────────────────────────────────── */
export default function App() {
  const [selectedFlowFile, setSelectedFlowFile] = useState('')
  const [flowName, setFlowName] = useState('untitled-flow')
  const [files, setFiles] = useState([])
  const [loadingFile, setLoadingFile] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  const [toast, setToast] = useState(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToast({ message, type, id })
    setTimeout(() => setToast(null), 3200)
  }

  const loadPublishedFiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/flows`)
      const data = await res.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }, [])

  useEffect(() => {
    loadPublishedFiles()
  }, [loadPublishedFiles])

  const saveDraftToDB = async (nextNodes, nextEdges) => {
    try {
      await fetch(`${API_BASE}/api/flows/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: flowName, nodes: nextNodes, edges: nextEdges }),
      })
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const onNodeChange = useCallback((id, field, value) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n
      )
      saveDraftToDB(next, edges)
      return next
    })
  }, [edges])

  const onChangeResponseField = useCallback((id, index, key, value) => {
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id !== id) return n
        const rf = [...(n.data.responseFields || [])]
        rf[index] = { ...rf[index], [key]: value }
        return { ...n, data: { ...n.data, responseFields: rf } }
      })
      saveDraftToDB(next, edges)
      return next
    })
  }, [edges])

  const onAddResponseField = useCallback((id) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id !== id
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                responseFields: [...(n.data.responseFields || []), { key: '', value: '' }],
              },
            }
      )
      saveDraftToDB(next, edges)
      return next
    })
  }, [edges])

  const onRemoveResponseField = useCallback((id, index) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id !== id
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                responseFields: (n.data.responseFields || []).filter((_, i) => i !== index),
              },
            }
      )
      saveDraftToDB(next, edges)
      return next
    })
  }, [edges])

  const onDeleteNode = useCallback((id) => {
    const nextNodes = nodes.filter((n) => n.id !== id)
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id)
    setNodes(nextNodes)
    setEdges(nextEdges)
    saveDraftToDB(nextNodes, nextEdges)
  }, [nodes, edges])

  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      const nextEdges = addEdge(params, eds)
      saveDraftToDB(nodes, nextEdges)
      return nextEdges
    })
  }, [nodes])

  const addNewNode = () => {
    const newNode = {
      id: String(Date.now()),
      type: 'workflow',
      position: { x: 200 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: {
        fieldNode: '',
        instructions: '',
        responseFields: [{ key: '', value: '' }],
        onChange: onNodeChange,
        onChangeResponseField,
        onAddResponseField,
        onRemoveResponseField,
        onDelete: onDeleteNode,
      },
    }

    const next = [...nodes, newNode]
    setNodes(next)
    saveDraftToDB(next, edges)
  }

  const publishFlow = async () => {
    setPublishing(true)
    try {
      await fetch(`${API_BASE}/api/flows/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: flowName, nodes, edges }),
      })
      await loadPublishedFiles()
      setJustPublished(true)
      setTimeout(() => setJustPublished(false), 2000)
    } catch (error) {
      console.error('Publish failed:', error)
      showToast('Publish failed', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const loadFlow = async (fileName) => {
    setLoadingFile(fileName)
    setSelectedFlowFile(fileName)
    try {
      const res = await fetch(`${API_BASE}/api/flows/${fileName}`)
      const data = await res.json()
      const updatedNodes = (data.nodes || []).map((n) => ({
        ...n,
        data: {
          ...n.data,
          onChange: onNodeChange,
          onChangeResponseField,
          onAddResponseField,
          onRemoveResponseField,
          onDelete: onDeleteNode,
        },
      }))
      setNodes(updatedNodes)
      setEdges(data.edges || [])
      setFlowName(fileName.replace('.json', ''))
    } catch (error) {
      console.error('Load flow failed:', error)
      showToast('Load failed', 'error')
    } finally {
      setLoadingFile('')
    }
  }

  const deleteFlow = async (fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return
    try {
      await fetch(`${API_BASE}/api/flows/${fileName}`, { method: 'DELETE' })
      await loadPublishedFiles()
    } catch (error) {
      console.error('Delete flow failed:', error)
      showToast('Delete failed', 'error')
    }
  }

  const handleGenerateSuccess = (message, type = 'success') => {
    showToast(message, type)
    if (type === 'success') {
      loadPublishedFiles()
    }
  }

  return (
    <>
      <StyleInjector />      

      <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'var(--bg-void)' }}>
        {toast && <Toast key={toast.id} message={toast.message} type={toast.type} />}

        <button
          className={`toggle-btn ${showSidebar ? 'sidebar-open' : ''}`}
          onClick={() => setShowSidebar((s) => !s)}
          type="button"
        >
          <IconChevron
            size={13}
            style={{
              transform: showSidebar ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s var(--transition)',
            }}
          />
          {showSidebar ? 'Hide' : 'Show'} Panel
        </button>

        {showSidebar && (
          <aside
            className="sidebar-enter"
            style={{
              width: 300,
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-dim)',
              padding: '20px 16px',
              zIndex: 999,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingTop: 4 }}>
              <div className="logo-mark">⬡</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  QuantAI.in
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                  WORKFLOW BUILDER
                </div>
              </div>
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>v2</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="section-label">Flow Name</div>
              <input
                className="input-field"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="untitled-flow"
              />
            </div>

            <div className="stat-row">
              <div className="stat-chip">
                <div className="stat-chip-value">{nodes.length}</div>
                <div className="stat-chip-label">Nodes</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-value">{edges.length}</div>
                <div className="stat-chip-label">Edges</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-value">{files.length}</div>
                <div className="stat-chip-label">Saved</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={addNewNode} type="button">
                <IconPlus size={13} />
                Add Node
              </button>

              <button
                className="btn btn-publish"
                onClick={publishFlow}
                disabled={publishing}
                type="button"
                style={{
                  background: justPublished ? 'var(--success)' : undefined,
                  transition: 'background 0.3s',
                  cursor: publishing ? 'wait' : 'pointer',
                }}
              >
                {publishing
                  ? <><IconSpinner /> Publishing…</>
                  : justPublished
                    ? '✓ Published!'
                    : <><IconUpload size={13} /> Publish Flow</>
                }
              </button>
            </div>

            <div className="divider" />

            <div>
              <div className="section-label">
                <IconFolder size={11} />
                Published Flows
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.length === 0 ? (
                  <div className="empty-state">
                    No flows yet.<br />
                    Build & publish your first one.
                  </div>
                ) : (
                  files.map((file, i) => (
                    <div
                      key={file}
                      className="flow-card file-item"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <IconFlow size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />

                      <button
                        className={`flow-card-name ${loadingFile === file ? 'loading' : ''}`}
                        onClick={() => loadFlow(file)}
                        type="button"
                      >
                        {loadingFile === file
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <IconSpinner /> Loading…
                            </span>
                          : file
                        }
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() => deleteFlow(file)}
                        title="Delete"
                        type="button"
                      >
                        <IconTrash size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 20,
                borderTop: '1px solid var(--border-dim)',
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.7,
              }}
            >
              Drag nodes to rearrange<br />
              Connect handles to link nodes<br />
              Use the AI bar below to generate
            </div>
          </aside>
        )}

        <div
          className="canvas-bg"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            style={{ background: 'transparent' }}
          >
            <Background
              variant="dots"
              gap={28}
              size={1}
              color="rgba(255,255,255,0.04)"
            />
            <Controls />
            <MiniMap
              nodeColor={() => 'var(--accent)'}
              maskColor="rgba(7,8,16,0.75)"
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              gap: 12,
              zIndex: 1,
              paddingBottom: 120,
            }}>
              <div style={{
                width: 64,
                height: 64,
                border: '2px dashed rgba(99,102,241,0.25)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: 'rgba(99,102,241,0.3)',
              }}>
                ⬡
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 1.8,
              }}>
                Your canvas is empty<br />
                <span style={{ color: 'rgba(99,102,241,0.5)' }}>
                  Add a node manually or describe your flow below ↓
                </span>
              </div>
            </div>
          )}
        </div>

        <VoiceAssistant selectedFlowFile={selectedFlowFile} />

        <ChatBar
          flowName={flowName}
          onSuccess={handleGenerateSuccess}
        />
      </div>
    </>
  )
}