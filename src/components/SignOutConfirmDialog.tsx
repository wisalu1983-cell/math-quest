import type { DirtyKey } from '@/sync/types';
import Dialog from './Dialog';

interface SignOutConfirmDialogProps {
  dirtyKeys: DirtyKey[];
  onCancel: () => void;
  onForce: () => void;
}

const KEY_LABEL: Record<DirtyKey, string> = {
  profiles: '个人资料',
  game_progress: '进度数据',
  history_records: '练习历史',
  rank_match_sessions: '段位赛记录',
};

export default function SignOutConfirmDialog({
  dirtyKeys,
  onCancel,
  onForce,
}: SignOutConfirmDialogProps) {
  const items = dirtyKeys.map(key => KEY_LABEL[key]).join('、');

  return (
    <Dialog open onClose={onCancel} title="还有未同步的数据">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text-2">
          以下数据尚未同步到云端：
          <span className="font-bold text-text">{items}</span>。
          登出后这些数据仍保留在本设备，但当前待同步队列会被丢弃，不会同步到你的账号或下一个登录账号。
        </p>
        <div className="flex gap-3">
          <button type="button" className="btn-primary flex-1" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn-secondary flex-1 text-danger" onClick={onForce}>
            仍然登出
          </button>
        </div>
      </div>
    </Dialog>
  );
}
