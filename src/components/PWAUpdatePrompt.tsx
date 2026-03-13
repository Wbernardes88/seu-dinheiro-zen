import { useEffect, useState, useCallback } from "react";

export const PWAUpdatePrompt = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const promptUpdate = useCallback((worker: ServiceWorker) => {
    setWaitingWorker(worker);
    setShowUpdate(true);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let intervalId: ReturnType<typeof setInterval>;

    const handleControllerChange = () => {
      window.location.reload();
    };

    const detectWaitingWorker = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        promptUpdate(reg.waiting);
      }
    };

    const listenForUpdates = (reg: ServiceWorkerRegistration) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            promptUpdate(newWorker);
          }
        });
      });
    };

    const init = async () => {
      try {
        // Wait for the SW to be ready first
        const reg = await navigator.serviceWorker.ready;
        
        // Check if there's already a waiting worker
        detectWaitingWorker(reg);

        // Listen for future updates
        listenForUpdates(reg);

        // Aggressively check for updates:
        // - Every 30s (iOS standalone mode is especially problematic)
        // - On visibility change (user comes back to app)
        intervalId = setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 1000);

        // When app becomes visible again, check immediately
        const handleVisibility = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
            // Re-check waiting worker (iOS sometimes misses events)
            detectWaitingWorker(reg);
          }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        // Also check on focus (belt and suspenders for iOS)
        const handleFocus = () => {
          reg.update().catch(() => {});
          detectWaitingWorker(reg);
        };
        window.addEventListener("focus", handleFocus);

        // Store cleanup refs
        (init as any)._cleanup = () => {
          document.removeEventListener("visibilitychange", handleVisibility);
          window.removeEventListener("focus", handleFocus);
        };
      } catch {
        // SW not supported or failed
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    init();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      if (intervalId) clearInterval(intervalId);
      if ((init as any)._cleanup) (init as any)._cleanup();
    };
  }, [promptUpdate]);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdate(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Re-show after 5 minutes if still not updated
    setTimeout(() => {
      if (waitingWorker) {
        setShowUpdate(true);
      }
    }, 5 * 60 * 1000);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Nova versão disponível!</span>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-primary-foreground/70 text-sm px-2 py-1.5 rounded-lg hover:text-primary-foreground"
          >
            Depois
          </button>
          <button
            onClick={handleUpdate}
            className="bg-primary-foreground text-primary text-sm font-semibold px-4 py-1.5 rounded-lg"
          >
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
};
