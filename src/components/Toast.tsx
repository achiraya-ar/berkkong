import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  tone: ToastTone;
  title?: string;
  message: string;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info", title?: string) => {
      const id = crypto.randomUUID();
      setItems((previous) => [...previous.slice(-3), { id, tone, title, message }]);
      const timer = window.setTimeout(() => {
        setItems((previous) => previous.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, 4500);
      timers.current.set(id, timer);
    },
    [],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, title) => show(message, "success", title),
      error: (message, title) => show(message, "error", title),
      info: (message, title) => show(message, "info", title),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div className={`toast toast--${item.tone}`} key={item.id} role="status">
              <span className="toast__icon">
                <Icon size={19} strokeWidth={2.2} />
              </span>
              <div className="toast__body">
                {item.title && <strong className="toast__title">{item.title}</strong>}
                <span className="toast__message">{item.message}</span>
              </div>
              <button
                className="toast__close"
                type="button"
                aria-label="ปิดข้อความ"
                onClick={() => dismiss(item.id)}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
