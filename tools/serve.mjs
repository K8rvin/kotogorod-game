import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "build", "web-mobile-current");
const port = Number(process.env.PORT || 8080);
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".wasm": "application/wasm", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".svg": "image/svg+xml" };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep) && file !== root) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(response);
});
server.listen(port, "127.0.0.1", () => console.log(`Kotogorod: http://127.0.0.1:${port}`));
