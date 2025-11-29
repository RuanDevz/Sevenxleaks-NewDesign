import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Crown, Plus, Star, Sparkles } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import MonthFilter from "../components/MonthFilter";
import CategoryFilter from "../components/CategoryFilter";
import { PreviewModal } from "../components/PreviewModal";

type LinkItem = {
  id: string;
  name: string;
  category: string;
  postDate: string; // base única
  slug: string;
  thumbnail?: string;
  preview?: string;
  createdAt: string; // não usada
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
      <div className="w-16 h-16 border-4 border-yellow-500/20 rounded-full animate-spin"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
      </div>
    </div>
  </div>
);

const VIPWesternPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewContentName, setPreviewContentName] = useState<string>("");

  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "7days">("all");

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

  // intervalo local por postDate
  function buildDateRange(filter: "all" | "today" | "yesterday" | "7days") {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "7days") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }

  // busca 1 página crua da API
  async function fetchPage(page: number) {
    const params = new URLSearchParams({
      page: page.toString(),
      sortBy: "postDate",
      sortOrder: "DESC",
      limit: "110",
    });

    // instruções de data para o backend, se suportadas
    params.append("dateField", "postDate");

    if (searchName) {
      params.append("search", searchName);
      // se existir prefixo de tipo no backend, poderia usar: params.append("contentTypePrefix","vip");
    } else {
      // intenção: restringir já no backend; se ignorado, filtramos no cliente
      params.append("contentType", "vip-western");
    }

    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedMonth) {
      params.append("month", selectedMonth);
      params.append("monthField", "postDate"); // se suportado
    }
    if (dateFilter !== "all") {
      params.append("dateFilter", dateFilter); // today | yesterday | 7days
      params.append("dateField", "postDate");
    }

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

    return decoded;
  }

  // coleta progressiva: varre páginas até achar itens vip-western suficientes
  const fetchContent = async (pageStart: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      if (isLoadMore) setLoadingMore(true);
      setSearchLoading(true);

      let page = pageStart;
      let acc: LinkItem[] = [];
      let pagesFetched = 0;
      const maxPagesPerRun = 1; // sempre 1 página por vez

      // usar totalPages real após primeira página
      let total = totalPages;

      while (pagesFetched < maxPagesPerRun) {
        const { data: allData, totalPages: tp } = await fetchPage(page);
        total = tp;

        // recorte por tipo no cliente para o caso do backend ignorar o parâmetro
        const byType = searchName
          ? allData.filter((i) => i.contentType && i.contentType.startsWith("vip"))
          : allData.filter((i) => i.contentType === "vip-western");

        // filtro local por data em postDate, caso o backend ignore
        let viewData = byType;
        if (dateFilter !== "all") {
          const { start, end } = buildDateRange(dateFilter);
          viewData = byType.filter((i) => {
            const d = new Date(i.postDate);
            return d >= start && d <= end;
          });
        }

        acc = acc.concat(viewData);

        pagesFetched += 1;

        // critério: se não é loadMore e ainda não temos nada, avançar página
        if (!isLoadMore && acc.length === 0 && page < total) {
          page += 1;
          continue;
        }

        // se é loadMore ou já obteve algo, parar
        break;
      }

      // ordenação estrita por postDate
      acc.sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime());

      if (isLoadMore) {
        setFilteredLinks((prev) => [...prev, ...acc]);
      } else {
        setFilteredLinks(acc);
        setCurrentPage(page);
      }

      setTotalPages(total);
      const hasMore = page < total && acc.length > 0;
      setHasMoreContent(hasMore);
    } catch (error) {
      console.error("Error fetching VIP Western content:", error);
      // em erro, manter estado mínimo coerente
      if (!isLoadMore) {
        setFilteredLinks([]);
        setHasMoreContent(false);
      }
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
    }, 200);
    return () => clearTimeout(timer);
  }, [searchName, selectedCategory, selectedMonth, dateFilter]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMoreContent || currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContent(nextPage, true);
  };

  const recentLinks = [...filteredLinks]
    .sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime())
    .slice(0, 5);

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
      const dateKey = formatDateHeader(post.postDate);
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
          ? "bg-gradient-to-br from-gray-900 via-yellow-900/10 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-yellow-100/20 to-gray-100 text-gray-900"
      }`}
    >
      <Helmet>
        <title>VIP Western Content - Sevenxleaks</title>
        <link rel="canonical" href="https://sevenxleaks.com/vip-western" />
      </Helmet>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-[60]">
        <div
          className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl ${
            isDark
              ? "bg-gray-800/60 border-yellow-500/30 shadow-yellow-500/10"
              : "bg-white/80 border-yellow-400/40 shadow-yellow-400/10"
          }`}
        >
          <div
            className={`flex flex-col lg:flex-row items-center gap-4 rounded-2xl px-6 py-4 border shadow-inner ${
              isDark
                ? "bg-gray-700/50 border-yellow-500/20"
                : "bg-gray-100/50 border-yellow-400/30"
            }`}
          >
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Crown className="text-yellow-400 w-5 h-5 animate-pulse" />
              <input
                type="text"
                className={`flex-1 bg-transparent border-none outline-none text-lg ${
                  isDark
                    ? "text-white placeholder-yellow-300/60"
                    : "text-gray-900 placeholder-yellow-600/60"
                }`}
                placeholder="Search VIP Western content..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchLoading && (
                <div
                  className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                    isDark ? "border-yellow-400" : "border-yellow-600"
                  }`}
                />
              )}
            </div>

            {/* Date filters */}
            <div className="flex items-center gap-2">
              {["all", "today", "yesterday", "7days"].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border whitespace-nowrap ${
                    dateFilter === filter
                      ? isDark
                        ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                        : "bg-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/20"
                      : isDark
                      ? "bg-gray-700/50 text-gray-300 hover:bg-yellow-500/20 border-gray-600/50 hover:text-yellow-300"
                      : "bg-gray-200/50 text-gray-700 hover:bg-yellow-100 border-gray-300/50 hover:text-yellow-700"
                  }`}
                  onClick={() => setDateFilter(filter as typeof dateFilter)}
                >
                  {filter === "all"
                    ? "All"
                    : filter === "7days"
                    ? "7 Days"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}

              <div className="month-filter-container">
                <MonthFilter
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  themeColor="yellow"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
              <CategoryFilter
                selected={selectedCategory}
                onChange={setSelectedCategory}
                themeColor="yellow"
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
                    ? "bg-gray-700/50 hover:bg-yellow-500/20 text-gray-300 hover:text-yellow-300 border-yellow-500/30"
                    : "bg-gray-200/50 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 border-yellow-400/40"
                }`}
                title="Switch to VIP Asian"
                onClick={() => navigate("/vip-asian")}
              >
                <i className="fa-solid fa-repeat text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-0">
        <main>
          {loading ? (
            <LoadingSpinner />
          ) : filteredLinks.length > 0 ? (
            <>
              {Object.entries(groupedLinks)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, posts]) => (
                  <div key={date} className="mb-8">
                    <h2
                      className={`text-xl font-bold mb-4 pb-2 border-b font-orbitron flex items-center gap-3 ${
                        isDark
                          ? "text-gray-300 border-yellow-500/30"
                          : "text-gray-700 border-yellow-400/40"
                      }`}
                    >
                      <div className="w-3 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full shadow-lg shadow-yellow-500/30"></div>
                      <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        VIP Western - {date}
                      </span>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    </h2>
                    <div className="space-y-2">
                      {posts
                        .sort(
                          (a, b) =>
                            new Date(b.postDate).getTime() -
                            new Date(a.postDate).getTime()
                        )
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
                                ? "bg-gray-800/60 hover:bg-gray-700/80 border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-yellow-500/20"
                                : "bg-white/60 hover:bg-gray-50/80 border-yellow-400/40 hover:border-yellow-500/60 hover:shadow-yellow-400/20"
                            } border`}
                            onClick={() => {
                              const t = link.contentType || "vip-western";
                              if (t === "vip-asian") navigate(`/vip-asian/${link.slug}`);
                              else if (t === "vip-western") navigate(`/vip-western/${link.slug}`);
                              else if (t === "vip-banned") navigate(`/vip-banned/${link.slug}`);
                              else if (t === "vip-unknown") navigate(`/vip-unknown/${link.slug}`);
                              else navigate(`/vip-western/${link.slug}`);
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                                <h3
                                  className={`text-sm sm:text-lg font-bold transition-colors duration-300 font-orbitron relative truncate ${
                                    isDark
                                      ? "text-white group-hover:text-yellow-300"
                                      : "text-gray-900 group-hover:text-yellow-600"
                                  }`}
                                >
                                  {link.name}
                                  <div className="absolute -bottom-1 left-0 w-16 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </h3>
                                <div
                                  className={`hidden sm:block h-px bg-gradient-to-r to-transparent flex-1 max-w-20 transition-all duration-300 ${
                                    isDark
                                      ? "from-yellow-500/50 group-hover:from-yellow-400/70"
                                      : "from-yellow-400/50 group-hover:from-yellow-500/70"
                                  }`}
                                />
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                {recentLinks.some((r) => r.id === link.id) && (
                                  <span
                                    className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs font-bold rounded-full shadow-lg animate-pulse border font-roboto ${
                                      isDark
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-black border-yellow-400/30"
                                        : "bg-gradient-to-r from-yellow-600 to-orange-700 text-white border-yellow-500/30"
                                    }`}
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    NEW VIP
                                  </span>
                                )}

                                <span
                                  className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full border backdrop-blur-sm font-roboto ${
                                    isDark
                                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30"
                                      : "bg-gradient-to-r from-yellow-200/40 to-orange-200/30 text-yellow-700 border-yellow-400/40"
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
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 shadow-lg hover:shadow-yellow-500/30'
                          : 'bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 shadow-lg hover:shadow-yellow-500/20'
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
              <div className="mb-8">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
              </div>
              <h3
                className={`text-3xl font-bold mb-4 font-orbitron ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                No VIP Western Content Found
              </h3>
              <p
                className={`text-lg font-roboto ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Try adjusting your search or filters to find premium content.
              </p>
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

export default VIPWesternPage;
