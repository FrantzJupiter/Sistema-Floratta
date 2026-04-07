/// <reference lib="webworker" />

import { Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & {
    __SW_MANIFEST: Array<string | { url: string; revision?: string | null }>;
  };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        (request.destination === "style" ||
          request.destination === "script" ||
          request.destination === "worker"),
      handler: new StaleWhileRevalidate({
        cacheName: "floratta-static-assets",
      }),
    },
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "floratta-images",
      }),
    },
  ],
});

serwist.addEventListeners();
