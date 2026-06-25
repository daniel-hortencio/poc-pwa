import { useState, useEffect } from "react";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { getTodos, createTodo, updateTodo } from "./lib/todoApi";
import { getQueue } from "./lib/queueDB";
import { PiWifiHigh, PiWifiSlash, PiCloudCheck, PiCloudX } from "react-icons/pi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "./App.css";

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const { isOnline, isApiReachable, isCheckingApi } = useConnectionStatus();
  const [todos, setTodos] = useState([]);
  const [queue, setQueue] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  useEffect(() => {
    getTodos().then(setTodos);
    getQueue().then(setQueue);
  }, []);

  useEffect(() => {
    const handler = (e) => setQueue(e.detail.queue);
    window.addEventListener("queue-updated", handler);
    return () => window.removeEventListener("queue-updated", handler);
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const item = await createTodo(input);
    if (item) setTodos((prev) => [...prev, item]);
    setInput("");
  }

  async function handleDone(id) {
    const updated = await updateTodo(id);
    if (updated) setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return (
    <>
      <div style={{ display: "flex", gap: 16, padding: "10px 16px", borderBottom: "1px solid #eee" }}>
        {isOnline
          ? <PiWifiHigh size={24} color="#16a34a" title="Internet ok" />
          : <PiWifiSlash size={24} color="#dc2626" title="Sem internet" />
        }
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isApiReachable
            ? <PiCloudCheck size={24} color="#16a34a" title="Backend ok" />
            : <PiCloudX size={24} color="#dc2626" title="Backend indisponível" />
          }
          {isCheckingApi && (
            <AiOutlineLoading3Quarters
              size={14}
              color="#6b7280"
              style={{ animation: "spin 1s linear infinite" }}
            />
          )}
        </div>
      </div>

      <section id="center">
        {installPrompt && (
          <button type="button" onClick={handleInstall}>
            Install app
          </button>
        )}

        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {/* Todo list */}
          <div>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="New todo..."
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
              />
              <button type="submit">Add</button>
            </form>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, minWidth: 280 }}>
              {todos.map((t) => (
                <li
                  key={t.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee" }}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    disabled={t.done}
                    onChange={() => handleDone(t.id)}
                    style={{ cursor: t.done ? "default" : "pointer" }}
                  />
                  <span style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9ca3af" : "inherit" }}>
                    {t.todo}
                  </span>
                  {t.pending && <span style={{ fontSize: 11, color: "#b45309", background: "#fef9c3", borderRadius: 4, padding: "1px 5px" }}>pendente</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Pending queue */}
          <div style={{ minWidth: 220 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14 }}>
              Requisições pendentes {queue.length > 0 && <span style={{ color: "#b45309" }}>({queue.length})</span>}
            </p>
            {queue.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhuma pendente</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {queue.map((item) => (
                  <li
                    key={item.id}
                    style={{ fontSize: 12, padding: "6px 8px", marginBottom: 6, borderRadius: 6, background: "#fef9c3", color: "#713f12", borderLeft: "3px solid #b45309" }}
                  >
                    <span style={{ fontWeight: 700 }}>{item.method}</span> {item.endpoint}
                    {Object.keys(item.data).length > 0 && (
                      <pre style={{ margin: "4px 0 0", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
