import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider.jsx";

// Icons
import heartIcon from "../../assets/Heart.png";
import commentIcon from "../../assets/Chat Dots.png";
import shareIcon from "../../assets/Share.png";
import saveIcon from "../../assets/Tag Horizontal.png";
import heartClickedIcon from "../../assets/HeartC.svg";
import saveClickedIcon from "../../assets/TagClicked.svg";

const BACKEND_URL = "https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev";

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [article, setArticle] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const SAVED_KEY = "savedArticles";
  const LIKED_KEY = "likedArticles";

  /* =====================================================
      FETCH FULL ARTICLE DATA
  ===================================================== */
  useEffect(() => {
    async function fetchArticle() {
      try {
        // We pass userId to backend to log the view automatically
        const res = await fetch(`${BACKEND_URL}/api/articles/${id}?userId=${user?.id || ""}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
      }
    }
    fetchArticle();
  }, [id, user]);

  /* =====================================================
      LOAD LIKE/SAVE STATE
  ===================================================== */
  useEffect(() => {
    if (!user || !id) return;
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    const liked = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    setIsSaved(saved.includes(id));
    setIsLiked(liked.includes(id));
  }, [id, user]);

  const toggleLike = (e) => {
    e.stopPropagation();
    if (!user) return alert("Login to like");
    const liked = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    let updated = liked.includes(id) ? liked.filter((i) => i !== id) : [...liked, id];
    setIsLiked(!isLiked);
    localStorage.setItem(LIKED_KEY, JSON.stringify(updated));
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    if (!user) return alert("Login to save");
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    let updated = saved.includes(id) ? saved.filter((i) => i !== id) : [...saved, id];
    setIsSaved(!isSaved);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  };

  if (!article) return <div style={{ padding: "50px", textAlign: "center" }}>Loading article...</div>;

  // Use the first image from the media array if it exists
  const mainImage = article.media?.[0]?.url || article.image;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "1000px",
        margin: "20px auto",
        backgroundColor: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* HEADER SECTION */}
      <div style={{ display: "flex", width: "100%", borderBottom: "1px solid #eee" }}>
        <div style={{ flex: 1, padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate(`/profile/${article.author.id}`)}>
              <img
                src={article.author.image}
                style={{ width: "60px", height: "60px", borderRadius: "50%", marginRight: "15px", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontSize: "20px", fontWeight: "600" }}>{article.author.name}</div>
                <div style={{ color: "#888" }}>@{article.author.username}</div>
              </div>
            </div>
            <span style={{ fontWeight: "600", color: "#666" }}>
              {article._count?.views || 0} Views
            </span>
          </div>

          <h1 style={{ fontSize: "3rem", marginTop: "30px", lineHeight: "1.1", fontWeight: "800" }}>
            {article.title}
          </h1>
        </div>

        {/* TOP RIGHT IMAGE */}
        {mainImage && (
          <div style={{ width: "40%", minHeight: "300px" }}>
            <img src={mainImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* BODY CONTENT */}
      <div style={{ padding: "40px", lineHeight: "1.8", fontSize: "1.2rem", color: "#222" }}>
        <div style={{ whiteSpace: "pre-wrap" }}>{article.content}</div>

        {/* SOURCES BLOCK (New functionality) */}
        {article.sources && article.sources.length > 0 && (
          <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ marginTop: 0 }}>Sources & References</h4>
            {article.sources.map((s) => (
              <a key={s.id} href={s.link} target="_blank" rel="noreferrer" style={{ display: "block", color: "#007bff", marginBottom: "5px", textDecoration: "none" }}>
                • {s.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BAR / FOOTER */}
      <div
        style={{
          padding: "20px 40px",
          borderTop: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div style={{ display: "flex", gap: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={isLiked ? heartClickedIcon : heartIcon} width="24" style={{ cursor: "pointer" }} onClick={toggleLike} />
            <span style={{ fontWeight: "600" }}>{article._count?.likes || 0}</span>
          </div>
          <img src={commentIcon} width="24" style={{ cursor: "pointer" }} />
          <img src={shareIcon} width="24" style={{ cursor: "pointer" }} />
          <img src={isSaved ? saveClickedIcon : saveIcon} width="24" style={{ cursor: "pointer" }} onClick={toggleSave} />
        </div>

        <span style={{ color: "#888" }}>
          Published on {new Date(article.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </span>
      </div>
    </div>
  );
};

export default ArticleDetail;