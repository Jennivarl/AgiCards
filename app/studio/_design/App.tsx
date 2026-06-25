"use client";

import { useState } from "react";
import { Landing } from "./components/Landing";
import { Dashboard } from "./components/Dashboard";
import { CardDetail } from "./components/CardDetail";
import { CreateCard } from "./components/CreateCard";
import { Activity } from "./components/Activity";
import { SettingsPage } from "./components/SettingsPage";
import { WalletProvider, useWallet } from "./WalletProvider";
import { ThemeProvider } from "./ThemeProvider";

type Screen =
  | { id: "landing" }
  | { id: "dashboard" }
  | { id: "card-detail"; cardId: string }
  | { id: "activity" }
  | { id: "settings" };

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <AppInner />
      </WalletProvider>
    </ThemeProvider>
  );
}

function AppInner() {
  const { connect } = useWallet();
  const [screen, setScreen] = useState<Screen>({ id: "landing" });
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [createDescription, setCreateDescription] = useState("");
  // Bump to force the dashboard to remount + re-fetch (after a mint, etc.).
  const [refreshKey, setRefreshKey] = useState(0);

  // Launching the app connects MetaMask (on Base) first; only navigate in on success.
  const launchApp = async () => {
    const ok = await connect();
    if (ok) setScreen({ id: "dashboard" });
  };

  return (
    <div className="size-full">
      {screen.id === "landing" && <Landing onLaunchApp={launchApp} />}

      {screen.id === "dashboard" && (
        <Dashboard
          key={refreshKey}
          onGoHome={() => setScreen({ id: "landing" })}
          onCardDetail={(cardId) => setScreen({ id: "card-detail", cardId })}
          onCreateCard={(desc) => { setCreateDescription(desc ?? ""); setShowCreateCard(true); }}
          onActivity={() => setScreen({ id: "activity" })}
          onSettings={() => setScreen({ id: "settings" })}
        />
      )}

      {screen.id === "card-detail" && (
        <CardDetail
          cardId={(screen as { id: "card-detail"; cardId: string }).cardId}
          onBack={() => setScreen({ id: "dashboard" })}
        />
      )}

      {screen.id === "activity" && (
        <Activity onBack={() => setScreen({ id: "dashboard" })} />
      )}

      {screen.id === "settings" && (
        <SettingsPage onBack={() => setScreen({ id: "dashboard" })} />
      )}

      {showCreateCard && (
        <CreateCard
          initialDescription={createDescription}
          onClose={() => setShowCreateCard(false)}
          onSuccess={() => {
            setShowCreateCard(false);
            setRefreshKey((k) => k + 1);
            setScreen({ id: "dashboard" });
          }}
        />
      )}
    </div>
  );
}
