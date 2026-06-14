// Navbar — top navigation bar with brand, nav links, user name, and logout.
import { useNavigate, Link, NavLink } from "react-router-dom";

/** Decode the name stored in the JWT payload (no signature verification needed client-side). */
function getUserName() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.name || payload.email?.split("@")[0] || null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = token ? getUserName() : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors px-1 pb-0.5 border-b-2 ${
      isActive
        ? "text-blue-600 border-blue-600"
        : "text-gray-500 border-transparent hover:text-gray-900"
    }`;

  return (
    <nav id="main-navbar" className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 shadow-sm">
      {/* Brand */}
      <Link
        id="navbar-home-link"
        to="/"
        className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors flex-shrink-0"
      >
        🎯 AI Mock Interviewer
      </Link>

      {/* Center nav links */}
      {token && (
        <div className="flex items-center gap-6">
          <NavLink id="navbar-dashboard-link" to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink id="navbar-history-link" to="/history" className={linkClass}>
            History
          </NavLink>
        </div>
      )}

      {/* Right side — user info + logout */}
      <div className="flex items-center gap-3">
        {token && userName && (
          <span className="text-sm text-gray-500 hidden sm:block">
            👋 <span className="font-medium text-gray-700">{userName}</span>
          </span>
        )}
        {token && (
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
