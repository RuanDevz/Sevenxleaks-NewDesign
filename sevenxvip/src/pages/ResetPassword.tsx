import React, { useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Token ausente na URL.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/reset-password`;
      const payload = { token, password: newPassword };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (import.meta.env.VITE_FRONTEND_API_KEY) {
        headers["x-api-key"] = import.meta.env.VITE_FRONTEND_API_KEY as string;
      }

      const res = await axios.post(url, payload, { headers });
      setMessage(res.data?.message || "Password reset successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error resetting password. Please try again.";
      setError(apiMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}
    >
      {/* Background Effects */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-gray-900"
            : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/30 via-white to-gray-50"
        }`}
      />
      <div
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? "bg-blue-500/10" : "bg-blue-200/30"
        }`}
      />
      <div
        className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? "bg-purple-500/10" : "bg-purple-200/30"
        }`}
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden ${
            isDark
              ? "bg-gray-800/80 border-gray-700/50"
              : "bg-white/90 border-gray-200/50"
          }`}
        >
          {/* Header */}
          <div
            className={`px-8 py-8 text-center border-b ${
              isDark
                ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-gray-700/50"
                : "bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-gray-200/50"
            }`}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${
                isDark
                  ? "bg-gradient-to-br from-blue-500 to-purple-600"
                  : "bg-gradient-to-br from-blue-600 to-purple-700"
              }`}
            >
              <KeyRound className="w-10 h-10 text-white" />
            </motion.div>

            <h1
              className={`text-3xl font-bold mb-2 font-['Orbitron'] ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Reset Password
            </h1>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                  isDark
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {message}
                </span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                  isDark
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    isDark ? "text-red-400" : "text-red-600"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDark ? "text-red-400" : "text-red-600"
                  }`}
                >
                  {error}
                </span>
              </motion.div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border focus:ring-2 transition-all duration-200 ${
                      isDark
                        ? "bg-gray-900/50 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border focus:ring-2 transition-all duration-200 ${
                      isDark
                        ? "bg-gray-900/50 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  isLoading
                    ? isDark
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gray-300 cursor-not-allowed"
                    : isDark
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/30"
                    : "bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-lg hover:shadow-blue-500/20"
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
