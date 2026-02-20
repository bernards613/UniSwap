export default function Header({ currentScreen, onNavigate }) {
  return (
    <header className="header">
      <h1 className="logo">UniSwap</h1>

      <nav className="navbar">
        {currentScreen !== "login" && currentScreen !== "create" && (
          <>
            <button className="nav-btn" onClick={() => onNavigate("listings")}>Listings</button>
            <button className="nav-btn" onClick={() => onNavigate("settings")}>Settings</button>
            <button className="nav-btn" onClick={() => onNavigate("login")}>Logout</button>
          </>
        )}
      </nav>
    </header>
  );
}