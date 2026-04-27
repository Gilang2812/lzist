import React, { useState } from 'react';

interface DateRangePickerProps {
  onChange?: (range: { start: string; end: string }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleChange = (field: 'start' | 'end', value: string) => {
    const newStart = field === 'start' ? value : start;
    const newEnd = field === 'end' ? value : end;
    if (field === 'start') setStart(value);
    else setEnd(value);
    if (newStart && newEnd) onChange?.({ start: newStart, end: newEnd });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm">
      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Dari</label>
        <input
          type="date"
          value={start}
          onChange={(e) => handleChange('start', e.target.value)}
          className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>
      <span className="hidden sm:block text-on-surface-variant mt-lg">—</span>
      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Sampai</label>
        <input
          type="date"
          value={end}
          onChange={(e) => handleChange('end', e.target.value)}
          className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
