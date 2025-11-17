import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Send,
  Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Loading from '../components/Loading/Loading';
import { Helmet } from 'react-helmet';

interface ContentRequest {
  id: number;
  requestNumber: string;
  userId: number;
  userName: string;
  vipTier: 'diamond' | 'titanium';
  creatorName: string;
  profileLink: string;
  contentType: string;
  additionalDetails?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedLink?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  titaniumPending: number;
  diamondPending: number;
}

const AdminContentRequests: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    titaniumPending: 0,
    diamondPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [completedLink, setCompletedLink] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/all`,
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
        setStats(data.stats || stats);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateRequestStatus = async (
    id: number,
    status: string,
    completedLink?: string,
    rejectionReason?: string
  ) => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/update-status/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_API_KEY
          },
          body: JSON.stringify({ status, completedLink, rejectionReason })
        }
      );

      if (response.ok) {
        setSuccess('Request status updated successfully');
        setCompletedLink('');
        setRejectionReason('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update request');
      }
    } catch (err) {
      setError('Failed to update request');
    }
  };

  const deleteRequest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const token = localStorage.getItem('Token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/content-requests/delete/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': import.meta.env.VITE_API_KEY
          }
        }
      );

      if (response.ok) {
        setSuccess('Request deleted successfully');
        fetchRequests();
      } else {
        setError('Failed to delete request');
      }
    } catch (err) {
      setError('Failed to delete request');
    }
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

  const titaniumRequests = requests.filter(
    (r) => r.vipTier === 'titanium' && (r.status === 'pending' || r.status === 'in_progress')
  );
  const diamondRequests = requests.filter(
    (r) => r.vipTier === 'diamond' && (r.status === 'pending' || r.status === 'in_progress')
  );

  if (loading) return <Loading />;

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <Helmet>
        <title>Admin - Content Requests</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
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
            Manage VIP content requests
          </p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              TOTAL REQUESTS
            </div>
            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.total}
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-700/30'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              PENDING (QUEUE)
            </div>
            <div
              className={`text-3xl font-black ${
                isDark ? 'text-yellow-400' : 'text-yellow-700'
              }`}
            >
              {stats.pending}
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700/30'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              IN PROGRESS
            </div>
            <div className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              {stats.inProgress}
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/30'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              COMPLETED (30d)
            </div>
            <div
              className={`text-3xl font-black ${isDark ? 'text-green-400' : 'text-green-700'}`}
            >
              {stats.completed}
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-600/30'
                : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-300'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              TITANIUM QUEUE
            </div>
            <div
              className={`text-3xl font-black ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}
            >
              {stats.titaniumPending}
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ${
              isDark
                ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-600/30'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-300'
            }`}
          >
            <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              DIAMOND QUEUE
            </div>
            <div className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              {stats.diamondPending}
            </div>
          </div>
        </div>

        {/* Titanium Requests */}
        {titaniumRequests.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                TITANIUM REQUESTS
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isDark
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {titaniumRequests.length} in queue
              </span>
            </div>

            <div className="space-y-4">
              {titaniumRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isDark={isDark}
                  selectedRequest={selectedRequest}
                  setSelectedRequest={setSelectedRequest}
                  completedLink={completedLink}
                  setCompletedLink={setCompletedLink}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  updateRequestStatus={updateRequestStatus}
                  deleteRequest={deleteRequest}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Diamond Requests */}
        {diamondRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-blue-500" />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                DIAMOND REQUESTS
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {diamondRequests.length} in queue
              </span>
            </div>

            <div className="space-y-4">
              {diamondRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isDark={isDark}
                  selectedRequest={selectedRequest}
                  setSelectedRequest={setSelectedRequest}
                  completedLink={completedLink}
                  setCompletedLink={setCompletedLink}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  updateRequestStatus={updateRequestStatus}
                  deleteRequest={deleteRequest}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RequestCardProps {
  request: ContentRequest;
  isDark: boolean;
  selectedRequest: number | null;
  setSelectedRequest: (id: number | null) => void;
  completedLink: string;
  setCompletedLink: (link: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  updateRequestStatus: (
    id: number,
    status: string,
    completedLink?: string,
    rejectionReason?: string
  ) => void;
  deleteRequest: (id: number) => void;
  getStatusIcon: (status: string) => React.ReactNode;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isDark,
  selectedRequest,
  setSelectedRequest,
  completedLink,
  setCompletedLink,
  rejectionReason,
  setRejectionReason,
  updateRequestStatus,
  deleteRequest,
  getStatusIcon
}) => {
  const tierColor = request.vipTier === 'titanium' ? 'yellow' : 'blue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 border ${
        isDark
          ? `bg-gradient-to-br from-${tierColor}-900/20 to-gray-900/60 border-${tierColor}-700/30`
          : `bg-white border-${tierColor}-200`
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(request.status)}
          <div>
            <h3
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {request.requestNumber}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Client: {request.userName}
            </p>
          </div>
        </div>
        <button
          onClick={() => deleteRequest(request.id)}
          className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <p>
          <strong>Creator:</strong> {request.creatorName}
        </p>
        <p>
          <strong>Type:</strong> {request.contentType}
        </p>
        {request.additionalDetails && (
          <p>
            <strong>Details:</strong> {request.additionalDetails}
          </p>
        )}
      </div>

      <a
        href={request.profileLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 mb-4 ${
          tierColor === 'yellow' ? 'text-yellow-500' : 'text-blue-500'
        } hover:underline`}
      >
        View Source Link <ExternalLink className="w-4 h-4" />
      </a>

      {request.status === 'pending' && (
        <div className="space-y-3">
          <button
            onClick={() => updateRequestStatus(request.id, 'in_progress')}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              isDark
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            Mark as In Progress
          </button>
        </div>
      )}

      {request.status === 'in_progress' && (
        <div className="space-y-3">
          {selectedRequest === request.id ? (
            <>
              <input
                type="url"
                value={completedLink}
                onChange={(e) => setCompletedLink(e.target.value)}
                placeholder="Paste the completed content link here"
                className={`w-full px-4 py-3 rounded-xl ${
                  isDark
                    ? 'bg-gray-700/50 text-white border-gray-600'
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateRequestStatus(request.id, 'completed', completedLink)
                  }
                  disabled={!completedLink}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    completedLink
                      ? isDark
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Complete & Send Link
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedRequest(request.id)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                Complete Request
              </button>
              <button
                onClick={() => updateRequestStatus(request.id, 'rejected')}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                Reject/Cancel
              </button>
            </>
          )}
        </div>
      )}

      {request.status === 'completed' && request.completedLink && (
        <a
          href={request.completedLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-green-500 hover:underline"
        >
          View Completed Content <Send className="w-4 h-4" />
        </a>
      )}

      {request.status === 'rejected' && (
        <div className="text-red-500">
          <strong>Status:</strong> Rejected
        </div>
      )}
    </motion.div>
  );
};

export default AdminContentRequests;
