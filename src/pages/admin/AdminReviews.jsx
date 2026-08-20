import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  Trash2 
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
    if (window.confirm(`Delete review from "${userName}"?`)) {
      try {
        await deleteReview(reviewId);
        showToast("Review deleted.", "success");
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

  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1) : '5.0';
  const fiveStarCount = reviews.filter(r => Number(r.rating) >= 5).length;
  const satisfactionRate = reviews.length > 0 ? Math.round((reviews.filter(r => Number(r.rating) >= 4).length / reviews.length) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customer Reviews
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Moderate customer feedback and product star ratings
          </p>
        </div>

        <div className="text-xs font-semibold bg-white px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 shadow-xs">
          Total Reviews: <span className="text-gray-900 font-bold">{reviews.length}</span>
        </div>
      </div>

      {/* Reviews Quick Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">Customer Feedback</span>
          <span className="font-bold text-gray-900">{totalReviews} reviews</span>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <span className="text-amber-800 font-medium">Average Rating</span>
          <span className="font-bold text-amber-950">★ {avgRating} / 5.0</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">5-Star Feedback</span>
          <span className="font-bold text-emerald-950">{fiveStarCount} verified</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Satisfaction Rate</span>
          <span className="font-bold text-emerald-950">{satisfactionRate}% positive</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <LoadingSpinner message="Loading customer reviews..." />
      ) : filteredReviews.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Product &amp; Reviewer</th>
                  <th className="py-3.5 px-5">Rating</th>
                  <th className="py-3.5 px-5">Feedback</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredReviews.map((rev) => {
                  const dateStr = rev.createdAt?.seconds
                    ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString()
                    : 'Recent';

                  return (
                    <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">{rev.productName || 'Apparel Item'}</div>
                        <div className="text-[11px] text-gray-500">By {rev.userName || 'Anonymous'}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Number(rev.rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-gray-700">{rev.rating || 5}.0</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 max-w-sm">
                        <p className="text-gray-600 line-clamp-2 italic">
                          "{rev.comment}"
                        </p>
                      </td>

                      <td className="py-3.5 px-5 text-gray-500">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.userName)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Review"
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-xs shadow-xs">
          No customer reviews recorded yet.
        </div>
      )}

    </div>
  );
};

export default AdminReviews;
