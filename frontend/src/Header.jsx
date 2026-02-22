export default function Header({ currentScreen, onNavigate }) {
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

            <button className="nav-btn" onClick={() => onNavigate("settings")}>
              Settings
            </button>

            <button className="nav-btn" onClick={() => onNavigate("login")}>
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}