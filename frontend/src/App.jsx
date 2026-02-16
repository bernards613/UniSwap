import { useState } from "react";
import Login from "./Login.jsx";
import { CreateAccount } from "./CreateAccount.jsx";
import Settings from "./Settings.jsx";
import Listings from "./Listings.jsx";

function App() {
  const [screen, setScreen] = useState("login"); 

  return (
    <>
      {screen === "login" && (
        <Login
          onSwitchToCreateAccount={() => setScreen("create")}
          onLoginSuccess={(data) => {
            console.log("Logged in:", data);
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
        <Listings />
      )}

      {screen === "settings" && (
        <Settings />
      )}
    </>
  );
}

export default App;
