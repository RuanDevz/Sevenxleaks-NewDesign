import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useContentStore } from '../store/contentStore';

type LinkItem = {
  id: string;
  name: string;
  category: string;
  postDate: string;
  slug: string;
  preview?: string;
  thumbnail?: string;
  createdAt: string;
  contentType?: string;
};

type Category = {
  id: string;
  name: string;
  category: string;
};

type UseContentCacheOptions = {
  contentType: 'asian' | 'western' | 'banned' | 'unknown' | 'vipAsian' | 'vipWestern' | 'vipBanned' | 'vipUnknown';
  filterFn?: (items: LinkItem[]) => LinkItem[];
  requiresAuth?: boolean;
};

export const useContentCache = ({ contentType, filterFn, requiresAuth = false }: UseContentCacheOptions) => {
  const { getCache, setCache, isCacheValid, appendToCache } = useContentStore();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('');

  function decodeModifiedBase64<T>(encodedStr: string): T {
    const fixedBase64 = encodedStr.slice(0, 2) + encodedStr.slice(3);
    const jsonString = atob(fixedBase64);
    return JSON.parse(jsonString) as T;
  }

  // Restaurar filtros do cache ao montar
  useEffect(() => {
    const cache = getCache(contentType);
    if (cache) {
      setSearchName(cache.filters.searchName);
      setSelectedCategory(cache.filters.selectedCategory);
      setDateFilter(cache.filters.dateFilter);
      setSelectedMonth(cache.filters.selectedMonth);
    }
  }, [contentType]);

  const fetchContent = useCallback(async (page: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      if (isLoadMore) setLoadingMore(true);
      setSearchLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        sortBy: 'postDate',
        sortOrder: 'DESC',
        limit: '300',
      });

      if (searchName) params.append('search', searchName);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedMonth) params.append('month', selectedMonth);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);

      const headers: Record<string, string> = {
        'x-api-key': `${import.meta.env.VITE_FRONTEND_API_KEY}`,
      };

      if (requiresAuth) {
        const token = localStorage.getItem('Token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/universal-search/search?${params}`,
        { headers }
      );

      if (!response.data?.data) throw new Error('Invalid server response');

      const decoded = decodeModifiedBase64<{ data: LinkItem[]; totalPages: number }>(
        response.data.data
      );

      const { data: allData, totalPages } = decoded;

      const rawData = filterFn ? filterFn(allData) : allData;

      if (isLoadMore) {
        setLinks((prev) => [...prev, ...rawData]);
        setFilteredLinks((prev) => [...prev, ...rawData]);
        appendToCache(contentType, rawData, page);
      } else {
        setLinks(rawData);
        setFilteredLinks(rawData);
        setCurrentPage(1);
      }

      setTotalPages(totalPages);
      const hasMore = page < totalPages && rawData.length > 0;
      setHasMoreContent(hasMore);

      const uniqueCategories = Array.from(new Set(rawData.map((item) => item.category))).map(
        (category) => ({ id: category, name: category, category })
      );

      setCategories((prev) => {
        const existingCategories = new Set(prev.map((c) => c.category));
        const newCategories = uniqueCategories.filter((c) => !existingCategories.has(c.category));
        return [...prev, ...newCategories];
      });

      if (!isLoadMore) {
        setCache(contentType, {
          links: rawData,
          categories: [...categories, ...uniqueCategories],
          currentPage: 1,
          totalPages,
          hasMoreContent: hasMore,
          filters: { searchName, selectedCategory, selectedMonth, dateFilter },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error(`Error fetching ${contentType} content:`, error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  }, [contentType, searchName, selectedCategory, selectedMonth, dateFilter, filterFn, requiresAuth]);

  useEffect(() => {
    const currentFilters = { searchName, selectedCategory, selectedMonth, dateFilter };

    if (isCacheValid(contentType, currentFilters)) {
      const cache = getCache(contentType);
      if (cache) {
        setLinks(cache.links);
        setFilteredLinks(cache.links);
        setCategories(cache.categories);
        setCurrentPage(cache.currentPage);
        setTotalPages(cache.totalPages);
        setHasMoreContent(cache.hasMoreContent);
        setLoading(false);
        return;
      }
    }

    const timer = setTimeout(() => {
      setHasMoreContent(true);
      fetchContent(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName, selectedCategory, dateFilter, selectedMonth, contentType]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMoreContent || currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContent(nextPage, true);
  }, [loadingMore, hasMoreContent, currentPage, totalPages, fetchContent]);

  return {
    links,
    filteredLinks,
    categories,
    searchName,
    setSearchName,
    selectedCategory,
    setSelectedCategory,
    dateFilter,
    setDateFilter,
    loading,
    loadingMore,
    currentPage,
    hasMoreContent,
    searchLoading,
    totalPages,
    selectedMonth,
    setSelectedMonth,
    handleLoadMore,
  };
};
