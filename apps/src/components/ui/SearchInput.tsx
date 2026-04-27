import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Cari...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all"
        placeholder={placeholder}
        type="text"
      />
    </div>
  );
};

export default SearchInput;
