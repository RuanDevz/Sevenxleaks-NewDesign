import React, { useEffect, useState } from "react";
import { Userdatatypes } from "../../types/Userdatatypes";
import Loading from "../components/Loading/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { 
  Crown, 
  User, 
  Shield, 
  Star, 
  Settings, 
  Mail, 
  Calendar, 
  Edit, 
  LogOut, 
  Trash2, 
  Key,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Phone
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import ChangePasswordModal from "../components/YourAccount/modals/ChangePasswordModal";
import DeleteAccountModal from "../components/YourAccount/modals/DeleteAccountModal";

const YourAccount: React.FC = () => {
  const [userData, setUserData] = useState<Userdatatypes | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const token = localStorage.getItem("Token");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } 
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const calculateDaysLeft = (expirationDate: number): number => {
    const currentDate = new Date();
    const expDate = new Date(expirationDate);
    const timeDiff = expDate.getTime() - currentDate.getTime();
    return Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 0);
  };

  const handleSignout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    window.location.href = '/';
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/stripe-portal/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Erro ao criar sessão do portal:', data.error);
        alert('Erro ao acessar o portal de gerenciamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar sessão do portal:', error);
      alert('Erro ao acessar o portal de gerenciamento. Tente novamente.');
    }
  };

  const getVipTierDisplay = () => {
    if (!userData?.isVip || !userData?.vipTier) return 'Free Member';
    return userData.vipTier === 'titanium' ? 'VIP TITANIUM' : 'VIP DIAMOND';
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <Loading />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <ErrorMessage message="User not found or unable to fetch user data." />
      </div>
    );
  }

  const isSubscriptionActive = userData.vipExpirationDate
    ? new Date(userData.vipExpirationDate) > new Date()
    : false;

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Helmet>
        <title>Your Account - Sevenxleaks</title>
        <link rel="canonical" href="https://sevenxleaks.com/account" />
      </Helmet>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/30 via-white to-gray-50'
        }`}></div>
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-purple-500/10' : 'bg-purple-200/30'
        }`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-blue-500/10' : 'bg-blue-200/30'
        }`}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-700'
              }`}
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            {userData.isVip && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Crown className="w-6 h-6 text-black" />
              </motion.div>
            )}
          </div>

          <h1 className={`text-4xl sm:text-5xl font-bold mb-4 font-orbitron ${
            isDark 
              ? 'bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-purple-600 via-blue-700 to-purple-800 bg-clip-text text-transparent'
          }`}>
            YOUR ACCOUNT
          </h1>
          <p className={`text-lg font-roboto ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Manage your profile, subscription, and preferences
          </p>

          {/* Status Badges */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${
              userData.isVip
                ? userData.vipTier === 'titanium'
                  ? isDark
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                    : 'bg-yellow-100 border-yellow-300 text-yellow-700'
                  : isDark
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-blue-100 border-blue-300 text-blue-700'
                : isDark
                  ? 'bg-gray-700/50 border-gray-600/30 text-gray-400'
                  : 'bg-gray-200 border-gray-300 text-gray-600'
            }`}>
              <Crown className="w-4 h-4" />
              <span className="font-medium text-sm">
                {getVipTierDisplay()}
              </span>
            </div>
            
            {userData.isAdmin && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm ${
                isDark 
                  ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                  : 'bg-red-100 border-red-300 text-red-700'
              } border`}>
                <Shield className="w-4 h-4" />
                <span className="font-medium text-sm">Administrator</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Single Column Layout */}
        <div className="space-y-8">
          {/* User Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
              isDark 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isDark 
                ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-600 to-blue-700'
                }`}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Profile Information</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Your personal details and account info</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {userData.profileImage ? (
                      <img
                        src={userData.profileImage}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isDark 
                          ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
                          : 'bg-gradient-to-br from-gray-200 to-gray-300'
                      }`}>
                        <User className={`w-12 h-12 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      </div>
                    )}
                  </div>
                  {userData.isVip && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="w-4 h-4 text-black" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-2 font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {userData.name}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className={`w-4 h-4 ${
                        isDark ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                      <span className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>{userData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <span className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Member since {new Date(userData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
              isDark 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isDark 
                ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                  userData.isVip 
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black'
                    : isDark
                      ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-400'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600'
                }`}>
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Subscription Status</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Manage your VIP subscription</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isDark 
                    ? 'bg-gray-700/50 border-gray-600/30' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    userData.isVip 
                      ? isDark
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-green-100 text-green-600'
                      : isDark
                        ? 'bg-gray-600/20 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {userData.isVip ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`font-medium mb-1 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Current Plan</h4>
                    <p className={`text-lg font-semibold font-orbitron ${
                      userData.isVip
                        ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                        : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {userData.isVip ? "VIP Subscription" : "Free Account"}
                    </p>
                  </div>
                </div>
                
                {userData.isVip && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600/30' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-medium mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Expires</h4>
                      <p className={`text-lg font-semibold font-orbitron ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {calculateDaysLeft(userData.vipExpirationDate)} days
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link to="/plans">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-lg font-orbitron ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white hover:shadow-purple-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-700 hover:to-blue-800 text-white hover:shadow-purple-500/30'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    {userData.isVip ? "Change Plan" : "Upgrade to VIP"}
                  </motion.button>
                </Link>
                
                {userData.isVip && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleManageSubscription}
                    className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 border ${
                      isDark 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                        : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* VIP Benefits (if VIP) */}
                   {userData.isVip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
                isDark 
                  ? 'bg-gray-800/60 border-gray-700' 
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <div className={`px-6 py-4 border-b ${
                isDark 
                  ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                    isDark 
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
                      : 'bg-gradient-to-br from-yellow-600 to-yellow-700'
                  }`}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold font-orbitron ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>VIP Benefits</h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Your exclusive member privileges</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Unlimited access to premium content",
                    "Early access to new releases", 
                    "Ad-free experience",
                    "Priority support",
                    "Exclusive downloads",
                    "HD quality streaming"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isDark 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <span className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Account Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
              isDark 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isDark 
                ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-red-500 to-red-600' 
                    : 'bg-gradient-to-br from-red-600 to-red-700'
                }`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Account Security</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Manage your security settings</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-200 flex items-center gap-3 border cursor-pointer ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white border-transparent hover:border-purple-500/20'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-purple-300'
                  }`}
                >
                  <Key className={`w-5 h-5 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <div>
                    <span className="font-medium">Change Password</span>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Update your account password</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
              isDark 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isDark 
                ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                }`}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Contact & Support</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Get help when you need it</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://discord.gg/Ec4zzTbsWs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600/30 hover:border-purple-500/30'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Discord Support</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Community help</p>
                  </div>
                  <ExternalLink className={`w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </a>
                
                <a 
                  href="mailto:dmca@sevenxleaks.com"
                  className={`p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600/30 hover:border-red-500/30'
                      : 'bg-gray-50 border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>DMCA Requests</h4>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>dmca@sevenxleaks.com</p>
                  </div>
                  <ExternalLink className={`w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
              isDark 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isDark 
                ? 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-gray-600 to-gray-700' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Account Actions</h3>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Manage your account settings</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={handleSignout}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-200 flex items-center gap-3 border ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white border-transparent hover:border-gray-500/20'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  <LogOut className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <div>
                    <span className="font-medium">Sign Out</span>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Sign out of your account</p>
                  </div>
                </button>

                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-200 flex items-center gap-3 border cursor-pointer ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 border-transparent hover:border-red-500/20'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700 border-transparent hover:border-red-300'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  <div>
                    <span className="font-medium">Delete Account</span>
                    <p className={`text-sm ${
                      isDark ? 'text-red-300' : 'text-red-500'
                    }`}>Permanently delete your account</p>
                  </div>
                </button>

                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className={`w-full p-4 text-left rounded-xl transition-all duration-200 flex items-center gap-3 border cursor-pointer ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white border-transparent hover:border-purple-500/20'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-purple-300'
                  }`}
                >
                  <Key className={`w-5 h-5 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <div>
                    <span className="font-medium">Change Password</span>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Update your account password</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modals */}
        <ChangePasswordModal 
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userEmail={userData.email}
        />
        
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          userEmail={userData.email}
        />
      </div>
    </div>
  );
};

export default YourAccount;