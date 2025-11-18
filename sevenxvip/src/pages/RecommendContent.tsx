import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, Ticket, ExternalLink, ArrowLeft, Crown, Trophy } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Loading from '../components/Loading/Loading';

interface UserData {
  vipTier?: 'diamond' | 'titanium';
  subscriptionType?: 'monthly' | 'annual';
  requestTickets: number;
  requestTicketsResetDate?: string;
}

interface ContentRequest {
  id: number;
  requestNumber: string;
  creatorName: string;
  profileLink: string;
  contentType: string;
  additionalDetails?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedLink?: string;
  rejectionReason?: string;
  createdAt: string;
}

const RecommendContent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [userData, setUserData] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    creatorName: '',
    profileLink: '',
    contentType: '',
    additionalDetails: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchRequests();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserData({
          vipTier: data.vipTier,
          subscriptionType: data.subscriptionType,
          requestTickets: data.requestTickets || 0,
          requestTicketsResetDate: data.requestTicketsResetDate
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/my-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_API_KEY
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Request submitted successfully!');
        setFormData({ creatorName: '', profileLink: '', contentType: '', additionalDetails: '' });
        if (userData) {
          setUserData({ ...userData, requestTickets: data.remainingTickets });
        }
        fetchRequests();
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysUntilReset = () => {
    if (!userData?.requestTicketsResetDate) return 0;
    const resetDate = new Date(userData.requestTicketsResetDate);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getMaxTickets = () => {
    if (userData?.vipTier === 'titanium') return 5;
    if (userData?.vipTier === 'diamond') {
      return userData.subscriptionType === 'annual' ? 2 : 1;
    }
    return 0;
  };

  const getTierIcon = () => {
    if (userData?.vipTier === 'titanium') return Trophy;
    return Crown;
  };

  const getTierColor = () => {
    if (userData?.vipTier === 'titanium') return 'yellow';
    return 'blue';
  };

  if (loading) return <Loading />;

  const TierIcon = getTierIcon();
  const tierColor = getTierColor();

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <Helmet>
        <title>Content Requests - Sevenxleaks</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/account"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-8 transition-all ${
            isDark
              ? 'bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-white'
              : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Account</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div
              className={`p-4 rounded-2xl ${
                tierColor === 'yellow'
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}
            >
              <TierIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1
            className={`text-5xl font-bold mb-6 font-orbitron ${
              isDark
                ? 'bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent'
            }`}
          >
            CONTENT REQUESTS
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            VIP {userData?.vipTier?.toUpperCase()} Exclusive Feature
          </p>
        </motion.div>

        {/* Tickets Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 mb-8 ${
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
              : 'bg-white border border-gray-200'
          } shadow-xl`}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket
                  className={`w-5 h-5 ${
                    tierColor === 'yellow'
                      ? isDark
                        ? 'text-yellow-400'
                        : 'text-yellow-600'
                      : isDark
                      ? 'text-blue-400'
                      : 'text-blue-600'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  AVAILABLE TICKETS (MONTHLY)
                </span>
              </div>
              <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userData?.requestTickets} / {getMaxTickets()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`w-5 h-5 ${
                    tierColor === 'yellow'
                      ? isDark
                        ? 'text-yellow-400'
                        : 'text-yellow-600'
                      : isDark
                      ? 'text-blue-400'
                      : 'text-blue-600'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  RESET IN
                </span>
              </div>
              <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {calculateDaysUntilReset()} days
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-500">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-500">
            {error}
          </div>
        )}

        {/* Request Form */}
        {userData && userData.requestTickets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-8 mb-8 ${
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-white border border-gray-200'
            } shadow-xl`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Submit New Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Artist/Creator Name
                </label>
                <input
                  type="text"
                  value={formData.creatorName}
                  onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                  placeholder="Ex: [Creator Name] or [Set Name]"
                  required
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDark
                      ? 'bg-gray-700/50 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Profile Link (OnlyFans, Social, etc.)
                </label>
                <input
                  type="url"
                  value={formData.profileLink}
                  onChange={(e) => setFormData({ ...formData, profileLink: e.target.value })}
                  placeholder="Ex: https://onlyfans.com/username"
                  required
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDark
                      ? 'bg-gray-700/50 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Content Type Requested (Free Text)
                </label>
                <textarea
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                  placeholder="Ex: 2024 Sextape, Recent solo content, Dildo PPV"
                  required
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDark
                      ? 'bg-gray-700/50 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Additional Details (Optional)
                </label>
                <textarea
                  value={formData.additionalDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalDetails: e.target.value })
                  }
                  placeholder="Any extra information to help with the search (date, event, etc.)"
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDark
                      ? 'bg-gray-700/50 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  isSubmitting
                    ? 'bg-gray-500 cursor-not-allowed'
                    : tierColor === 'yellow'
                    ? isDark
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                    : isDark
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                } text-white shadow-lg hover:shadow-xl hover:scale-105`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Use 1 Ticket & Submit Request
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* My Requests */}
        {requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-8 ${
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-white border border-gray-200'
            } shadow-xl`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              My Requests
            </h2>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-xl p-4 ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700/50'
                      : 'bg-gray-50 border-gray-200'
                  } border`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {request.requestNumber}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-500/20 text-green-500'
                          : request.status === 'rejected'
                          ? 'bg-red-500/20 text-red-500'
                          : request.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>
                      <strong>Creator:</strong> {request.creatorName}
                    </p>
                    <p>
                      <strong>Type:</strong> {request.contentType}
                    </p>
                    {request.completedLink && (
                      <a
                        href={request.completedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-500 hover:text-purple-400 flex items-center gap-1 mt-2"
                      >
                        View Completed Content <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {request.rejectionReason && (
                      <p className="text-red-500 mt-2">
                        <strong>Reason:</strong> {request.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RecommendContent;
