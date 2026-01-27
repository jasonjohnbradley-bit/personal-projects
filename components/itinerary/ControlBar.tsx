'use client';

interface ControlBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onReset: () => void;
  onExport: () => void;
}

export function ControlBar({ isSaving, lastSaved, onReset, onExport }: ControlBarProps) {
  const getStatusText = () => {
    if (isSaving) return '💾 Saving...';
    if (lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      if (seconds < 5) return '✨ Changes saved!';
      if (seconds < 60) return `✅ Saved ${seconds}s ago`;
      return '✅ All changes saved';
    }
    return '✨ Ready to edit';
  };

  return (
    <div className="control-bar">
      <div className="status">{getStatusText()}</div>
      <div className="control-buttons">
        <button className="btn btn-secondary" onClick={onReset}>
          🌿 Reset
        </button>
        <button className="btn btn-primary" onClick={onExport}>
          📥 Export
        </button>
      </div>
    </div>
  );
}
