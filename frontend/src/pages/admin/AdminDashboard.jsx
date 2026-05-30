import React, { useState, useEffect } from "react";
import { Users, Vote, Calendar, UserCheck, UserX, Activity } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const adminToken = localStorage.getItem("admin_access_token");

    if (!isAdmin || !adminToken) {
      window.location.href = "/admin-login";
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("admin_access_token");
      
      // Use admin token for authorization
      const response = await api.get("/admin/stats/", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.status === "success") {
        setStats(response.data.data);
      } else {
        setError(response.data.message || "Failed to load stats");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Token expired or invalid, redirect to admin login
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("is_admin");
        window.location.href = "/admin-login";
      } else {
        setError("Could not load admin dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-primary-500 text-xl">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Citizens",
      value: stats?.citizens?.total || 0,
      icon: Users,
      color: "bg-blue-500",
      detail: `${stats?.citizens?.registered || 0} registered`
    },
    {
      title: "Total Users",
      value: stats?.users?.total || 0,
      icon: UserCheck,
      color: "bg-green-500",
      detail: `${stats?.users?.verified || 0} verified`
    },
    {
      title: "Total Elections",
      value: stats?.elections?.total || 0,
      icon: Calendar,
      color: "bg-purple-500",
      detail: `${stats?.elections?.active || 0} active`
    },
    {
      title: "Total Votes",
      value: stats?.votes?.total || 0,
      icon: Vote,
      color: "bg-orange-500",
      detail: `${stats?.votes?.turnout_percentage || 0}% turnout`
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System overview and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.detail}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Citizens Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Citizens</span>
                <span className="font-semibold">{stats?.citizens?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registered Citizens</span>
                <span className="text-green-600 font-semibold">{stats?.citizens?.registered || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unregistered Citizens</span>
                <span className="text-red-600 font-semibold">{stats?.citizens?.unregistered || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold">{stats?.users?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verified Users</span>
                <span className="text-green-600 font-semibold">{stats?.users?.verified || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unverified Users</span>
                <span className="text-red-600 font-semibold">{stats?.users?.unverified || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Elections Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Elections Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.elections?.active || 0}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats?.elections?.upcoming || 0}</p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{stats?.elections?.closed || 0}</p>
              <p className="text-sm text-gray-600">Closed</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;


