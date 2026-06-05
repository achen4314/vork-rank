import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const host = process.env.HOST ?? "127.0.0.1";
const preferredPort = positiveInt(process.env.PORT, 3000);
const port = await findOpenPort(preferredPort, 30);
const nextBin = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

if (port !== preferredPort) {
  console.log(`Port ${preferredPort} is busy; starting Vork Rank on ${port}.`);
}

const child = spawn(nextBin, ["dev", "-p", String(port), "-H", host], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function findOpenPort(start, attempts) {
  for (let offset = 0; offset <= attempts; offset += 1) {
    const portToTry = start + offset;
    if (await isOpen(portToTry)) return portToTry;
  }
  throw new Error(`No open port found from ${start} to ${start + attempts}.`);
}

function isOpen(portToTry) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ host, port: portToTry }, () => {
      server.close(() => resolve(true));
    });
  });
}
