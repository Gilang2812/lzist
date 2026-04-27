import React from 'react';

interface ImageUploaderProps {
  images: string[];
  onUpload?: (file: File) => void;
  onRemove?: (index: number) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onUpload, onRemove }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
  };

  return (
    <div className="flex flex-wrap gap-sm">
      {images.map((img, idx) => (
        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant group">
          <img src={img} alt="" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          )}
        </div>
      ))}
      <label className="w-20 h-20 rounded-lg bg-surface-container flex items-center justify-center border border-dashed border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined text-outline">add_photo_alternate</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
