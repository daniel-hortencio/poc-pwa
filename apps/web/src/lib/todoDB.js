const DB_NAME = "poc-pwa";
const VERSION = 2;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("todos")) {
        db.createObjectStore("todos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalTodos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("todos", "readonly").objectStore("todos").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalTodos(todos) {
  const db = await openDB();
  const tx = db.transaction("todos", "readwrite");
  const store = tx.objectStore("todos");
  store.clear();
  todos.forEach((t) => store.put(t));
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
