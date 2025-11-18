import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, AlertCircle, Ticket } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
  completedAt?: string;
}

interface UserData {
  vipTier?: 'diamond' | 'titanium';
  subscriptionType?: 'monthly' | 'annual';
  requestTickets: number;
  requestTicketsResetDate?: string;
}

interface Props {
  userData: UserData;
  onTicketsUpdate: (newTickets: number) => void;
}

const ContentRequestsSection: React.FC<Props> = ({ userData, onTicketsUpdate }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    creatorName: '',
    profileLink: '',
    contentType: '',
    additionalDetails: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/my-requests`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
            'Authorization': `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_FRONTEND_API_KEY
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Request submitted successfully!');
        setFormData({ creatorName: '', profileLink: '', contentType: '', additionalDetails: '' });
        setShowForm(false);
        onTicketsUpdate(data.remainingTickets);
        fetchRequests();
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilReset = () => {
    if (!userData.requestTicketsResetDate) return 0;
    const resetDate = new Date(userData.requestTicketsResetDate);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getMaxTickets = () => {
    if (userData.vipTier === 'titanium') return 5;
    if (userData.vipTier === 'diamond') {
      return userData.subscriptionType === 'annual' ? 2 : 1;
    }
    return 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-8 ${
        isDark
          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80'
          : 'bg-gradient-to-br from-white to-gray-50'
      } backdrop-blur-xl border ${
        isDark ? 'border-gray-700/50' : 'border-gray-200'
      } shadow-2xl`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${
          isDark
            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
            : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }`}>
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Content Request Center
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Request exclusive content
          </p>
        </div>
      </div>

      {/* Tickets Status */}
      <div className={`rounded-xl p-6 mb-6 ${
        isDark
          ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30'
          : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
      }`}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ticket className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-semibold ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AVAILABLE TICKETS (MONTHLY)
              </span>
            </div>
            <div className={`text-4xl font-black ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {userData.requestTickets} / {getMaxTickets()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-semibold ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                RESET IN
              </span>
            </div>
            <div className={`text-4xl font-black ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {calculateDaysUntilReset()} days
            </div>
          </div>
        </div>
      </div>

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
      {!showForm && userData.requestTickets > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
          } shadow-lg hover:shadow-xl hover:scale-105`}
        >
          Submit New Request
        </button>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="space-y-4 mb-6"
        >
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
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
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
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
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
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
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Additional Details (Optional)
            </label>
            <textarea
              value={formData.additionalDetails}
              onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
              placeholder="Any extra information to help with the search (date, event, etc.)"
              rows={2}
              className={`w-full px-4 py-3 rounded-xl ${
                isDark
                  ? 'bg-gray-700/50 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${
                loading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : isDark
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              } text-white shadow-lg hover:shadow-xl`}
            >
              {loading ? 'Submitting...' : 'Use 1 Ticket & Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* My Requests */}
      {requests.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            My Requests
          </h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`rounded-xl p-4 ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700/50'
                    : 'bg-white border-gray-200'
                } border`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className={`font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {request.requestNumber}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      request.status === 'completed'
                        ? 'bg-green-500/20 text-green-500'
                        : request.status === 'rejected'
                        ? 'bg-red-500/20 text-red-500'
                        : request.status === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p><strong>Creator:</strong> {request.creatorName}</p>
                  <p><strong>Type:</strong> {request.contentType}</p>
                  {request.completedLink && (
                    <a
                      href={request.completedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-400 flex items-center gap-1 mt-2"
                    >
                      View Completed Content <Send className="w-4 h-4" />
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
        </div>
      )}
    </motion.div>
  );
};

export default ContentRequestsSection;
