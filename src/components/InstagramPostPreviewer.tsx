import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { Story } from '../types';

// 慢活品牌美學 - 分類高畫質 Unsplash 備份封面圖列表
const getFallbackImage = (tag: string, index: number = 0): string => {
  const chargers = [
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80'
  ];
  const offices = [
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1200&q=80'
  ];
  const travels = [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'
  ];

  const tagClean = tag || '';
  let list = chargers;
  if (tagClean.includes('辦公') || tagClean.toLowerCase().includes('office')) {
    list = offices;
  } else if (tagClean.includes('旅行') || tagClean.toLowerCase().includes('travel')) {
    list = travels;
  }
  return list[Math.abs(index) % list.length];
};

interface InstagramPostPreviewerProps {
  story: Story;
  currentIssueNumber: number;
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  editCoverImage: string;
  onDownload: (ratio: '4:5' | '9:16') => void;
}

export default function InstagramPostPreviewer({
  story,
  currentIssueNumber,
  isEditing,
  editTitle,
  editDescription,
  editCoverImage,
  onDownload
}: InstagramPostPreviewerProps) {
  
  const [activeRatio, setActiveRatio] = React.useState<'4:5' | '9:16'>('4:5');
  const title = isEditing ? editTitle : story.title;
  const description = isEditing ? editDescription : story.description;
  const coverImage = isEditing ? editCoverImage : story.coverImage;
  const dateTag = story.date || 'ISSUE 025 // SUMMER 2026';
  const issueStr = `ISSUE ${String(currentIssueNumber).padStart(3, '0')}`;
  
  // 控制預覽時的備份載入狀態，防止破圖
  const [displayImage, setDisplayImage] = React.useState(coverImage);

  React.useEffect(() => {
    setDisplayImage(coverImage);
  }, [coverImage]);

  return (
    <div className="lg:col-span-5 flex flex-col items-center bg-[#5A6351]/5 border border-[#5A6351]/15 rounded-2xl p-6 shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full mb-4">
        <div className="flex items-center space-x-2 text-[#5A6351]">
          <Smartphone className="w-4 h-4" />
          <span className="font-mono-data text-xs tracking-wider font-bold uppercase text-[#5A6351]">INSTAGRAM POST GENERATOR // 官方社群貼文配圖</span>
        </div>
        <div className="flex space-x-1.5 self-end sm:self-auto bg-[#5A6351]/10 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveRatio('4:5')}
            className={`px-3 py-1 text-[10px] font-sans-ui font-bold rounded-md transition-all cursor-pointer ${
              activeRatio === '4:5'
                ? 'bg-[#5A6351] text-white shadow-sm'
                : 'text-[#5A6351]/75 hover:text-[#5A6351]'
            }`}
          >
            4:5 貼文
          </button>
          <button
            type="button"
            onClick={() => setActiveRatio('9:16')}
            className={`px-3 py-1 text-[10px] font-sans-ui font-bold rounded-md transition-all cursor-pointer ${
              activeRatio === '9:16'
                ? 'bg-[#5A6351] text-white shadow-sm'
                : 'text-[#5A6351]/75 hover:text-[#5A6351]'
            }`}
          >
            9:16 限動
          </button>
        </div>
      </div>

      <p className="font-sans-ui text-[11px] text-[#2C2C2A]/65 leading-relaxed mb-5 self-start">
        此區域為專題產生時同步渲染的 <strong>官方 IG 貼文專用配圖 (支援 1080x1350 與 1080x1920 雙尺寸)</strong>。配圖的文字會隨著左側您的編輯在下方預覽中<strong>即時同步更新</strong>。字體、品牌邊框和排版細節均符合 Oasis Lab. 的生活美學風格，確保官方帳號視覺的一致性。
      </p>

      {/* IG 貼文卡片預覽 */}
      <div className="mb-5 flex justify-center w-full">
        <div className={`w-full max-w-[340px] relative bg-[#2C2C2A] rounded-xl shadow-lg overflow-hidden border border-[#2C2C2A]/15 select-none group transition-all duration-300 ${
          activeRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]'
        }`}>
          {/* 專題封面底圖 */}
          <img 
            src={displayImage} 
            alt="IG Post BG" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
            onError={() => {
              const fallback = getFallbackImage(story.targetTag, 0);
              if (displayImage !== fallback) {
                setDisplayImage(fallback);
              }
            }}
          />
          {/* 電影感色調暗部疊加層，保證文字高對比度 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2A]/65 via-[#2C2C2A]/45 to-[#2C2C2A]/75 mix-blend-multiply" />
          
          {/* 外層精細輔助線 (3.5% Padding) */}
          <div className="absolute inset-3.5 border border-[#F4F4F3]/20 rounded-lg pointer-events-none" />
          
          {/* 內層品牌實線邊框與 L 型文藝直角標記 (5.5% Padding) */}
          <div className="absolute inset-5.5 border border-[#F4F4F3]/60 rounded-md p-5 flex flex-col justify-between items-center text-center text-[#F4F4F3] pointer-events-none">
            {/* Corner marks (角落 L 型美學對焦標記) */}
            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#F4F4F3]/90" />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-[#F4F4F3]/90" />
            <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-[#F4F4F3]/90" />
            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-[#F4F4F3]/90" />

            {/* 頁首品牌標誌與策展字樣 */}
            <div className="flex flex-col items-center pt-2">
              <span className="font-mono-data text-[10px] tracking-[0.25em] font-extrabold text-[#F4F4F3]/95 uppercase">Oasis Lab.</span>
              <span className="font-mono-data text-[8px] tracking-[0.15em] text-[#F4F4F3]/50 uppercase mt-0.5">// EDITORIAL JOURNAL //</span>
            </div>

            {/* 中間主標題與摘要引言 */}
            <div className="flex flex-col items-center max-w-[90%] space-y-3.5 my-auto">
              <div className="w-12 h-[1.5px] bg-[#F4F4F3]/30" />
              <h2 className="font-serif font-black text-lg md:text-xl leading-snug tracking-wide line-clamp-2 text-[#F4F4F3] text-center">
                {title || '未命名專題'}
              </h2>
              <div className="w-8 h-[1px] bg-[#F4F4F3]/25" />
              <p className="font-serif italic text-[11px] leading-relaxed text-[#F4F4F3]/80 line-clamp-2 font-light text-center px-1">
                “{description || '無引言內容'}”
              </p>
              <div className="w-12 h-[1.5px] bg-[#F4F4F3]/30" />
            </div>

            {/* 頁尾期刊資訊標籤 */}
            <div className="flex flex-col items-center pb-1">
              <span className="font-mono-data text-[9px] tracking-[0.15em] font-bold text-[#F4F4F3]/90">{issueStr} // {story.targetTag.toUpperCase()}</span>
              <span className="font-mono-data text-[8px] tracking-[0.1em] text-[#F4F4F3]/40 mt-1 uppercase">
                {dateTag.split('//')[1]?.trim() || 'SUMMER 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* 一鍵下載高解析 PNG 圖按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
        <button
          type="button"
          onClick={() => onDownload('4:5')}
          className="flex-1 bg-[#2C2C2A] hover:bg-[#1E1E1D] text-[#F4F4F3] font-sans-ui text-xs font-bold py-3 px-4 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-1.5 shadow-md hover:shadow-lg"
        >
          <Download className="w-3.5 h-3.5 text-[#F4F4F3]" />
          <span>下載貼文 (4:5)</span>
        </button>
        <button
          type="button"
          onClick={() => onDownload('9:16')}
          className="flex-1 bg-white hover:bg-neutral-50 text-[#2C2C2A] border border-[#2C2C2A]/20 font-sans-ui text-xs font-bold py-3 px-4 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md"
        >
          <Download className="w-3.5 h-3.5 text-[#2C2C2A]" />
          <span>下載限動 (9:16)</span>
        </button>
      </div>
    </div>
  );
}
