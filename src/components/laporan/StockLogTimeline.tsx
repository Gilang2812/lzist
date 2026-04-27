import React from 'react';
import type { StokLog } from '../../types';
import LogEntry from './LogEntry';

interface StockLogTimelineProps {
  logs: StokLog[];
}

const StockLogTimeline: React.FC<StockLogTimelineProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-lg">
        Belum ada log stok.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-surface-variant"></div>
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
};

export default StockLogTimeline;
