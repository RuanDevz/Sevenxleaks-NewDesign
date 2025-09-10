// DateRangeFilter.tsx
import React from "react";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

export type DateFilterValue = "all" | "today" | "yesterday" | "7days";

type Props = {
  value: DateFilterValue;
  onChange: (v: DateFilterValue) => void;
  themeColor?: "purple" | "orange" | "yellow" | "red" | "slate";
  className?: string;
};

export const DateRangeFilter: React.FC<Props> = ({ 
  value, 
  onChange, 
  themeColor = "purple", 
  className 
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getThemeClasses = () => {
    const themes = {
      purple: {
        active: isDark 
          ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30"
          : "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20",
        inactive: isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-purple-500/20 border-gray-600/50 hover:text-purple-300 hover:border-purple-500/30"
          : "bg-gray-200/50 text-gray-700 hover:bg-purple-100 border-gray-300/50 hover:text-purple-700 hover:border-purple-400/40"
      },
      orange: {
        active: isDark 
          ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30"
          : "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20",
        inactive: isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-orange-500/20 border-gray-600/50 hover:text-orange-300 hover:border-orange-500/30"
          : "bg-gray-200/50 text-gray-700 hover:bg-orange-100 border-gray-300/50 hover:text-orange-700 hover:border-orange-400/40"
      },
      yellow: {
        active: isDark 
          ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
          : "bg-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/20",
        inactive: isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-yellow-500/20 border-gray-600/50 hover:text-yellow-300 hover:border-yellow-500/30"
          : "bg-gray-200/50 text-gray-700 hover:bg-yellow-100 border-gray-300/50 hover:text-yellow-700 hover:border-yellow-400/40"
      },
      red: {
        active: isDark 
          ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30"
          : "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20",
        inactive: isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-red-500/20 border-gray-600/50 hover:text-red-300 hover:border-red-500/30"
          : "bg-gray-200/50 text-gray-700 hover:bg-red-100 border-gray-300/50 hover:text-red-700 hover:border-red-400/40"
      },
      slate: {
        active: isDark 
          ? "bg-slate-500 text-white border-slate-400 shadow-lg shadow-slate-500/30"
          : "bg-slate-600 text-white border-slate-500 shadow-lg shadow-slate-500/20",
        inactive: isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-slate-500/20 border-gray-600/50 hover:text-slate-300 hover:border-slate-500/30"
          : "bg-gray-200/50 text-gray-700 hover:bg-slate-100 border-gray-300/50 hover:text-slate-700 hover:border-slate-400/40"
      }
    };
    return themes[themeColor];
  };

  const themeClasses = getThemeClasses();

  const baseBtn = "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border whitespace-nowrap";

  const label = (k: DateFilterValue) =>
    k === "all" ? "All" : k === "7days" ? "7 Days" : k.charAt(0).toUpperCase() + k.slice(1);

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Calendar className={`w-4 h-4 ${
        themeColor === 'purple' ? isDark ? 'text-purple-400' : 'text-purple-600' :
        themeColor === 'orange' ? isDark ? 'text-orange-400' : 'text-orange-600' :
        themeColor === 'yellow' ? isDark ? 'text-yellow-400' : 'text-yellow-600' :
        themeColor === 'red' ? isDark ? 'text-red-400' : 'text-red-600' :
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`} />
      {(["all", "today", "yesterday", "7days"] as DateFilterValue[]).map((k) => (
        <motion.button
          key={k}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`${baseBtn} ${value === k ? themeClasses.active : themeClasses.inactive}`}
          onClick={() => onChange(k)}
        >
          {label(k)}
        </motion.button>
      ))}
    </div>
  );
};

// -------- Utilitário de filtragem com lógica -1 dia --------
export type WithDates = { postDate?: string; createdAt?: string };

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

// parse local robusto (evita UTC em YYYY-MM-DD)
function parseDateLocal(s?: string): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : new Date(t);
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3], 12, 0, 0, 0);
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

/** 
 * postDate ajustado em -1 dia conforme solicitado. 
 * Fallback em createdAt se postDate não existir.
 */
export function applyDateFilter<T extends WithDates>(
  items: T[],
  filter: "all" | "today" | "yesterday" | "7days"
): T[] {
  if (filter === "all") return items;

  const now = new Date();
  const today0 = startOfDayLocal(now);
  const yesterday0 = new Date(today0); 
  yesterday0.setDate(yesterday0.getDate() - 1);
  const sevenDays0 = new Date(today0); 
  sevenDays0.setDate(sevenDays0.getDate() - 7);

  return items.filter((it) => {
    const base = parseDateLocal(it.postDate) ?? parseDateLocal(it.createdAt);
    if (!base) return false;

    // LÓGICA CORRIGIDA: Como o postDate já representa o dia anterior ao real,
    // precisamos adicionar +1 dia para obter a data real do conteúdo
    const realContentDate = new Date(base);
    realContentDate.setDate(realContentDate.getDate() + 1);
    const contentTime = realContentDate.getTime();
    
    const todayEnd = new Date(today0);
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayEnd = new Date(yesterday0);
    yesterdayEnd.setHours(23, 59, 59, 999);

    if (filter === "today") {
      return contentTime >= today0.getTime() && contentTime <= todayEnd.getTime();
    }
    if (filter === "yesterday") {
      return contentTime >= yesterday0.getTime() && contentTime <= yesterdayEnd.getTime();
    }
    if (filter === "7days") {
      return contentTime >= sevenDays0.getTime() && contentTime <= todayEnd.getTime();
    }
    
    return false;
  });
}