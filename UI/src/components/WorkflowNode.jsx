import * as React from 'react'
import { useState } from 'react'
import { Handle, Position } from 'reactflow'

/* ─── Injected node styles (scoped to avoid conflicts) ─────────── */
const NODE_STYLES = `
  @keyframes nodeEntrance {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes fieldSlideIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .wf-node {
    animation: nodeEntrance 0.25s cubic-bezier(0.16,1,0.3,1) both;
    font-family: 'Syne', sans-serif;
  }

  .wf-node:hover .wf-node-glow { opacity: 1; }

  .wf-input {
    width: 100%;
    background: #0c0e1a;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 7px;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    resize: none;
    box-sizing: border-box;
  }
  .wf-input::placeholder { color: #334155; }
  .wf-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .wf-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 5px;
    font-family: 'Syne', sans-serif;
  }

  .wf-btn-add {
    display: flex; align-items: center; gap: 4px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    color: #818cf8;
    font-size: 10px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.04em;
    padding: 4px 9px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.18s;
  }
  .wf-btn-add:hover {
    background: rgba(99,102,241,0.22);
    border-color: rgba(99,102,241,0.5);
    color: #c7d2fe;
    transform: translateY(-1px);
  }

  .wf-btn-remove {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; flex-shrink: 0;
    background: rgba(244,63,94,0.08);
    border: 1px solid rgba(244,63,94,0.15);
    color: #f43f5e;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: all 0.18s;
  }
  .wf-btn-remove:hover {
    background: #f43f5e;
    color: white;
    border-color: #f43f5e;
  }

  .wf-btn-delete {
    display: flex; align-items: center; gap: 5px;
    background: rgba(244,63,94,0.08);
    border: 1px solid rgba(244,63,94,0.15);
    color: #f43f5e;
    font-size: 10px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.04em;
    padding: 5px 10px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.18s;
  }
  .wf-btn-delete:hover {
    background: #f43f5e;
    color: white;
    border-color: #f43f5e;
  }

  .wf-field-row {
    display: flex; gap: 6px; align-items: center;
    animation: fieldSlideIn 0.2s cubic-bezier(0.16,1,0.3,1) both;
  }

  .wf-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent);
    margin: 12px 0;
  }

  .wf-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .wf-handle {
    width: 12px !important;
    height: 12px !important;
    border: 2px solid #6366f1 !important;
    background: #111320 !important;
    transition: transform 0.2s, background 0.2s !important;
  }
  .wf-handle:hover {
    background: #6366f1 !important;
    transform: scale(1.4) !important;
  }

  .wf-node-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #334155;
    letter-spacing: 0.04em;
  }

  .wf-collapsed-preview {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
`

let nodeStylesInjected = false
function ensureNodeStyles() {
  if (nodeStylesInjected) return
  const tag = document.createElement('style')
  tag.textContent = NODE_STYLES
  document.head.appendChild(tag)
  nodeStylesInjected = true
}

/* ─── Icons ─────────────────────────────────────────────────────── */
const Ico = ({ d, size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const IcoTrash    = () => <Ico d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
const IcoPlus     = () => <Ico d="M12 5v14M5 12h14" />
const IcoChevron  = ({ up }) => <Ico d={up ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
const IcoClose    = () => <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
const IcoDots     = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5"  cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
)

/* ─── WorkflowNode ──────────────────────────────────────────────── */
export default function WorkflowNode({ id, data }) {
  ensureNodeStyles()

  const [collapsed, setCollapsed] = useState(false)
  const [hovered,   setHovered]   = useState(false)

  const update              = (field, value)            => data.onChange(id, field, value)
  const updateResponseField = (index, key, value)       => data.onChangeResponseField(id, index, key, value)
  const addResponseField    = ()                        => data.onAddResponseField(id)
  const removeResponseField = (index)                   => data.onRemoveResponseField(id, index)

  const shortId = id.slice(-4)

  return (
    <div
      className="wf-node"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: 300,
        maxWidth: 340,
        background: 'linear-gradient(145deg, #131525, #0f1120)',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        boxShadow: hovered
          ? '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15), 0 0 24px rgba(99,102,241,0.12)'
          : '0 4px 24px rgba(0,0,0,0.5)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 50%, transparent 100%)',
        opacity: hovered ? 1 : 0.3,
        transition: 'opacity 0.3s',
      }} />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="wf-handle"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="wf-handle"
        style={{ right: -6 }}
      />

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Color dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle at 35% 35%, #818cf8, #6366f1)',
          boxShadow: '0 0 6px rgba(99,102,241,0.6)',
        }} />

        {/* Title / preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {collapsed && data.fieldNode ? (
            <span className="wf-collapsed-preview">{data.fieldNode}</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Workflow Node
            </span>
          )}
        </div>

        <span className="wf-node-id">#{shortId}</span>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', padding: 2,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <IcoChevron up={!collapsed} />
        </button>

        {/* Delete */}
        <button className="wf-btn-delete" onClick={() => data.onDelete(id)}>
          <IcoTrash />
          Delete
        </button>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div style={{ padding: '12px 12px 14px' }}>

          {/* Field Node */}
          <div style={{ marginBottom: 12 }}>
            <label className="wf-label">Field Node</label>
            <input
              className="wf-input"
              value={data.fieldNode || ''}
              onChange={(e) => update('fieldNode', e.target.value)}
              placeholder="e.g. extract_entities"
            />
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 0 }}>
            <label className="wf-label">Instructions</label>
            <textarea
              className="wf-input"
              value={data.instructions || ''}
              onChange={(e) => update('instructions', e.target.value)}
              placeholder="Describe what this node should do…"
              rows={3}
              style={{ lineHeight: 1.6 }}
            />
          </div>

          <div className="wf-divider" />

          {/* Response Fields */}
          <div>
            <div className="wf-section-header">
              <label className="wf-label" style={{ marginBottom: 0 }}>
                Response Fields
                {(data.responseFields || []).length > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: 'rgba(99,102,241,0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 100,
                    padding: '1px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                    verticalAlign: 'middle',
                  }}>
                    {(data.responseFields || []).length}
                  </span>
                )}
              </label>
              <button className="wf-btn-add" onClick={addResponseField}>
                <IcoPlus /> Add
              </button>
            </div>

            {(data.responseFields || []).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '10px 8px',
                border: '1px dashed rgba(255,255,255,0.06)',
                borderRadius: 8,
                color: '#334155',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
              }}>
                No fields yet — click Add
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(data.responseFields || []).map((field, index) => (
                <div
                  key={index}
                  className="wf-field-row"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <input
                    className="wf-input"
                    value={field.key || ''}
                    onChange={(e) => updateResponseField(index, 'key', e.target.value)}
                    placeholder="key"
                    style={{ flex: 1 }}
                  />
                  <div style={{ color: '#334155', fontSize: 12, flexShrink: 0 }}>:</div>
                  <input
                    className="wf-input"
                    value={field.value || ''}
                    onChange={(e) => updateResponseField(index, 'value', e.target.value)}
                    placeholder="value"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="wf-btn-remove"
                    onClick={() => removeResponseField(index)}
                    title="Remove field"
                  >
                    <IcoClose />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}