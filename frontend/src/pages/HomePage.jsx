import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

const HomePage = () => {
  const [stats, setStats] = useState({
    totalCitizens: 0,
    registeredVoters: 0,
    activeElections: 0,
    totalVotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch citizens count
    api
      .get("/citizens/")
      .then((response) => {
        setStats((prev) => ({
          ...prev,
          totalCitizens: response.data.length,
          registeredVoters: response.data.filter((c) => c.is_registered).length,
        }));
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching citizens:", error));
  }, []);

  const statCards = [
    {
      title: "Total Citizens",
      value: stats.totalCitizens,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Registered Voters",
      value: stats.registeredVoters,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Active Elections",
      value: stats.activeElections,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Total Votes Cast",
      value: stats.totalVotes,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome to the Online Voting System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition">
              View Active Elections
            </button>
            <button className="w-full border border-primary-500 text-primary-500 py-2 rounded-lg hover:bg-primary-50 transition">
              Update Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Status</span>
              <span className="text-green-500">● Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database</span>
              <span className="text-green-500">● Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Sync</span>
              <span className="text-gray-500">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
