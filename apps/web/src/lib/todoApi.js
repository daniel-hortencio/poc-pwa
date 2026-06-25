import { getLocalTodos, saveLocalTodos } from "./todoDB";
import { addToQueue } from "./queueDB";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function notifyApiStatus(reachable) {
  window.dispatchEvent(new CustomEvent("api-status", { detail: { reachable } }));
}

export async function getTodos() {
  try {
    const res = await fetch(`${API_URL}/todo`);
    const todos = await res.json();
    notifyApiStatus(true);
    await saveLocalTodos(todos);
    return todos;
  } catch (err) {
    console.log("[getTodos] API unavailable, loading from IndexedDB:", err);
    notifyApiStatus(false);
    return getLocalTodos();
  }
}

export async function createTodo(todo) {
  try {
    const res = await fetch(`${API_URL}/todo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todo }),
    });
    const created = await res.json();
    notifyApiStatus(true);
    const todos = await getLocalTodos();
    await saveLocalTodos([...todos, created]);
    return created;
  } catch (err) {
    console.log("[createTodo] API unavailable:", err);
    notifyApiStatus(false);
    const optimistic = { id: `pending-${Date.now()}`, todo, done: false, pending: true };
    const todos = await getLocalTodos();
    await saveLocalTodos([...todos, optimistic]);
    await addToQueue({ endpoint: `${API_URL}/todo`, method: "POST", data: { todo } });
    return optimistic;
  }
}

export async function updateTodo(id) {
  try {
    const res = await fetch(`${API_URL}/todo?id=${id}`, { method: "PATCH" });
    const updated = await res.json();
    notifyApiStatus(true);
    const todos = await getLocalTodos();
    await saveLocalTodos(todos.map((t) => (t.id === id ? updated : t)));
    return updated;
  } catch (err) {
    console.log("[updateTodo] API unavailable:", err);
    notifyApiStatus(false);
    const todos = await getLocalTodos();
    const optimistic = todos.map((t) => (t.id === id ? { ...t, done: true } : t));
    await saveLocalTodos(optimistic);
    await addToQueue({ endpoint: `${API_URL}/todo?id=${id}`, method: "PATCH", data: {} });
    return optimistic.find((t) => t.id === id);
  }
}
