// src/components/CategoryFilter.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tags, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

export interface CategoryOption {
  value: string;
  label: string;
}

interface CategoryFilterProps {
  selected: string;
  onChange: (value: string) => void;
  options: CategoryOption[]; 
  themeColor?: "purple" | "orange" | "yellow" | "red" | "slate";
  placeholder?: string; 
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selected,
  onChange,
  options,
  themeColor = "purple",
  placeholder = "All Categories",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const idxSelected = Math.max(
    0,
    options.findIndex((o) => o.value === selected)
  );

  const themeClasses = useMemo(() => {
    const light = {
      button:
        "bg-gray-200/50 hover:bg-opacity-70 text-gray-700 border-gray-300/50",
      dropdown: "bg-white border-gray-200",
      item: "hover:bg-opacity-70 text-gray-700",
      accent: {
        purple: "hover:bg-purple-100 hover:text-purple-700",
        orange: "hover:bg-orange-100 hover:text-orange-700",
        yellow:
          "border-yellow-400/40 hover:bg-yellow-100 hover:text-yellow-700",
        red: "hover:bg-red-100 hover:text-red-700",
        slate: "hover:bg-slate-100 hover:text-slate-700",
      },
    };
    const dark = {
      button:
        "bg-gray-700/50 hover:bg-opacity-60 text-gray-300 border-gray-600/50",
      dropdown: "bg-gray-800 border-gray-700",
      item: "hover:bg-opacity-60 text-gray-300",
      accent: {
        purple: "hover:bg-purple-500/20 hover:text-purple-300",
        orange: "hover:bg-orange-500/20 hover:text-orange-300",
        yellow:
          "border-yellow-500/30 hover:bg-yellow-500/20 hover:text-yellow-300",
        red: "hover:bg-red-500/20 hover:text-red-300",
        slate: "hover:bg-slate-500/20 hover:text-slate-300",
      },
    };
    const base = isDark ? dark : light;
    return {
      button: base.button,
      dropdown: base.dropdown,
      item: `${base.item} ${base.accent[themeColor]}`,
      dropdownBorder:
        themeColor === "yellow"
          ? isDark
            ? "border-yellow-500/30"
            : "border-yellow-400/40"
          : "",
    };
  }, [isDark, themeColor]);

  const selectedLabel =
    options.find((o) => o.value === selected)?.label || placeholder;

  // A11y: ESC, setas, Enter/Espaço
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    const n = options.length;
    const i = Math.max(0, idxSelected);
    if (e.key === "Escape") {
      setIsOpen(false);
      btnRef.current?.focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = options[(i + 1) % n];
      onChange(next.value);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = options[(i - 1 + n) % n];
      onChange(prev.value);
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(false);
      btnRef.current?.focus();
    }
  };

  useEffect(() => {
    if (isOpen) listRef.current?.focus();
  }, [isOpen]);

  return (
    <div className="relative z-50" onKeyDown={onKeyDown}>
      <motion.button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter by category"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 border ${themeClasses.button}`}
      >
        <Tags className="w-4 h-4" />
        <span className="text-xs font-medium min-w-[120px] text-left truncate">
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            aria-activedescendant={`cat-${idxSelected}`}
            tabIndex={-1}
            ref={listRef}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-full mt-2 right-0 w-56 rounded-xl shadow-xl border backdrop-blur-xl ${themeClasses.dropdown} ${themeClasses.dropdownBorder}`}
          >
            <div className="p-2 max-h-72 overflow-y-auto">
              {options.map((opt, i) => {
                const active = selected === opt.value;
                return (
                  <motion.button
                    id={`cat-${i}`}
                    role="option"
                    aria-selected={active}
                    key={opt.value || "__all"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      btnRef.current?.focus();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 outline-none ${themeClasses.item} ${
                      active ? "font-semibold" : ""
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default CategoryFilter;
