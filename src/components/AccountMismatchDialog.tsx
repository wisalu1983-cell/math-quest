import Dialog from './Dialog';

interface AccountMismatchDialogProps {
  currentLocalAuthId: string;
  incomingUserId: string;
  onProceed: () => void;
  onCancelLogin: () => void;
}

export default function AccountMismatchDialog({
  currentLocalAuthId,
  incomingUserId,
  onProceed,
  onCancelLogin,
}: AccountMismatchDialogProps) {
  return (
    <Dialog
      open
      onClose={() => undefined}
      dismissible={false}
      title="本设备已绑定另一个账号"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text-2">
          本设备当前保存的进度属于另一个账号（{currentLocalAuthId}）。登录 {incomingUserId}
          将只加载该账号的云端数据，本地现有进度不会迁移到新账号。
        </p>
        <div className="grid gap-3">
          <button type="button" className="btn-primary w-full" onClick={onProceed}>
            继续登录
          </button>
          <button type="button" className="btn-secondary w-full" onClick={onCancelLogin}>
            取消登录
          </button>
        </div>
      </div>
    </Dialog>
  );
}
