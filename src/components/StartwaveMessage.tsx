import { AlertCircleIcon, UsersIcon } from "@/components/Icons";

type StartwaveMessageProps = {
  type: "not-found" | "multiple" | "error";
  message: string;
  candidateCount?: number;
  onRetry?: () => void;
};

const tone = {
  "not-found": {
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <AlertCircleIcon className="h-5 w-5 shrink-0 text-red-500" />,
  },
  multiple: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: <UsersIcon className="h-5 w-5 shrink-0 text-amber-600" />,
  },
  error: {
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <AlertCircleIcon className="h-5 w-5 shrink-0 text-red-500" />,
  },
};

export default function StartwaveMessage({ type, message, candidateCount, onRetry }: StartwaveMessageProps) {
  const config = tone[type];

  return (
    <div className={`rounded border p-4 ${config.className}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <p className="text-sm">{message}</p>
          {type === "multiple" && candidateCount !== undefined ? (
            <p className="mt-1 text-xs text-[var(--muted)]">已匹配 {candidateCount} 位候选选手，请补充后四位精确查询。</p>
          ) : null}
          {type === "error" && onRetry ? (
            <button type="button" onClick={onRetry} className="mt-2 text-sm font-bold text-[var(--brand-navy)] underline hover:no-underline">
              重试
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
