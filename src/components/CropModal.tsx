import React from 'react';
import { motion } from 'motion/react';
import { Feather, X, CheckCircle2 } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  cropSrc: string;
  cropZoom: number;
  cropPanX: number;
  cropPanY: number;
  setCropZoom: (zoom: number) => void;
  onClose: () => void;
  onApply: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onMouseUp: () => void;
}

export default function CropModal({
  isOpen,
  cropSrc,
  cropZoom,
  cropPanX,
  cropPanY,
  setCropZoom,
  onClose,
  onApply,
  onMouseDown,
  onMouseMove,
  onTouchStart,
  onTouchMove,
  onMouseUp
}: CropModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      id="crop-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2A]/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-[#F4F4F3] border border-[#2C2C2A]/15 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl font-serif text-[#2C2C2A]"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex space-x-2 items-center text-[#5A6351]">
            <Feather className="w-5 h-5 animate-pulse" />
            <span className="font-sans-ui text-xs tracking-widest font-bold uppercase">Image Cropper // 封面圖美學對焦</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#2C2C2A]/5 transition-colors text-[#2C2C2A]/60 hover:text-[#2C2C2A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-xl font-bold mb-1.5 tracking-tight">調整封面圖裁切</h3>
        <p className="font-sans-ui text-xs text-[#2C2C2A]/60 mb-5 leading-relaxed">
          利用滑鼠或手機觸控在黑框內<strong>拖曳圖片</strong>以調整位置，並使用下方拉條進行<strong>縮放對焦</strong>，以呈現最完美的慢活構圖比例。
        </p>

        {/* 裁切視窗主容器 (1:1 比例) */}
        <div className="w-full flex justify-center mb-5">
          <div 
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            className="w-[350px] h-[350px] max-w-full relative overflow-hidden bg-[#1C1C1A] rounded-lg border-2 border-[#5A6351]/30 shadow-inner select-none cursor-move touch-none"
          >
            {/* 裁切來源底圖 */}
            {cropSrc && (
              <img 
                src={cropSrc} 
                alt="Crop Source" 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${cropPanX}px, ${cropPanY}px) scale(${cropZoom})`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* 網格對焦層 - 三分法美學輔助線 (Rule of Thirds) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0">
              <div className="w-full h-1/3 border-b border-dashed border-white/25" />
              <div className="w-full h-1/3 border-b border-dashed border-white/25" />
            </div>
            <div className="absolute inset-0 pointer-events-none flex justify-between p-0">
              <div className="h-full w-1/3 border-r border-dashed border-white/25" />
              <div className="h-full w-1/3 border-r border-dashed border-white/25" />
            </div>

            {/* 視覺四角微型 L 對焦框 */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/80 pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/80 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/80 pointer-events-none" />

            {/* 中央文藝對焦十字符號 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-45">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white" />
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white" />
            </div>
          </div>
        </div>

        {/* 縮放調節滑桿 */}
        <div className="bg-[#2C2C2A]/5 border border-[#2C2C2A]/10 rounded-xl p-3.5 mb-6 font-sans-ui text-xs text-[#2C2C2A]/70 flex items-center justify-between gap-4">
          <span className="font-mono-data tracking-wider uppercase text-[10px] text-[#2C2C2A]/55 flex-shrink-0">Zoom Level</span>
          <input 
            type="range"
            min="1.0"
            max="3.0"
            step="0.01"
            value={cropZoom}
            onChange={(e) => setCropZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#5A6351] cursor-pointer h-1 bg-[#2C2C2A]/10 rounded-lg appearance-none"
          />
          <span className="font-mono-data font-bold w-[45px] text-right text-[#5A6351]">{cropZoom.toFixed(2)}x</span>
        </div>

        {/* 控制按鈕 */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 py-2.5 rounded-lg text-center font-sans-ui text-xs text-[#2C2C2A]/70 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] py-2.5 rounded-lg text-center font-sans-ui font-medium text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>確認裁切並套用</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
