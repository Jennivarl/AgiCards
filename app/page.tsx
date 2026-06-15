"use client";

import DesignApp from "./studio/_design/App";

// AgiCards v2 — the live product, served at the site root (agicards.dev).
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <DesignApp />
    </div>
  );
}
