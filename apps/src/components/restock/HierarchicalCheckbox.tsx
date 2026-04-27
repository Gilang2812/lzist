import React from 'react';

interface HierarchicalCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
}

const HierarchicalCheckbox: React.FC<HierarchicalCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        checked={checked || indeterminate}
        onChange={onChange}
        disabled={disabled}
        className={`custom-checkbox appearance-none w-md h-md border-2 rounded-DEFAULT cursor-pointer transition-colors relative ${
          indeterminate
            ? 'indeterminate border-primary-container bg-primary-container'
            : checked
            ? 'border-primary-container bg-primary-container'
            : disabled
            ? 'border-outline-variant bg-surface-container-high cursor-not-allowed'
            : 'border-outline-variant'
        }`}
        type="checkbox"
      />
    </div>
  );
};

export default HierarchicalCheckbox;
