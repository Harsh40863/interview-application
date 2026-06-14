// Root component — defines React Router v6 routes for all application pages.
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Register from "./pages/Register";
import History from "./pages/History";
import Navbar from "./components/Navbar";

/** Layout with Navbar shown on all protected pages. */
function ProtectedLayout({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — Navbar is included via ProtectedLayout */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Home />
          </ProtectedLayout>
        }
      />
      <Route
        path="/interview"
        element={
          <ProtectedLayout>
            <Interview />
          </ProtectedLayout>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedLayout>
            <Results />
          </ProtectedLayout>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedLayout>
            <History />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default App;
