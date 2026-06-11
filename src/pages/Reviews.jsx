import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaStar } from "react-icons/fa";
import { getAllReviewsApi, updateReviewApi, deleteReviewApi } from "../apis/reviews";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editRemark, setEditRemark] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getAllReviewsApi();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this review!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteReviewApi(id);
        toast.success("Review deleted successfully");
        fetchReviews();
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to delete review");
      }
    }
  };

  const openEditModal = (review) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditRemark(review.remark);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editRating === 0 || !editRemark.trim()) {
      return toast.error("Rating and remark are required");
    }

    try {
      await updateReviewApi(selectedReview._id, { rating: editRating, remark: editRemark });
      toast.success("Review updated successfully");
      setIsEditModalOpen(false);
      fetchReviews();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update review");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Product Reviews</h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
          Total: {reviews.length}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Remark
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {review.product?.mainImage && (
                          <img
                            src={review.product.mainImage.url}
                            alt={review.product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {review.product?.name || "Deleted Product"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{review.user?.firstName ? `${review.user.firstName} ${review.user.lastName}` : (review.user?.name || "Deleted User")}</div>
                      <div className="text-xs text-gray-500">{review.user?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-500">
                        {review.rating} <FaStar className="ml-1" size={12} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-xs" title={review.remark}>
                        {review.remark}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditModal(review)}
                          className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                          title="Edit Review"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Edit Review</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className={`text-2xl ${star <= editRating ? "text-yellow-500" : "text-gray-300"} hover:scale-110 transition-transform`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <textarea
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Update Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
