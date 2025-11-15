import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Tag,
  ExternalLink,
  Shield,
  Crown,
  ChevronDown,
  Globe,
} from "lucide-react";
import DownloadOptions from "../components/DownloadOptions";
import { linkvertise } from "../components/Linkvertise";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import LoadingWestern from "../components/Loaders/LoadingWestern";
import { useTheme } from "../contexts/ThemeContext";
import { PreviewModal } from "../components/PreviewModal";

type ContentItem = {
  id: number;
  name: string;
  link: string;
  link2: string;
  linkP: string;
  linkG: string;
  linkMV1: string;
  linkMV2: string;
  linkMV3: string;
  linkMV4: string;
  category: string;
  postDate: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  preview?: string;
};

const WesternContentDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linkvertiseAccount, setLinkvertiseAccount] = useState<string>("518238");
  const [benefitsOpen, setBenefitsOpen] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      linkvertise(linkvertiseAccount, { whitelist: ["mega.nz", "pixeldrain.com", "gofile.io"] });
    }
  }, [content, linkvertiseAccount]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/western/${slug}`,
          {
            headers: {
              "x-api-key": `${import.meta.env.VITE_FRONTEND_API_KEY}`,
              Authorization: `Bearer ${localStorage.getItem("Token")}`,
            },
          }
        );

        if (response.data) {
          setContent(response.data);
        } else {
          setError("Content not found");
        }
      } catch (err: any) {
        console.error("Error fetching content:", err);
        setError(err.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchContent();
  }, [slug]);

  if (loading) return <LoadingWestern />;

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6 py-12 max-w-md rounded-2xl"
        >
          <Globe className="w-20 h-20 mx-auto mb-6 text-orange-500" />
          <h2 className="text-3xl font-bold mb-4">Content Not Found</h2>
          <p className="mb-8 text-gray-500">The western content you're looking for doesn't exist or has been removed.</p>
          <Link to="/western" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
            Back to western content
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className={`relative min-h-screen overflow-x-clip ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <Helmet>
        <title>Sevenxleaks - {content.name} (western)</title>
        <link rel="canonical" href={`https://sevenxleaks.com/western/${content.slug}`} />
        <style>{`
          html, body {
            overflow-x: hidden !important;
            width: 100%;
            max-width: 100vw;
          }
          * {
            max-width: 100%;
          }
        `}</style>
      </Helmet>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/western"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
              isDark
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Western Content</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`backdrop-blur-xl border rounded-3xl p-6 sm:p-10 shadow-2xl ${
            isDark
              ? 'bg-gray-800/60 border-orange-500/30 shadow-orange-500/10'
              : 'bg-white/80 border-orange-400/40 shadow-orange-400/10'
          }`}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${
              isDark ? 'bg-orange-500/20' : 'bg-orange-100'
            }`}>
              <Globe className={`w-8 h-8 ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-4xl font-black mb-2 break-words ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800'
              }`}>
                {content.name}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${
                isDark
                  ? 'bg-gray-700/50 border-orange-500/20'
                  : 'bg-gray-50/50 border-orange-400/30'
              }`}
            >
              <Calendar className={`w-5 h-5 flex-shrink-0 ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Posted On
                </p>
                <p className={`text-sm font-bold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {new Date(content.postDate).toLocaleDateString()}
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${
                isDark
                  ? 'bg-gray-700/50 border-orange-500/20'
                  : 'bg-gray-50/50 border-orange-400/30'
              }`}
            >
              <Tag className={`w-5 h-5 flex-shrink-0 ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <p className={`text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Category
                </p>
                <p className={`text-sm font-bold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {content.category}
                </p>
                {content.preview && (
                  <button
                    onClick={() => setShowPreview(content.preview!)}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                        : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
                    }`}
                    aria-label="Preview"
                    title="View preview"
                  >
                    <i className="fa-solid fa-eye text-sm"></i>
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-6 border mb-8 ${
              isDark
                ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30'
                : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-300/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className={`w-6 h-6 ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <h2 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Download Options
              </h2>
            </div>

            <DownloadOptions
              primaryLinks={{
                linkG: content.link,
                linkP: content.linkG,
                pixeldrain: content.linkP,
                LINKMV1: content.linkMV1,
                LINKMV2: content.linkMV2,
                LINKMV3: content.linkMV3,
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setBenefitsOpen(!benefitsOpen)}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border-yellow-500/30 hover:border-yellow-400/50'
                  : 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-300/50 hover:border-yellow-400/60'
              }`}
            >
              <div className="flex items-center gap-4">
                <Crown className={`w-6 h-6 ${
                  isDark ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
                <span className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Want VIP Benefits?
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  benefitsOpen ? 'rotate-180' : ''
                } ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}
              />
            </button>

            {benefitsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`mt-4 p-6 rounded-2xl border ${
                  isDark
                    ? 'bg-gray-700/50 border-yellow-500/20'
                    : 'bg-yellow-50/50 border-yellow-300/30'
                }`}
              >
                <ul className="space-y-3">
                  {[
                    'No ads or linkvertise',
                    'Instant direct downloads',
                    'Premium exclusive content',
                    'Early access to new releases',
                    'Priority support',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isDark ? 'bg-yellow-400' : 'bg-yellow-600'
                      }`} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/plans"
                  className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    isDark
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black'
                      : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
                  } shadow-lg hover:shadow-xl`}
                >
                  <Crown className="w-5 h-5" />
                  <span>Upgrade to VIP</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {showPreview && (
        <PreviewModal
          imageUrl={showPreview}
          contentName={content.name}
          onClose={() => setShowPreview(null)}
        />
      )}
    </div>
  );
};

export default WesternContentDetails;
