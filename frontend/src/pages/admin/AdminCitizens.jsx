import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  X,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Upload,
  CheckSquare,
  Square,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";

function AdminCitizens() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [selectedCitizens, setSelectedCitizens] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchStats();
    fetchDistricts();
    fetchCitizens();
  }, [currentPage, selectedDistrict, selectedGender, selectedStatus]);

  // Handle search separately to avoid too many requests
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1);
        fetchCitizens();
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      const response = await api.get("/admin/stats/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === "success") {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      const response = await api.get("/citizens/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page_size: 1000, no_pagination: true }, // Add flag for no pagination
      });

      let citizensData = [];
      if (response.data.status === "success") {
        citizensData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        citizensData = response.data;
      } else if (response.data.results) {
        citizensData = response.data.results;
      }

      const uniqueDistricts = [
        ...new Set(citizensData.map((c) => c.district).filter(Boolean)),
      ];
      setDistricts(uniqueDistricts.sort());
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_access_token");

      // Build params correctly for backend
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedGender) params.gender = selectedGender;
      if (selectedStatus === "registered") params.is_registered = "true";
      if (selectedStatus === "unregistered") params.is_registered = "false";

      const response = await api.get("/citizens/", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      let citizensData = [];
      let pagination = {};

      if (response.data.status === "success") {
        citizensData = response.data.data || [];
        pagination = response.data.pagination || {};
      } else if (Array.isArray(response.data)) {
        citizensData = response.data;
      } else if (response.data.results) {
        citizensData = response.data.results;
        pagination = {
          total: response.data.count,
          total_pages: Math.ceil(response.data.count / itemsPerPage),
        };
      }

      setCitizens(citizensData);
      setTotalCount(pagination.total || citizensData.length);
      setTotalPages(
        pagination.total_pages || Math.ceil(citizensData.length / itemsPerPage),
      );

      // Clear selections when data changes
      setSelectedCitizens([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error fetching citizens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCitizens([]);
    } else {
      setSelectedCitizens(citizens.map((c) => c.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectCitizen = (id) => {
    if (selectedCitizens.includes(id)) {
      setSelectedCitizens(selectedCitizens.filter((cid) => cid !== id));
      setSelectAll(false);
    } else {
      setSelectedCitizens([...selectedCitizens, id]);
      if (selectedCitizens.length + 1 === citizens.length) {
        setSelectAll(true);
      }
    }
  };

  const exportToCSV = async (exportType = "all") => {
    try {
      const token = localStorage.getItem("admin_access_token");

      let params = {};

      if (exportType === "selected" && selectedCitizens.length > 0) {
        params.ids = selectedCitizens.join(",");
      } else {
        // Use current filters for all export
        if (searchTerm) params.search = searchTerm;
        if (selectedDistrict) params.district = selectedDistrict;
        if (selectedGender) params.gender = selectedGender;
        if (selectedStatus === "registered") params.is_registered = "true";
        if (selectedStatus === "unregistered") params.is_registered = "false";
      }

      params.export = "csv";
      params.page_size = 10000; // Get all records for export

      const response = await api.get("/citizens/", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const exportLabel = exportType === "selected" ? "selected" : "all";
      link.href = url;
      link.setAttribute(
        "download",
        `citizens_${exportLabel}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert("Please select a CSV file");
      return;
    }

    // Validate CSV format before uploading
    const file = importFile;
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target.result;
      const lines = content.split("\n");
      const headers = lines[0].toLowerCase().split(",");

      const requiredColumns = [
        "citizenship_number",
        "full_name",
        "date_of_birth",
        "district",
        "municipality",
        "ward_number",
        "gender",
      ];
      const missingColumns = requiredColumns.filter(
        (col) => !headers.includes(col),
      );

      if (missingColumns.length > 0) {
        alert(
          `Missing required columns: ${missingColumns.join(", ")}\n\nPlease ensure your CSV has: ${requiredColumns.join(", ")}`,
        );
        return;
      }

      setImporting(true);
      setImportResult(null);

      try {
        const token = localStorage.getItem("admin_access_token");
        const formData = new FormData();
        formData.append("file", importFile);

        const response = await api.post("/citizens/import/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.status === "success") {
          setImportResult(response.data.data);
          fetchCitizens();
          fetchStats();

          setTimeout(() => {
            setShowImportModal(false);
            setImportFile(null);
            setImportResult(null);
          }, 3000);
        } else {
          alert(response.data.message || "Import failed");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert(error.response?.data?.message || "Failed to import citizens");
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("admin_access_token");
      await api.delete(`/citizens/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCitizens();
      fetchStats();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting citizen:", error);
      alert("Failed to delete citizen");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCitizens.length === 0) {
      alert("No citizens selected");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedCitizens.length} citizens? This action cannot be undone.`,
      )
    ) {
      try {
        const token = localStorage.getItem("admin_access_token");
        await api.post(
          "/citizens/bulk-delete/",
          { ids: selectedCitizens },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        fetchCitizens();
        fetchStats();
        setSelectedCitizens([]);
        setSelectAll(false);
      } catch (error) {
        console.error("Error bulk deleting:", error);
        alert("Failed to delete citizens");
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("");
    setSelectedGender("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Citizens Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage all registered citizens in the system
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              <Upload size={18} />
              Import CSV
            </button>
            {selectedCitizens.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <Trash2 size={18} />
                Delete Selected ({selectedCitizens.length})
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Citizens</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.citizens?.total || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Registered</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.citizens?.registered || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Unregistered</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {stats.citizens?.unregistered || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <UserX className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-400" />
            <h3 className="font-medium text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Name or Citizenship No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">All</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">All</option>
                <option value="registered">Registered</option>
                <option value="unregistered">Unregistered</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => fetchCitizens()}
                className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV("all")}
              className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              <Download size={14} />
              Export All (Filtered)
            </button>
            {selectedCitizens.length > 0 && (
              <button
                onClick={() => exportToCSV("selected")}
                className="flex items-center gap-2 bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 transition text-sm"
              >
                <Download size={14} />
                Export Selected ({selectedCitizens.length})
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {totalCount} total citizens found
          </div>
        </div>

        {/* Citizens Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-1"
                    >
                      {selectAll ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.N.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Citizenship No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Loading citizens...
                    </td>
                  </tr>
                ) : citizens.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No citizens found
                    </td>
                  </tr>
                ) : (
                  citizens.map((citizen, index) => (
                    <tr
                      key={citizen.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <button onClick={() => handleSelectCitizen(citizen.id)}>
                          {selectedCitizens.includes(citizen.id) ? (
                            <CheckSquare
                              size={16}
                              className="text-primary-500"
                            />
                          ) : (
                            <Square size={16} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {citizen.citizenship_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {citizen.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {calculateAge(citizen.date_of_birth)} yrs /{" "}
                        {citizen.gender === "M"
                          ? "Male"
                          : citizen.gender === "F"
                            ? "Female"
                            : "Other"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citizen.district}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citizen.municipality}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citizen.ward_number}
                      </td>
                      <td className="px-6 py-4">
                        {citizen.is_registered ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Registered
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowViewModal(citizen)}
                            className="p-1 text-gray-400 hover:text-primary-500 transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(citizen.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} citizens
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Citizen Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Citizen Details
              </h2>
              <button
                onClick={() => setShowViewModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">
                    Citizenship Number
                  </label>
                  <p className="text-gray-900 font-medium">
                    {showViewModal.citizenship_number}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium">
                    {showViewModal.full_name}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">
                    {formatDate(showViewModal.date_of_birth)} (
                    {calculateAge(showViewModal.date_of_birth)} years)
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Gender</label>
                  <p className="text-gray-900">
                    {showViewModal.gender === "M"
                      ? "Male"
                      : showViewModal.gender === "F"
                        ? "Female"
                        : "Other"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">District</label>
                  <p className="text-gray-900">{showViewModal.district}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Municipality</label>
                  <p className="text-gray-900">{showViewModal.municipality}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ward Number</label>
                  <p className="text-gray-900">{showViewModal.ward_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Father's Name</label>
                  <p className="text-gray-900">
                    {showViewModal.father_name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Mother's Name</label>
                  <p className="text-gray-900">
                    {showViewModal.mother_name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <p className="text-gray-900">
                    {showViewModal.is_registered ? (
                      <span className="text-green-600">Registered</span>
                    ) : (
                      <span className="text-yellow-600">Unregistered</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(null)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Citizen?
            </h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete this citizen? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Import Citizens
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {importResult ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Import Complete!
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      Total rows: <strong>{importResult.total}</strong>
                    </p>
                    <p>
                      Imported:{" "}
                      <strong className="text-green-600">
                        {importResult.imported}
                      </strong>
                    </p>
                    <p>
                      Skipped:{" "}
                      <strong className="text-yellow-600">
                        {importResult.skipped}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Required columns: citizenship_number, full_name,
                      date_of_birth, district, municipality, ward_number, gender
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || importing}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                    >
                      {importing ? "Importing..." : "Import"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCitizens;
