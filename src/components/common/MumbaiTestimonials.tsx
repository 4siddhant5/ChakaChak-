import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  locality: string;
  avatar: string;
  rating: number;
  service: string;
  comment: string;
  date: string;
}

const REVIEWS: Review[] = [
  {
    id: 'r-1',
    name: 'Ananya Singhania',
    locality: 'Carter Road, Bandra West',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    service: 'Wardrobe Declutter & Folding',
    comment: 'Ramesh and his team transformed our master walk-in wardrobe in under 4 hours. Everything is color-zoned and labeled with velvet hangers. Absolute peace of mind!',
    date: '2 days ago',
  },
  {
    id: 'r-2',
    name: 'Vikram Merchant',
    locality: 'Pali Hill, Khar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    service: 'Diamond Deep Steam Clean',
    comment: 'The 140°C medical steam made our Italian marble floors shine like a 5-star hotel. They even descaled hard water stains behind all rain showers without damaging chrome.',
    date: '1 week ago',
  },
  {
    id: 'r-3',
    name: 'Kavita Chawla',
    locality: 'Hiranandani Gardens, Powai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    service: 'Modular Kitchen Revamp',
    comment: 'Pantry spice jars zoned by expiry and airtight labeled. Oil buildup behind the chimney was scrubbed spotless. Worth every rupee.',
    date: 'Yesterday',
  },
];

export const MumbaiTestimonials: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF5A5F] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Customer Stories</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#12222E]">
            Loved by 12,000+ Mumbai Homes
          </h3>
          <p className="text-xs text-gray-500">Real feedback from verified Mumbai residents</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
        {REVIEWS.map((review) => (
          <div
            key={review.id}
            className="min-w-[85%] sm:min-w-[300px] snap-center bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col justify-between shrink-0 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-gray-400">{review.date}</span>
              </div>

              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F6] text-[#FF5A5F] mb-2 border border-[#FF5A5F]/20">
                {review.service}
              </span>

              <p className="text-xs text-gray-700 leading-relaxed italic">
                "{review.comment}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
              <img
                src={review.avatar}
                alt={review.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-[#12222E] truncate">{review.name}</h4>
                <p className="text-[10px] text-gray-400 truncate">{review.locality}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
