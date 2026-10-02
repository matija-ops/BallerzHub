import { copyFile } from "node:fs/promises";

// GitHub Pages serves this file for client-side routes, preserving the URL
// (including OAuth query parameters and fragments) for React Router.
await copyFile(
  new URL("../dist/index.html", import.meta.url),
  new URL("../dist/404.html", import.meta.url),
);
