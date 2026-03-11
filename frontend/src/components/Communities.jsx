import React, { useState } from "react";
import Header from "./Header";


import FeedC from "/workspaces/Shine/frontend/src/components/communities/feedC.jsx";
import LeftBarC from "./communities/LeftBarC.jsx";
import RightBarC from "./communities/rightBarC.jsx";

import "../styles/comm.css"; // Make sure this path is correct

export default function Communities() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="communities-page">
      <Header />
      <div className="forum-mobile-topbar">
        <button className="forum-mobile-menu-btn" onClick={() => setMobileNavOpen(true)}>☰ Menu</button>
      </div>
      {mobileNavOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setMobileNavOpen(false)} />
          <aside className="mobile-left-drawer">
            <button className="mobile-drawer-close" onClick={() => setMobileNavOpen(false)}>✕</button>
            <button>Make a community</button>
            <button>Events</button>
            <button>Friends</button>
            <button>Messenger</button>
          </aside>
        </>
      )}

      <div className="communities-container">
        {/* Left Sidebar */}
        <aside className="left-column">
          <LeftBarC />
        </aside>

        {/* Main Feed */}
        <main className="center-column">
          <div className="center-content">
            <FeedC />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-column">
          <RightBarC />
        </aside>
      </div>
    </div>
  );
}
