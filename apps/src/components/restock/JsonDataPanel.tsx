import React from 'react';

interface JsonDataPanelProps {
  data?: object;
  onImport?: (json: string) => void;
}

const JsonDataPanel: React.FC<JsonDataPanelProps> = ({ data, onImport }) => {
  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    onImport?.(text);
  };

  return (
    <div className="flex flex-col gap-md p-md bg-surface-container rounded-xl border border-surface-variant">
      <h3 className="font-h3 text-h3 text-on-surface">Data JSON</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Export atau import data restock list dalam format JSON.
      </p>
      <div className="flex gap-sm">
        <button onClick={handleCopy} className="flex items-center gap-xs text-primary hover:bg-surface-container-high px-md py-sm rounded-md transition-colors border border-surface-variant">
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
          <span className="font-label-md text-label-md">Copy JSON</span>
        </button>
        <button onClick={handlePaste} className="flex items-center gap-xs text-primary hover:bg-surface-container-high px-md py-sm rounded-md transition-colors border border-surface-variant">
          <span className="material-symbols-outlined text-[18px]">content_paste</span>
          <span className="font-label-md text-label-md">Paste JSON</span>
        </button>
      </div>
    </div>
  );
};

export default JsonDataPanel;
