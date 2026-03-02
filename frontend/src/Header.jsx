import { useState, useEffect, useRef } from "react";

export default function Header({ currentScreen, onNavigate, userData }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInitial, setUserInitial] = useState("?");
  const [profilePicture, setProfilePicture] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userData?.username) {
      setUserInitial(userData.username.charAt(0).toUpperCase());
    } else {
      const username = localStorage.getItem("username");
      setUserInitial(username ? username.charAt(0).toUpperCase() : "?");
    }
    
    if (userData?.profilePicture) {
      setProfilePicture(userData.profilePicture);
    } else {
      const profilePic = localStorage.getItem("profilePicture");
      setProfilePicture(profilePic || null);
    }
  }, [currentScreen, userData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userFirstname");
    localStorage.removeItem("userLastname");
    localStorage.removeItem("username");
    localStorage.removeItem("profilePicture");
    setShowDropdown(false);
    onNavigate("login");
  };

  return (
    <header className="header">
      <img
        src="/UniswapLogoBackgroundless.png"
        alt="UniSwap Logo"
        className="header-logo-img"
        onClick={() => {
          if (currentScreen !== "login" && currentScreen !== "create") {
            onNavigate("listings");
          }
        }}
        style={{
          cursor:
            currentScreen !== "login" && currentScreen !== "create"
              ? "pointer"
              : "default",
        }}
      />

      <nav className="navbar">
        {currentScreen !== "login" && currentScreen !== "create" && (
          <>
            <button className="nav-btn" onClick={() => onNavigate("listings")}>
              Listings
            </button>

            <button className="nav-btn" onClick={() => onNavigate("mylistings")}>
              My Listings
            </button>

            <button className="nav-btn" onClick={() => onNavigate("bookmarks")}>
              Bookmarked Listings
            </button>

            <button className="nav-btn" onClick={() => onNavigate("purchases")}>
              Purchase History
            </button>

            <button className="nav-btn" onClick={() => onNavigate("messages")}>
              Messages
            </button>

            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className={`profile-circle ${profilePicture ? "has-image" : ""}`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="profile-circle-img" />
                ) : (
                  userInitial
                )}
              </button>

              {showDropdown && (
                <div className="profile-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowDropdown(false);
                      onNavigate("profile");
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowDropdown(false);
                      onNavigate("settings");
                    }}
                  >
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <style>{`
        .profile-dropdown-container {
          position: relative;
        }

        .profile-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0c040 0%, #e0b030 100%);
          border: 2px solid #e0b030;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, box-shadow 0.15s;
          overflow: hidden;
          padding: 0;
        }

        .profile-circle.has-image {
          background: transparent;
          border: 2px solid #f0c040;
        }

        .profile-circle:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(240, 192, 64, 0.4);
        }

        .profile-circle-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          overflow: hidden;
          z-index: 1000;
          animation: dropdownFadeIn 0.15s ease;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          text-align: left;
          font-size: 0.9rem;
          color: #333;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: #f5f5f5;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: #fef2f2;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 0.25rem 0;
        }

        html.dark-mode .profile-dropdown {
          background: #1e1e1e;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        html.dark-mode .dropdown-item {
          color: #fff;
        }

        html.dark-mode .dropdown-item:hover {
          background: #2a2a2a;
        }

        html.dark-mode .dropdown-item.logout:hover {
          background: #3a2020;
        }

        html.dark-mode .dropdown-divider {
          background: #333;
        }
      `}</style>
    </header>
  );
}