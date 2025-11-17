import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface VIPUserMenuProps {
  name: string | null;
  isMenuOpen: boolean;
  handleMenuToggle: () => void;
  isVip: boolean;
  isAdmin: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const VIPUserMenu: React.FC<VIPUserMenuProps> = ({
  name,
  isMenuOpen,
  setIsMenuOpen,
  handleMenuToggle,
  isVip,
  isAdmin,
}) => {
  const Logout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const isMobile = window.innerWidth <= 768;
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleAccountClick = () => {
    if (isMobile) {
      navigate("/account");
    } else {
      handleMenuToggle();
    }
  };

  return (
    <nav className="relative z-50 left-6">
      {/* Botão principal */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`hidden sm:flex items-center gap-3 cursor-pointer px-3 py-3 ml-4 rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl
          ${
            isDark
              ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-transparent hover:from-yellow-500/30 hover:to-yellow-600/30 hover:shadow-yellow-500/20"
              : "bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300/40 hover:border-yellow-400 hover:from-yellow-200 hover:to-yellow-300 hover:shadow-yellow-200/30"
          }`}
        onClick={handleAccountClick}
      >
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg
            ${
              isDark
                ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border border-transparent ring-0"
                : "bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 border border-yellow-300/40 ring-yellow-300/40"
            }`}
          >
            <i
              className={`fa-solid fa-user text-sm font-bold ${
                isDark ? "text-black" : "text-white"
              }`}
            ></i>
          </div>

          {/* VIP Crown Badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center shadow-lg border border-transparent">
            <Crown className="w-3 h-3 text-black animate-pulse" />
          </div>

          {isAdmin && (
            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border border-transparent">
              <Shield className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="hidden sm:block">
          <p
            className={`font-semibold text-sm font-['Roboto'] ${
              isDark ? "text-yellow-200" : "text-gray-900"
            }`}
          >
            {name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold flex items-center gap-1 text-xs">
              <Crown className="w-3 h-3 animate-pulse" />
              VIP MEMBER
            </span>
            {isAdmin && (
              <span className="text-red-500 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
        </div>
        <i className="fa-solid fa-chevron-down text-yellow-400 text-xs hidden sm:block transition-transform duration-200 group-hover:rotate-180"></i>
      </motion.div>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className={`absolute left-4 mt-4 w-64 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl
              ${
                isDark
                  ? "bg-gray-900/95 border border-transparent"
                  : "bg-white/95 border border-yellow-300/40"
              }`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div
              className={`p-4 border-b
              ${
                isDark
                  ? "bg-gradient-to-br from-yellow-900/60 via-yellow-800/40 to-gray-900/80 border-transparent"
                  : "bg-gradient-to-br from-yellow-100 via-yellow-50 to-gray-100 border-yellow-300/40"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative max-w-10">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg
                    ${
                      isDark
                        ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border border-transparent"
                        : "bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 border border-yellow-300/40"
                    }`}
                  >
                    <i
                      className={`fa-solid fa-user text-sm font-bold ${
                        isDark ? "text-black" : "text-white"
                      }`}
                    ></i>
                  </div>

                  {/* VIP Crown */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center shadow-md border border-transparent">
                    <Crown className="w-3 h-3 text-black animate-pulse" />
                  </div>

                  {isAdmin && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md border border-transparent">
                      <Shield className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p
                    className={`font-bold text-base font-['Roboto'] ${
                      isDark ? "text-yellow-200" : "text-gray-900"
                    }`}
                  >
                    {name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm
                      ${
                        isDark
                          ? "bg-gradient-to-r from-yellow-400/30 to-yellow-500/30 text-yellow-300 border-transparent"
                          : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-600 border-yellow-300/40"
                      }`}
                    >
                      <Crown className="w-3 h-3 animate-pulse" />
                      VIP PREMIUM
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 rounded-full text-xs font-bold border border-transparent backdrop-blur-sm">
                        <Shield className="w-3 h-3" />
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Itens do Menu */}
            <div className="py-2">
              {/* Conta */}
              <div className="px-2">
                <Link
                  to="/account"
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                  ${
                    isDark
                      ? "hover:bg-yellow-500/10 text-yellow-200"
                      : "border hover:bg-yellow-100 hover:border-yellow-300 text-gray-800"
                  }`}
                  onClick={handleMenuToggle}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200
                    ${
                      isDark
                        ? "bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border border-transparent"
                        : "bg-gradient-to-br from-yellow-200 to-yellow-300 border border-yellow-300"
                    }`}
                  >
                    <i className="fa-solid fa-user text-yellow-400 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-yellow-200" : "text-gray-900"
                      }`}
                    >
                      VIP Account
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-yellow-500 text-xs"></i>
                </Link>
              </div>

              {/* VIP Exclusive */}
              <div className="px-3 mt-3">
                <div
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 font-['Roboto']
                  ${isDark ? "text-yellow-500" : "text-yellow-600"}`}
                >
                  VIP EXCLUSIVE
                </div>
                <div className="space-y-1">
                

                  {/* VIP Asian */}
                  <Link
                    to="/vip-asian"
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                    ${
                      isDark
                        ? "hover:bg-yellow-500/10 text-yellow-200"
                        : "border hover:bg-yellow-100 hover:border-yellow-300 text-gray-800"
                    }`}
                    onClick={handleMenuToggle}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-yellow-500/20 flex items-center justify-center
                      ${
                        isDark ? "border border-transparent" : "border border-purple-500/20"
                      }`}
                    >
                      <i className="fa-solid fa-crown text-purple-400 text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold">VIP Asian</span>
                      <p
                        className={`text-xs ${
                          isDark ? "text-yellow-400" : "text-gray-500"
                        }`}
                      >
                        Premium Asian content
                      </p>
                    </div>
                  </Link>

                  {/* VIP Western */}
                  <Link
                    to="/vip-western"
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                    ${
                      isDark
                        ? "hover:bg-yellow-500/10 text-yellow-200"
                        : "border hover:bg-yellow-100 hover:border-yellow-300 text-gray-800"
                    }`}
                    onClick={handleMenuToggle}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center
                      ${
                        isDark ? "border border-transparent" : "border border-orange-500/20"
                      }`}
                    >
                      <i className="fa-solid fa-crown text-orange-400 text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold">VIP Western</span>
                      <p
                        className={`text-xs ${
                          isDark ? "text-yellow-400" : "text-gray-500"
                        }`}
                      >
                        Premium Western content
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Admin Section */}
              {isAdmin && (
                <div className="px-3 mt-3">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 font-['Roboto']
                    ${isDark ? "text-red-500" : "text-red-600"}`}
                  >
                    ADMIN CONTROLS
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/admin/content-requests"
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                      ${
                        isDark
                          ? "hover:bg-red-500/10 text-yellow-200"
                          : "border hover:bg-red-100 hover:border-red-300 text-gray-800"
                      }`}
                      onClick={handleMenuToggle}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center
                        ${
                          isDark ? "border border-transparent" : "border border-red-500/20"
                        }`}
                      >
                        <i className="fa-solid fa-clipboard-list text-red-400 text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold">View Requests</span>
                        <p
                          className={`text-xs ${
                            isDark ? "text-yellow-400" : "text-gray-500"
                          }`}
                        >
                          Manage user requests
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/stats"
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                      ${
                        isDark
                          ? "hover:bg-green-500/10 text-yellow-200"
                          : "border hover:bg-green-100 hover:border-green-300 text-gray-800"
                      }`}
                      onClick={handleMenuToggle}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center
                        ${
                          isDark ? "border border-transparent" : "border border-green-500/20"
                        }`}
                      >
                        <i className="fa-solid fa-chart-line text-green-400 text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold">View Stats</span>
                        <p
                          className={`text-xs ${
                            isDark ? "text-yellow-400" : "text-gray-500"
                          }`}
                        >
                          Analytics & metrics
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/admin/settings"
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                      ${
                        isDark
                          ? "hover:bg-indigo-500/10 text-yellow-200"
                          : "border hover:bg-indigo-100 hover:border-indigo-300 text-gray-800"
                      }`}
                      onClick={handleMenuToggle}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center
                        ${
                          isDark ? "border border-transparent" : "border border-indigo-500/20"
                        }`}
                      >
                        <i className="fa-solid fa-cog text-indigo-400 text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-bold">Admin Settings</span>
                        <p
                          className={`text-xs ${
                            isDark ? "text-yellow-400" : "text-gray-500"
                          }`}
                        >
                          System configuration
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Suporte & Logout */}
              <div
                className={`px-3 mt-4 pt-3 border-t ${
                  isDark ? "border-transparent" : "border-yellow-300/40"
                }`}
              >
                <a
                  href="https://discord.gg/Ec4zzTbsWs"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isDark
                      ? "hover:bg-yellow-500/10 text-yellow-200"
                      : "border hover:bg-yellow-100 hover:border-yellow-300 text-gray-800"
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center
                    ${
                      isDark ? "border border-transparent" : "border border-blue-500/20"
                    }`}
                  >
                    <i className="fa-brands fa-discord text-blue-400 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold">Discord</span>
                    <p
                      className={`text-xs ${
                        isDark ? "text-yellow-400" : "text-gray-500"
                      }`}
                    >
                      Join our Discord community
                    </p>
                  </div>
                </a>

                <button
                  onClick={Logout}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2 group
                  ${
                    isDark
                      ? "hover:bg-red-500/10 text-yellow-200"
                      : "border hover:bg-red-100 hover:border-red-300 text-gray-800"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center
                    ${
                      isDark ? "border border-transparent" : "border border-red-500/20"
                    }`}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket text-red-400 text-sm"></i>
                  </div>
                  <div className="flex flex-col justify-start items-start">
                    <span className="text-sm font-bold">Logout</span>
                    <p
                      className={`text-xs ${
                        isDark ? "text-yellow-400" : "text-gray-500"
                      }`}
                    >
                      Sign out from account
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default VIPUserMenu;
