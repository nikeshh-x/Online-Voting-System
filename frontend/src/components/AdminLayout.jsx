import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Vote, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Activity
} from 'lucide-react';

function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const adminToken = localStorage.getItem('admin_access_token');
    const adminUserStr = localStorage.getItem('admin_user');
    
    if (!isAdmin || !adminToken) {
      navigate('/admin-login');
      return;
    }
    
    if (adminUserStr) {
      setAdminUser(JSON.parse(adminUserStr));
    }
  }, [navigate]);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Elections', path: '/admin/elections', icon: Vote },
    { name: 'Candidates', path: '/admin/candidates', icon: Users },
    { name: 'Citizens', path: '/admin/citizens', icon: UserCog },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity },
  ];

  const isActive = (path) => location.pathname === path;

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("is_admin");
  navigate("/admin-login");
};

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary-500 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:relative lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-gray-700`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-8 w-8 text-primary-400" />
              <span className="text-lg font-bold">Admin Panel</span>
            </div>
          )}
          {isCollapsed && <ShieldCheck className="h-8 w-8 text-primary-400" />}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1 rounded-lg hover:bg-gray-700 transition"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Admin User Info */}
        {adminUser && (
          <div className={`p-4 border-b border-gray-700 ${isCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {adminUser.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-white">{adminUser.username}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</p>
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
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all duration-200
                      ${active ? 'bg-primary-500 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-all duration-200`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;