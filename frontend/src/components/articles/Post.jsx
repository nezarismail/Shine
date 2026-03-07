import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "/workspaces/Shine/frontend/src/components/AuthProvider.jsx";
import SharePopup from "/workspaces/Shine/frontend/src/components/posts/SharePopup.jsx";

// Icons
import heartIcon from "/workspaces/Shine/frontend/src/assets/Heart.svg";
import heartClickedIcon from "/workspaces/Shine/frontend/src/assets/HeartC.svg";
import commentIcon from "/workspaces/Shine/frontend/src/assets/comment.svg";
import shareIcon from "/workspaces/Shine/frontend/src/assets/Share.svg";
import saveIcon from "/workspaces/Shine/frontend/src/assets/Tag.svg";
import saveClickedIcon from "/workspaces/Shine/frontend/src/assets/TagClicked.svg";

const BACKEND_URL = "https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev";

function Toast({ message, type = "success", duration = 2000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "error" ? "#FF4C4C" : "#1C274C";
  const textColor = type === "error" ? "#FFF" : "#FFC847";

  return (
    <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: bgColor, color: textColor, padding: "12px 20px",
        borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 1100,
      }}>
      {message}
    </div>
  );
}

const Post = ({ article: initialArticle, profileUser }) => {
  const navigate = useNavigate();
  const { user: loggedInUser } = useContext(AuthContext);
  const postRef = useRef(null);

  const [article, setArticle] = useState(initialArticle);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasCountedView, setHasCountedView] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => { 
    setArticle(initialArticle); 
  }, [initialArticle]);

  // View Tracking
  useEffect(() => {
    if (!article?.id || hasCountedView) return;
    let timer;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasCountedView) {
          timer = setTimeout(() => recordView(article.id), 2000); 
        } else {
          clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );
    if (postRef.current) observer.observe(postRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [article.id, hasCountedView]);

  const recordView = async (articleId) => {
    try {
      const userId = loggedInUser?.id || loggedInUser?._id || "anonymous";
      const res = await fetch(`${BACKEND_URL}/api/articles/${articleId}/view?userId=${userId}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setHasCountedView(true);
        setArticle(prev => ({
          ...prev,
          _count: { ...prev._count, views: data.viewsCount ?? prev._count.views }
        }));
      }
    } catch (e) { console.error("View tracking error", e); }
  };

  useEffect(() => {
    if (!loggedInUser || !article?.id) return;
    const checkStatus = async () => {
      try {
        const userId = loggedInUser.id || loggedInUser._id;
        const [lRes, sRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/articles/${article.id}/like-status?userId=${userId}`),
          fetch(`${BACKEND_URL}/api/articles/${article.id}/save-status?userId=${userId}`)
        ]);
        if (lRes.ok) setIsLiked((await lRes.json()).liked);
        if (sRes.ok) setIsSaved((await sRes.json()).saved);
      } catch (err) { console.error("Status check failed", err); }
    };
    checkStatus();
  }, [article.id, loggedInUser]);

  const handleInteraction = async (e, endpoint, setter, successMsg) => {
    e.stopPropagation();
    if (!loggedInUser) return showToast("Please login first", "error");
    try {
      const res = await fetch(`${BACKEND_URL}/api/articles/${article.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUser.id || loggedInUser._id }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setter(data.status);
      setArticle(prev => ({
        ...prev,
        _count: { 
          ...prev._count, 
          likes: data.likesCount !== undefined ? data.likesCount : prev._count.likes,
          saves: data.savesCount !== undefined ? data.savesCount : prev._count.saves 
        }
      }));
      showToast(data.status ? successMsg : "Action removed");
    } catch (err) { showToast("Action failed", "error"); }
  };

  const handlePostClick = () => navigate(`/article/${article.id}`);
  
  // NAVIGATION FIX:
  const handleProfileClick = (e) => {
    e.stopPropagation(); // Prevent triggering handlePostClick
    const username = article.author?.username || article.authorUsername || profileUser?.username;
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      showToast("Profile not found", "error");
    }
  };

  const authorName = article.author?.name || article.authorName || profileUser?.name || "User";
  const authorImg = article.author?.image || article.authorImage || profileUser?.image || "";
  const displayImage = article.media?.[0]?.url || "https://via.placeholder.com/400x300";

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div
        ref={postRef}
        onClick={handlePostClick}
        className="article-post-card"
        style={{
          display: "flex",
          width: "100%",
          minHeight: "400px",
          backgroundColor: "#fff",
          borderRadius: "15px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          cursor: "pointer",
          marginBottom: "20px",
          border: "1px solid #eee"
        }}
      >
        <div style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            
            {/* CLICKABLE AUTHOR AREA */}
            <div 
              onClick={handleProfileClick} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                cursor: "pointer" // Visual cue it's clickable
              }}
            >
              <img
                src={authorImg}
                alt=""
                style={{ 
                  width: "45px", 
                  height: "45px", 
                  borderRadius: "50%", 
                  objectFit: "cover", 
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #eee" 
                }}
              />
              <span 
                style={{ 
                  fontSize: "18px", 
                  fontWeight: 500, 
                  color: "#1C274C",
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                {authorName}
              </span>
            </div>

            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#6b7280" }}>{article._count?.views || 0} views</span>
            </div>
          </div>

          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#1C274C", marginBottom: "15px", lineHeight: 1.2 }}>
            {article.title}
          </h2>

          <p style={{
              fontSize: "1.1rem", color: "#4b5563", flex: 1, lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: "6", WebkitBoxOrient: "vertical",
              overflow: "hidden", margin: 0
            }}>
            {article.content}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <img 
                    src={isLiked ? heartClickedIcon : heartIcon} 
                    style={{ width: 22, cursor: "pointer" }} 
                    onClick={(e) => handleInteraction(e, 'like', setIsLiked, "Liked")} 
                />
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{article._count?.likes || 0}</span>
              </div>
              <img src={commentIcon} style={{ width: 22, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); handlePostClick(); }} />
              <img src={shareIcon} style={{ width: 22, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setShowShare(true); }} />
              <img 
                src={isSaved ? saveClickedIcon : saveIcon} 
                style={{ width: 22, cursor: "pointer" }} 
                onClick={(e) => handleInteraction(e, 'save', setIsSaved, "Saved")} 
              />
            </div>
            <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 500 }}>
              {article.createdAt ? new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
            </span>
          </div>
        </div>

        <div style={{ flex: "0 0 35%", backgroundColor: "#f9fafb" }}>
          <img 
            src={displayImage} 
            alt={article.title} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
      </div>

      {showShare && (
        <SharePopup 
          id={article.id} 
          type="article" 
          onClose={() => setShowShare(false)} 
        />
      )}
    </>
  );
};

export default Post;