import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";
import Layout from "../components/Layout";
import { getDashboardStats, updateProfile } from "../services/api";
import { RefreshCw } from "lucide-react";
import { resendVerification } from "../services/api";

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await getDashboardStats();
      if (response.status === "success") {
        setUser(response.data.user);
        setFormData({
          email: response.data.user.email,
          phone: response.data.user.phone || "",
        });
        // Update localStorage for sidebar
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error("Profile error:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveStatus("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user?.email,
      phone: user?.phone || "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      const response = await updateProfile({
        email: formData.email,
        phone: formData.phone,
      });

      if (response.status === "success") {
        setSaveStatus("success");
        setUser({
          ...user,
          email: formData.email,
          phone: formData.phone,
        });
        // Update localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            email: formData.email,
            phone: formData.phone,
          }),
        );
        setIsEditing(false);
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch (error) {
      console.error("Update error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setResendStatus("sending");
    try {
      const response = await resendVerification();
      if (response.status === "success") {
        setResendStatus("sent");
        setResendCooldown(60);
        // Countdown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimeout(() => setResendStatus(""), 3000);
      }
    } catch (error) {
      setResendStatus("error");
      setTimeout(() => setResendStatus(""), 3000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-500 text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">
              View and manage your profile information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-primary-500 text-black px-4 py-2 rounded-lg hover:bg-primary-600 transition"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-primary-500 to-primary-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-black">
              Personal Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Name - Read Only */}
            <div className="flex items-center gap-3 border-b pb-3">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user?.full_name}</p>
              </div>
            </div>

            {/* Citizenship Number - Read Only */}
            <div className="flex items-center gap-3 border-b pb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Citizenship Number</p>
                <p className="font-medium text-gray-900 font-mono text-sm">
                  {user?.citizenship_number}
                </p>
              </div>
            </div>

            {/* District - Read Only */}
            <div className="flex items-center gap-3 border-b pb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">District</p>
                <p className="font-medium text-gray-900">{user?.district}</p>
              </div>
            </div>

            {/* Email - Editable */}
            <div className="flex items-center gap-3 border-b pb-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    {user?.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <XCircle size={12} /> Not verified
                      </span>
                    )}

                    {/* RESEND BUTTON - PUT HERE */}
                    {!user?.is_verified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0}
                        className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 mt-2 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={14}
                          className={
                            resendStatus === "sending" ? "animate-spin" : ""
                          }
                        />
                        {resendCooldown > 0
                          ? `Resend available in ${resendCooldown}s`
                          : "Resend verification email"}
                      </button>
                    )}
                    {resendStatus === "sent" && (
                      <p className="text-green-600 text-xs mt-1">
                        Verification email sent!
                      </p>
                    )}
                    {resendStatus === "error" && (
                      <p className="text-red-600 text-xs mt-1">
                        Failed to send. Please try again.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Phone - Editable */}
            <div className="flex items-center gap-3 border-b pb-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Not provided"
                  />
                ) : (
                  <p className="font-medium text-gray-900">
                    {user?.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>

            {/* Member Since - Read Only */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(user?.date_joined).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}

            {/* Save Status Message */}
            {saveStatus === "success" && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}
            {saveStatus === "error" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                Failed to update profile. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
