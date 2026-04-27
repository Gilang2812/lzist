import React from 'react';

interface ImageGalleryRowProps {
  images: string[];
  altPrefix?: string;
  onImageClick?: (url: string) => void;
}

const ImageGalleryRow: React.FC<ImageGalleryRowProps> = ({ images, altPrefix = 'Reference', onImageClick }) => {
  return (
    <div>
      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">REFERENSI</p>
      <div className="flex gap-sm">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className="w-24 h-24 rounded-lg bg-surface-variant overflow-hidden border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onImageClick && onImageClick(img)}
          >
            <img alt={`${altPrefix} reference`} className="w-full h-full object-cover" src={img} />
          </div>
        ))}
        <div className="w-24 h-24 rounded-lg bg-surface-container flex items-center justify-center border border-dashed border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-outline">add_photo_alternate</span>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryRow;
