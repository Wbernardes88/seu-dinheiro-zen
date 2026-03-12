import { useEffect, useState } from "react";

export const PWAUpdatePrompt = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    const checkForUpdates = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // If there's already a waiting worker, show prompt
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }

      // Listen for new service workers
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowUpdate(true);
          }
        });
      });

      // Periodically check for updates (every 60s)
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    checkForUpdates();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Nova versão disponível!</span>
        <button
          onClick={handleUpdate}
          className="bg-primary-foreground text-primary text-sm font-semibold px-4 py-1.5 rounded-lg shrink-0"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};
