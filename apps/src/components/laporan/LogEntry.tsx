import React from 'react';
import type { StokLog } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface LogEntryProps {
  log: StokLog;
}

const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const isMasuk = log.type === 'masuk';

  return (
    <div className="flex items-start gap-md py-sm pl-md relative z-10">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMasuk ? 'bg-primary-container' : 'bg-error-container'}`}>
        <span className={`material-symbols-outlined text-[18px] ${isMasuk ? 'text-primary' : 'text-error'}`}>
          {isMasuk ? 'add' : 'remove'}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-sm">
          <span className={`font-body-md text-body-md font-medium ${isMasuk ? 'text-primary' : 'text-error'}`}>
            {isMasuk ? '+' : '-'}{log.quantity}
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            Stok {isMasuk ? 'Masuk' : 'Keluar'}
          </span>
        </div>
        {log.note && <p className="font-body-sm text-body-sm text-on-surface-variant">{log.note}</p>}
        <p className="font-label-md text-label-md text-outline mt-xs">{formatDate(log.createdAt, 'long')}</p>
      </div>
    </div>
  );
};

export default LogEntry;
