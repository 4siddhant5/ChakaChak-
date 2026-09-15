import React, { useState, useEffect, useRef } from 'react';
import { db, collection, doc, setDoc, onSnapshot } from '../../lib/firebase';
import { SupportMessage } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Phone,
  Clock,
  Headphones,
  Bot,
  User,
  CheckCheck,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface HelpSupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'customer' | 'worker';
  currentUserId?: string;
  currentUserName?: string;
  activeBookingId?: string;
}

export const HelpSupportChatModal: React.FC<HelpSupportChatModalProps> = ({
  isOpen,
  onClose,
  role,
  currentUserId,
  currentUserName,
  activeBookingId,
}) => {
  const { showToast, sanitizeForFirestore } = useApp();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const senderId = currentUserId || (role === 'customer' ? 'cust-mumbai-01' : 'w-101');
  const senderName = currentUserName || (role === 'customer' ? 'Riya Mehta' : 'Ramesh Sawant');

  // Customer & Worker Contextual Quick Replies
  const quickChips =
    role === 'customer'
      ? [
          'Where is my assigned cleaning partner?',
          'How do I add sofa shampoo to active booking?',
          'Need GST invoice for society audit',
          'Request urgent slot reschedule',
          'Call Mumbai Support Helpline',
        ]
      : [
          'Customer society gate security pass needed',
          'Heavy traffic delay on Western Express Highway',
          'Need microfiber & chemical kit replenishment',
          'Customer requesting extra balcony deep clean',
          'Emergency Partner Helpline',
        ];

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Firestore Real-Time Listener for support_messages
  useEffect(() => {
    if (!isOpen) return;

    try {
      const unsub = onSnapshot(
        collection(db, 'support_messages'),
        (snapshot) => {
          if (!snapshot.empty) {
            const rawDocs = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as SupportMessage[];

            // Sort chronologically
            rawDocs.sort((a, b) => {
              const timeA = new Date(a.createdAt || a.timestamp).getTime() || 0;
              const timeB = new Date(b.createdAt || b.timestamp).getTime() || 0;
              return timeA - timeB;
            });

            // Filter relevant messages for this role / user or portal
            const relevant = rawDocs.filter((m) => {
              if (m.targetPortal === 'all') return true;
              if (m.targetPortal === role) return true;
              if (m.senderRole === role && m.senderId === senderId) return true;
              if (m.senderRole === 'agent' || m.senderRole === 'system') return true;
              return false;
            });

            setMessages(relevant);
          } else {
            // Seed initial welcome message if empty
            const welcomeMsg: SupportMessage = {
              id: `welcome-${role}`,
              senderId: 'support-agent-mumbai',
              senderName: 'ChakaChak Mumbai Concierge',
              senderRole: 'agent',
              targetPortal: role,
              text:
                role === 'customer'
                  ? 'Namaste! Welcome to ChakaChak Mumbai 24x7 Live Concierge. How can we help with your home cleaning or wardrobe transformation today?'
                  : 'Namaste Partner! ChakaChak Fleet Dispatch Desk is active. Report any traffic delays, chemical refills, or site assistance here.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: new Date().toISOString(),
              status: 'delivered',
            };
            setMessages([welcomeMsg]);
          }
        },
        (err) => {
          console.warn('Firestore support_messages listener error:', err);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('Failed to attach Firestore support_messages listener:', err);
    }
  }, [isOpen, role, senderId]);

  // Send message to Firestore
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    setInputText('');
    setIsSending(true);

    const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: SupportMessage = {
      id: newMsgId,
      senderId,
      senderName,
      senderRole: role,
      targetPortal: role,
      text: textToSend,
      timestamp: currentTimeStr,
      createdAt: new Date().toISOString(),
      bookingId: activeBookingId,
      status: 'sent',
    };

    // Optimistically update
    setMessages((prev) => [...prev, newMsg]);

    try {
      await setDoc(doc(db, 'support_messages', newMsgId), sanitizeForFirestore(newMsg));
      setIsSending(false);

      // Simulate intelligent automated response from Support Dispatch Desk
      setIsTyping(true);
      setTimeout(async () => {
        let replyText = 'Thank you for reaching out. A senior Mumbai fleet supervisor has logged your query and is reviewing it right now.';

        const lower = textToSend.toLowerCase();
        if (lower.includes('partner') || lower.includes('where')) {
          replyText = 'Your assigned partner Ramesh Sawant is en-route on his registered two-wheeler. GPS telemetry indicates ~12 mins arrival in Bandra West.';
        } else if (lower.includes('sofa') || lower.includes('add')) {
          replyText = 'Sofa injection-extraction shampoo can be added to your active booking! You can toggle it under Add-ons or we can adjust your invoice on-site.';
        } else if (lower.includes('invoice') || lower.includes('gst')) {
          replyText = 'Your GST-compliant tax invoice will be automatically emailed to your registered address upon service completion. You can also download it from Service History.';
        } else if (lower.includes('gate') || lower.includes('security')) {
          replyText = 'Security gate clearance alert dispatched to customer! Please hold at visitor bay for 2 minutes while we verify society entry with the owner.';
        } else if (lower.includes('traffic') || lower.includes('delay')) {
          replyText = 'Western Express Highway congestion noted. ETA adjusted in customer app (+15 mins) and customer has been notified so your punctuality rating remains protected!';
        } else if (lower.includes('chemical') || lower.includes('refill')) {
          replyText = 'Refill authorized. You can collect Taski R1/R2 and fresh microfiber bundles from the nearest ChakaChak Hub at Khar Linking Road.';
        } else if (lower.includes('helpline') || lower.includes('call')) {
          replyText = 'You can connect directly to Mumbai Central Dispatch at 1800-CHAKACHAK (1800-242-5224) available 24 hours a day.';
        }

        const replyMsgId = `agent-${Date.now()}`;
        const replyMsg: SupportMessage = {
          id: replyMsgId,
          senderId: 'agent-mumbai-dispatch',
          senderName: 'ChakaChak Mumbai Concierge',
          senderRole: 'agent',
          targetPortal: role,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          bookingId: activeBookingId,
          status: 'delivered',
        };

        try {
          await setDoc(doc(db, 'support_messages', replyMsgId), sanitizeForFirestore(replyMsg));
        } catch (e) {
          setMessages((prev) => [...prev, replyMsg]);
        }
        setIsTyping(false);
      }, 1200);
    } catch (err) {
      console.warn('Error saving support message to Firestore:', err);
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="help-support-chat-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg h-[88vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slideUp relative"
      >
        {/* Top Header */}
        <header className="p-4 bg-[#12222E] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A5F] to-amber-500 flex items-center justify-center text-white font-black shadow-md">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#12222E] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  ChakaChak Help & Support
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/30 uppercase">
                  {role === 'customer' ? 'Customer Care' : 'Fleet Support'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Mumbai Dispatch Desk · Avg reply &lt; 2 min</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:18002425224"
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
              title="Call Mumbai Toll-Free Helpline"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
              title="Close support chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Status Strip */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Realtime Firestore Sync</span>
          </span>
          {activeBookingId && (
            <span className="font-mono text-[11px] font-bold text-gray-700">
              Ref #{activeBookingId}
            </span>
          )}
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FB]">
          {messages.map((msg) => {
            const isMe = msg.senderRole === role;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1">
                  <span>{isMe ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-[#FF5A5F] text-white rounded-br-xs font-medium'
                      : 'bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {isMe && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 pr-1">
                    <CheckCheck className="w-3 h-3 text-emerald-500" />
                    <span>Firestore Synced</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-400 p-2 bg-white rounded-2xl border border-gray-100 w-fit animate-pulse">
              <Bot className="w-4 h-4 text-[#FF5A5F]" />
              <span>ChakaChak Concierge is replying...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-[#FFF5F6] text-gray-700 hover:text-[#FF5A5F] text-[11px] font-semibold whitespace-nowrap transition border border-gray-200/60"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              role === 'customer'
                ? 'Type your query or service issue...'
                : 'Message Mumbai Fleet Dispatch...'
            }
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-2xl bg-[#FF5A5F] hover:bg-[#E8355C] disabled:opacity-40 text-white font-bold transition active:scale-95 shadow-md shadow-[#FF5A5F]/20 flex items-center justify-center"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
};
