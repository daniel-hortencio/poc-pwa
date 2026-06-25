import { useState, useEffect, useRef } from "react";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { getTodos, createTodo, updateTodo, deleteTodo } from "./lib/todoApi";
import { getQueue, removeFromQueue } from "./lib/queueDB";
import { PiWifiHigh, PiWifiSlash, PiCloudCheck, PiCloudX, PiTrash } from "react-icons/pi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "./App.css";

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const { isOnline, isApiReachable, isCheckingApi } = useConnectionStatus();
  const [todos, setTodos] = useState([]);
  const [queue, setQueue] = useState([]);
  const [input, setInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

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

  useEffect(() => {
    if (isApiReachable === true && queue.length > 0 && !isSyncingRef.current) {
      syncQueue(queue);
    }
  }, [isApiReachable, queue]);

  async function syncQueue(pendingQueue) {
    isSyncingRef.current = true;
    setIsSyncing(true);
    for (const item of pendingQueue) {
      try {
        const hasBody = item.data && Object.keys(item.data).length > 0;
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: hasBody ? { "Content-Type": "application/json" } : undefined,
          body: hasBody ? JSON.stringify(item.data) : undefined,
        });
        if (res.ok) await removeFromQueue(item.id);
      } catch {
        // mantém na fila se falhar
      }
    }
    const fresh = await getTodos();
    setTodos(fresh);
    isSyncingRef.current = false;
    setIsSyncing(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const item = await createTodo(input);
    if (item) setTodos((prev) => [...prev, item]);
    setInput("");
  }

  async function handleDone(id, currentDone) {
    const updated = await updateTodo(id, !currentDone);
    if (updated) setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
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
                disabled={isSyncing}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, opacity: isSyncing ? 0.5 : 1 }}
              />
              <button type="submit" disabled={isSyncing}>Add</button>
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
                    disabled={isSyncing}
                    onChange={() => handleDone(t.id, t.done)}
                    style={{ cursor: isSyncing ? "default" : "pointer" }}
                  />
                  <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9ca3af" : "inherit" }}>
                    {t.todo}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={isSyncing}
                    style={{ background: "none", border: "none", cursor: isSyncing ? "default" : "pointer", color: "#dc2626", padding: 2 }}
                  >
                    <PiTrash size={16} />
                  </button>
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
