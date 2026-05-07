import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Vote,
  BarChart3,
  UserCircle,
  LogIn,
  UserPlus,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation items (remove Home since it's public)
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Elections", path: "/elections", icon: Vote },
    { name: "Results", path: "/results", icon: BarChart3 },
    { name: "Profile", path: "/profile", icon: UserCircle },
  ];

  const authItems = [
    { name: "Login", path: "/login", icon: LogIn },
    { name: "Register", path: "/register", icon: UserPlus },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fxed top-4 left-4 z-50 lg:hidden bg-primary-500 text-white p-2 rounded-lg shadow-lg"
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
        className={`fixed left-0 top-0 min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50
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

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {/* Main Navigation */}
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">
                Main
              </p>
            )}
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"} px-3 py-2.5 rounded-lg transition-all duration-200
                      ${
                        active
                          ? "bg-primary-500 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 mx-3 border-t border-gray-700"></div>

          {/* Auth Section */}
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
                      ${
                        active
                          ? "bg-primary-500 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div
          className={`p-4 border-t border-gray-700 ${isCollapsed ? "text-center" : ""}`}
        >
          {!isCollapsed ? (
            <p className="text-xs text-gray-400">© 2024 VoteSecure</p>
          ) : (
            <ShieldCheck size={16} className="text-gray-400 mx-auto" />
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
