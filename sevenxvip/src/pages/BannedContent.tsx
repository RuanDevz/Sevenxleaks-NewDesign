import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, Ban, Eye } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import LoadingBanned from "../components/Loaders/LoadingBanned";
import MonthFilter from "../components/MonthFilter";
import SortFilter, { SortValue } from "../components/SortFilter";
import { PreviewModal } from "../components/PreviewModal";

type LinkItem = {
  id: string;
  name: string;
  category: string;
  postDate: string;
  slug: string;
  mega: string;
  mega2?: string;
  pixeldrain?: string;
  thumbnail?: string;
  preview?: string;
  createdAt: string;
  region: string;
  contentType?: string;
};

const BannedContent: React.FC = () => {
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
  const [searchName, setSearchName] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortValue>("mostRecent");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewContentName, setPreviewContentName] = useState<string>("");

  function decodeModifiedBase64<T>(encodedStr: string): T {
    const fixedBase64 = encodedStr.slice(0, 2) + encodedStr.slice(3);
    const jsonString = atob(fixedBase64);
    return JSON.parse(jsonString) as T;
  }

    const getPath = (l: LinkItem) => {
  const ct = l.contentType || "asian";
  if (ct === "asian") {
    if (l.category === "Banned") return `/banned/${l.slug}`;
    if (l.category === "Unknown") return `/unknown/${l.slug}`;
    return `/asian/${l.slug}`;
  }
  if (ct === "banned") return `/banned/${l.slug}`;
  if (ct === "unknown") return `/unknown/${l.slug}`;
  if (ct === "vip") return `/vip/${l.slug}`;
  return `/western/${l.slug}`;
};

  const fetchContent = async (page: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      if (isLoadMore) setLoadingMore(true);
      setSearchLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        sortBy: "postDate",
        sortOrder: sortOption === "oldest" ? "ASC" : "DESC",
        limit: "110",
        category: "Banned"
      });

      if (searchName) params.append('search', searchName);
      if (selectedMonth) params.append('month', selectedMonth);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/universal-search/search?${params}`,
        {
          headers: {
            "x-api-key": `${import.meta.env.VITE_FRONTEND_API_KEY}`,
          },
        }
      );

      if (!response.data?.data) throw new Error("Invalid server response");

      const decoded = decodeModifiedBase64<{ data: LinkItem[]; totalPages: number }>(
        response.data.data
      );
      const { data: allData, totalPages } = decoded;
      
      // Mostra todos os Banned FREE (exclui VIP)
      const rawData = allData.filter(item => {
        return item.category === "Banned" && (!item.contentType || !item.contentType.startsWith('vip'));
      });

      if (isLoadMore) {
        setLinks((prev) => [...prev, ...rawData]);
        setFilteredLinks((prev) => [...prev, ...rawData]);
      } else {
        setLinks(rawData);
        setFilteredLinks(rawData);
        setCurrentPage(1);
      }

      setTotalPages(totalPages);
      const hasMore = page < totalPages && rawData.length > 0;
      setHasMoreContent(hasMore);
    } catch (error) {
      console.error("Error fetching banned content:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMoreContent(true);
      fetchContent(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedMonth, sortOption]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMoreContent || currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContent(nextPage, true);
  };

  const recentLinks = filteredLinks.slice(0, 5);

  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  };

  const groupPostsByDate = (posts: LinkItem[]) => {
    const grouped: Record<string, LinkItem[]> = {};
    posts.forEach((post) => {
      const dateKey = formatDateHeader(post.postDate || post.createdAt);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(post);
    });
    return grouped;
  };

  const groupedLinks = groupPostsByDate(filteredLinks);

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      <Helmet>
        <title>Banned Content - Sevenxleaks</title>
        <link rel="canonical" href="https://sevenxleaks.com/banned" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banned Header */}
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
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], y: [0, -4, 0, 4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Ban className="w-12 h-12 text-red-500" />
            </motion.div>

            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 2xl:text-3xl">
              Banned Content
            </h1>

            <motion.div
              animate={{ rotate: [0, -10, 10, 0], y: [0, 4, 0, -4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1, ease: "easeInOut" }}
            >
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </motion.div>
          </motion.div>

          <motion.p
            className="text-lg text-red-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Content banned from Erome
          </motion.p>
        </motion.div>

        {/* Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-[60]">
          <div
            className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl ${
              isDark ? "bg-gray-800/60 border-gray-700/50" : "bg-white/80 border-gray-200/50"
            }`}
          >
            <div
              className={`flex flex-col lg:flex-row items-center gap-4 rounded-2xl px-6 py-4 border shadow-inner ${
                isDark ? "bg-gray-700/50 border-gray-600/30" : "bg-gray-100/50 border-gray-300/30"
              }`}
            >
              {/* Search Bar */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Ban className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                <input
                  type="text"
                  className={`flex-1 bg-transparent border-none outline-none text-lg ${
                    isDark
                      ? "text-white placeholder-gray-400"
                      : "text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Search banned content..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                {searchLoading && (
                  <div
                    className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                      isDark ? "border-red-400" : "border-red-600"
                    }`}
                  />
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="month-filter-container relative z-50">
                  <MonthFilter
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    themeColor="red"
                  />
                </div>

                <SortFilter selected={sortOption} onChange={setSortOption} themeColor="red" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-0">
          <main>
            {loading ? (
              <LoadingBanned />
            ) : filteredLinks.length > 0 ? (
              <>
                {Object.entries(groupedLinks)
                  .sort(([dateA], [dateB]) => {
                    const a = new Date(dateA).getTime();
                    const b = new Date(dateB).getTime();
                    return sortOption === "oldest" ? a - b : b - a;
                  })
                  .map(([date, posts]) => (
                    <div key={date} className="mb-8">
                      <h2
                        className={`text-xl font-bold mb-4 pb-2 border-b font-orbitron flex items-center gap-3 ${
                          isDark ? "text-gray-300 border-gray-700/50" : "text-gray-700 border-gray-300/50"
                        }`}
                      >
                        <div
                          className={`w-3 h-8 rounded-full shadow-lg ${
                            isDark
                              ? "bg-gradient-to-b from-red-500 to-red-600 shadow-red-500/30"
                              : "bg-gradient-to-b from-red-600 to-red-700 shadow-red-500/20"
                          }`}
                        />
                        <span
                          className={`bg-gradient-to-r bg-clip-text text-transparent ${
                            isDark ? "from-red-400 to-red-300" : "from-red-600 to-red-500"
                          }`}
                        >
                          {date}
                        </span>
                      </h2>

                      <div className="space-y-2">
                        {posts
                          .sort((a, b) => {
                            const da = new Date(a.postDate || a.createdAt).getTime();
                            const db = new Date(b.postDate || b.createdAt).getTime();
                            return sortOption === "oldest" ? da - db : db - da;
                          })
                          .map((link, index) => (
                             <Link to={getPath(link)}
                        className="relative block rounded-xl p-1 focus:outline-none"
                        draggable={false}>
                          <motion.div
                              key={link.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`group rounded-xl p-3 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-[1.01] ${
                                isDark
                                  ? "bg-gray-800/60 hover:bg-gray-700/80 border-gray-700/50 hover:border-gray-500/50 hover:shadow-gray-500/20"
                                  : "bg-white/60 hover:bg-gray-50/80 border-gray-200/50 hover:border-red-400/50 hover:shadow-red-400/10"
                              } border`}
                              onClick={() => navigate(`/banned/${link.slug}`)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                  {/* Origin indicator */}
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      link.contentType === 'asian' ? 'bg-purple-400' :
                                      link.contentType === 'western' ? 'bg-orange-400' :
                                      'bg-red-400'
                                    }`}
                                  />
                                  <Ban className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                                  <h3
                                    className={`text-sm sm:text-lg font-bold transition-colors duration-300 font-orbitron relative truncate ${
                                      isDark ? "text-white group-hover:text-red-300" : "text-gray-900 group-hover:text-red-600"
                                    }`}
                                  >
                                    {link.name}
                                    <div
                                      className={`absolute -bottom-1 left-0 w-16 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                        isDark ? "bg-gradient-to-r from-red-500 to-red-300" : "bg-gradient-to-r from-red-600 to-red-500"
                                      }`}
                                    />
                                  </h3>
                                  <div
                                    className={`hidden sm:block h-px bg-gradient-to-r to-transparent flex-1 max-w-20 transition-all duration-300 ${
                                      isDark ? "from-red-500/50 group-hover:from-red-400/70" : "from-red-400/50 group-hover:from-red-500/70"
                                    }`}
                                  />
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                  {recentLinks.includes(link) && (
                                    <span
                                      className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-white text-xs font-bold rounded-full shadow-lg animate-pulse border font-roboto ${
                                        isDark
                                          ? "bg-gradient-to-r from-red-500 to-red-600 border-red-400/30"
                                          : "bg-gradient-to-r from-red-600 to-red-700 border-red-500/30"
                                      }`}
                                    >
                                      <i className="fa-solid fa-star mr-1 text-xs hidden sm:inline" />
                                      NEW
                                    </span>
                                  )}

                                  {/* Origin badge */}
                                  {link.contentType && (
                                    <span
                                      className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                                        link.contentType === 'asian'
                                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                          : link.contentType === 'western'
                                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      }`}
                                    >
                                      {link.contentType.toUpperCase()} ORIGIN
                                    </span>
                                  )}

                                  <span
                                    className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full border backdrop-blur-sm font-roboto ${
                                      isDark ? "bg-gray-700/70 text-gray-300 border-gray-600/50" : "bg-gray-200/70 text-gray-700 border-gray-300/50"
                                    }`}
                                  >
                                    <i className="fa-solid fa-ban mr-1 sm:mr-2 text-xs" />
                                    {link.category}
                                  </span>
                                  {link.preview && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowPreview(link.preview!);
                                        setPreviewContentName(link.name);
                                      }}
                                      className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                        isDark
                                          ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                                          : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
                                      }`}
                                      aria-label="Preview"
                                      title="View preview"
                                    >
                                      <i className="fa-solid fa-eye text-sm"></i>
                                    </button>
                                  )}
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
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/30'
                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/20'
                      } text-white`}
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Content'
                      )}
                    </motion.button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="mb-8">
                  <Ban className="w-16 h-16 text-red-500 mx-auto" />
                </div>
                <h3 className={`text-3xl font-bold mb-4 font-orbitron ${isDark ? "text-white" : "text-gray-900"}`}>
                  No Banned Content Found
                </h3>
                <p className={`text-lg font-roboto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          imageUrl={showPreview}
          contentName={previewContentName}
          onClose={() => {
            setShowPreview(null);
            setPreviewContentName("");
          }}
        />
      )}
    </div>
  );
};

export default BannedContent;