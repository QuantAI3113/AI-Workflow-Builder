import React from 'react'
import { useState, useRef, useEffect } from "react";

const BACKEND_URL = "http://localhost:5000";

const StatusBadge = ({ action }) => {
  if (!action) return null;
  const isNew = action === "created";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      background: isNew ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
      color: isNew ? "#34d399" : "#fbbf24",
      border: `1px solid ${isNew ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {isNew ? "New Flow Saved" : "Flow Replaced"}
    </span>
  );
};

const NodeCard = ({ node, index }) => (
  <div style={{
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px", padding: "12px 14px", marginBottom: "8px",
    animation: `fadeSlideIn 0.3s ease ${index * 0.04}s both`,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div>
        <span style={{ fontSize: "10px", color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {node.id}
        </span>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginTop: 3 }}>
          {node.data.fieldNode.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
          {node.data.instructions}
        </div>
      </div>
      <div style={{ fontSize: "10px", color: "#475569", whiteSpace: "nowrap" }}>
        ({node.position.x}, {node.position.y})
      </div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
      {node.data.responseFields.map((f, i) => (
        <span key={i} style={{
          fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
          background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
          border: "1px solid rgba(99,102,241,0.2)",
        }}>
          {f.key}: <span style={{ opacity: 0.7 }}>{f.value}</span>
        </span>
      ))}
    </div>
  </div>
);

export default function WorkflowGenerator() {
  const [flowName, setFlowName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 260;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
    ta.style.overflowY = ta.scrollHeight > max ? "auto" : "hidden";
  }, [text]);

  const handleSubmit = async () => {
    if (!flowName.trim() || !text.trim()) {
      setError("Both flow name and description are required.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/generate-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_name: flowName.trim(), text: text.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const canSubmit = flowName.trim() && text.trim() && !loading;

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e2e8f0", overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .submit-btn:hover:not(:disabled) {
          background: #4f46e5 !important;
          transform: translateY(-1px);
          box-shadow: 0 0 24px rgba(99,102,241,0.5) !important;
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .tab:hover { color: #e2e8f0 !important; }
        textarea { resize: none; }
        textarea:focus { outline: none; }
        .flow-name-input:focus { outline: none; border-color: rgba(99,102,241,0.5) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 32px",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(255,255,255,0.015)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "8px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", boxShadow: "0 0 16px rgba(99,102,241,0.4)",
        }}>⚡</div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
            Workflow Generator
          </div>
          <div style={{ fontSize: "11px", color: "#475569" }}>Powered by GPT-4.1-mini · Auto-validates with Pydantic</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700,
            letterSpacing: "-0.03em", lineHeight: 1.15,
            background: "linear-gradient(135deg, #f1f5f9 30%, #6366f1 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 12,
          }}>
            Describe your flow.<br />We'll build the graph.
          </h1>
          <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7 }}>
            Paste any conversational workflow description. The AI generates a validated<br />
            n-ary tree JSON — saved automatically by flow name.
          </p>
        </div>

        {/* Input Panel */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.4)",
          transition: "border-color 0.2s",
        }}>
          {/* Flow name row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <span style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Flow Name
            </span>
            <input
              className="flow-name-input"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder="e.g. aiva-intake-flow"
              style={{
                flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", padding: "7px 12px", fontSize: "13px",
                color: "#e2e8f0", fontFamily: "'DM Mono', monospace",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Textarea */}
          <div style={{ padding: "4px 0" }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe your workflow in plain English...\n\nExample: "Build an AI intake assistant that greets the user, collects their name, age, contact info, education, skills, and career goals, then closes with a summary."\n\nTip: ⌘ + Enter to send`}
              style={{
                width: "100%", minHeight: "140px", maxHeight: "260px",
                background: "transparent", border: "none",
                padding: "18px 20px", fontSize: "14px", lineHeight: 1.7,
                color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Bottom bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: "11px", color: "#334155" }}>
              {text.length > 0 && `${text.length} chars · `}⌘↵ to send
            </div>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 20px", borderRadius: "10px", border: "none",
                background: canSubmit ? "#6366f1" : "#1e293b",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: canSubmit ? "0 0 16px rgba(99,102,241,0.3)" : "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Generating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                  </svg>
                  Generate Flow
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: "10px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: "13px", display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "16px", lineHeight: 1 }}>⚠</span>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#6366f1", opacity: 0.3,
                    animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                Calling GPT-4.1-mini · Validating schema · Saving flow…
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div ref={resultRef} style={{ marginTop: 32, animation: "fadeSlideIn 0.4s ease both" }}>

            {/* Result header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16, flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "7px",
                  background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                }}>✓</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                    {result.flow_name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>{result.file_path}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge action={result.action} />
                <span style={{ fontSize: "11px", color: "#334155" }}>
                  {result.workflow.nodes.length} nodes · {result.workflow.edges.length} edges
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: 0, marginBottom: 0,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              {["preview", "json"].map(tab => (
                <button key={tab} className="tab" onClick={() => setActiveTab(tab)} style={{
                  padding: "9px 18px", background: "none", border: "none",
                  fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em",
                  textTransform: "uppercase", cursor: "pointer",
                  color: activeTab === tab ? "#818cf8" : "#334155",
                  borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                }}>
                  {tab === "preview" ? `Nodes (${result.workflow.nodes.length})` : "Raw JSON"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "none", borderRadius: "0 0 12px 12px",
              overflow: "hidden",
            }}>
              {activeTab === "preview" ? (
                <div style={{ padding: "16px", maxHeight: "480px", overflowY: "auto" }}>
                  {result.workflow.nodes.map((node, i) => (
                    <NodeCard key={node.id} node={node} index={i} />
                  ))}
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(result.workflow, null, 2))}
                    style={{
                      position: "absolute", top: 12, right: 12, zIndex: 1,
                      padding: "5px 12px", background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px",
                      color: "#818cf8", fontSize: "11px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Copy
                  </button>
                  <pre style={{
                    padding: "20px", maxHeight: "480px", overflowY: "auto",
                    fontSize: "11px", lineHeight: 1.65,
                    color: "#94a3b8", fontFamily: "'DM Mono', monospace",
                    whiteSpace: "pre-wrap", wordBreak: "break-all",
                  }}>
                    {JSON.stringify(result.workflow, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}