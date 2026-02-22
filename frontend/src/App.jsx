import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import { CreateAccount } from "./CreateAccount.jsx";
import Settings from "./Settings.jsx";
import Listings from "./Listings.jsx";
import Header from "./Header.jsx";
import MyListings from "./MyListings.jsx";

function App() {
  const [screen, setScreenState] = useState("login");
  const [token, setToken] = useState(null);

  const setScreen = (newScreen) => {
    setScreenState(newScreen);
    localStorage.setItem("screen", newScreen);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedScreen = localStorage.getItem("screen");
    if (savedToken) {
      setToken(savedToken);
      if (savedScreen) {
        setScreenState(savedScreen);
      } else {
        setScreenState("listings");
      }
    }
  }, []);

  return (
    <>
      <Header currentScreen={screen} onNavigate={setScreen} />
      {screen === "login" && (
        <Login
          onSwitchToCreateAccount={() => setScreen("create")}
          onLoginSuccess={(data) => {
            console.log("Logged in:", data);
            const token = data.access_token;
            // FIX: user info is nested under data.user
            const userId = data.user?.userid ?? data.user_id ?? data.id ?? data.userId;
            setToken(token);
            localStorage.setItem("token", token);
            if (userId) localStorage.setItem("userId", String(userId));
            setScreen("listings");
          }}
        />
      )}
      {screen === "create" && (
        <CreateAccount
          onSwitchToLogin={() => setScreen("login")}
          onAccountCreated={(data) => {
            console.log("Account created:", data);
            setScreen("login");
          }}
        />
      )}
      {screen === "listings" && <Listings token={token} />}
      {screen === "mylistings" && <MyListings />}
      {screen === "settings" && <Settings />}
    </>
  );
}

export default App;
