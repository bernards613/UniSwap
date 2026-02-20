import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import { CreateAccount } from "./CreateAccount.jsx";
import Settings from "./Settings.jsx";
import Listings from "./Listings.jsx";
import Header from "./Header.jsx";

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
            setToken(data.access_token);
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

      {screen === "listings" && (
        <Listings token={token} />
      )}

      {screen === "settings" && (
        <Settings />
      )}
    </>
  );
}

export default App;
