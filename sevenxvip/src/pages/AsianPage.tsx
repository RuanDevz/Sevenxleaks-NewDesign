// src/pages/AsianPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "../contexts/ThemeContext";
import MonthFilter from "../components/MonthFilter";
import CategoryFilter from "../components/CategoryFilter";

type LinkItem = {
  id: string;
  name: string;
  category: string;
  postDate: string;
  slug: string;
  thumbnail?: string;
  createdAt: string;
  contentType?: string;
};

type Category = {
  id: string;
  name: string;
  category: string;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full animate-spin"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fa-solid fa-spinner text-purple-500 animate-spin text-xl"></i>
      </div>
    </div>
  </div>
);

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

function decodeModifiedBase64<T>(encodedStr: string): T {
  const fixedBase64 = encodedStr.slice(0, 2) + encodedStr.slice(3);
  const jsonString = atob(fixedBase64);
  return JSON.parse(jsonString) as T;
}

function sortDescByDate(a: LinkItem, b: LinkItem) {
  const dateA = new Date(a.postDate || a.createdAt).getTime();
  const dateB = new Date(b.postDate || b.createdAt).getTime();
  return dateB - dateA;
}

function dedupeById(items: LinkItem[]) {
  const map = new Map<string, LinkItem>();
  for (const it of items) map.set(it.id, it);
  return Array.from(map.values());
}

const AsianPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);

  const LIMIT = 50; // coerente com cálculo de hasMore e UX

  const fetchContent = async (page: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      if (isLoadMore) setLoadingMore(true);
      setSearchLoading(true);

      const params = new URLSearchParams({
        sortBy: "postDate",
        sortOrder: "DESC",
        limit: String(LIMIT),
        page: String(page)
      });

      if (searchName) params.append("search", searchName);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedMonth) params.append("month", selectedMonth);
      if (dateFilter !== "all") params.append("dateFilter", dateFilter);

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

      const rawData = searchName
        ? allData.filter((item) => !item.contentType || !item.contentType.startsWith("vip"))
        : allData.filter((item) => item.contentType === "asian");

      rawData.sort(sortDescByDate);

      if (isLoadMore) {
        const merged = dedupeById([...links, ...rawData]).sort(sortDescByDate);
        setLinks(merged);
        setFilteredLinks(merged);
        setCurrentPage(page);
      } else {
        setLinks(rawData);
        setFilteredLinks(rawData);
        setCurrentPage(1);
      }

      setTotalPages(totalPages);
      setHasMoreContent(page < totalPages);

      // categorias únicas acumuladas a partir do conjunto atual
      const uniqueCategories = Array.from(new Set(
        (isLoadMore ? dedupeById([...links, ...rawData]) : rawData).map((i) => i.category)
      )).map((category) => ({ id: category, name: category, category }));

      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };

  // reset e busca inicial a cada alteração de filtro
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMoreContent(true);
      fetchContent(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedCategory, dateFilter, selectedMonth]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMoreContent) return;
    const next = currentPage + 1;
    fetchContent(next, true);
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
    const grouped: { [key: string]: LinkItem[] } = {};
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
      className={`min-h-screen isolate ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      <Helmet>
        <title>Sevenxleaks Asian - Free Content</title>
        <link rel="canonical" href="https://sevenxleaks.com/Asian" />
      </Helmet>

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
              <i className={`fa-solid fa-search text-lg ${isDark ? "text-purple-400" : "text-purple-600"}`}></i>
              <input
                type="text"
                className={`flex-1 bg-transparent border-none outline-none text-lg ${
                  isDark ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchLoading && (
                <div
                  className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                    isDark ? "border-purple-400" : "border-purple-600"
                  }`}
                ></div>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              {["all", "today", "yesterday", "7days"].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border whitespace-nowrap ${
                    dateFilter === filter
                      ? isDark
                        ? "bg-purple-500 text-white border-purple-400"
                        : "bg-purple-600 text-white border-purple-500"
                      : isDark
                      ? "bg-gray-700/50 text-gray-300 hover:bg-purple-500/20 border-gray-600/50"
                      : "bg-gray-200/50 text-gray-700 hover:bg-purple-100 border-gray-300/50"
                  }`}
                  onClick={() => setDateFilter(filter)}
                >
                  {filter === "all" ? "All" : filter === "7days" ? "7 Days" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 month-filter-container relative z-50">
              <MonthFilter selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} themeColor="purple" />
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2">
              <CategoryFilter
                selected={selectedCategory}
                onChange={setSelectedCategory}
                themeColor="purple"
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((c) => ({
                    value: c.category,
                    label: c.name,
                  })),
                ]}
              />

              <button
                className={`p-2 rounded-lg transition-all duration-300 border ${
                  isDark
                    ? "bg-gray-700/50 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 border-gray-600/50"
                    : "bg-gray-200/50 hover:bg-purple-100 text-gray-700 hover:text-purple-700 border-gray-300/50"
                }`}
                title="Switch to Asian"
                onClick={() => navigate("/western")}
              >
                <i className="fa-solid fa-repeat text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-0">
        <main>
          {loading ? (
            <LoadingSpinner />
          ) : filteredLinks.length > 0 ? (
            <>
              {Object.entries(groupedLinks)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, posts]) => (
                  <div key={date} className="mb-8">
                    <h2
                      className={`text-xl font-bold mb-4 pb-2 border-b font-orbitron flex items-center gap-3 ${
                        isDark ? "text-gray-300 border-gray-700/50" : "text-gray-700 border-gray-300/50"
                      }`}
                    >
                      <div className="w-3 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/30"></div>
                      <span
                        className={`bg-clip-text text-transparent ${
                          posts.every((p) => (p.contentType || "asian") === "asian")
                            ? isDark
                              ? "bg-gradient-to-r from-purple-400 to-purple-300"
                              : "bg-gradient-to-r from-purple-600 to-purple-500"
                            : isDark
                            ? "bg-gradient-to-r from-purple-400 to-purple-300"
                            : "bg-gradient-to-r from-purple-600 to-purple-500"
                        }`}
                      >
                        {date}
                      </span>
                    </h2>

                    <div className="space-y-2">
                      {posts
                        .sort(sortDescByDate)
                        .map((link, index) => (
                          <Link
                            key={link.id}
                            to={getPath(link)}
                            className="relative block rounded-xl p-1 focus:outline-none"
                            draggable={false}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`group rounded-xl p-3 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-[1.01] border ${
                                isDark
                                  ? "bg-gray-800/60 hover:bg-gray-700/80 border-gray-700/50 hover:border-purple-500/50 hover:shadow-purple-500/10"
                                  : "bg-white/60 hover:bg-gray-50/80 border-gray-200/50 hover:border-purple-400/50 hover:shadow-purple-400/10"
                              } border`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                  {link.contentType && (
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        link.contentType === "asian"
                                          ? "bg-purple-400"
                                          : link.contentType === "banned"
                                          ? "bg-red-400"
                                          : link.contentType === "unknown"
                                          ? "bg-gray-400"
                                          : link.contentType === "western"
                                          ? "bg-orange-400"
                                          : link.contentType === "vip"
                                          ? "bg-yellow-400"
                                          : "bg-purple-400"
                                      }`}
                                    ></div>
                                  )}
                                  <h3
                                    className={`text-sm sm:text-lg font-bold transition-colors duration-300 font-orbitron relative truncate ${
                                      isDark ? "text-white group-hover:text-purple-300" : "text-gray-900 group-hover:text-purple-600"
                                    }`}
                                  >
                                    {link.name}
                                    <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  </h3>
                                  <div
                                    className={`hidden sm:block h-px bg-gradient-to-r to-transparent flex-1 max-w-20 transition-all duration-300 ${
                                      isDark ? "from-purple-500/50 group-hover:from-purple-400/70" : "from-purple-400/50 group-hover:from-purple-500/70"
                                    }`}
                                  ></div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                  {recentLinks.includes(link) && (
                                    <span
                                      className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-white text-xs font-bold rounded-full shadow-lg animate-pulse border font-roboto ${
                                        isDark
                                          ? "bg-gradient-to-r from-purple-500 to-purple-600 border-purple-400/30"
                                          : "bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500/30"
                                      }`}
                                    >
                                      <i className="fa-solid fa-star mr-1 text-xs hidden sm:inline"></i>
                                      NEW
                                    </span>
                                  )}
                                  <span
                                    className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full border backdrop-blur-sm font-roboto ${
                                      isDark ? "bg-gray-700/70 text-gray-300 border-gray-600/50" : "bg-gray-200/70 text-gray-700 border-gray-300/50"
                                    }`}
                                  >
                                    <i className="fa-solid fa-tag mr-1 sm:mr-2 text-xs"></i>
                                    {link.category}
                                  </span>
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
                        ? "bg-gray-600 cursor-not-allowed"
                        : isDark
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-purple-500/30"
                        : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-purple-500/20"
                    } text-white`}
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More Content"
                    )}
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="mb-8">
                <i className="fa-solid fa-search text-6xl text-gray-500"></i>
              </div>
              <h3 className={`text-3xl font-bold mb-4 font-orbitron ${isDark ? "text-white" : "text-gray-900"}`}>
                No Content Found
              </h3>
              <p className={`text-lg font-roboto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AsianPage;
