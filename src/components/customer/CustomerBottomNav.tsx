import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Clock, Tag, User } from 'lucide-react';

export const CustomerBottomNav: React.FC = () => {
  const { activeCustomerTab, setActiveCustomerTab, bookings, customer } = useApp();

  const activeBooking = bookings.find(
    (b) => b.status === 'en_route' || b.status === 'job_started' || b.status === 'worker_assigned'
  );

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 sm:px-6 py-2 shadow-lg flex items-center justify-around select-none mt-auto">
      <button
        onClick={() => setActiveCustomerTab('home')}
        className={`flex flex-col items-center gap-1 transition ${
          activeCustomerTab === 'home' ? 'text-[#FF5A5F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className={`text-[10px] ${activeCustomerTab === 'home' ? 'font-bold' : 'font-medium'}`}>
          Explore
        </span>
      </button>

      <button
        onClick={() => setActiveCustomerTab('history')}
        className={`flex flex-col items-center gap-1 transition ${
          activeCustomerTab === 'history' ? 'text-[#FF5A5F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center relative">
          <Clock className="w-5 h-5" />
          {activeBooking && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-pulse"></span>
          )}
        </div>
        <span className={`text-[10px] ${activeCustomerTab === 'history' ? 'font-bold' : 'font-medium'}`}>
          Bookings
        </span>
      </button>

      <button
        onClick={() => setActiveCustomerTab('offers')}
        className={`flex flex-col items-center gap-1 transition ${
          activeCustomerTab === 'offers' ? 'text-[#FF5A5F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <Tag className="w-5 h-5" />
        </div>
        <span className={`text-[10px] ${activeCustomerTab === 'offers' ? 'font-bold' : 'font-medium'}`}>
          Offers
        </span>
      </button>

      <button
        onClick={() => setActiveCustomerTab('profile')}
        className={`flex flex-col items-center gap-1 transition ${
          activeCustomerTab === 'profile' ? 'text-[#FF5A5F]' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          {customer?.avatar ? (
            <img
              src={customer.avatar}
              alt="Profile"
              className={`w-5 h-5 rounded-full object-cover ring-1 ${
                activeCustomerTab === 'profile' ? 'ring-[#FF5A5F]' : 'ring-gray-200'
              }`}
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <span className={`text-[10px] ${activeCustomerTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
          Profile
        </span>
      </button>
    </nav>
  );
};
