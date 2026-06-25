import { openDB } from "./todoDB";

function dispatch(queue) {
  window.dispatchEvent(new CustomEvent("queue-updated", { detail: { queue } }));
}

export async function getQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("queue", "readonly").objectStore("queue").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addToQueue(item) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const req = db.transaction("queue", "readwrite").objectStore("queue").add(item);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  const queue = await getQueue();
  dispatch(queue);
}

export async function removeFromQueue(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const req = db.transaction("queue", "readwrite").objectStore("queue").delete(id);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  const queue = await getQueue();
  dispatch(queue);
}
