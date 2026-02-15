import { useState } from "react";
import Login from "./Login.jsx";
import { CreateAccount } from "./CreateAccount.jsx";

function App() {
  const [screen, setScreen] = useState("login"); // "login" or "create"

  return (
    <>
      {screen === "login" && (
        <Login
          onSwitchToCreateAccount={() => setScreen("create")}
          onLoginSuccess={(data) => console.log("Logged in:", data)}
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
    </>
  );
}

export default App;
