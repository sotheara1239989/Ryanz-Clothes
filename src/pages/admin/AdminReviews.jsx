import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Star, 
  Trash2, 
  User, 
  Package, 
  Calendar 
} from 'lucide-react';
import { listenToAllReviews, deleteReview } from '../../services/reviewService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllReviews(
      (allReviews) => {
        setReviews(allReviews);
        setLoading(false);
      },
      (err) => {
        console.error("Reviews stream error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteReview = async (reviewId, userName) => {
    if (window.confirm(`Delete review from "${userName}" in Firestore?`)) {
      try {
        await deleteReview(reviewId);
        showToast("Review deleted from Firestore.", "success");
      } catch (err) {
        console.error("Delete review error:", err);
        showToast("Failed to delete review.", "error");
      }
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchComment = r.comment?.toLowerCase().includes(term);
      const matchUser = r.userName?.toLowerCase().includes(term);
      const matchProduct = r.productName?.toLowerCase().includes(term);
      if (!matchComment && !matchUser && !matchProduct) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Moderate customer feedback, star ratings, and community reviews
          </p>
        </div>

        <div className="text-xs font-black bg-[#0c121e] px-4 py-2 rounded-xl border border-slate-800/80 text-slate-300 shadow-sm">
          Total Reviews: <span className="text-emerald-400">{reviews.length}</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-[#0c121e] p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, product, or comment..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <LoadingSpinner message="Loading customer reviews..." />
      ) : filteredReviews.length > 0 ? (
        <div className="bg-[#0c121e] rounded-2xl sm:rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="py-4 px-6">Product / Reviewer</th>
                  <th className="py-4 px-6">Rating</th>
                  <th className="py-4 px-6">Review Content</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredReviews.map((rev) => {
                  return (
                    <tr key={rev.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Product and User */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-xs">{rev.productName || 'Product'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{rev.userName || 'Anonymous'}</span>
                        </div>
                      </td>

                      {/* Rating Stars */}
                      <td className="py-4 px-6">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${
                                st <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="py-4 px-6 max-w-sm">
                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                          "{rev.comment}"
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-400">
                        {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>

                      {/* Delete Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.userName)}
                          className="p-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete / Moderate Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800 text-center text-slate-400 text-xs">
          No customer reviews submitted in Firestore yet.
        </div>
      )}

    </div>
  );
};

export default AdminReviews;
