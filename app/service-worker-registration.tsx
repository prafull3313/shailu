"use client";

import { useEffect } from "react";

const serviceWorkerPath = process.env.NODE_ENV === "production" ? "/shailu/sw.js" : "/sw.js";

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register(serviceWorkerPath);
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    void registerServiceWorker();
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
