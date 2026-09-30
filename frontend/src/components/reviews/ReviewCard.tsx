import React, { useState } from "react";
import { Review } from "../../types/review";
import { StarRating, Modal, Icon } from "../common";
import { getImageUrl } from "../../utils/image.utils";
import { useTranslation } from "react-i18next";

export interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const isAuthor = currentUserId && review.userId === currentUserId;
  const canModify = isAuthor || isAdmin;

  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const reviewerName = review.user?.name || "Customer";
  const userInitials = reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs space-y-4">
      {/* Header: User Info, Rating, Date & Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {/* Avatar with fallback initials */}
          {review.user?.avatar ? (
            <img
              src={getImageUrl(review.user.avatar)}
              alt={reviewerName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-black text-xs flex items-center justify-center shadow-2xs">
              {userInitials}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{reviewerName}</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={review.rating} size="xs" />
              <span className="text-[11px] text-slate-400 font-medium">· {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Action dropdown for author or admin */}
        {canModify && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Review options"
            >
              <Icon name="more-vertical" className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-32 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-20"
                onMouseLeave={() => setShowMenu(false)}
              >
                {isAuthor && onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(review);
                    }}
                    className="w-full px-3.5 py-1.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="edit" className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t("common.edit", { defaultValue: "Edit" })}</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(review);
                    }}
                    className="w-full px-3.5 py-1.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" />
                    <span>{t("common.delete", { defaultValue: "Delete" })}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        {review.title && (
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            {review.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      </div>

      {/* Photos Thumbnail Grid */}
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {review.images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPhoto(imgUrl)}
              className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-slate-100 group"
            >
              <img
                src={getImageUrl(imgUrl)}
                alt={`Review photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      <Modal
        isOpen={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        size="3xl"
        bodyClassName="p-2 flex items-center justify-center bg-slate-900/90 rounded-2xl overflow-hidden"
        className="bg-transparent border-0 shadow-none"
      >
        {selectedPhoto && (
          <div className="relative flex items-center justify-center max-h-[85vh] w-full">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close photo preview"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
            <img
              src={getImageUrl(selectedPhoto)}
              alt="Full review photo"
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewCard;
