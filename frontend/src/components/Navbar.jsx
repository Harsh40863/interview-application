// Navbar — top navigation bar with brand, links, and logout button.
import { useNavigate, Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <nav id="main-navbar" className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Brand */}
      <Link id="navbar-home-link" to="/" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors flex-shrink-0">
        🎯 AI Mock Interviewer
      </Link>

      {/* Nav links + Logout */}
      <div className="flex items-center gap-4">
        {token && (
          <>
            <NavLink id="navbar-history-link" to="/history" className={navLinkClass}>
              History
            </NavLink>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
