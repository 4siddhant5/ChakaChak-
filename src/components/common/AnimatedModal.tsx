import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'sheet' | 'dialog';
  maxWidth?: string;
  className?: string;
  maxHeight?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  variant = 'sheet',
  maxWidth = 'max-w-md',
  maxHeight = 'max-h-[88vh]',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            key="modal-content"
            initial={
              variant === 'sheet'
                ? { opacity: 0, y: '100%' }
                : { opacity: 0, scale: 0.94, y: 16 }
            }
            animate={
              variant === 'sheet'
                ? { opacity: 1, y: 0 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              variant === 'sheet'
                ? { opacity: 0, y: '100%' }
                : { opacity: 0, scale: 0.94, y: 16 }
            }
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full ${maxWidth} rounded-t-[24px] sm:rounded-[20px] ${maxHeight} overflow-hidden shadow-[0_20px_50px_-12px_rgba(18,34,46,0.25)] flex flex-col ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
