const http = require("http");

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from Node API" }));
});

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
