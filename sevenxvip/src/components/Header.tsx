import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import BlackFridayBanner from "./BlackFridayBanner";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const getLogoText = () => {
    if (location.pathname.includes("western")) return " WESTERN";
    if (location.pathname.includes("asian")) return " ASIAN";
    if (location.pathname.includes("banned")) return " BANNED";
    if (location.pathname.includes("unknown")) return " UNKNOWN";
    if (location.pathname.includes("vip")) return " VIP";
    if (location.pathname.includes("plans")) return " PLANS";
    if (location.pathname.includes("login")) return " LOGIN";
    if (location.pathname.includes("register")) return " REGISTER";
    return "";
  };

  const getThemeClasses = () => {
    if (location.pathname === "/western") {
      return {
        accent: "text-orange-400",
        accentHover: "hover:text-orange-300",
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
        gradientHover: "hover:from-orange-600 hover:to-orange-700",
        border: "border-orange-500/20",
        bg: "bg-orange-500/10",
        glow: "shadow-orange-500/20",
      };
    }
    if (location.pathname.includes("vip")) {
      return {
        accent: "text-yellow-400",
        accentHover: "hover:text-yellow-300",
        gradient: "bg-gradient-to-r from-yellow-500 to-yellow-600",
        gradientHover: "hover:from-yellow-600 hover:to-yellow-700",
        border: "border-yellow-500/20",
        bg: "bg-yellow-500/10",
        glow: "shadow-yellow-500/20",
      };
    }
    if (location.pathname.includes("banned")) {
      return {
        accent: "text-red-400",
        accentHover: "hover:text-red-300",
        gradient: "bg-gradient-to-r from-red-500 to-red-600",
        gradientHover: "hover:from-red-600 hover:to-red-700",
        border: "border-red-500/20",
        bg: "bg-red-500/10",
        glow: "shadow-red-500/20",
      };
    }
    if (location.pathname.includes("unknown")) {
      return {
        accent: "text-slate-400",
        accentHover: "hover:text-slate-300",
        gradient: "bg-gradient-to-r from-slate-500 to-slate-600",
        gradientHover: "hover:from-slate-600 hover:to-slate-700",
        border: "border-slate-500/20",
        bg: "bg-slate-500/10",
        glow: "shadow-slate-500/20",
      };
    }
    return {
      accent: "text-purple-400",
      accentHover: "hover:text-purple-300",
      gradient: "bg-gradient-to-r from-slate-500 to-slate-600",
      gradientHover: "hover:from-slate-600 hover:to-slate-700",
      border: "border-slate-500/20",
      bg: "bg-purple-500/10",
      glow: "shadow-purple-500/20",
    };
  };

  const themeClasses = getThemeClasses();

  const menuItems = [
    { name: "Home", path: "/", icon: "fa-solid fa-house" },
    { name: "Banned", path: "/banned", icon: "fa-solid fa-ban" },
    { name: "Unknown", path: "/unknown", icon: "fa-regular fa-circle-question" },
    { name: "Plans", path: "/plans", icon: "fa-solid fa-crown" },
    {
      name: "Discord",
      path: "https://discord.gg/Ec4zzTbsWs",
      icon: "fa-brands fa-discord",
      external: true,
    },
    { name: "Login", path: "/login", icon: "fa-solid fa-right-to-bracket" },
    { name: "Register", path: "/register", icon: "fa-regular fa-registered" },
  ];

  return (
    <header className={`w-full sticky top-0 z-50 backdrop-blur-xl shadow-2xl border-b ${
      isDark 
        ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-700/30' 
        : 'bg-gradient-to-r from-white via-gray-50 to-white border-gray-200/30'
    }`}>

      <BlackFridayBanner/>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className={`text-sm sm:text-base lg:text-lg font-bold tracking-wide font-orbitron ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span>SEVENXLEAKS</span>
                {location.pathname !== "/" && (
                  <span className={`ml-2 ${themeClasses.accent} drop-shadow-lg`}>
                    {getLogoText()}
                  </span>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent ${themeClasses.border} ${themeClasses.glow} ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm">Home</span>
              <div className={`absolute inset-0 ${themeClasses.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
            </Link>

            <Link 
              to="/banned" 
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent border-slate-500/20 shadow-slate-500/20 ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm flex items-center gap-2">
                <i className={`fa-solid fa-ban text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}></i>
                Banned
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </Link>

            <Link 
              to="/unknown" 
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent border-gray-500/20 shadow-gray-500/20 ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm flex items-center gap-2">
                <i className={`fa-solid fa-question text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}></i>
                Unknown
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </Link>

            <Link 
              to="/plans" 
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent border-slate-500/20 shadow-slate-500/20 ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm flex items-center gap-2">
                <i className={`fa-solid fa-crown text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}></i>
                Plans
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </Link>

            <a 
              href="https://discord.gg/Ec4zzTbsWs"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent border-slate-500/20 shadow-slate-500/20 ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm flex items-center gap-2">
                <i className={`fab fa-discord text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}></i>
                Discord
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </a>

<div >
              <Link 
              to="/login" 
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent ${themeClasses.border} ${themeClasses.glow} ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm">Login</span>
              <div className={`absolute inset-0 ${themeClasses.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
            </Link>

                        <Link 
              to="/register" 
              className={`relative px-4 py-2 transition-all duration-300 group rounded-lg backdrop-blur-sm border border-transparent ${themeClasses.border} ${themeClasses.glow} ${
                isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-800 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              <span className="relative z-10 font-medium font-roboto text-sm">Register</span>
              <div className={`absolute inset-0 ${themeClasses.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
            </Link>
</div>
          </nav>

          {/* Actions Section */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            <Link to="/plans">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 transform border border-yellow-400/20 font-orbitron text-sm"
              >
                <i className="fa-solid fa-crown text-sm animate-pulse"></i>
                <span>VIP ACCESS</span>
              </motion.button>
            </Link>

            {/* Simple Mobile Menu Toggle */}
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className={`md:hidden p-2 transition-colors duration-200 ${
    isDark
      ? "text-gray-300 hover:text-white"
      : "text-gray-800 hover:text-black"
  }`}
  onClick={toggleMenu}
>

              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <motion.span
                  animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className="w-6 h-0.5 bg-current block transition-all duration-300 origin-center"
                />
                <motion.span
                  animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="w-6 h-0.5 bg-current block mt-1.5 transition-all duration-300"
                />
                <motion.span
                  animate={isMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className="w-6 h-0.5 bg-current block mt-1.5 transition-all duration-300 origin-center"
                />
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`md:hidden inset-0 top-16 sm:top-18 lg:top-20 z-50 h-[800px] ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            {/* Close Button */}
            <div className="absolute top-6 right-6">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
              />
            </div>

            {/* Logo */}
            <div className="text-center pt-16 pb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-1 mb-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    themeClasses.gradient.replace("bg-gradient-to-r", "bg-gradient-to-br")
                  }`}
                >
                  <i className="fa-solid fa-crown text-white text-xl"></i>
                </div>
                <h2 className="text-3xl font-bold text-white font-orbitron"></h2>
                <h2 className={`text-3xl font-bold font-orbitron ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>MENU</h2>
              </motion.div>
              <div className={`w-32 h-1 mx-auto rounded-full ${themeClasses.gradient}`}></div>
            </div>

            {/* Menu Items */}
            <div className="px-8 py-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 px-6 py-4 ${themeClasses.bg} rounded-xl transition-all duration-300 border border-transparent ${themeClasses.border} backdrop-blur-sm ${
                        isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-800 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-12 h-12 ${themeClasses.bg} rounded-xl flex items-center justify-center border ${themeClasses.border}`}>
                        <i className={`${item.icon} ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-lg">{item.name}</span>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>External link</p>
                      </div>
                      <i className="fa-solid fa-external-link text-xs"></i>
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 px-6 py-4 ${themeClasses.bg} rounded-xl transition-all duration-300 border border-transparent ${themeClasses.border} backdrop-blur-sm ${
                        isDark 
                          ? 'text-gray-300 hover:text-white' 
                          : 'text-gray-800 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-12 h-12 ${themeClasses.bg} rounded-xl flex items-center justify-center border ${themeClasses.border}`}>
                        <i className={`${item.icon} ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-lg">{item.name}</span>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>Navigate to page</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </Link>
                  )}
                </motion.div>
              ))}

              {/* Special Actions for Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={`pt-6 border-t ${themeClasses.border} space-y-3`}
              >
                <Link to="/plans" onClick={toggleMenu}>
                  <div className={`flex items-center gap-4 px-6 py-4 ${themeClasses.gradient} border ${themeClasses.border} rounded-xl hover:opacity-90 transition-all duration-300`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      isDark 
                        ? 'bg-yellow-500/30 border-yellow-500/40' 
                        : 'bg-yellow-200/50 border-yellow-400/50'
                    }`}>
                      <i className={`fa-solid fa-crown ${
                        isDark ? 'text-yellow-400' : 'text-yellow-600'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <span className={`font-bold text-lg ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Get VIP Access</span>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}>Unlock premium features</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;