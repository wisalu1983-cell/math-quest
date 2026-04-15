// src/components/LoadingScreen.tsx

interface LoadingScreenProps {
  message?: string;
}

/** 替换页面级 `return null` 黑屏，提供统一的加载占位。*/
export default function LoadingScreen({ message = '加载中…' }: LoadingScreenProps) {
  return (
    <div
      className="min-h-dvh bg-bg flex items-center justify-center safe-top"
      aria-busy="true"
      aria-label={message}
    >
      <p className="text-text-2 text-sm">{message}</p>
    </div>
  );
}
