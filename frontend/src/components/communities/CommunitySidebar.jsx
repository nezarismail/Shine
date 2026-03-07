import React, { useContext, useEffect, useState, useRef } from "react";
import { SearchContext } from "/workspaces/Shine/frontend/src/searchContext.jsx";
import { AuthContext } from "../AuthProvider.jsx";
import { useParams, useNavigate } from "react-router-dom";
import magnifier from "../../assets/magnifier.svg";
import closeIcon from "../../assets/close.svg";
import feather from "../../assets/feather.png";
import MenuIcon from "../../assets/Menu.svg";
import axios from "axios";

const BACKEND_URL = "https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev";

const CommunitySidebar = ({ isAdmin, setIsEditing }) => {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const { user, token } = useContext(AuthContext);
  const { communityId } = useParams();
  const navigate = useNavigate();
  
  const postPopupRef = useRef(null);
  const settingsPopupRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const [trends, setTrends] = useState({ viralKeywords: [], trendingHashtags: [] });

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/communities/${communityId}`);
        setCommunity(res.data);
      } catch (err) { console.error("Failed fetch community"); }
    };
    if (communityId) fetchCommunity();
  }, [communityId]);

  useEffect(() => {
    const checkMembership = async () => {
      if (!user || !communityId) return;
      try {
        const res = await axios.get(`${BACKEND_URL}/api/communities/${communityId}/membership/${user.id}`);
        setIsMember(res.data.isMember);
      } catch (err) { console.error("Membership check failed"); }
    };
    checkMembership();
  }, [user, communityId]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/posts/trends`);
        setTrends(res.data);
      } catch (err) { console.error("Failed trends"); } finally { setLoading(false); }
    };
    fetchTrends();
  }, []);

  const handleJoin = async () => {
    if (!user || !token) { navigate("/login"); return; }
    try {
      setJoining(true);
      await axios.post(`${BACKEND_URL}/api/communities/${communityId}/join`, { userId: user.id }, { headers: { Authorization: `Bearer ${token}` } });
      setIsMember(true);
    } catch (err) { console.error(err); } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this community?")) return;
    try {
      await axios.post(`${BACKEND_URL}/api/communities/${communityId}/leave`, { userId: user.id });
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  const handleReport = () => {
    // Logic for reporting the community
    alert("Community reported to moderators.");
    setShowSettingsPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (postPopupRef.current && !postPopupRef.current.contains(e.target)) setShowPostPopup(false);
      if (settingsPopupRef.current && !settingsPopupRef.current.contains(e.target)) setShowSettingsPopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {!isMember ? (
        <button onClick={handleJoin} disabled={joining} style={{ width: "100%", height: "61px", backgroundColor: "#1C274C", color: "#FFC847", borderRadius: "19px", fontWeight: "600", cursor: "pointer", border: "none" }}>
          {joining ? "Joining..." : "Join Community"}
        </button>
      ) : (
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          {/* POST BUTTON */}
          <div style={{ flex: 1, position: "relative" }} ref={postPopupRef}>
            <button onClick={() => setShowPostPopup(!showPostPopup)} style={{ width: "100%", height: "57px", borderRadius: "1.4rem", backgroundColor: "#1c274c", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer" }}>
              <img src={feather} alt="" style={{ width: 18 }} />
              <span style={{ fontSize: "17px", fontWeight: 600, color: "#FFC847" }}>Post</span>
            </button>

            {showPostPopup && (
              <div style={{ position: "absolute", top: "65px", width: "100%", backgroundColor: "#fff", borderRadius: "15px", border: "1px solid #1c274c", padding: "10px 0", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {["Opinion", "Analysis", "Critique", "Poll"].map((label, i) => (
                  <button key={i} onClick={() => navigate(`/${label.toLowerCase()}-create`, { state: { preSelectCommunity: community?.name } })} style={{ background: "none", border: "none", padding: "8px", fontSize: "16px", color: "#1c274c", cursor: "pointer", width: "100%" }}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* SETTINGS MENU BUTTON */}
          <div style={{ position: "relative" }} ref={settingsPopupRef}>
            <button onClick={() => setShowSettingsPopup(!showSettingsPopup)} style={{ width: "57px", height: "57px", borderRadius: "1.4rem", backgroundColor: "#F0F2F5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <img src={MenuIcon} alt="menu" style={{ width: 22 }} />
            </button>

            {showSettingsPopup && (
              <div style={{ position: "absolute", top: "65px", right: 0, width: "180px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #ddd", padding: "5px 0", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {isAdmin ? (
                  <>
                    <div className="side-menu-item" onClick={() => navigate(`/communities/${communityId}/manage`)}>
                        Community Manager
                    </div>
                  </>
                ) : (
                  <>
                    <div className="side-menu-item" onClick={handleReport}>Report</div>
                    <div className="side-menu-item delete" onClick={handleLeave}>Leave Group</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH & TRENDS */}
      <div style={{ width: "100%", borderRadius: "1.4rem", border: "0.5px solid #1C274C", padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", backgroundColor: "#FCFCFC", border: "0.2px solid black", borderRadius: "0.7rem", padding: "0.5rem" }}>
          {!searchQuery && <img src={magnifier} style={{ width: "1.25rem", marginRight: "0.4rem" }} />}
          <input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: "none", outline: "none", background: "transparent" }} />
          {searchQuery && <img src={closeIcon} onClick={() => setSearchQuery("")} style={{ width: "1rem", cursor: "pointer" }} />}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {!loading ? trends.viralKeywords.map((topic, i) => (
            <button key={i} onClick={() => setSearchQuery(searchQuery === topic ? "" : topic)} style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", borderRadius: "0.6rem", border: searchQuery === topic ? "1px solid #1C274C" : "1px solid #ccc", background: searchQuery === topic ? "#ECF2F6" : "transparent", cursor: "pointer" }}>{topic}</button>
          )) : <span>Loading...</span>}
        </div>
      </div>

      <style>{`
        .side-menu-item { padding: 10px 15px; cursor: pointer; font-size: 14px; color: #1c274c; font-weight: 500; }
        .side-menu-item:hover { background: #f5f7f9; }
        .side-menu-item.delete { color: #ff4d4f; border-top: 1px solid #eee; }
      `}</style>
    </div>
  );
};

export default CommunitySidebar;