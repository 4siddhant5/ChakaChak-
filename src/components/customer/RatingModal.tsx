import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import { Star, X, Camera, Check, Sparkles, ArrowLeft } from 'lucide-react';

interface RatingModalProps {
  bookingId: string;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ bookingId, onClose }) => {
  const { bookings, submitCustomerRating, showToast, getPreviousTitle } = useApp();
  const booking = bookings.find((b) => b.id === bookingId);

  const [stars, setStars] = useState(booking?.customerRating?.stars || 5);
  const [comment, setComment] = useState(
    booking?.customerRating?.comment ||
      'Obsessive attention to detail! Ramesh made our modular kitchen and wardrobe look brand new.'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    booking?.customerRating?.tags || ['Super punctual', 'Deep cleanliness', 'Polite pro']
  );
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(
    booking?.customerRating?.photoUrl ||
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
  );

  const availableTags = [
    'Super punctual',
    'Deep cleanliness',
    'Polite pro',
    'Organized like magic',
    'High-tech steam clean',
    'Label perfection',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCustomerRating(bookingId, {
      stars,
      tags: selectedTags,
      comment,
      photoUrl: uploadedPhoto || undefined,
    });
    onClose();
  };

  if (!booking) return null;

  return (
    <AnimatedModal
      isOpen={Boolean(bookingId)}
      onClose={onClose}
      variant="dialog"
      maxWidth="max-w-md"
      className="p-5 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center justify-center shrink-0"
            title={getPreviousTitle()}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-extrabold text-base text-[#12222E]">Rate Your Service</h3>
            <p className="text-xs text-gray-500">Booking #{booking.id} · {booking.workerName}</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose} 
          className="w-11 h-11 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center shrink-0"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Star Rating */}
        <div className="text-center py-2 bg-gray-50/70 rounded-[20px] p-3 border border-gray-100">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setStars(num)}
                className="w-11 h-11 flex items-center justify-center transition-transform hover:scale-125 focus:outline-hidden"
              >
                <Star
                  className={`w-7 h-7 ${
                    num <= stars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 fill-gray-100'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-700 mt-1">
            {stars === 5
              ? 'Outstanding Experience! 🌟'
              : stars === 4
              ? 'Very Good Clean'
              : 'Service Feedback'}
          </p>
        </div>

        {/* Quick Compliment Tags */}
        <div>
          <span className="text-xs font-bold text-gray-700 block mb-2">What stood out?</span>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-[20px] text-xs font-bold transition flex items-center ${
                    isSelected
                      ? 'bg-[#FF5A5F] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Review Textarea */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Your Feedback</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share how the organization or deep cleaning transformed your home..."
            className="w-full px-3.5 py-3 rounded-[20px] border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] shadow-2xs"
          />
        </div>

        {/* Optional Photo Upload */}
        <div>
          <span className="text-xs font-bold text-gray-700 block mb-1">
            Add Photo of Transformed Area (Optional)
          </span>
          {uploadedPhoto ? (
            <div className="relative w-full h-28 rounded-[20px] overflow-hidden border border-gray-200 shadow-sm">
              <img src={uploadedPhoto} alt="Proof" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setUploadedPhoto(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setUploadedPhoto(
                  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
                );
                showToast('Photo of sparkling kitchen attached!');
              }}
              className="w-full min-h-[44px] py-3 rounded-[20px] border-2 border-dashed border-gray-200 hover:border-[#FF5A5F] text-xs font-bold text-gray-600 hover:text-[#FF5A5F] flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Finished Room Photo</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] py-3.5 rounded-[20px] bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white text-sm font-black shadow-lg shadow-[#FF5A5F]/30 hover:opacity-95 transition active:scale-98"
        >
          Submit Review
        </button>
      </form>
    </AnimatedModal>
  );
};
