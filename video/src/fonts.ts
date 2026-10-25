import { continueRender, delayRender, staticFile } from "remotion";

const loaded = { done: false };
export function ensureFonts() {
  if (loaded.done || typeof document === "undefined") return;
  loaded.done = true;
  const handle = delayRender("fonts");
  const sans = new FontFace("Geist", `url(${staticFile("fonts/Geist.woff2")}) format("woff2")`, { weight: "100 900" });
  const mono = new FontFace("GeistMono", `url(${staticFile("fonts/GeistMono.woff2")}) format("woff2")`, { weight: "100 900" });
  Promise.all([sans.load(), mono.load()])
    .then((faces) => {
      faces.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}
