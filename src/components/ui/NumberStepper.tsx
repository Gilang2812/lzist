import React from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ value, onChange, min = 0, max = 9999, label }) => {
  return (
    <div className="flex items-center gap-sm">
      {label && <span className="font-body-sm text-body-sm text-on-surface-variant mr-sm">{label}</span>}
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <span className="w-10 text-center font-body-md text-body-md text-on-surface font-medium">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
    </div>
  );
};

export default NumberStepper;
