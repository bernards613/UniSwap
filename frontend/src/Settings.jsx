import { useEffect, useState } from 'react'
import './index.css'
export default function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);
  return (
    <div className="settings">
      <h1>Settings</h1>
      <button className="create-listing-button" onClick={() => setIsDarkMode(prev => !prev)}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
}
