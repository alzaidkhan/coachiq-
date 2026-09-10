import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Camera, Check, Sparkles, Trash2, Upload, UserRound, X } from "lucide-react";
import { avatarPresets, compressImageFile, type AvatarPreset } from "../lib/avatarPresets";

interface ProfilePhotoModalProps {
  currentPhoto?: string;
  playerName: string;
  role?: string;
  onSave: (photoUrl: string) => void;
  onClose: () => void;
}

export function ProfilePhotoModal({
  currentPhoto = "",
  playerName,
  role = "",
  onSave,
  onClose,
}: ProfilePhotoModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhoto);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (
    playerName
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("") || "CQ"
  )
    .slice(0, 2)
    .toUpperCase();

  const handleFile = async (file: File) => {
    if (!file) return;
    setErrorMessage("");
    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 240, 0.84);
      setSelectedPhoto(compressedDataUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not process this image."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setErrorMessage("");
    setSelectedPhoto(preset.url);
  };

  const handleClearPhoto = () => {
    setErrorMessage("");
    setSelectedPhoto("");
  };

  const handleApply = () => {
    onSave(selectedPhoto);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Update profile picture"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#e6ddd4] bg-[#fbf8f3] shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eee5dc] bg-[#f7f2ea] px-6 py-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b45124]">
              Player Identity
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em] text-[#1d3024]">
              Choose Profile Picture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8b837b] transition hover:bg-[#eadecc] hover:text-[#1d3024]"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Preview */}
          <div className="flex items-center gap-5 rounded-2xl border border-[#e6ddd4] bg-white p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#1d3024] bg-[#1d3024] shadow-md">
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8b837b]">
                Current Preview
              </div>
              <div className="mt-1 truncate font-display text-lg font-semibold text-[#1d3024]">
                {playerName || "Player"}
              </div>
              <p className="mt-0.5 text-xs text-[#6e665e]">
                {selectedPhoto
                  ? "Custom picture or avatar selected"
                  : "Using standard initials badge"}
              </p>
            </div>
            {selectedPhoto && (
              <button
                type="button"
                onClick={handleClearPhoto}
                className="flex items-center gap-1.5 rounded-xl border border-[#e6ddd4] bg-[#fcfaf7] px-3 py-2 text-xs font-semibold text-[#b45124] hover:bg-[#fff4ed]"
                title="Reset to default initials"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Upload Area */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#546859]">
              Upload Photo From Device
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                dragActive
                  ? "border-[#e66a2c] bg-[#fff5ee]"
                  : "border-[#d8cebe] bg-[#fcfaf7] hover:border-[#1d3024] hover:bg-[#f6f2ec]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleInputChange}
              />
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d3024] text-white">
                {isProcessing ? (
                  <Sparkles size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-[#1d3024]">
                {isProcessing
                  ? "Processing and optimizing photo…"
                  : "Click or drag & drop photo here"}
              </p>
              <p className="mt-1 text-xs text-[#8b837b]">
                PNG, JPG, or WebP · Automatically optimized for cricket player desk
              </p>
            </div>
            {errorMessage && (
              <p className="mt-2 text-xs font-semibold text-[#b45124]">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Cricket Avatar Presets */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#546859]">
                Or Choose a Cricket Avatar
              </label>
              <span className="text-[11px] font-semibold text-[#8b837b]">
                6 Handcrafted Badges
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {avatarPresets.map((preset) => {
                const isCurrent = selectedPhoto === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative flex flex-col items-center rounded-2xl border p-2 text-center transition ${
                      isCurrent
                        ? "border-[#1d3024] bg-[#eef5ef] ring-2 ring-[#1d3024]"
                        : "border-[#e6ddd4] bg-white hover:border-[#365b44] hover:bg-[#f8f5ef]"
                    }`}
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-full shadow-sm">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="mt-1.5 block w-full truncate text-[11px] font-bold text-[#1d3024]">
                      {preset.name}
                    </span>
                    {isCurrent && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#1d3024] text-white shadow">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#eee5dc] bg-[#f7f2ea] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d8cebe] bg-white px-4 py-2.5 text-xs font-bold text-[#544d45] transition hover:bg-[#eee6dc]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 rounded-xl bg-[#1d3024] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#284533]"
          >
            <Check size={15} />
            <span>Apply Profile Picture</span>
          </button>
        </div>
      </div>
    </div>
  );
}
