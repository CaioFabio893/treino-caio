import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
if (/(?:src|href)="\/(?:assets|icon|manifest)/.test(html))
  throw new Error("Recurso escapando da subpasta do GitHub Pages.");
if (!html.includes("/treino-caio/assets/"))
  throw new Error("Base do GitHub Pages ausente.");
const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
if (manifest.scope !== "./" || manifest.start_url !== "./")
  throw new Error("Manifest fora do escopo da aplicação.");
const assets = JSON.parse(readFileSync("dist/offline-assets.json", "utf8"));
if (
  !assets.length ||
  assets.some((path) => path.startsWith("/") || !existsSync(`dist/${path}`))
)
  throw new Error("Lista de arquivos offline inconsistente.");
if (readFileSync("dist/sw.js", "utf8").includes("shell-v1"))
  throw new Error("Service worker sem versão do build.");
console.log(
  "GitHub Pages: base, manifest, precache e versão do worker conferidos, sem navegador.",
);
