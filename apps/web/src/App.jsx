import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const { isOnline, isApiReachable } = useConnectionStatus();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <>
      {!isOnline && (
        <div
          role="alert"
          style={{
            background: "#b91c1c",
            color: "#fff",
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          No internet connection.
        </div>
      )}
      {isOnline && isApiReachable === false && (
        <div
          role="alert"
          style={{
            background: "#b45309",
            color: "#fff",
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          Could not reach the backend.
        </div>
      )}
      <section id="center">
        {installPrompt && (
          <button type="button" onClick={handleInstall}>
            Install app
          </button>
        )}
      </section>
    </>
  );
}

export default App;
