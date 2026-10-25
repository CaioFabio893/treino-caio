const ROOT = new URL("./", self.location.href);
const CACHE = "hybrid-strength-" + ROOT.pathname + "-shell-v1";
const asset = (path) => new URL(path, ROOT).href;
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch(ROOT.href);
      if (!response.ok) throw new Error("Página indisponível");
      await cache.put(ROOT.href, response);
      const list = await fetch(asset("offline-assets.json")).then((r) => {
        if (!r.ok) throw new Error("Lista offline indisponível");
        return r.json();
      });
      await cache.addAll(
        [
          "icon.svg",
          "icon-192.png",
          "icon-512.png",
          "manifest.webmanifest",
          ...list,
        ].map(asset),
      );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpeza restrita à subpasta desta aplicação; sem tocar em outros sites.
      const prefix = "hybrid-strength-" + ROOT.pathname + "-shell-";
      for (const key of await caches.keys())
        if (key.startsWith(prefix) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(ROOT.href)),
    );
  } else if (
    url.pathname.startsWith(new URL("assets/", ROOT).pathname) ||
    ["icon.svg", "icon-192.png", "icon-512.png", "manifest.webmanifest"].some(
      (path) => url.href === asset(path),
    )
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      })(),
    );
  }
});
