'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { Download, RotateCw } from 'lucide-react';

const PWAContext = createContext();

export function PWAProvider({ children }) {
  const [installed, setInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setSwRegistration(registration);
          console.log('Service Worker registered');

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalled(true);
      setInstallPrompt(null);
    }
  };

  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Reload after SW updates
      window.location.reload();
    }
  };

  return (
    <PWAContext.Provider value={{ installed, installPrompt, updateAvailable, handleInstall, handleUpdate }}>
      {children}

      {/* Install Prompt Banner */}
      {installPrompt && !installed && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg flex items-center justify-between z-50 sm:rounded-t-lg sm:bottom-4 sm:left-4 sm:right-auto sm:w-96">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-bold">Install App</p>
              <p className="text-xs opacity-90">Quick access on your home screen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-50"
            >
              Install
            </button>
            <button
              onClick={() => setInstallPrompt(null)}
              className="text-white hover:bg-blue-700 px-3 py-2 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white p-4 shadow-lg flex items-center justify-between z-50 sm:rounded-t-lg sm:bottom-4 sm:left-4 sm:right-auto sm:w-96">
          <div className="flex items-center gap-3">
            <RotateCw className="h-5 w-5" />
            <div>
              <p className="font-bold">Update Available</p>
              <p className="text-xs opacity-90">Restart to get the latest version</p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-white text-amber-600 px-4 py-2 rounded font-bold hover:bg-amber-50"
          >
            Update
          </button>
        </div>
      )}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}
