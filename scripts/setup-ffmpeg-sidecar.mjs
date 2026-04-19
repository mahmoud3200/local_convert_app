import { constants } from "node:fs";
import { access, chmod, copyFile, mkdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(scriptPath), "..");
const binaryDir = join(repoRoot, "src-tauri", "binaries");
const hostTuple = getHostTuple();
const executableExtension = process.platform === "win32" ? ".exe" : "";
const sidecarPath = join(binaryDir, `ffmpeg-${hostTuple}${executableExtension}`);

await mkdir(binaryDir, { recursive: true });

if (await exists(sidecarPath)) {
  console.log(`FFmpeg sidecar already exists: ${sidecarPath}`);
  process.exit(0);
}

if (process.platform === "win32") {
  execFileSync(
    "powershell",
    ["-ExecutionPolicy", "Bypass", "-File", "./scripts/setup-ffmpeg-sidecar.ps1"],
    { cwd: repoRoot, stdio: "inherit" },
  );
  process.exit(0);
}

const systemFfmpeg = findSystemFfmpeg();

if (!systemFfmpeg) {
  throw new Error(
    [
      `No FFmpeg sidecar found at ${sidecarPath}.`,
      "Install FFmpeg on this machine, then rerun npm run ffmpeg:setup so it can copy the executable into src-tauri/binaries.",
      "For release builds, use a portable FFmpeg binary for each target platform instead of relying on a developer machine install.",
    ].join(" "),
  );
}

const resolvedFfmpeg = await realpath(systemFfmpeg);
await copyFile(resolvedFfmpeg, sidecarPath);
await chmod(sidecarPath, 0o755);

console.log(`Copied system FFmpeg into Tauri sidecar slot: ${sidecarPath}`);

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function getHostTuple() {
  const rustc = spawnSync("rustc", ["-Vv"], { encoding: "utf8" });
  const host = rustc.stdout
    ?.split(/\r?\n/)
    .find((line) => line.startsWith("host:"))
    ?.replace("host:", "")
    .trim();

  if (host) {
    return host;
  }

  return getFallbackHostTuple();
}

function getFallbackHostTuple() {
  const key = `${process.platform}:${process.arch}`;
  const fallbackTuples = {
    "win32:x64": "x86_64-pc-windows-msvc",
    "win32:arm64": "aarch64-pc-windows-msvc",
    "darwin:x64": "x86_64-apple-darwin",
    "darwin:arm64": "aarch64-apple-darwin",
    "linux:x64": "x86_64-unknown-linux-gnu",
    "linux:arm64": "aarch64-unknown-linux-gnu",
  };

  const tuple = fallbackTuples[key];

  if (!tuple) {
    throw new Error(`Unsupported platform for FFmpeg sidecar setup: ${key}`);
  }

  return tuple;
}

function findSystemFfmpeg() {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  const lookup = spawnSync(lookupCommand, ["ffmpeg"], { encoding: "utf8" });

  if (lookup.status !== 0) {
    return null;
  }

  return lookup.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null;
}
