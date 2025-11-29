import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

type FilterState = {
  searchName: string;
  selectedCategory: string;
  selectedMonth: string;
  dateFilter: string;
};

type ContentCache = {
  links: LinkItem[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
  hasMoreContent: boolean;
  filters: FilterState;
  timestamp: number;
};

type ContentStore = {
  // Cache por tipo de conteúdo
  caches: {
    asian: ContentCache | null;
    western: ContentCache | null;
    banned: ContentCache | null;
    unknown: ContentCache | null;
    vipAsian: ContentCache | null;
    vipWestern: ContentCache | null;
    vipBanned: ContentCache | null;
    vipUnknown: ContentCache | null;
  };

  // Ações para gerenciar o cache
  setCache: (contentType: keyof ContentStore['caches'], data: ContentCache) => void;
  getCache: (contentType: keyof ContentStore['caches']) => ContentCache | null;
  clearCache: (contentType: keyof ContentStore['caches']) => void;
  clearAllCaches: () => void;
  isCacheValid: (contentType: keyof ContentStore['caches'], filters: FilterState) => boolean;
  appendToCache: (contentType: keyof ContentStore['caches'], newLinks: LinkItem[], newPage: number) => void;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const areFiltersEqual = (f1: FilterState, f2: FilterState): boolean => {
  return (
    f1.searchName === f2.searchName &&
    f1.selectedCategory === f2.selectedCategory &&
    f1.selectedMonth === f2.selectedMonth &&
    f1.dateFilter === f2.dateFilter
  );
};

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      caches: {
        asian: null,
        western: null,
        banned: null,
        unknown: null,
        vipAsian: null,
        vipWestern: null,
        vipBanned: null,
        vipUnknown: null,
      },

      setCache: (contentType, data) => {
        set((state) => ({
          caches: {
            ...state.caches,
            [contentType]: data,
          },
        }));
      },

      getCache: (contentType) => {
        const cache = get().caches[contentType];
        if (!cache) return null;

        // Verifica se o cache expirou
        const now = Date.now();
        if (now - cache.timestamp > CACHE_DURATION) {
          get().clearCache(contentType);
          return null;
        }

        return cache;
      },

      clearCache: (contentType) => {
        set((state) => ({
          caches: {
            ...state.caches,
            [contentType]: null,
          },
        }));
      },

      clearAllCaches: () => {
        set({
          caches: {
            asian: null,
            western: null,
            banned: null,
            unknown: null,
            vipAsian: null,
            vipWestern: null,
            vipBanned: null,
            vipUnknown: null,
          },
        });
      },

      isCacheValid: (contentType, filters) => {
        const cache = get().getCache(contentType);
        if (!cache) return false;
        return areFiltersEqual(cache.filters, filters);
      },

      appendToCache: (contentType, newLinks, newPage) => {
        const cache = get().caches[contentType];
        if (!cache) return;

        set((state) => ({
          caches: {
            ...state.caches,
            [contentType]: {
              ...cache,
              links: [...cache.links, ...newLinks],
              currentPage: newPage,
              hasMoreContent: newPage < cache.totalPages,
              timestamp: Date.now(),
            },
          },
        }));
      },
    }),
    {
      name: 'content-cache-storage',
      partialize: (state) => ({ caches: state.caches }),
    }
  )
);
