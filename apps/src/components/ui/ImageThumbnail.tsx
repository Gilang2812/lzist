import React from 'react';

interface ImageThumbnailProps {
  src: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ src, alt = '', onClick, className = '' }) => {
  return (
    <div
      className={`w-24 h-24 rounded-lg bg-surface-variant overflow-hidden border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={onClick}
    >
      <img alt={alt} className="w-full h-full object-cover" src={src} />
    </div>
  );
};

export default ImageThumbnail;
