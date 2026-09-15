import React from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import { Bell, Check, X, Sparkles, AlertTriangle, ShieldCheck, Tag, ArrowLeft } from 'lucide-react';

export const CustomerNotificationsModal: React.FC = () => {
  const {
    notificationsDrawerOpen,
    notifications,
    markNotificationAsRead,
    goBack,
  } = useApp();

  const handleClose = () => {
    goBack();
  };

  const customerNotifs = notifications.filter(
    (n) => n.target === 'customer' || n.target === 'all'
  );

  return (
    <AnimatedModal
      isOpen={notificationsDrawerOpen}
      onClose={handleClose}
      variant="sheet"
      maxWidth="max-w-md"
      className="p-0"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center justify-center shrink-0"
            title="Close Notifications"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-[14px] bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Notifications</h3>
            <p className="text-xs text-gray-500">Live service updates & active promotions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex items-center justify-center shrink-0"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
        {customerNotifs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Bell className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-40" />
            <p className="text-xs font-semibold">No new notifications</p>
          </div>
        ) : (
          customerNotifs.map((notif) => {
            const getIcon = () => {
              switch (notif.type) {
                case 'booking':
                  return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
                case 'promo':
                  return <Tag className="w-4 h-4 text-[#FF5A5F]" />;
                case 'alert':
                  return <AlertTriangle className="w-4 h-4 text-amber-600" />;
                default:
                  return <Sparkles className="w-4 h-4 text-blue-600" />;
              }
            };

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer shadow-sm ${
                  !notif.read
                    ? 'bg-[#FFF5F6] border-[#FF5A5F]/30 shadow-[#FF5A5F]/5'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-gray-900 truncate">{notif.title}</h4>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 shrink-0">
        <span>Synced across Mumbai operations</span>
        <button
          onClick={() => {
            customerNotifs.forEach((n) => markNotificationAsRead(n.id));
          }}
          className="min-h-[44px] px-3 font-extrabold text-[#FF5A5F] hover:underline flex items-center"
        >
          Mark all read
        </button>
      </div>
    </AnimatedModal>
  );
};
