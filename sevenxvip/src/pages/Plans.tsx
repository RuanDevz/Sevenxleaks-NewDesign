import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Zap, MessageCircle, Star, Trophy, X, Flame } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Helmet } from "react-helmet";

const Plans: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userIsVip, setUserIsVip] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const navigate = useNavigate();
  const token = localStorage.getItem("Token");
  const email = localStorage.getItem("email");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const checkAuthAndVipStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const authResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (authResponse.ok) {
          setIsAuthenticated(true);
          const userData = await authResponse.json();
          setUserIsVip(userData.isVip);
        } else {
          localStorage.removeItem("Token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication or VIP status:", error);
        localStorage.removeItem("Token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndVipStatus();
  }, [token, email]);

  const handleAccessClick = async (vipTier: "diamond" | "titanium" | "lifetime") => {
    const token = localStorage.getItem("Token");
    const email = localStorage.getItem("email");

    if (!token) {
      navigate('/register');
      return;
    }

    if (!email) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        navigate('/login');
        return;
      }

      const paymentResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/pay/vip-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          planType: billingCycle,
          vipTier: vipTier
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.url) {
        window.location.href = paymentData.url;
      } else {
        alert(paymentData.error || "Erro ao redirecionar para o Stripe.");
      }
    } catch (error) {
      console.error("Erro ao iniciar o checkout:", error);
      alert("Erro ao processar pagamento. Veja o console para detalhes.");
    }
  };

  if (loading) return <Loading />;

  const plans = {
    free: {
      name: "FREE",
      icon: Star,
      color: "gray",
      gradient: isDark
        ? "from-gray-600 to-gray-700"
        : "from-gray-500 to-gray-600",
      price: {
        monthly: 0,
        annual: 0
      },
      features: [
        { icon: Check, text: "Early access to new content", active: true },
        { icon: Check, text: "High Resolution Content", active: true },
        { icon: Check, text: "Basic Discord access", active: true },
        { icon: Check, text: "Standard support", active: true },
        { icon: Check, text: "Community features", active: true },
        { icon: X, text: "Exclusive VIP content access", active: false },
        { icon: X, text: "Ad-free experience", active: false },
        { icon: X, text: "Request tickets (1/month)", active: false },
      ]
    },
    diamond: {
      name: "VIP DIAMOND",
      icon: Crown,
      color: "blue",
      gradient: isDark
        ? "from-blue-500 to-cyan-500"
        : "from-blue-600 to-cyan-600",
      price: {
        monthly: 12,
        annual: 80
      },
      features: [
        { icon: Check, text: "Exclusive VIP content access" },
        { icon: Check, text: "Early access to new content" },
        { icon: Check, text: "High Resolution Content" },
        { icon: Check, text: "Ad-free experience" },
        { icon: Check, text: "Priority support 24/7" },
        { icon: Check, text: "Community features" },
        { icon: Crown, text: "VIP Discord DIAMOND badge", highlight: true },
        { icon: Star, text: billingCycle === "annual" ? "2 Request tickets (2/month)" : "1 Request tickets (1/month)", highlight: true },
      ]
    },
    vitality: {
      name: "BLACK FRIDAY LIFETIME",
      icon: Flame,
      color: "black",
      gradient: isDark
        ? "from-gray-900 via-black to-gray-900"
        : "from-black via-gray-900 to-black",
      price: 199.99,
      originalPrice: 499,
      features: [
        { icon: Flame, text: "LIFETIME ACCESS - Forever!", highlight: true },
        { icon: Check, text: "Everything in DIAMOND" },
        { icon: Crown, text: "Exclusive LIFETIME badge", highlight: true },
        { icon: Zap, text: "2 Request tickets (2/month)", highlight: true },
        { icon: Star, text: "Never pay again!", highlight: true },
        { icon: Check, text: "All future features included" },
        { icon: Check, text: "VIP priority support 24/7" },
        { icon: MessageCircle, text: "Direct line to founders" },
      ],
      isPopular: true,
      isLimited: true
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Helmet>
        <title>Sevenxleaks - VIP Plans</title>
        <link rel="canonical" href={`https://sevenxleaks.com/plans`} />
      </Helmet>

      {/* Background Effects */}
      <div className={`absolute inset-0 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-gray-900 to-gray-900'
          : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100/30 via-white to-gray-50'
      }`}></div>
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
        isDark ? 'bg-yellow-500/10' : 'bg-yellow-200/30'
      }`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
        isDark ? 'bg-blue-500/10' : 'bg-blue-200/30'
      }`}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${
              isDark
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-yellow-500/30'
                : 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/20'
            }`}
          >
            <Crown className="w-12 h-12 text-black" />
          </motion.div>

          <h1
            className={`text-5xl sm:text-6xl font-bold mb-6 font-orbitron bg-clip-text text-transparent ${
              isDark
                ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500'
                : 'bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800'
            }`}
          >
            VIP LOUNGE
          </h1>
          <p
            className={`text-xl max-w-2xl mx-auto font-roboto mb-8 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Choose your elite membership tier
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`inline-flex items-center p-1 rounded-full border-2 ${
              isDark
                ? 'bg-gray-800/60 border-yellow-500/30'
                : 'bg-white/60 border-yellow-400/40'
            } backdrop-blur-xl shadow-lg`}
          >
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                billingCycle === "monthly"
                  ? isDark
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-300 relative ${
                billingCycle === "annual"
                  ? isDark
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full ${
                isDark
                  ? 'bg-green-500 text-black'
                  : 'bg-green-600 text-white'
              }`}>
                SAVE
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Free Plan */}
            <motion.div
              key="free"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-2xl p-6 border-2 backdrop-blur-xl flex flex-col ${
                isDark
                  ? 'bg-gray-800/60 border-gray-600/30 hover:border-gray-500/50'
                  : 'bg-white/80 border-gray-400/40 hover:border-gray-500/60'
              } shadow-xl hover:shadow-gray-500/20 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${plans.free.gradient}`}>
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plans.free.name}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Basic Access
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    $0
                  </span>
                  <span className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    /forever
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plans.free.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <feature.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      feature.active
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <span className={`text-sm ${
                      feature.active
                        ? isDark ? 'text-gray-300' : 'text-gray-700'
                        : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => navigate(isAuthenticated ? "/" : "/")}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                } shadow-lg hover:shadow-xl hover:scale-105`}
              >
                Get Started Free
              </button>
            </motion.div>

            {/* Vitality Plan */}
            <motion.div
              key="lifetime"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className={`relative rounded-2xl p-6 border-4 backdrop-blur-xl flex flex-col ${
                isDark
                  ? 'bg-gradient-to-br from-gray-800/80 via-black to-gray-800/80 border-gray-900/70 hover:border-black/90'
                  : 'bg-gradient-to-br from-white/90 via-gray-50/50 to-white/90 border-black/80 hover:border-black/100'
              } shadow-2xl hover:shadow-black/40 transition-all duration-300`}
            >
              {/* Black animation background */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-black rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-gray-900 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full font-black text-xs ${
                isDark
                  ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white'
                  : 'bg-gradient-to-r from-black via-gray-900 to-black text-white'
              } shadow-2xl border-2 border-gray-400 animate-bounce`}>
                🔥 LIMITED TIME
              </div>

              <div className="flex items-center gap-3 mb-4 mt-2 relative">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${plans.vitality.gradient} shadow-lg animate-pulse`}>
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold font-orbitron ${
                    isDark
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-black to-gray-900'
                  }`}>
                    LIFETIME
                  </h3>
                  <p className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>
                    Lifetime Access
                  </p>
                </div>
              </div>

              <div className="mb-6 relative">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ${plans.vitality.originalPrice}
                  </span>
                  <span className={`text-4xl font-black font-orbitron ${
                    isDark
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500'
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-black'
                  }`}>
                    ${plans.vitality.price}
                  </span>
                </div>
                <p className={`text-xs mt-2 font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  Save $300 (60% OFF)
                </p>
              </div>

              <ul className="space-y-3 mb-6 relative flex-grow">
                {plans.vitality.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <feature.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      feature.highlight
                        ? isDark ? 'text-white' : 'text-black'
                        : isDark ? 'text-gray-500' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm ${
                      feature.highlight
                        ? isDark ? 'font-bold text-white' : 'font-bold text-black'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => handleAccessClick("lifetime")}
                className={`relative w-full py-3 rounded-xl font-bold text-base transition-all duration-300 overflow-hidden group ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-black hover:via-gray-900 hover:to-black text-white'
                    : 'bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white'
                } shadow-2xl hover:shadow-black/50 hover:scale-105 border-2 border-gray-400`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-shine"></span>
                <span className="relative">🔥 Claim Lifetime Access</span>
              </button>
            </motion.div>

            {/* Diamond Plan */}
            <motion.div
              key={`diamond-${billingCycle}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`relative rounded-2xl p-6 border-2 backdrop-blur-xl flex flex-col ${
                isDark
                  ? 'bg-gray-800/60 border-blue-500/30 hover:border-blue-400/50'
                  : 'bg-white/80 border-blue-400/40 hover:border-blue-500/60'
              } shadow-xl hover:shadow-blue-500/20 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${plans.diamond.gradient}`}>
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plans.diamond.name}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Premium Access
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${plans.diamond.price[billingCycle]}
                  </span>
                  <span className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {billingCycle === "annual" && (
                  <p className={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Save ${(plans.diamond.price.monthly * 12) - plans.diamond.price.annual} per year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plans.diamond.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <feature.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      feature.highlight
                        ? 'text-yellow-500'
                        : isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`text-sm ${
                      feature.highlight
                        ? 'font-bold text-yellow-500'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => handleAccessClick("diamond")}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                } shadow-lg hover:shadow-xl hover:scale-105`}
              >
                Get Diamond Access
              </button>
            </motion.div>

            {/* Titanium Plan
            <motion.div
              key={`titanium-${billingCycle}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`relative rounded-2xl p-6 border-2 backdrop-blur-xl ${
                isDark
                  ? 'bg-gray-800/60 border-yellow-500/50 hover:border-yellow-400/70'
                  : 'bg-white/80 border-yellow-400/60 hover:border-yellow-500/80'
              } shadow-xl hover:shadow-yellow-500/30 transition-all duration-300`}
            >
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full font-bold text-xs ${
                isDark
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
              } shadow-lg`}>
                ⭐ MOST POPULAR
              </div>

              <div className="flex items-center gap-3 mb-4 mt-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${plans.titanium.gradient}`}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plans.titanium.name}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Elite Access
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black font-orbitron ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${plans.titanium.price[billingCycle]}
                  </span>
                  <span className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {billingCycle === "annual" && (
                  <p className={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Save ${(plans.titanium.price.monthly * 12) - plans.titanium.price.annual} per year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plans.titanium.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <feature.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      feature.highlight
                        ? 'text-yellow-500'
                        : isDark ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <span className={`text-sm ${
                      feature.highlight
                        ? 'font-bold text-yellow-500'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => handleAccessClick("titanium")}
                className={`w-full py-3 relative bottom-3 rounded-xl font-bold text-base transition-all duration-300 ${
                  isDark
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black'
                    : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                } shadow-lg hover:shadow-xl hover:scale-105`}
              >
                Get Titanium Access
              </button>
            </motion.div>
            */}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Plans;
