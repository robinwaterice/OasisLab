import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface KeywordModalProps {
  isOpen: boolean;
  currentIssueNumber: number;
  nomadKeyword: string;
  officeKeyword: string;
  minimalistTravelKeyword: string;
  setNomadKeyword: (val: string) => void;
  setOfficeKeyword: (val: string) => void;
  setMinimalistTravelKeyword: (val: string) => void;
  onClose: () => void;
  onGenerate: (keywords: { nomad?: string; office?: string; minimalistTravel?: string }) => void;
}

export default function KeywordModal({
  isOpen,
  currentIssueNumber,
  nomadKeyword,
  officeKeyword,
  minimalistTravelKeyword,
  setNomadKeyword,
  setOfficeKeyword,
  setMinimalistTravelKeyword,
  onClose,
  onGenerate
}: KeywordModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      id="keyword-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2A]/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-[#F4F4F3] border border-[#2C2C2A]/15 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl font-serif text-[#2C2C2A]"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex space-x-2 items-center text-[#5A6351]">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-sans-ui text-xs tracking-widest font-bold uppercase">AI Topic Customization</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#2C2C2A]/5 transition-colors text-[#2C2C2A]/60 hover:text-[#2C2C2A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-xl font-bold mb-2 tracking-tight">自訂最新一期專題關鍵字</h3>
        <p className="font-sans-ui text-xs text-[#2C2C2A]/60 mb-6 leading-relaxed">
          您可以為下一期 (ISSUE {String(currentIssueNumber + 1).padStart(3, '0')}) 的三個主題指定專題關鍵字。AI 將依您填寫的關鍵字為核心進行深度策展與寫作；若留白，則依預設美學自由生成。
        </p>

        <div className="space-y-4 font-sans-ui text-xs text-[#2C2C2A]/80 mb-6">
          <div>
            <label className="block font-bold mb-1.5 text-[#2C2C2A]/70">
              💻 游牧數位 (Digital Nomad) 專題關鍵字
            </label>
            <input
              type="text"
              value={nomadKeyword}
              onChange={(e) => setNomadKeyword(e.target.value)}
              placeholder="例如：人體工學機械鍵盤、輕量降噪耳機（選填）"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui placeholder:text-[#2C2C2A]/30 transition-all"
            />
          </div>

          <div>
            <label className="block font-bold mb-1.5 text-[#2C2C2A]/70">
              ☕ 辦公美學 (Office Aesthetics) 專題關鍵字
            </label>
            <input
              type="text"
              value={officeKeyword}
              onChange={(e) => setOfficeKeyword(e.target.value)}
              placeholder="例如：原木升降桌、極簡手沖咖啡壺（選填）"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui placeholder:text-[#2C2C2A]/30 transition-all"
            />
          </div>

          <div>
            <label className="block font-bold mb-1.5 text-[#2C2C2A]/70">
              ✈️ 極簡旅行 (Minimalist Travel) 專題關鍵字
            </label>
            <input
              type="text"
              value={minimalistTravelKeyword}
              onChange={(e) => setMinimalistTravelKeyword(e.target.value)}
              placeholder="例如：耐磨防潑水雙肩包、超輕量盥洗包（選填）"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui placeholder:text-[#2C2C2A]/30 transition-all"
            />
          </div>
        </div>

        <div className="bg-[#5A6351]/5 border-l-2 border-[#5A6351] p-3 text-[11px] font-sans-ui text-[#5A6351]/90 rounded mb-6 leading-relaxed">
          💡 填寫關鍵字可以精準引導 AI 創作出您喜愛的好物故事，為您客製專屬的生活美學提案。
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 py-2.5 rounded-lg text-center font-sans-ui text-xs text-[#2C2C2A]/70 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => {
              onGenerate({
                nomad: nomadKeyword,
                office: officeKeyword,
                minimalistTravel: minimalistTravelKeyword
              });
            }}
            className="flex-1 bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] py-2.5 rounded-lg text-center font-sans-ui font-medium text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>開始 AI 策展生成</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
