import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Edit2,
  Trash2,
  Plus,
  Users,
  AlertCircle,
  Loader2,
  ChevronDown,
  Filter,
  Database,
  Activity,
  Globe,
  Crown,
  Ban,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { LinkItem } from "../utils/index";
import { useTheme } from "../contexts/ThemeContext";
import AdminLinkForm from "../components/Admin/AdminLinkForm";
import AdminLinkList from "../components/Admin/AdminLinkList";
import AdminFilterBar from "../components/Admin/AdminFilterBar";

interface ApiResponse {
  page: number;
  perPage: number;
  data: LinkItem[];
  totalPages: number;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<keyof typeof tabConfig>("asian");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState<LinkItem>({
      id: 0,
      name: "",
      link: "",
      link2: "",
      linkP: "",
      linkG: "",
      linkMV1: "",
      linkMV2: "",
      linkMV3: "",
      linkMV4: "",
      category: "",
      postDate: new Date().toISOString().split("T")[0],
      createdAt: "",
      updatedAt: "",
      slug: "",
  });
  const [categories] = useState<string[]>([
    "Asian",
    "Teen",
    "Big Tits",
    "Tiktok",
    "Instagram",
    "Banned",
    "Unknown",
    "Western",
    "VIP Content",
  ]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const token = localStorage.getItem("Token");

  const tabConfig = {
    asian: {
      endpoint: "/asiancontent",
      icon: Globe,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
    western: {
      endpoint: "/westerncontent",
      icon: Globe,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
    },
    vip: {
      endpoint: "/vipcontent",
      icon: Crown,
      color: "yellow",
      gradient: "from-yellow-500 to-yellow-600",
    },
    banned: {
      endpoint: "/bannedcontent",
      icon: Ban,
      color: "red",
      gradient: "from-red-500 to-red-600",
    },
    unknown: {
      endpoint: "/unknowncontent",
      icon: HelpCircle,
      color: "gray",
      gradient: "from-gray-500 to-gray-600",
    },
  };

  useEffect(() => {
    setCurrentPage(1);
    setLinks([]);
    fetchLinks(1);
  }, [activeTab]);

  const fetchLinks = async (page: number = 1, isLoadMore = false) => {
    try {
      setIsLoading(!isLoadMore);
      setError(null);

      const config = tabConfig[activeTab];
      const params = new URLSearchParams({
        page: page.toString(),
        sortOrder: "DESC",
        limit: "900",
      });

      const response = await axios.get<{ data: string }>(
        `${import.meta.env.VITE_BACKEND_URL}${config.endpoint}?${params}`,
        {
          headers: {
            "x-api-key": import.meta.env.VITE_FRONTEND_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let base64Data = response.data.data;
      if (base64Data.length > 2) {
        base64Data = base64Data.slice(0, 2) + base64Data.slice(3);
      }
      const jsonString = atob(base64Data);
      const dataObject: ApiResponse = JSON.parse(jsonString);

      if (isLoadMore) {
        setLinks((prev) => [...prev, ...(dataObject.data || [])]);
      } else {
        setLinks(dataObject.data || []);
      }

      setTotalPages(dataObject.totalPages || 1);
      setHasMore(page < (dataObject.totalPages || 1));
    } catch (err) {
      setError("Failed to fetch content. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name || !newLink.link || !newLink.category) {
      setError("Please fill in all required fields (name, mega link, category)");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const config = tabConfig[activeTab];
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}${config.endpoint}`, newLink, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": `${import.meta.env.VITE_FRONTEND_API_KEY}`,
          "x-admin-key": `${import.meta.env.VITE_ADMIN_KEY}`,
        },
      });

      setNewLink({
      id: 0,
      name: "",
      link: "",
      link2: "",
      linkP: "",
      linkG: "",
      linkMV1: "",
      linkMV2: "",
      linkMV3: "",
      linkMV4: "",
      category: "",
      postDate: new Date().toISOString().split("T")[0],
      createdAt: "",
      updatedAt: "",
      slug: "",
      });

      setCurrentPage(1);
      fetchLinks(1);
    } catch (error) {
      setError("Failed to add content. Please try again.");
      console.error("Error adding content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLink = (id: number) => {
    const linkToEdit = links.find((link) => link.id === id);
    if (linkToEdit) {
      setNewLink(linkToEdit);
      setIsEditing(id);
    }
  };

  const handleUpdateLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = tabConfig[activeTab];
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}${config.endpoint}/${isEditing}`,
        newLink,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-key": `${import.meta.env.VITE_FRONTEND_API_KEY}`,
            "x-admin-key": `${import.meta.env.VITE_ADMIN_KEY}`,
          },
        }
      );

      setIsEditing(null);
      setNewLink({
      id: 0,
      name: "",
      link: "",
      link2: "",
      linkP: "",
      linkG: "",
      linkMV1: "",
      linkMV2: "",
      linkMV3: "",
      linkMV4: "",
      category: "",
      postDate: new Date().toISOString().split("T")[0],
      createdAt: "",
      updatedAt: "",
      slug: "",
      });

      fetchLinks(1);
    } catch (error) {
      setError("Failed to update content. Please try again.");
      console.error("Error updating content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const config = tabConfig[activeTab];
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}${config.endpoint}/${id}`, {
        headers: {
          "x-api-key": import.meta.env.VITE_FRONTEND_API_KEY,
          "x-admin-key": `${import.meta.env.VITE_ADMIN_KEY}`,
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLinks(1);
    } catch (error) {
      setError("Failed to delete content. Please try again.");
      console.error("Error deleting content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchLinks(nextPage, true);
    }
  };

  const filteredLinks = links.filter(
    (link) =>
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || link.category === selectedCategory)
  );

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1
              className={`text-3xl font-bold font-orbitron bg-gradient-to-r bg-clip-text text-transparent ${
                isDark ? "from-blue-400 to-purple-500" : "from-blue-600 to-purple-700"
              }`}
            >
              Admin Dashboard
            </h1>
            <p className={`mt-2 font-roboto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Manage content across all platforms
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin-vip-users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors shadow-lg ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Manage VIP Users</span>
              <span className="sm:hidden">VIP Users</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin/stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors shadow-lg ${
                isDark
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </motion.button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border p-4 rounded-xl mb-6 flex items-center gap-2 ${
              isDark
                ? "bg-red-500/10 border-red-500 text-red-500"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Content Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(tabConfig).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === key
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    : isDark
                    ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30"
                    : "bg-gray-200/50 text-gray-700 hover:bg-gray-300/50 border border-gray-300/30"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="capitalize font-roboto">{key}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div
          className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
            isDark ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"
          }`}
        >
          {/* Filter Bar */}
          <div className={`p-6 border-b ${isDark ? "border-gray-700/50" : "border-gray-200/50"}`}>
            <AdminFilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              categories={categories}
            />
          </div>

          {/* Add/Edit Form */}
          <div className={`p-6 border-b ${isDark ? "border-gray-700/50" : "border-gray-200/50"}`}>
            <AdminLinkForm
              newLink={newLink}
              setNewLink={setNewLink}
              categories={categories}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleAddLink={handleAddLink}
              handleUpdateLink={handleUpdateLink}
              isLoading={isLoading}
            />
          </div>

          {/* Content List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold font-orbitron ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Content ({filteredLinks.length})
              </h3>
              <div
                className={`flex items-center gap-2 text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <Database className="w-4 h-4" />
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>

            <AdminLinkList
              links={filteredLinks}
              isLoading={isLoading}
              handleEditLink={handleEditLink}
              handleDeleteLink={handleDeleteLink}
              hasMore={hasMore}
              loadMore={loadMore}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;