import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Header.jsx";
import { AuthContext } from "../AuthProvider.jsx";

// Icons
import heartIcon from "../../assets/Heart.png";
import commentIcon from "../../assets/Chat Dots.png";
import shareIcon from "../../assets/Share.png";
import saveIcon from "../../assets/Tag Horizontal.png";
import heartClickedIcon from "../../assets/HeartC.svg";
import saveClickedIcon from "../../assets/TagClicked.svg";

const BACKEND_URL = "https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev";

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Fetch article with user ID to log a "View" on the backend
    const url = user 
      ? `${BACKEND_URL}/api/articles/${id}?userId=${user.id}` 
      : `${BACKEND_URL}/api/articles/${id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data);
        setLoading(false);
        
        // Check local storage for like/save status
        const liked = JSON.parse(localStorage.getItem("likedPosts")) || [];
        const saved = JSON.parse(localStorage.getItem("savedPosts")) || [];
        setIsLiked(liked.includes(id));
        setIsSaved(saved.includes(id));
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, user]);

  if (loading) return <p style={{ padding: 40, textAlign: "center" }}>Loading article...</p>;
  if (!article) return <p style={{ padding: 40, textAlign: "center" }}>Article not found</p>;

  const author = article.author || { name: "Unknown User", image: "https://via.placeholder.com/49" };
  const displayImage = article.media?.[0]?.url || article.image;

  return (
    <>
      <Header />
      <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "15px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            minHeight: "70vh",
          }}
        >
          {/* ================= LEFT CONTENT (SCROLLABLE) ================= */}
          <div style={{ flex: 1, padding: "50px", display: "flex", flexDirection: "column" }}>
            
            {/* Header: Profile & Views */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
              <div 
                onClick={() => navigate(`/profile/${author.id}`)} 
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              >
                <img
                  src={author.image}
                  alt={author.name}
                  style={{ width: "60px", height: "60px", borderRadius: "50%", marginRight: "15px", objectFit: "cover" }}
                />
                <span style={{ fontSize: "22px", fontWeight: "500" }}>{author.name}</span>
              </div>
              <span style={{ fontSize: "18px", fontWeight: 600, color: "#888" }}>
                {article._count?.views || 0} views
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: "3.5rem", fontWeight: 800, marginBottom: "25px", lineHeight: "1.1" }}>
              {article.title}
            </h1>

            {/* Full Content */}
            <div
              style={{
                fontSize: "1.25rem",
                lineHeight: "1.8",
                color: "#222",
                whiteSpace: "pre-wrap", // Maintains paragraphs
                marginBottom: "40px",
              }}
            >
              {article.content}
            </div>

            {/* Sources Section */}
            {article.sources?.length > 0 && (
              <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "10px" }}>
                <h4 style={{ marginBottom: "10px" }}>Sources:</h4>
                {article.sources.map((s, i) => (
                  <a key={i} href={s.link} target="_blank" rel="noreferrer" style={{ display: "block", color: "#007bff", textDecoration: "none", marginBottom: "5px" }}>
                    • {s.name}
                  </a>
                ))}
              </div>
            )}

            {/* Footer: Interactions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
                <img src={isLiked ? heartClickedIcon : heartIcon} width="25" style={{ cursor: "pointer" }} alt="Like" />
                <img src={commentIcon} width="25" style={{ cursor: "pointer" }} alt="Comment" />
                <img src={shareIcon} width="25" style={{ cursor: "pointer" }} alt="Share" />
                <img src={isSaved ? saveClickedIcon : saveIcon} width="25" style={{ cursor: "pointer" }} alt="Save" />
              </div>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#999" }}>
                Published {new Date(article.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* ================= RIGHT IMAGE ================= */}
          {displayImage && (
            <div style={{ flex: "0 0 40%", position: "relative" }}>
              <img
                src={displayImage}
                alt={article.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}