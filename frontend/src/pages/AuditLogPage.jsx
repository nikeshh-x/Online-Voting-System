import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Download, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Mail,
  Activity
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    user: "",
    date_from: "",
    date_to: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 0,
  });
  const [availableActions, setAvailableActions] = useState({});

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page]);

  const checkAdminAccess = () => {
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const adminToken = localStorage.getItem("admin_access_token");
    
    if (!isAdmin || !adminToken) {
      window.location.href = "/admin-login";
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("admin_access_token");
      const params = new URLSearchParams({
        page: pagination.page,
        page_size: pagination.page_size,
        ...(filters.action && { action: filters.action }),
        ...(filters.user && { user: filters.user }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });
      
      const response = await api.get(`/admin/audit-logs/?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.status === "success") {
        setLogs(response.data.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          total_pages: response.data.data.pagination.total_pages,
        }));
        setAvailableActions(response.data.data.filters.actions);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      action: "",
      user: "",
      date_from: "",
      date_to: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = async () => {
    try {
      const adminToken = localStorage.getItem("admin_access_token");
      const params = new URLSearchParams({
        page: 1,
        page_size: 10000,
        ...(filters.action && { action: filters.action }),
        ...(filters.user && { user: filters.user }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });
      
      const response = await api.get(`/admin/audit-logs/?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.status === "success") {
        const data = response.data.data.logs;
        
        const headers = ["Timestamp", "User", "Action", "IP Address", "Details"];
        const csvRows = [headers];
        
        for (const log of data) {
          csvRows.push([
            new Date(log.timestamp).toLocaleString(),
            log.user.email,
            log.action_display,
            log.ip_address,
            JSON.stringify(log.details).slice(0, 200)
          ]);
        }
        
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const getActionColor = (action) => {
    if (action.includes("vote")) return "bg-purple-50 text-purple-700";
    if (action.includes("login") || action.includes("logout")) return "bg-blue-50 text-blue-700";
    if (action.includes("election")) return "bg-green-50 text-green-700";
    if (action.includes("candidate")) return "bg-orange-50 text-orange-700";
    if (action.includes("user") || action.includes("register") || action.includes("verify")) return "bg-teal-50 text-teal-700";
    return "bg-gray-50 text-gray-700";
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-500 mt-1">Track all user activities in the system</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <h3 className="font-medium text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Action</label>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Actions</option>
                {Object.entries(availableActions).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">User Email</label>
              <input
                type="text"
                name="user"
                value={filters.user}
                onChange={handleFilterChange}
                placeholder="Search by email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {(filters.action || filters.user || filters.date_from || filters.date_to) && (
            <button
              onClick={resetFilters}
              className="mt-3 text-sm text-primary-500 hover:text-primary-600"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Loading audit logs...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {log.user.email}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {log.action_display}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-md truncate">
                        {Object.keys(log.details).length > 0 ? JSON.stringify(log.details).slice(0, 80) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AuditLogPage;