import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Vote,
  BarChart3,
  UserCircle,
  LogIn,
  UserPlus,
  Menu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { logoutUser } from "../services/api";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Check if admin is logged in
  const isAdminLoggedIn = localStorage.getItem("is_admin") === "true";
  const adminToken = localStorage.getItem("admin_access_token");
  const isAdminUser = isAdminLoggedIn && !!adminToken;

  // Check if regular user is logged in
  const token = localStorage.getItem("access_token");
  const isAuthenticated = !!token;

  // Get user from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Base navigation items for authenticated users
  const baseNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Elections", path: "/elections", icon: Vote },
    { name: "Results", path: "/results", icon: BarChart3 },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ];

  // Add Admin item if user is admin
  const navItems = [...baseNavItems];
  if (isAdminUser) {
    navItems.push({
      name: "Admin Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    });
  }

  // Auth items for non-authenticated users
  const authItems = [
    { name: "Login", path: "/login", icon: LogIn },
    { name: "Register", path: "/register", icon: UserPlus },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    // Clear ALL auth-related items from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("is_admin");

    // Also clear any other potential items
    localStorage.removeItem("verification_token");
    localStorage.removeItem("verified_citizen");

    // Optional: Call logout API if needed
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    navigate("/login");
  };

  const initials =
    user?.full_name?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "U";

  // Determine what to show in user info section
  const showUserInfo = isAuthenticated && user;
  const displayName = isAdminUser
    ? user?.username || user?.email || "Admin"
    : user?.full_name || user?.email || "User";
  const userRole = isAdminUser ? "Administrator" : "Verified Voter";

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary-500 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50
          ${isCollapsed ? "w-20" : "w-64"}
          lg:relative lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo Section */}
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-5 border-b border-gray-700`}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-8 w-8 text-primary-400" />
              <span className="text-lg font-bold">VoteSecure</span>
            </div>
          )}
          {isCollapsed && <ShieldCheck className="h-8 w-8 text-primary-400" />}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1 rounded-lg hover:bg-gray-700 transition"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* User Info Section (only when logged in) */}
        {showUserInfo && (
          <div
            className={`p-4 border-b border-gray-700 ${isCollapsed ? "text-center" : ""}`}
          >
            <div
              className={`flex items-center ${isCollapsed ? "flex-col" : "space-x-3"}`}
            >
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{userRole}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">
                {isAuthenticated ? "Menu" : "Main"}
              </p>
            )}
            <div className="space-y-1">
              {/* Show nav items only for authenticated users */}
              {isAuthenticated &&
                navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-3 py-2.5 rounded-lg transition-all duration-200
                      ${active ? "bg-primary-500 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                      title={isCollapsed ? item.name : ""}
                    >
                      <Icon size={20} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Show auth items only for non-authenticated users */}
          {!isAuthenticated && (
            <>
              <div className="my-6 mx-3 border-t border-gray-700"></div>
              <div className="px-3">
                {!isCollapsed && (
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">
                    Account
                  </p>
                )}
                <div className="space-y-1">
                  {authItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-3 py-2.5 rounded-lg transition-all duration-200
                          ${active ? "bg-primary-500 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                        title={isCollapsed ? item.name : ""}
                      >
                        <Icon size={20} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Logout Button (only when logged in) */}
        {isAuthenticated && (
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} w-full px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-all duration-200`}
              title={isCollapsed ? "Logout" : ""}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}

        {/* Footer (only for non-authenticated users) */}
        {!isAuthenticated && (
          <div
            className={`p-4 border-t border-gray-700 ${isCollapsed ? "text-center" : ""}`}
          >
            {!isCollapsed ? (
              <p className="text-xs text-gray-400">© 2024 VoteSecure</p>
            ) : (
              <ShieldCheck size={16} className="text-gray-400 mx-auto" />
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
