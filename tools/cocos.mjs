import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const editor = path.join(root, ".cache", "cocos", "editor", "CocosCreator.exe");
if (!existsSync(editor)) throw new Error(`Cocos Creator 3.8.8 not found at ${editor}`);
const mode = process.argv[2] ?? "build";
const args = ["--project", root];
if (mode === "build") args.push("--build", `configPath=${path.join(root, "tools", "web-mobile-build.json")}`);
else if (mode !== "editor") throw new Error(`Unknown mode: ${mode}`);
const child = spawn(editor, args, { cwd: root, stdio: "inherit", windowsHide: false });
child.on("error", (error) => { throw error; });
child.on("exit", (code) => {
  if (mode === "editor") process.exit(0);
  process.exit(code === 36 || code === 0 ? 0 : code ?? 1);
});
