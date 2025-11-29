// VIPBannedPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Crown, Plus, Star, Shield, AlertTriangle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import MonthFilter from "../components/MonthFilter";
import SortFilter, { SortValue } from "../components/SortFilter";
import { PreviewModal } from "../components/PreviewModal";

type LinkItem = {
  id: string;
  name: string;
  category: string;
  postDate: string;
  slug: string;
  thumbnail?: string;
  preview?: string;
  createdAt: string;
  contentType?: string;
  region: string;
};

type Category = {
  id: string;
  name: string;
  category: string;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-yellow-500/20 rounded-full animate-spin"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
      </div>
    </div>
  </div>
);

const VIPBannedPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewContentName, setPreviewContentName] = useState<string>("");

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortOption, setSortOption] = useState<SortValue>("mostRecent");
  const [allLoaded, setAllLoaded] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  

  function decodeModifiedBase64<T>(encodedStr: string): T {
    const fixedBase64 = encodedStr.slice(0, 2) + encodedStr.slice(3);
    const jsonString = atob(fixedBase64);
    return JSON.parse(jsonString) as T;
  }

  const getVipPath = (l: LinkItem): string => {
  const ct = (l.contentType ?? "vip-asian").toLowerCase();
  const cat = (l.category ?? "").toLowerCase();

  if (ct === "vip-asian" || ct === "asian") {
    if (cat === "vip-banned") return `/vip-banned/${l.slug}`;
    if (cat === "vip-unknown") return `/vip-unknown/${l.slug}`;
    return `/vip-asian/${l.slug}`;
  }
  if (ct === "vip-western" || ct === "western") return `/vip-western/${l.slug}`;
  if (ct === "vip-banned" || ct === "banned") return `/vip-banned/${l.slug}`;
  if (ct === "vip-unknown" || ct === "unknown") return `/vip-unknown/${l.slug}`;
  if (ct === "vip") return `/vip/${l.slug}`;
  return `/vip-asian/${l.slug}`;
};

 const fetchContent = async (page: number, isLoadMore = false) => {
  try {
    if (!isLoadMore) setLoading(true);
    if (isLoadMore) setLoadingMore(true);
    setSearchLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      sortBy: "postDate",
      sortOrder: sortOption === "oldest" ? "ASC" : "DESC",
      limit: "110",
    });

    if (searchName) params.append("search", searchName);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedRegion) params.append("region", selectedRegion);
    if (selectedMonth) params.append("month", selectedMonth);

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/universal-search/search?${params}`,
      {
        headers: {
          "x-api-key": `${import.meta.env.VITE_FRONTEND_API_KEY}`,
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      }
    );

    if (!response.data?.data) throw new Error("Invalid server response");

    const decoded = decodeModifiedBase64<{ data: LinkItem[]; totalPages: number }>(
      response.data.data
    );

    const { data: allData, totalPages: totalPagesFromApi } = decoded;

    const rawData = searchName
      ? allData.filter(item => item.contentType && item.contentType.startsWith("vip"))
      : allData.filter(item =>
          item.contentType &&
          item.contentType.startsWith("vip") &&
          (item.category === "Banned" || item.category === "VIP Banned")
        );

    if (isLoadMore) {
      setLinks(prev => [...prev, ...rawData]);
      setFilteredLinks(prev => [...prev, ...rawData]);
    } else {
      setLinks(rawData);
      setFilteredLinks(rawData);
      setCurrentPage(1);
    }

    // atualiza paginação
    setTotalPages(totalPagesFromApi);
    const hasMorePages = page < totalPagesFromApi;
    setHasMoreContent(hasMorePages);
    setAllLoaded(!hasMorePages);

    const uniqueCategories = Array.from(new Set(rawData.map(i => i.category))).map(category => ({
      id: category,
      name: category,
      category,
    }));

    setCategories(prev => {
      const existing = new Set(prev.map(c => c.category));
      const news = uniqueCategories.filter(c => !existing.has(c.category));
      return [...prev, ...news];
    });
  } catch (error) {
    console.error("Error fetching VIP Banned content:", error);
  } finally {
    setLoading(false);
    setLoadingMore(false);
    setSearchLoading(false);
  }
};


  useEffect(() => {
    const t = setTimeout(() => {
      setHasMoreContent(true);
      fetchContent(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedCategory, selectedRegion, selectedMonth, sortOption]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMoreContent || currentPage >= totalPages) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchContent(next, true);
  };

  const recentLinks = filteredLinks.slice(0, 5);

  const formatDateHeader = (dateString: string): string => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
  };

  const groupPostsByDate = (posts: LinkItem[]) => {
    const grouped: Record<string, LinkItem[]> = {};
    posts.forEach((p) => {
      const key = formatDateHeader(p.postDate || p.createdAt);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    return grouped;
  };

  const groupedLinks = groupPostsByDate(filteredLinks);

  return (
    <div
      className={`min-h-screen isolate ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-yellow-900/10 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-yellow-100/20 to-gray-100 text-gray-900"
      }`}
    >
      <Helmet>
        <title>VIP Banned Content - Sevenxleaks</title>
        <link rel="canonical" href="https://sevenxleaks.com/vip-banned" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-[60] ">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-4 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Shield className="w-12 h-12 text-yellow-500" />
            </motion.div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 2xl:text-3xl ">
              Banned Content
            </h1>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </motion.div>
          </motion.div>

          <motion.p
            className="text-lg text-yellow-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Content banned from Erome
          </motion.p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-[60]">
        <div
          className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl ${
            isDark ? "bg-gray-800/60 border-yellow-500/30 shadow-yellow-500/10" : "bg-white/80 border-yellow-400/40 shadow-yellow-400/10"
          }`}
        >
          <div
            className={`flex flex-col lg:flex-row items-center gap-4 rounded-2xl px-6 py-4 border shadow-inner ${
              isDark ? "bg-gray-700/50 border-yellow-500/20" : "bg-gray-100/50 border-yellow-400/30"
            }`}
          >
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Crown className="text-yellow-400 w-5 h-5 animate-pulse" />
                <AlertTriangle className="text-red-400 w-4 h-4" />
              </div>
              <input
                type="text"
                className={`flex-1 bg-transparent border-none outline-none text-lg ${
                  isDark ? "text-white placeholder-yellow-300/60" : "text-gray-900 placeholder-yellow-600/60"
                }`}
                placeholder="Search VIP banned content..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchLoading && (
                <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isDark ? "border-yellow-400" : "border-yellow-600"}`} />
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="month-filter-container">
                <MonthFilter selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} themeColor="yellow" />
              </div>

              <SortFilter selected={sortOption} onChange={setSortOption} themeColor="yellow" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <main>
          {loading ? (
            <LoadingSpinner />
          ) : filteredLinks.length > 0 ? (
            <>
              {Object.entries(groupedLinks)
                .sort(([a], [b]) => {
                  const da = new Date(a).getTime();
                  const db = new Date(b).getTime();
                  return sortOption === "oldest" ? da - db : db - da;
                })
                .map(([date, posts]) => (
                  <div key={date} className="mb-8">
                    <h2
                      className={`text-xl font-bold mb-4 pb-2 border-b font-orbitron flex items-center gap-3 ${
                        isDark ? "text-gray-300 border-yellow-500/30" : "text-gray-700 border-yellow-400/40"
                      }`}
                    >
                      <div className="w-3 h-8 bg-gradient-to-b from-yellow-500 to-red-600 rounded-full shadow-lg shadow-yellow-500/30"></div>
                      <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">VIP Banned - {date}</span>
                      <Shield className="w-4 h-4 text-red-300" />
                    </h2>

                    <div className="space-y-2">
                      {posts
                        .sort((a, b) => {
                          const da = new Date(a.postDate || a.createdAt).getTime();
                          const db = new Date(b.postDate || b.createdAt).getTime();
                          return sortOption === "oldest" ? da - db : db - da;
                        })
                        .map((link, index) => (
                          <Link to={getVipPath(link)}
                        className="relative block rounded-xl p-1 focus:outline-none"
                        draggable={false}>
                          <motion.div
                            key={link.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group rounded-xl p-3 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-[1.01] ${
                              isDark
                                ? "bg-gray-800/60 hover:bg-gray-700/80 border-yellow-500/30 hover:border-red-400/60 hover:shadow-red-500/20"
                                : "bg-white/60 hover:bg-gray-50/80 border-yellow-400/40 hover:border-red-400/60 hover:shadow-red-400/20"
                            } border`}
                            onClick={() => {
                              const ct = link.contentType || "vip-banned";
                              switch (ct) {
                                case "vip-asian":
                                  navigate(`/vip-asian/${link.slug}`);
                                  break;
                                case "vip-western":
                                  navigate(`/vip-western/${link.slug}`);
                                  break;
                                case "vip-banned":
                                  navigate(`/vip-banned/${link.slug}`);
                                  break;
                                case "vip-unknown":
                                  navigate(`/vip-unknown/${link.slug}`);
                                  break;
                                default:
                                  navigate(`/vip-banned/${link.slug}`);
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <h3
                                  className={`text-sm sm:text-lg font-bold transition-colors duration-300 font-orbitron relative truncate ${
                                    isDark ? "text-white group-hover:text-red-300" : "text-gray-900 group-hover:text-red-600"
                                  }`}
                                >
                                  {link.name}
                                  <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-gradient-to-r from-yellow-500 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                {recentLinks.includes(link) && (
                                  <span
                                    className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-white text-xs font-bold rounded-full shadow-lg animate-pulse border font-roboto ${
                                      isDark
                                        ? "bg-gradient-to-r from-yellow-500 to-red-600 border-yellow-400/30"
                                        : "bg-gradient-to-r from-yellow-600 to-red-700 border-yellow-500/30"
                                    }`}
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    NEW VIP
                                  </span>
                                )}

                                {link.contentType && link.contentType !== "vip-banned" && (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                                      link.contentType === "vip-asian"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        : link.contentType === "vip-western"
                                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                        : link.contentType === "vip-unknown"
                                        ? "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                                        : ""
                                    }`}
                                  >
                                    {link.contentType.replace("vip-", "").toUpperCase()}
                                  </span>
                                )}

                                <span
                                  className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full border backdrop-blur-sm font-roboto ${
                                    isDark
                                      ? "bg-gradient-to-r from-yellow-500/20 to-red-500/20 text-yellow-300 border-yellow-500/30"
                                      : "bg-gradient-to-r from-yellow-200/40 to-red-200/30 text-yellow-700 border-yellow-400/40"
                                  }`}
                                >
                                  <Crown className="w-3 h-3 mr-2" />
                                  {link.category}
                                </span>
                                {/* {link.preview && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowPreview(link.preview!);
                                      setPreviewContentName(link.name);
                                    }}
                                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                      isDark
                                        ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                                        : 'bg-gray-100 hover:bg-gray-200 text-yellow-600'
                                    }`}
                                    aria-label="Preview"
                                    title="View preview"
                                  >
                                    <i className="fa-solid fa-eye text-sm"></i>
                                  </button>
                                )} */}
                              </div>
                            </div>
                          </motion.div>
                         </Link>
                        ))}
                    </div>
                  </div>
                ))}

              {hasMoreContent && (
                <div className="text-center mt-12 py-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      loadingMore
                        ? 'bg-gray-600 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 shadow-lg hover:shadow-yellow-500/30'
                          : 'bg-gradient-to-r from-yellow-600 to-red-700 hover:from-yellow-700 hover:to-red-800 shadow-lg hover:shadow-yellow-500/20'
                    } text-black`}
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More VIP Content'
                    )}
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="mb-8 flex items-center justify-center gap-4">
                <Crown className="w-16 h-16 text-yellow-500 animate-pulse" />
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className={`text-3xl font-bold mb-4 font-orbitron ${isDark ? "text-white" : "text-gray-900"}`}>
                No VIP Banned Content Found
              </h3>
              <p className="text-gray-400 text-lg font-roboto">Try adjusting your search or filters to find premium banned content.</p>
            </div>
          )}
        </main>
      </div>

      {/* {showPreview && (
        <PreviewModal
          imageUrl={showPreview}
          contentName={previewContentName}
          onClose={() => {
            setShowPreview(null);
            setPreviewContentName("");
          }}
        />
      )} */}
    </div>
  );
};

export default VIPBannedPage;
