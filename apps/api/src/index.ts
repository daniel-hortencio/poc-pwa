import http, { IncomingMessage, ServerResponse } from "http";
import { PrismaClient } from "@prisma/client";

const PORT = process.env.PORT || 3333;
const prisma = new PrismaClient();

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, data: unknown): void {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === "/" && req.method === "GET") {
    return json(res, 200, { message: "Hello from Node API" });
  }

  if (url.pathname === "/health" && req.method === "GET") {
    return json(res, 200, { status: "ok" });
  }

  // GET /todo
  if (url.pathname === "/todo" && req.method === "GET") {
    const todos = await prisma.todo.findMany({ orderBy: { id: "asc" } });
    return json(res, 200, todos);
  }

  // POST /todo — body: { todo: string }
  if (url.pathname === "/todo" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      if (!body.todo || typeof body.todo !== "string" || !body.todo.trim()) {
        return json(res, 400, { error: "Field 'todo' is required" });
      }
      const item = await prisma.todo.create({
        data: { todo: body.todo.trim() },
      });
      return json(res, 201, item);
    } catch {
      return json(res, 400, { error: "Invalid JSON body" });
    }
  }

  // PATCH /todo?id=N — body: { done: boolean }
  if (url.pathname === "/todo" && req.method === "PATCH") {
    const id = Number(url.searchParams.get("id"));
    if (!id) return json(res, 400, { error: "Query param 'id' is required" });
    try {
      const body = await parseBody(req);
      if (typeof body.done !== "boolean") {
        return json(res, 400, { error: "Field 'done' must be a boolean" });
      }
      const item = await prisma.todo.update({
        where: { id },
        data: { done: body.done },
      });
      return json(res, 200, item);
    } catch {
      return json(res, 404, { error: "Todo not found" });
    }
  }

  // DELETE /todo?id=N
  if (url.pathname === "/todo" && req.method === "DELETE") {
    const id = Number(url.searchParams.get("id"));
    if (!id) return json(res, 400, { error: "Query param 'id' is required" });
    try {
      const item = await prisma.todo.delete({ where: { id } });
      return json(res, 200, item);
    } catch {
      return json(res, 404, { error: "Todo not found" });
    }
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
