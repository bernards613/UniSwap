import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import { CreateAccount } from "./CreateAccount.jsx";
import Settings from "./Settings.jsx";
import Listings from "./Listings.jsx";
import Header from "./Header.jsx";
import MyListings from "./MyListings.jsx";
import BookmarkedListings from "./BookmarkedListings.jsx";
import PurchaseHistory from "./PurchaseHistory.jsx";
import Messages from "./Messages.jsx";
import Conversation from "./Conversation.jsx";
import Profile from "./Profile.jsx";

function App() {
  const [screen, setScreenState] = useState("login");
  const [token, setToken] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [newChatData, setNewChatData] = useState(null);
  const [userData, setUserData] = useState({ username: null, profilePicture: null });

  const setScreen = (newScreen) => {
    setScreenState(newScreen);
    localStorage.setItem("screen", newScreen);
  };

  const handleOpenConversation = (convId) => {
    setConversationId(convId);
    setNewChatData(null);
    setScreen("conversation");
  };

  const handleMessageSeller = (sellerId, itemId, itemDescription, itemPrice) => {
    setNewChatData({
      sellerId,
      itemId,
      itemDescription,
      itemPrice,
    });
    setConversationId(null);
    setScreen("conversation");
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userFirstname");
    localStorage.removeItem("userLastname");
    localStorage.removeItem("username");
    localStorage.removeItem("profilePicture");
    localStorage.removeItem("screen");
    setToken(null);
    setUserData({ username: null, profilePicture: null });
    setScreenState("login");
  };

  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem("token");
      
      if (!savedToken) {
        setScreenState("login");
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setToken(savedToken);
          localStorage.setItem("userId", String(user.userid));
          localStorage.setItem("userFirstname", user.firstname || "");
          localStorage.setItem("userLastname", user.lastname || "");
          localStorage.setItem("username", user.username || "");
          if (user.profilepictureurl) {
            localStorage.setItem("profilePicture", user.profilepictureurl);
          }
          setUserData({
            username: user.username || null,
            profilePicture: user.profilepictureurl || null,
          });
          
          const savedScreen = localStorage.getItem("screen");
          if (savedScreen && savedScreen !== "login" && savedScreen !== "create") {
            setScreenState(savedScreen);
          } else {
            setScreenState("listings");
          }
        } else {
          console.log("Token invalid, clearing session");
          clearSession();
        }
      } catch (err) {
        console.error("Error validating token:", err);
        clearSession();
      }
    };

    validateToken();
  }, []);

  return (
    <>
      <Header currentScreen={screen} onNavigate={setScreen} userData={userData} />
      {screen === "login" && (
        <Login
          onSwitchToCreateAccount={() => setScreen("create")}
          onLoginSuccess={(data) => {
            console.log("Logged in:", data);
            const token = data.access_token;
            const user = data.user || {};
            const userId = user.userid ?? data.user_id ?? data.id ?? data.userId;
            setToken(token);
            localStorage.setItem("token", token);
            if (userId) localStorage.setItem("userId", String(userId));
            if (user.firstname) localStorage.setItem("userFirstname", user.firstname);
            if (user.lastname) localStorage.setItem("userLastname", user.lastname);
            if (user.username) localStorage.setItem("username", user.username);
            if (user.profilepictureurl) localStorage.setItem("profilePicture", user.profilepictureurl);
            setUserData({
              username: user.username || null,
              profilePicture: user.profilepictureurl || null,
            });
            setScreen("listings");
          }}
        />
      )}
      {screen === "create" && (
        <CreateAccount
          onSwitchToLogin={() => setScreen("login")}
          onAccountCreated={(data) => {
            console.log("Account created:", data);
            if (data.autoLogin && data.access_token) {
              const token = data.access_token;
              const user = data.user || {};
              const userId = user.userid ?? data.userid ?? data.user_id;
              setToken(token);
              localStorage.setItem("token", token);
              if (userId) localStorage.setItem("userId", String(userId));
              if (user.firstname || data.firstname) localStorage.setItem("userFirstname", user.firstname || data.firstname);
              if (user.lastname || data.lastname) localStorage.setItem("userLastname", user.lastname || data.lastname);
              if (user.username || data.username) localStorage.setItem("username", user.username || data.username);
              setScreen("listings");
            } else {
              setScreen("login");
            }
          }}
        />
      )}
      {screen === "listings" && <Listings token={token} onMessageSeller={handleMessageSeller} />}
      {screen === "mylistings" && <MyListings />}
      {screen === "settings" && <Settings />}
      {screen === "bookmarks" && <BookmarkedListings token={token} />}
      {screen === "purchases" && <PurchaseHistory token={token} />}
      {screen === "messages" && (
        <Messages token={token} onOpenConversation={handleOpenConversation} />
      )}
      {screen === "conversation" && (
        <Conversation
          token={token}
          conversationId={conversationId}
          newChatData={newChatData}
          onBack={() => {
            setNewChatData(null);
            setScreen("messages");
          }}
          onConversationCreated={(convId) => {
            setConversationId(convId);
            setNewChatData(null);
          }}
        />
      )}
      {screen === "profile" && (
        <Profile
          token={token}
          onProfilePictureUpdate={(newPicture) => {
            setUserData((prev) => ({ ...prev, profilePicture: newPicture }));
          }}
        />
      )}
    </>
  );
}

export default App;
