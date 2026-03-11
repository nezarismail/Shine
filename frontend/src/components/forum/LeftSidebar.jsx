import React, { useContext, useEffect, useState } from "react";
import { SearchContext } from "/workspaces/Shine/frontend/src/searchContext.jsx";
import magnifier from "../../assets/magnifier.svg";
import closeIcon from "../../assets/close.svg";
import axios from "axios"; 

const LeftSidebar = () => {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [trends, setTrends] = useState({ viralKeywords: [], trendingHashtags: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get("https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev/api/posts/trends");
        setTrends(res.data);
      } catch (err) {
        console.error("Failed to fetch weekly trends", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const handleTopicClick = (topic) => {
    setSearchQuery(searchQuery === topic ? "" : topic);
  };

  return (
    <div className="forum-left-sidebar" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {/* Group 1: Search & Viral Keywords */}
      <div className="forum-search-card" style={{ 
        width: "100%", minHeight: "200px", borderRadius: "1.4rem", 
        border: "0.5px solid #1C274C", padding: "1.25rem", 
        backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", boxSizing: "border-box"
      }}>
        <div style={{ 
          display: "flex", alignItems: "center", backgroundColor: "#FCFCFC", 
          border: "0.2px solid black", borderRadius: "0.7rem", padding: "0.5rem 0.625rem", marginBottom: "1.1rem" 
        }}>
          {!searchQuery && <img src={magnifier} alt="search" style={{ width: "1.25rem", marginRight: "0.4rem" }} />}
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, border: "none", outline: "none", backgroundColor: "transparent", 
              fontSize: "0.9rem", color: "#1C274C", fontWeight: "300"
            }}
          />
          {searchQuery && (
            <img src={closeIcon} alt="clear" onClick={() => setSearchQuery("")} 
                 style={{ width: "1rem", cursor: "pointer", marginLeft: "0.4rem" }} />
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignContent: "flex-start" }}>
          {!loading ? (
            trends.viralKeywords.map((topic, index) => {
              const isSelected = searchQuery === topic;
              return (
                <button
                  key={index}
                  onClick={() => handleTopicClick(topic)}
                  style={{ 
                    fontSize: "0.85rem", padding: "0.3rem 0.6rem", borderRadius: "0.6rem", 
                    border: isSelected ? "1px solid #1C274C" : "0.1px solid #CCC", 
                    backgroundColor: isSelected ? "#ECF2F6" : "transparent",
                    color: "#1C274C", fontWeight: isSelected ? "600" : "300",
                    cursor: "pointer", transition: "all 0.2s ease"
                  }}
                >
                  {topic}
                </button>
              );
            })
          ) : (
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Loading viral topics...</span>
          )}
        </div>
      </div>

      {/* Group 2: Trending Hashtags */}
      <div className="forum-trending-card" style={{ 
        width: "100%", borderRadius: "1.4rem", border: "0.5px solid #1C274C", 
        padding: "1.25rem", backgroundColor: "#FFFFFF", boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.15rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1C274C" }}>Trending</span>
          <span style={{ fontSize: "1rem", fontWeight: "300", color: "#FFC847", cursor: "pointer" }}>View all</span>
        </div>
        <div style={{ height: "0.5px", backgroundColor: "#1C274C", marginBottom: "1.15rem", marginLeft: "-1.25rem", marginRight: "-1.25rem" }}></div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {!loading ? (
            trends.trendingHashtags.map((tag, index) => (
              <div 
                key={index} 
                onClick={() => setSearchQuery(`#${tag.name}`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <span>
                  <span style={{ fontWeight: "500", color: "#FFC847" }}>#{index + 1}. </span>
                  <span style={{ color: "#1C274C", fontWeight: "400" }}>#{tag.name}</span>
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "#1C274C" }}>{tag.views}</span>
              </div>
            ))
          ) : <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Loading trends...</span>}
        </div>
      </div>

      {/* Group 3: Messages */}
      <div className="forum-messages-card" style={{ 
        width: "100%", borderRadius: "1.4rem", border: "0.5px solid #1C274C", 
        padding: "1.25rem", backgroundColor: "#FFFFFF", boxSizing: "border-box", marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.15rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: "500", color: "#1C274C" }}>Messages</span>
        </div>
        <div style={{ height: "0.5px", backgroundColor: "#1C274C", marginBottom: "1.15rem", marginLeft: "-1.25rem", marginRight: "-1.25rem" }}></div>
        <div style={{ textAlign: "center", color: "#1C274C", padding: "50px 0", fontWeight: "300", fontSize: "1rem" }}>
          There are no new messages
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;