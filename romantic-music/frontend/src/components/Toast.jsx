import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

/** Dismissible notification. `toast` is { id, type: 'success' | 'error' | 'info', text } or null. */
export default function Toast({ toast, onClose }) {
  const Icon = toast ? ICONS[toast.type] ?? Info : null;

  return (
    <div className="toast-region">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="toast__text">{toast.text}</span>
            <button type="button" className="toast__close" onClick={onClose} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
