import Dialog from './Dialog';
import type { MergeGuideDialogStep } from '@/sync/merge-flow';

interface MergeGuideDialogProps {
  step: MergeGuideDialogStep;
  onConfirmMerge: () => void;
  onConfirmDiscard: () => void;
  onRetry: () => void;
  onSwitch: () => void;
  onCancelLogin: () => void;
}

const BUSY_COPY: Partial<Record<MergeGuideDialogStep, string>> = {
  loading: '正在检查本地与云端进度',
  'auto-pulling': '正在载入云端进度',
  'auto-pushing': '正在保存本地进度',
  merging: '正在合并进度',
  discarding: '正在使用云端进度',
  success: '同步准备完成',
};

function BusyState({ step }: { step: MergeGuideDialogStep }) {
  return (
    <div className="flex flex-col items-center gap-4 py-5 text-center">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm font-bold text-text-2">{BUSY_COPY[step]}</p>
    </div>
  );
}

export default function MergeGuideDialog({
  step,
  onConfirmMerge,
  onConfirmDiscard,
  onRetry,
  onSwitch,
  onCancelLogin,
}: MergeGuideDialogProps) {
  const isBusy = step in BUSY_COPY;

  return (
    <Dialog
      open
      onClose={() => undefined}
      dismissible={false}
      title={
        step === 'wait-user-choice'
          ? '发现本地进度'
          : step === 'merge-error'
            ? '合并失败'
            : step === 'discard-error'
              ? '拉取云端失败'
              : step === 'offline-waiting'
                ? '首次登录需要网络'
                : undefined
      }
    >
      {isBusy ? <BusyState step={step} /> : null}

      {step === 'wait-user-choice' ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-2">
            你的设备上有练习进度，云端账号也有进度。
          </p>
          <div className="grid gap-3">
            <button type="button" className="btn-primary w-full" onClick={onConfirmMerge}>
              合并到云端
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onConfirmDiscard}>
              使用云端
            </button>
            <button type="button" className="text-sm font-bold text-text-2" onClick={onCancelLogin}>
              取消登录
            </button>
          </div>
        </div>
      ) : null}

      {step === 'merge-error' ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-2">网络异常，已保留本地数据。</p>
          <div className="grid gap-3">
            <button type="button" className="btn-primary w-full" onClick={onRetry}>
              重试合并
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onSwitch}>
              改用云端数据
            </button>
            <button type="button" className="text-sm font-bold text-text-2" onClick={onCancelLogin}>
              取消登录
            </button>
          </div>
        </div>
      ) : null}

      {step === 'discard-error' ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-2">暂未获取到云端数据。</p>
          <div className="grid gap-3">
            <button type="button" className="btn-primary w-full" onClick={onRetry}>
              重试
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onSwitch}>
              合并本地进度
            </button>
            <button type="button" className="text-sm font-bold text-text-2" onClick={onCancelLogin}>
              取消登录
            </button>
          </div>
        </div>
      ) : null}

      {step === 'offline-waiting' ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-text-2">完成一次同步后即可离线使用。</p>
          <div className="grid gap-3">
            <button type="button" className="btn-primary w-full" onClick={onRetry}>
              重试
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onCancelLogin}>
              取消登录
            </button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
