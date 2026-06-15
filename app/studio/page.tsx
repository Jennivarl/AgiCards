"use client";

import DesignApp from "./_design/App";

// Ported Figma "Design Dashboard Layout" — viewable at /studio. Presentational
// (mock data) for now; real wallet/card/agent logic gets wired in next.
export default function StudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <DesignApp />
    </div>
  );
}
