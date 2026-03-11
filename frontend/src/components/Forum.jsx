import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import LeftSidebar from "./forum/LeftSidebar";
import RightSidebar from "./forum/RightSidebar";
import Feed from "./forum/Feed";
import PostView from "./PostView/PostView";
import "../styles/Forum.css";

export default function Forum() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [selectedPostId, setSelectedPostId] = useState(postId || null);
  const [feed, setFeed] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    setSelectedPostId(postId || null);
  }, [postId]);

  const handleSelectPost = (id) => {
    scrollPosRef.current = window.scrollY;
    setSelectedPostId(id);
    navigate(`/forum/post/${id}`);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedPostId(null);
    navigate("/forum");
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosRef.current,
        behavior: "instant"
      });
    }, 0);
  };

  return (
    <div className="forum-page">
      <Header />
      <div className="forum-mobile-topbar">
        <button className="forum-mobile-menu-btn" onClick={() => setMobileNavOpen(true)}>☰ Menu</button>
      </div>

      {mobileNavOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setMobileNavOpen(false)} />
          <aside className="mobile-left-drawer">
            <button className="mobile-drawer-close" onClick={() => setMobileNavOpen(false)}>✕</button>
            <button onClick={() => navigate('/opinion-create')}>Post</button>
            <button onClick={() => navigate('/events')}>Events</button>
            <button onClick={() => navigate(`/${JSON.parse(localStorage.getItem('user') || 'null')?.username || ''}/friends`)}>Friends</button>
            <button onClick={() => navigate('/messages')}>Messenger</button>
          </aside>
        </>
      )}

      <div className="forum-container">
        <aside className="left-column">
          <LeftSidebar />
        </aside>

        <main className="center-column">
          {selectedPostId ? (
            <PostView postId={selectedPostId} goBack={handleBack} />
          ) : (
            <Feed
              onSelectPost={handleSelectPost}
              feed={feed}
              setFeed={setFeed}
            />
          )}
        </main>

        <aside className="right-column">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
