import { useState, useRef, useEffect } from "react";

const SAMPLE_DATASETS = {
  sales: {
    name: "Sales Data",
    columns: ["Month", "Revenue", "Units", "Region", "Category"],
    rows: [
      ["Jan", 42000, 320, "North", "Electronics"],
      ["Feb", 38000, 290, "South", "Electronics"],
      ["Mar", 51000, 410, "East", "Apparel"],
      ["Apr", 47000, 375, "West", "Electronics"],
      ["May", 55000, 430, "North", "Apparel"],
      ["Jun", 60000, 480, "South", "Electronics"],
      ["Jul", 58000, 460, "East", "Electronics"],
      ["Aug", 63000, 510, "West", "Apparel"],
    ],
  },
  customers: {
    name: "Customer Data",
    columns: ["ID", "Name", "Age", "Country", "Spend", "Tier"],
    rows: [
      [1001, "Alice Chen", 32, "USA", 4200, "Gold"],
      [1002, "Bob Martinez", 45, "Mexico", 1800, "Silver"],
      [1003, "Clara Singh", 28, "India", 6500, "Platinum"],
      [1004, "David Kim", 37, "Korea", 3100, "Gold"],
      [1005, "Eva Rossi", 52, "Italy", 2400, "Silver"],
      [1006, "Frank Müller", 41, "Germany", 7800, "Platinum"],
    ],
  },
};

const SUGGESTED_QUERIES = [
  "What is the total revenue across all months?",
  "Which region has the highest sales?",
  "Summarize this dataset in 3 bullet points",
  "Find any trends or patterns in the data",
  "Which category performs best?",
];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--color-text-tertiary)",
          display: "inline-block",
          animation: "bounce 1.2s infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function DataTable({ dataset }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: "var(--color-background-secondary)" }}>
            {dataset.columns.map(col => (
              <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataset.rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "7px 12px", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{typeof cell === "number" && j > 0 ? cell.toLocaleString() : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCards({ dataset }) {
  const numeric = dataset.columns.reduce((acc, col, i) => {
    const vals = dataset.rows.map(r => r[i]).filter(v => typeof v === "number");
    if (vals.length > 0) acc.push({ col, sum: vals.reduce((a, b) => a + b, 0), avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), max: Math.max(...vals) });
    return acc;
  }, []).slice(0, 3);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
      {numeric.map(({ col, sum, avg, max }) => (
        <div key={col} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{col}</p>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" }}>{sum.toLocaleString()}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>avg {avg.toLocaleString()} · max {max.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [selectedDataset, setSelectedDataset] = useState("sales");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I'm your AI Data Engine. Select a dataset, then ask me anything about it — summaries, trends, calculations, or insights." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const dataset = SAMPLE_DATASETS[selectedDataset];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    const systemPrompt = `You are an AI data analyst assistant. The user has loaded the following dataset called "${dataset.name}".

Columns: ${dataset.columns.join(", ")}

Data (${dataset.rows.length} rows):
${dataset.rows.map(r => r.join(", ")).join("\n")}

Answer the user's questions about this data concisely and helpfully. Use numbers when relevant. Keep responses under 150 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: q }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "An error occurred. Please try again." }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 style={{ display: "sr-only", position: "absolute", left: -9999 }}>AI-powered data engine — chat with your dataset</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--border-radius-md)", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-database" style={{ fontSize: 18, color: "var(--color-text-info)" }} aria-hidden="true" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>AI Data Engine</h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>Powered by Claude</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {Object.entries(SAMPLE_DATASETS).map(([key, ds]) => (
            <button
              key={key}
              onClick={() => { setSelectedDataset(key); setMessages([{ role: "assistant", text: `Switched to "${ds.name}". Ask me anything about it!` }]); }}
              style={{
                padding: "5px 12px", fontSize: 13, cursor: "pointer", borderRadius: "var(--border-radius-md)",
                border: selectedDataset === key ? "1.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-secondary)",
                background: selectedDataset === key ? "var(--color-background-info)" : "transparent",
                color: selectedDataset === key ? "var(--color-text-info)" : "var(--color-text-secondary)",
                fontWeight: selectedDataset === key ? 500 : 400,
              }}
            >
              {ds.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[["chat", "ti-message", "Chat"], ["data", "ti-table", "Data"], ["stats", "ti-chart-bar", "Stats"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 16px", fontSize: 13, cursor: "pointer", border: "none",
            background: "transparent", color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            fontWeight: tab === key ? 500 : 400, borderBottom: tab === key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
            marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Data tab */}
      {tab === "data" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            <i className="ti ti-table" style={{ fontSize: 14, verticalAlign: -2, marginRight: 5 }} aria-hidden="true" />
            {dataset.rows.length} rows · {dataset.columns.length} columns
          </p>
          <DataTable dataset={dataset} />
        </div>
      )}

      {/* Stats tab */}
      {tab === "stats" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>Numeric column summaries</p>
          <StatCards dataset={dataset} />
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px" }}>
            <p style={{ fontSize: 13, margin: "0 0 8px", color: "var(--color-text-secondary)" }}>Dataset overview</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Rows", dataset.rows.length],
                ["Columns", dataset.columns.length],
                ["Dataset", dataset.name],
                ["String cols", dataset.columns.filter((_, i) => typeof dataset.rows[0][i] === "string").length],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat tab */}
      {tab === "chat" && (
        <div>
          {/* Messages */}
          <div style={{ minHeight: 280, maxHeight: 380, overflowY: "auto", marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 4 }}>
                    <i className="ti ti-sparkles" style={{ fontSize: 13, color: "var(--color-text-info)" }} aria-hidden="true" />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "10px 14px",
                  background: msg.role === "user" ? "var(--color-background-info)" : "var(--color-background-secondary)",
                  borderRadius: "var(--border-radius-lg)",
                  fontSize: 14, lineHeight: 1.6,
                  color: msg.role === "user" ? "var(--color-text-info)" : "var(--color-text-primary)",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 13, color: "var(--color-text-info)" }} aria-hidden="true" />
                </div>
                <TypingIndicator />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested queries */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {SUGGESTED_QUERIES.slice(0, 3).map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                fontSize: 12, padding: "4px 10px", cursor: "pointer",
                borderRadius: 99, border: "0.5px solid var(--color-border-secondary)",
                background: "transparent", color: "var(--color-text-secondary)",
                whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "8px 12px", background: "var(--color-background-primary)" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask anything about ${dataset.name}…`}
              disabled={loading}
              rows={1}
              style={{
                flex: 1, border: "none", outline: "none", resize: "none",
                fontSize: 14, background: "transparent", color: "var(--color-text-primary)",
                fontFamily: "var(--font-sans)", lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, borderRadius: "var(--border-radius-md)", border: "none",
                background: input.trim() && !loading ? "var(--color-background-info)" : "var(--color-background-secondary)",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
              aria-label="Send message"
            >
              <i className="ti ti-arrow-up" style={{ fontSize: 16, color: input.trim() && !loading ? "var(--color-text-info)" : "var(--color-text-tertiary)" }} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
