/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ArrowLeft, 
  ArrowRight, 
  Tag, 
  ExternalLink, 
  Compass, 
  Bookmark, 
  Share2, 
  Heart, 
  Feather, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  X,
  Smartphone,
  Download,
  Lock,
  Unlock,
  Key,
  Database,
  ShoppingBag,
  PlusCircle,
  Trash2,
  Edit3,
  Link,
  GripVertical,
  Star
} from 'lucide-react';
import { Story, Product } from './types';
import { STORIES, HISTORICAL_STORIES, NEXT_ISSUE_STORIES, PRODUCTS } from './data';

// ================== 【可拖曳排序商品列 - 獨立子元件】 ==================
interface SortableProductRowProps {
  product: Product;
  isSelected: boolean;
  isPendingDelete: boolean;
  onSelect: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function SortableProductRow({
  product, isSelected, isPendingDelete,
  onSelect, onDeleteRequest, onDeleteConfirm, onDeleteCancel
}: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      {/* 拖曳把手 */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-2 text-[#2C2C2A]/25 hover:text-[#5A6351] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        title="拖曳排序"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {/* 商品選取按鈕 */}
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 flex items-center space-x-2.5 text-left px-3 py-2.5 rounded-lg text-xs font-sans-ui border transition-all cursor-pointer ${
          isSelected
            ? 'bg-[#5A6351] text-[#F4F4F3] border-[#5A6351] shadow-md'
            : 'bg-[#F4F4F3]/60 text-[#2C2C2A]/70 hover:bg-[#2C2C2A]/5 border-[#2C2C2A]/10'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          product.status === 'active' ? 'bg-emerald-400' :
          product.status === 'pending' ? 'bg-amber-400' : 'bg-gray-300'
        }`} />
        <span className="flex-1 line-clamp-1 leading-snug font-semibold">{product.title_optimized}</span>
        {product.is_popular && (
          <Star className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-amber-300 fill-amber-300' : 'text-amber-400 fill-amber-400'}`} />
        )}
      </button>
      {/* 刪除按鈕（兩步確認） */}
      {isPendingDelete ? (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button type="button" onClick={onDeleteConfirm}
            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold font-sans-ui cursor-pointer transition-colors"
          >確認</button>
          <button type="button" onClick={onDeleteCancel}
            className="px-2 py-1 bg-[#2C2C2A]/8 hover:bg-[#2C2C2A]/15 text-[#2C2C2A]/60 rounded text-[10px] font-sans-ui cursor-pointer transition-colors"
          >取消</button>
        </div>
      ) : (
        <button type="button" title="刪除此商品" onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
          className="p-2 rounded-lg text-[#2C2C2A]/30 hover:text-red-500 hover:bg-red-50 border border-[#2C2C2A]/8 hover:border-red-200 transition-all cursor-pointer flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function App() {
  // 狀態管理：目前所在的頁面。'cover' 代表封面首頁，story 的 id 代表具體專體內頁
  const [currentView, setCurrentView] = useState<string>('cover');
  const [activeStories, setActiveStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_active_stories_v1');
      if (saved) return JSON.parse(saved) as Story[];
    } catch (e) {}
    return STORIES;
  });
  const [archivedStories, setArchivedStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_archived_stories_v1');
      if (saved) return JSON.parse(saved) as Story[];
    } catch (e) {}
    return HISTORICAL_STORIES;
  });
  const [currentIssueNumber, setCurrentIssueNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('oasis_issue_number_v1');
      if (saved) return parseInt(saved, 10);
    } catch (e) {}
    return 25;
  });
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<string>('all');
  const [activeReferral, setActiveReferral] = useState<Product | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // 管理者頁面登入與管理狀態
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // AI 策展期刊生成狀態
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('idle');

  // 策展指定關鍵字狀態
  const [showKeywordModal, setShowKeywordModal] = useState<boolean>(false);
  const [nomadKeyword, setNomadKeyword] = useState<string>('');
  const [officeKeyword, setOfficeKeyword] = useState<string>('');
  const [minimalistTravelKeyword, setMinimalistTravelKeyword] = useState<string>('');

  // 重置期數與編輯選取專題狀態
  const [rollbackIssueNum, setRollbackIssueNum] = useState<number>(25);
  const [selectedEditStoryId, setSelectedEditStoryId] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  // 後台 Shop 商品管理狀態
  const [editableProducts, setEditableProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_editable_products_v1');
      if (saved) return JSON.parse(saved) as Product[];
    } catch (e) {}
    return PRODUCTS;
  });
  const [selectedEditProductId, setSelectedEditProductId] = useState<string>('');
  const [editProductTitle, setEditProductTitle] = useState<string>('');
  const [editProductPrice, setEditProductPrice] = useState<string>('');
  const [editProductUrl, setEditProductUrl] = useState<string>('');
  const [editProductBtnText, setEditProductBtnText] = useState<string>('');
  const [editProductDescription, setEditProductDescription] = useState<string>('');
  const [editProductImageUrl, setEditProductImageUrl] = useState<string>('');
  const [editProductTags, setEditProductTags] = useState<string>('');
  const [editProductStatus, setEditProductStatus] = useState<'active' | 'pending' | 'draft'>('active');
  const [editProductIsPopular, setEditProductIsPopular] = useState<boolean>(false);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string>('');

  // DnD 感應器設定
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editableProducts.findIndex(p => p.id === active.id);
      const newIndex = editableProducts.findIndex(p => p.id === over.id);
      const reordered = arrayMove(editableProducts, oldIndex, newIndex);
      setEditableProducts(reordered);
      try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(reordered)); } catch(e) {}
    }
  };

  // 依期數動態計算月份與年度，May 2026 為第 25 期基底
  const getIssueDate = (issueNum: number) => {
    const baseIssue = 25;
    const baseYear = 2026;
    const baseMonthIndex = 4; // MAY
    const totalMonths = baseMonthIndex + (issueNum - baseIssue);
    const year = baseYear + Math.floor(totalMonths / 12);
    const monthIndex = ((totalMonths % 12) + 12) % 12;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const padNum = String(issueNum).padStart(3, '0');
    return `ISSUE ${padNum} // ${months[monthIndex]} ${year}`;
  };

  // 隨機偏移量（使顯示點擊數穩定且隨機，不會隨畫面重繪而頻繁亂跳）
  const [storyOffsets, setStoryOffsets] = useState<{[key: string]: number}>(() => {
    const offsets: {[key: string]: number} = {};
    const all = [...STORIES, ...HISTORICAL_STORIES, ...NEXT_ISSUE_STORIES];
    all.forEach(s => {
      // 隨機 800 - 1999 數字
      offsets[s.id] = Math.floor(Math.random() * 1200) + 800;
    });
    return offsets;
  });

  const [productOffsets, setProductOffsets] = useState<{[key: string]: number}>(() => {
    const offsets: {[key: string]: number} = {};
    PRODUCTS.forEach(p => {
      // 隨機 500 - 999 數字
      offsets[p.id] = Math.floor(Math.random() * 500) + 500;
    });
    return offsets;
  });

  // 實際點擊數/查看數統計 (從 localStorage 獲取或預設為一些初始演示數據)
  const [storyClicks, setStoryClicks] = useState<{[key: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('oasis_story_clicks_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // 預設演示用的點擊數（後臺數據從0開始計算）
    const defaultClicks: {[key: string]: number} = {};
    const all = [...STORIES, ...HISTORICAL_STORIES, ...NEXT_ISSUE_STORIES];
    all.forEach(s => {
      defaultClicks[s.id] = 0;
    });
    return defaultClicks;
  });

  const [productClicks, setProductClicks] = useState<{[key: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('oasis_product_clicks_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // 預設演示用的商品實際點擊數（後臺數據從0開始計算）
    const defaultClicks: {[key: string]: number} = {};
    PRODUCTS.forEach(p => {
      defaultClicks[p.id] = 0;
    });
    return defaultClicks;
  });

  // 保存統計數據至 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oasis_story_clicks_v3', JSON.stringify(storyClicks));
    } catch (e) {}
  }, [storyClicks]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_product_clicks_v3', JSON.stringify(productClicks));
    } catch (e) {}
  }, [productClicks]);

  // 💾 持久化儲存：AI 生成的專題與期數，避免重整後消失
  useEffect(() => {
    try {
      localStorage.setItem('oasis_active_stories_v1', JSON.stringify(activeStories));
    } catch (e) {}
  }, [activeStories]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_archived_stories_v1', JSON.stringify(archivedStories));
    } catch (e) {}
  }, [archivedStories]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_issue_number_v1', String(currentIssueNumber));
    } catch (e) {}
  }, [currentIssueNumber]);

  // 開啟專題細閱之輔助函數（自動登載實際點擊點數）
  const handleViewStory = (storyId: string) => {
    setStoryClicks(prev => ({
      ...prev,
      [storyId]: (prev[storyId] || 0) + 1
    }));
    setCurrentView(storyId);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // 處理商品導購重定向，並增加查看數
  const handleProductRedirect = (product: Product) => {
    setActiveReferral(product);
  };

  // 開啟商品沈浸式詳情介紹，並增加查看數
  const handleOpenProductDetail = (product: Product) => {
    setProductClicks(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    setSelectedProductDetail(product);
  };

  // PWA (Progressive Web App) 狀態
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showManualPwaGuide, setShowManualPwaGuide] = useState<boolean>(false);

  useEffect(() => {
    // 檢查是否為已排版、已安裝的獨立 standalone 模式運作
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      triggerToast('🎉 感謝安裝！「Oasis Lab.」已成功放置於您的手機或裝置桌面。');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      // 顯示手動引導說明（適合 iOS / Safari 或者尚未觸發原生 prompt 的流派）
      setShowManualPwaGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      triggerToast('✨ 感謝您的信任：正在將 Oasis Lab. 加載至主畫面。');
    }
    setDeferredPrompt(null);
  };

  // 觸發自定義高質感通知
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };


  // 全域故事池探尋，確保無論是當期故事或歷史已歸檔(Archive)故事，都能透過同一個詳細頁載入（使用 Map 進行 id 去重以防 React Key 重複）
  const allStories = Array.from(
    new Map(
      [...activeStories, ...archivedStories, ...NEXT_ISSUE_STORIES].map(s => [s.id, s])
    ).values()
  );
  const currentStory = allStories.find(story => story.id === currentView);

  // 根據專題的 targetTag 自動篩選出 status 為 'active' 且 tags 包含該 targetTag 的商品
  const getFilteredProducts = (story: Story) => {
    return editableProducts.filter(
      product => product.status === 'active' && product.context_tags.includes(story.targetTag)
    );
  };

  // 聯網搜尋趨勢與動態 AI 策展下一期專題
  const handleGenerateNextIssue = async (keywords?: { nomad?: string; office?: string; minimalistTravel?: string }) => {
    setIsGenerating(true);
    setGenerationStep('searching');
    
    const nextIssueNum = currentIssueNumber + 1;
    const nextIssueDate = getIssueDate(nextIssueNum);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('nvapi-')) {
        throw new Error('API Key is missing or invalid. Please configure a valid VITE_GEMINI_API_KEY in .env.local.');
      }

      await new Promise(resolve => setTimeout(resolve, 1800));
      setGenerationStep('writing');

      const systemInstructions = `你是一位享譽國際的極簡生活美學雜誌《Oasis Lab.》的總編輯。
你對現代都市人的生活方式有著深刻的理解，文筆溫潤、優雅、富有哲思與詩意。
你的任務是為最新一期雜誌《${nextIssueDate}》策劃、撰寫三篇高質感的原創專題文章。

請務必在生成前使用 Google Search 工具搜尋最新最受歡迎的數位游牧工具、辦公美學配置、極簡主義產品與旅行新趨勢，並在文章中融入這些具體的實時資訊。

這三篇文章必須分別對應以下四個主題中的【三個不同主題】（即每篇文章的主題分類不同）：
1. 游牧數位 (Digital Nomad) - 對應的 targetTag 為 '日常充電'，Emoji 可選 '💻' 或 '🔋'。
2. 辦公美學 (Office Aesthetics) - 對應的 targetTag 為 '辦公室必備'，Emoji 可選 '☕' 或 '⌨️'。
3. 極簡美學 (Minimalist Aesthetics) - 對應的 targetTag 為 '日常充電' 或 '辦公室必備'，Emoji 可選 '🌿' 或 '🕯️'。
4. 旅行 (Travel) - 對應的 targetTag 為 '極簡旅行'，Emoji 可選 '✈️' 或 '🏕️'。

【寫作指導風格與要求】：
- 文字風格必須是散發文藝氣息的繁體中文，行文高雅精緻，段落分明，富有生活儀式感。
- 每篇文章的 'content' 欄位必須是長篇深度文章（至少 3-4 個段落），不要有任何 markdown 代碼標記（如 \`\`\` 等），使用換行符 (\\n) 分割段落。
- **【標題極簡與多樣化要求】**：在撰寫文章標題 ("title") 時，**請絕對不要包含任何年份或數字（例如 2025、2026、2027、今年、新的一年等）**。請保持標題的多樣性與文學美感，以抽象、溫潤、富有生活哲思的方式命名（例如《專注的儀式》、《日常的留白》、《流動的精神聖殿》等），嚴禁千篇一律地使用帶年份的格式。

【封面圖配對】：
請為每篇文章的 'coverImage' 欄位，從以下為您精心整理的視覺美學清單中，挑選最符合該主題的一張【完整 URL】：
* 游牧數位 用圖：
  - https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1504607798333-52a30db54a5d?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=80
* 辦公美學 用圖：
  - https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80
* 極簡美學 用圖：
  - https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80
* 旅行 用圖：
  - https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80
  - https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1200&q=80

請直接輸出符合以下 Story Schema 的 JSON 陣列，直接使用 \`\`\`json ... \`\`\` 區塊包裹輸出。所有文字內容必須是繁體中文！其中 Schema 的每個物件格式如下：
{
  "id": "story-g0X (Unique ID starting with story-g01, story-g02, story-g03)",
  "icon": "單個 Emoji",
  "subtitle": "STORY 0X // [主題名稱]",
  "title": "文藝雅緻且富有哲思的標題",
  "description": "1-2 句極具吸引力的摘要說明",
  "content": "深度極簡慢活美學文章（至少 3-4 個段落，行文溫潤優雅，段落間用 \\n 隔開，不要帶額外 markdown 標記）",
  "targetTag": "日常充電 或 辦公室必備 或 極簡旅行 (必須完全一致，不能寫其他內容)",
  "coverImage": "從上方清單挑選的最佳 Unsplash URL",
  "author": "編輯姓名，如 '主編・Elian'",
  "readTime": "閱讀時間，如 '4 Mins Read'",
  "date": "必須為 '${nextIssueDate}'"
}
請勿輸出任何 Schema 定義本身、任何額外的 Markdown 代碼解釋或問候，只需輸出包裹在 \`\`\`json 內的故事 JSON 陣列即可。`;

      const existingTitles = [...activeStories, ...archivedStories].map(s => s.title).join('、');
      
      let keywordInstructions = "";
      if (keywords) {
        const parts = [];
        if (keywords.nomad) parts.push(`- 游牧數位 (Digital Nomad) 專題必須圍繞指定關鍵字「${keywords.nomad}」展開深入寫作與選物美學。`);
        if (keywords.office) parts.push(`- 辦公美學 (Office Aesthetics) 專題必須圍繞指定關鍵字「${keywords.office}」展開人體工學與配置探討。`);
        if (keywords.minimalistTravel) parts.push(`- 極簡美學與旅行 (Minimalist & Travel) 專題必須圍繞指定關鍵字「${keywords.minimalistTravel}」展開收納與輕量化生活哲學。`);
        
        if (parts.length > 0) {
          keywordInstructions = `\n\n【策展人指定關鍵字寫作要求】：\n本期專題文章已由策展人特別指定了核心方向，請務必圍繞以下關鍵字進行深度創作：\n${parts.join('\n')}\n請在產出的文章標題 (title) 與內文 (content) 中自然、溫潤且優雅地融入上述指定關鍵字與主題概念，並以此關鍵字為核心進行專題寫作。`;
        }
      }

      const userPrompt = `為最新期 ISSUE ${String(nextIssueNum).padStart(3, '0')} 雜誌生成 3 篇具備實時 Google 搜尋趨勢的精緻專題文章。請徹底搜尋並融入最新最熱門的數位游牧、辦公美學配置、極簡生活與旅行新趨勢，並以 JSON 陣列輸出符合系統架構的故事。${keywordInstructions}
【避免重複提示】：
為了維護期刊內容的獨特創想與新鮮感，請絕對不要重複或模仿以下已發布過的文章標題與核心概念：${existingTitles}。請為這一期量身定制三篇主題全新、觀點新穎的文章。標題絕對不可出現任何年份。`;

      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: userPrompt
              }
            ]
          }
        ],
        system_instruction: {
          parts: [
            {
              text: systemInstructions
            }
          ]
        },
        tools: [
          {
            google_search: {}
          }
        ],
        generation_config: {
          temperature: 0.7,
          response_mime_type: "text/plain"
        }
      };

      const apiResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errDetails = await apiResponse.json().catch(() => ({}));
        throw new Error((errDetails as any)?.error?.message || `API HTTP error! Status: ${apiResponse.status}`);
      }

      const resData = await apiResponse.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Could not retrieve curated stories text from Gemini API response.');
      }

      setGenerationStep('designing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGenerationStep('formatting');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const parsedStories = (() => {
        let jsonStr = rawText.trim();
        const matches = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
          jsonStr = matches[1].trim();
        }
        return JSON.parse(jsonStr) as Story[];
      })();

      if (!Array.isArray(parsedStories) || parsedStories.length < 3) {
        throw new Error('Curated stories array format is incorrect or incomplete.');
      }

      // 將生成的故事 ID 附帶期刊號進行唯一化，避免 key 重複衝突
      const uniqueParsedStories = parsedStories.map((story, index) => {
        const safeIndex = index + 1;
        return {
          ...story,
          id: `story-i${nextIssueNum}-0${safeIndex}`,
          subtitle: `STORY 0${safeIndex} // ${story.subtitle.split('//')[1]?.trim() || '新期刊專題'}`,
          date: nextIssueDate
        };
      });

      // 歷史期刊存檔輪轉（將原本的 activeStories 移存至 ArchivedStories 存盤）
      setArchivedStories(prev => {
        const merged = [...activeStories, ...prev];
        return Array.from(new Map(merged.map(s => [s.id, s])).values());
      });

      setActiveStories(uniqueParsedStories);
      setStoryOffsets(prev => {
        const nextOffsets = { ...prev };
        uniqueParsedStories.forEach(s => {
          if (!nextOffsets[s.id]) {
            nextOffsets[s.id] = Math.floor(Math.random() * 1200) + 800;
          }
        });
        return nextOffsets;
      });
      
      setCurrentIssueNumber(nextIssueNum);
      triggerToast(`✨ 聯網搜尋與 AI 寫作成功！已為您發行全新第 ${String(nextIssueNum).padStart(3, '0')} 期高質感專題期刊！`);

    } catch (error: any) {
      console.error('AI Journal Curation Error:', error);
      
      // 降級與發行回滾處理
      await new Promise(resolve => setTimeout(resolve, 1200));
      // 當生成失敗時，我們保持在原本的期數與故事狀態，並回報錯誤
      triggerToast(`⚠️ 聯網搜尋與 AI 寫作失敗（${error.message || '網路異常'}），已維持在當前第 ${String(currentIssueNumber).padStart(3, '0')} 期設定。`);
    } finally {
      setIsGenerating(false);
      setGenerationStep('idle');
    }
  };

  // 獲取專題對應期數的輔助函數
  const getStoryIssueNumber = (story: Story): number => {
    if (story.id.startsWith('story-i')) {
      const match = story.id.match(/^story-i(\d+)-/);
      if (match) return parseInt(match[1], 10);
    }
    // 預設 initial stories 是第 25 期
    if (story.id === 'story-01' || story.id === 'story-02' || story.id === 'story-03') {
      return 25;
    }
    // 預設 NEXT_ISSUE_STORIES 的備份
    if (story.id === 'story-n01' || story.id === 'story-n02' || story.id === 'story-n03') {
      return 26;
    }
    // 其他歸檔處理
    if (story.date?.includes('ISSUE 024')) return 24;
    if (story.date?.includes('ISSUE 023')) return 23;
    return 25;
  };

  // 執行重置回指定期數的動作
  const handleRollbackToIssue = (targetIssue: number) => {
    if (targetIssue === 25) {
      setActiveStories(STORIES);
      setArchivedStories(HISTORICAL_STORIES);
      setCurrentIssueNumber(25);
      setRollbackIssueNum(25);
      triggerToast('🔄 系統已回復至初始 ISSUE 025 期設定，Archive 已重置。');
    } else {
      const allPossibleStories = [...activeStories, ...archivedStories, ...NEXT_ISSUE_STORIES];
      const targetStories = allPossibleStories.filter(s => getStoryIssueNumber(s) === targetIssue);

      if (targetStories.length > 0) {
        // 僅保留早於 targetIssue 的歸檔專題
        const earlierStories = archivedStories.filter(s => getStoryIssueNumber(s) < targetIssue);
        
        setActiveStories(targetStories);
        setArchivedStories(earlierStories);
        setCurrentIssueNumber(targetIssue);
        setRollbackIssueNum(targetIssue);
        triggerToast(`🔄 系統已成功重置回第 ${String(targetIssue).padStart(3, '0')} 期專題狀態！`);
      } else {
        triggerToast(`⚠️ 找不到第 ${String(targetIssue).padStart(3, '0')} 期的專題存檔。`);
      }
    }
  };

  // 儲存並發布後台修改的專題文字
  const handleSaveStoryEdits = () => {
    setActiveStories(prev => prev.map(s => {
      if (s.id === selectedEditStoryId) {
        return {
          ...s,
          title: editTitle,
          description: editDescription,
          content: editContent
        };
      }
      return s;
    }));
    triggerToast(`✨ 已成功更新專題《${editTitle}》的文字內容，並即時發布至前台！`);
  };

  // 設定編輯器預設選取的專題
  useEffect(() => {
    if (activeStories.length > 0) {
      const exists = activeStories.some(s => s.id === selectedEditStoryId);
      if (!exists) {
        setSelectedEditStoryId(activeStories[0].id);
      }
    }
  }, [activeStories, selectedEditStoryId]);

  // 當所選專題或 activeStories 改變時，同步載入內容至暫存狀態
  useEffect(() => {
    const story = activeStories.find(s => s.id === selectedEditStoryId);
    if (story) {
      setEditTitle(story.title);
      setEditDescription(story.description);
      setEditContent(story.content);
    }
  }, [selectedEditStoryId, activeStories]);

  // 當 currentIssueNumber 改變時，自動將 rollbackIssueNum 設為當前最新期數
  useEffect(() => {
    setRollbackIssueNum(currentIssueNumber);
  }, [currentIssueNumber]);

  return (
    <div id="oasis-root" className="min-h-screen bg-[#F4F4F3] text-[#2C2C2A] selection:bg-[#5A6351]/20 selection:text-[#5A6351] font-serif overflow-x-hidden relative">
      
      {/* 雜誌最頂部的裝飾線條與極簡導航（不具干擾性） */}
      <header id="magazine-header" className="h-28 px-6 md:px-12 flex items-center justify-between border-b border-[#2C2C2A]/10 bg-white/50 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <button 
              id="logo-button"
              onClick={() => { setCurrentView('cover'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-3xl font-bold tracking-tight text-[#2C2C2A] select-none hover:text-[#5A6351] transition-all cursor-pointer font-serif"
            >
              Oasis Lab.
            </button>
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] opacity-60 font-sans-ui mt-1 text-center md:text-left">
              現代人的生活綠洲 — CURATED LIFE SOLUTIONS
            </p>
          </div>
          <nav className="flex gap-6 md:gap-8 text-xs md:text-sm font-medium uppercase tracking-widest font-sans-ui">
            <button 
              onClick={() => { setCurrentView('cover'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`pb-1 transition-all cursor-pointer ${currentView === 'cover' ? 'text-[#5A6351] border-b-2 border-[#5A6351] font-semibold' : 'text-[#2C2C2A]/70 hover:text-[#5A6351]'}`}
            >
              Magazine
            </button>
            <span className="text-[#2C2C2A]/30 select-none">/</span>
            <button 
              onClick={() => { setCurrentView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`pb-1 transition-all cursor-pointer ${currentView === 'shop' ? 'text-[#5A6351] border-b-2 border-[#5A6351] font-semibold' : 'text-[#2C2C2A]/70 hover:text-[#5A6351]'}`}
            >
              Shop
            </button>
            <span className="text-[#2C2C2A]/30 select-none">/</span>
            <button 
              onClick={() => { setCurrentView('archive'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`pb-1 transition-all cursor-pointer ${currentView === 'archive' ? 'text-[#5A6351] border-b-2 border-[#5A6351] font-semibold' : 'text-[#2C2C2A]/70 hover:text-[#5A6351]'}`}
            >
              Archive
            </button>
          </nav>
        </div>
      </header>

      {/* 頂級 AI 策展加載遮罩 */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-xl flex flex-col justify-center items-center p-6 text-center select-none"
          >
            <div className="max-w-md w-full space-y-8 flex flex-col items-center">
              {/* 美麗流暢的加載圈 */}
              <div className="relative w-24 h-24">
                {/* 裝飾背景圈 */}
                <div className="absolute inset-0 rounded-full border-4 border-[#5A6351]/10"></div>
                {/* 動態旋轉圈 */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-t-[#5A6351] border-r-transparent border-b-transparent border-l-transparent"
                ></motion.div>
                {/* 核心閃爍圖標 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#5A6351] animate-pulse" />
                </div>
              </div>

              {/* 步驟提示字元 */}
              <div className="space-y-3">
                <span className="font-mono-data text-xs tracking-[0.25em] text-[#5A6351] font-extrabold uppercase block animate-pulse">
                  Oasis Lab. AI Journal Curator // AI 策展編輯
                </span>
                
                <h3 className="font-serif text-lg md:text-xl font-bold text-[#2C2C2A] h-12 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={generationStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {generationStep === 'searching' && "🔍 正在透過 Google 搜尋最新跨界潮流與選物趨勢..."}
                      {generationStep === 'writing' && "✍️ 總編輯親自撰稿中：調製極簡美學與人文語調..."}
                      {generationStep === 'designing' && "🎨 正在挑選專屬高清 Unsplash 視覺影像與版面編排..."}
                      {generationStep === 'formatting' && "✨ 正在對齊 Story Schema 與商品關聯選物資料庫..."}
                    </motion.span>
                  </AnimatePresence>
                </h3>

                <p className="font-sans-ui text-xs text-[#2C2C2A]/50 max-w-sm mx-auto leading-relaxed">
                  為了維護 Oasis Lab 的極致品味，我們使用 Google Search Grounding 聯網技術獲取真實世界的最新話題，並嚴格遵循 Bento-Grid 高規設計體系進行排版，整個過程需要約 5-8 秒鐘，感謝您的優雅等待。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 轉跳提示與預約平台模組（防止 Sandbox 的 window.open 被阻擋，優雅提示） */}
      <AnimatePresence>
        {activeReferral && (
          <motion.div 
            id="referral-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2A]/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#F4F4F3] border border-[#2C2C2A]/15 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl font-serif text-[#2C2C2A]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex space-x-2 items-center text-[#5A6351]">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="font-sans-ui text-xs tracking-widest font-bold uppercase">Curated Discovery</span>
                </div>
                <button 
                  onClick={() => setActiveReferral(null)}
                  className="p-1 rounded-full hover:bg-[#2C2C2A]/5 transition-colors text-[#2C2C2A]/60 hover:text-[#2C2C2A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-3 tracking-tight">首選生活提案導購中</h3>
              <p className="font-sans-ui text-sm text-[#2C2C2A]/70 mb-4 leading-relaxed">
                正在為您安排前往專屬的聯盟行銷合作頁面，深入探索 <strong className="text-[#2C2C2A]">{activeReferral.title_optimized}</strong>。
              </p>

              <div className="bg-[#5A6351]/5 border-l-2 border-[#5A6351] p-3 text-xs font-sans-ui text-[#5A6351]/80 rounded mb-6">
                💡 Oasis Lab. 嚴格把關：此單品具備良好的材質、永續美學思維與高實用性，值得您細細品味。
              </div>

              <div className="flex flex-col space-y-2">
                <a 
                  href={activeReferral.affiliate_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setActiveReferral(null)}
                  className="w-full bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] py-2.5 rounded-lg text-center font-sans-ui font-medium text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span className="font-sans-ui">點此開啟探索新視窗</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setActiveReferral(null)}
                  className="w-full border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 py-2.5 rounded-lg text-center font-sans-ui text-xs text-[#2C2C2A]/70 transition-colors cursor-pointer"
                >
                  留在目前雜誌網頁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================== 【商品沈浸式詳情介紹面板 (Bento Modal)】 ================== */}
      <AnimatePresence>
        {selectedProductDetail && (
          <motion.div
            id="product-detail-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-[#2C2C2A]/60 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedProductDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="bg-[#F4F4F3] border border-[#2C2C2A]/10 rounded-2xl md:rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden font-serif text-[#2C2C2A] flex flex-col md:grid md:grid-cols-12 max-h-[90vh] md:max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 左側：極美視覺區 (Bento Left) */}
              <div className="relative md:col-span-5 h-64 md:h-full min-h-[280px] bg-[#2C2C2A]/5 overflow-hidden group">
                <img
                  src={selectedProductDetail.image_url}
                  alt={selectedProductDetail.title_optimized}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C2C2A]/40 via-transparent to-transparent"></div>

                {/* 懸浮標籤 */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[80%] z-10">
                  {selectedProductDetail.context_tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-[#F4F4F3]/90 text-[10px] text-[#2C2C2A] font-sans-ui font-bold border border-[#2C2C2A]/10 rounded-md shadow-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 珍藏按鈕 */}
                <button
                  onClick={() => toggleSaveProduct(selectedProductDetail.id)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-[#F4F4F3]/90 hover:bg-[#F4F4F3] border border-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-red-500 transition-all shadow-md cursor-pointer z-10"
                  title={savedProducts.includes(selectedProductDetail.id) ? "取消珍藏" : "珍藏此物件"}
                >
                  <Heart className={`w-4 h-4 ${savedProducts.includes(selectedProductDetail.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* 左下底飾 */}
                <div className="absolute bottom-6 left-6 text-[#F4F4F3] z-10 hidden md:block">
                  <span className="font-mono-data text-[9px] tracking-[0.25em] font-extrabold uppercase opacity-80 block mb-1">
                    DESIGN SELECTION
                  </span>
                  <span className="text-[10px] font-sans-ui opacity-60">
                    Oasis Lab. Curated Product ID: {selectedProductDetail.id}
                  </span>
                </div>
              </div>

              {/* 右側：美學文字深度細閱區 (Bento Right) */}
              <div className="md:col-span-7 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
                {/* 頂部控制欄 */}
                <div className="p-6 md:p-8 pb-0 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-[#5A6351]">
                    <Compass className="w-4 h-4" />
                    <span className="font-sans-ui text-[10px] tracking-[0.2em] font-bold uppercase">
                      Editorial Review // 嚴選器物評誌
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProductDetail(null)}
                    className="p-1.5 rounded-full hover:bg-[#2C2C2A]/5 transition-colors text-[#2C2C2A]/60 hover:text-[#2C2C2A] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 核心介紹內容 */}
                <div className="p-6 md:p-8 pt-4 space-y-6 flex-grow">
                  <div>
                    {/* 價格標示 */}
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className="text-2xl font-mono-data font-bold text-[#5A6351]">
                        {selectedProductDetail.price_display}
                      </span>
                      <span className="text-[10px] font-sans-ui text-[#2C2C2A]/40 uppercase tracking-wider">
                        Curated Price
                      </span>
                    </div>

                    {/* 商品優化標題 */}
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#2C2C2A] leading-snug">
                      {selectedProductDetail.title_optimized}
                    </h2>
                  </div>

                  {/* 一句話特點 */}
                  <p className="text-sm text-[#2C2C2A]/80 font-medium italic border-l-2 border-[#5A6351] pl-3 py-0.5 leading-relaxed bg-[#5A6351]/3 rounded-r-md pr-3">
                    「{selectedProductDetail.description}」
                  </p>

                  {/* 設計理念 (Story Behind) */}
                  {selectedProductDetail.story_behind && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-sans-ui font-extrabold tracking-widest text-[#2C2C2A]/50 uppercase">
                        設計理念與人文脈絡
                      </h4>
                      <p className="text-xs md:text-sm text-[#2C2C2A]/70 leading-relaxed font-serif text-justify whitespace-pre-line">
                        {selectedProductDetail.story_behind}
                      </p>
                    </div>
                  )}

                  {/* 三大設計亮點 (Features) */}
                  {selectedProductDetail.features && selectedProductDetail.features.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-sans-ui font-extrabold tracking-widest text-[#2C2C2A]/50 uppercase">
                        工藝與功能特點
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedProductDetail.features.map((feature, fIdx) => (
                          <div 
                            key={fIdx} 
                            className="bg-white border border-[#2C2C2A]/5 rounded-lg p-3 flex items-center space-x-2.5 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#5A6351] flex-shrink-0" />
                            <span className="text-xs font-sans-ui font-semibold text-[#2C2C2A]/85">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 策展人美學講評 (Designer Critique) */}
                  {selectedProductDetail.designer_critique && (
                    <div className="bg-[#5A6351]/5 border border-[#5A6351]/15 rounded-xl p-5 md:p-6 space-y-2.5">
                      <div className="flex items-center space-x-1.5 text-[#5A6351]">
                        <Feather className="w-4 h-4" />
                        <span className="font-sans-ui text-[10px] tracking-widest font-bold uppercase">
                          Curator's Critique // 策展人講評
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-[#2C2C2A]/75 font-sans-ui leading-relaxed italic">
                        "{selectedProductDetail.designer_critique}"
                      </p>
                      <div className="text-right text-[10px] text-[#5A6351]/80 font-sans-ui font-bold">
                        —— Oasis Lab. 編輯部總編輯
                      </div>
                    </div>
                  )}

                  {/* 工藝與技術規格 (Specifications) */}
                  {selectedProductDetail.specifications && selectedProductDetail.specifications.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-sans-ui font-extrabold tracking-widest text-[#2C2C2A]/50 uppercase">
                        製品規格參數
                      </h4>
                      <div className="border border-[#2C2C2A]/10 rounded-lg overflow-hidden bg-white/50">
                        <table className="w-full text-left border-collapse text-xs font-sans-ui">
                          <tbody>
                            {selectedProductDetail.specifications.map((spec, sIdx) => (
                              <tr 
                                key={sIdx} 
                                className={`border-b border-[#2C2C2A]/5 last:border-0 ${sIdx % 2 === 0 ? 'bg-[#2C2C2A]/2' : 'bg-transparent'}`}
                              >
                                <td className="p-2.5 font-bold text-[#2C2C2A]/60 w-1/3 border-r border-[#2C2C2A]/5">
                                  {spec.label}
                                </td>
                                <td className="p-2.5 text-[#2C2C2A]/80 font-medium">
                                  {spec.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部導購行動欄 (Sticky Bottom CTA) */}
                <div className="p-6 md:p-8 bg-[#F4F4F3] border-t border-[#2C2C2A]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="font-mono-data text-[10px] text-[#2C2C2A]/40">
                        🔥 已有 {((productClicks[selectedProductDetail.id] || 0) + (productOffsets[selectedProductDetail.id] || 500)).toLocaleString()} 次查看
                      </span>
                    </div>
                    <span className="text-xs text-[#2C2C2A]/50 font-sans-ui mt-0.5">
                      點擊按鈕即可引導至官方指定專屬平台。
                    </span>
                  </div>

                  <div className="flex space-x-3.5 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedProductDetail(null);
                      }}
                      className="flex-1 sm:flex-initial px-5 py-2.5 border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 text-xs text-[#2C2C2A]/70 font-sans-ui font-semibold rounded-lg transition-colors cursor-pointer text-center"
                    >
                      返回雜誌
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProductDetail(null);
                        handleProductRedirect(selectedProductDetail);
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] text-xs font-sans-ui font-bold py-2.5 px-6 shadow-[0_4px_14px_rgba(90,99,81,0.2)] rounded-lg transition-all hover:scale-101 cursor-pointer"
                    >
                      <span>{selectedProductDetail.btn_text}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分享故事成功提示 / 全域高質感自訂通知 */}
      <AnimatePresence>
        {copiedLink && (
          <motion.div 
            id="share-toast"
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-[#2C2C2A] text-[#F4F4F3] px-6 py-3 rounded-full text-xs font-sans-ui tracking-wider flex items-center space-x-2 shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-[#5A6351]" />
            <span>已複製文章專屬錨點連結至剪貼簿！</span>
          </motion.div>
        )}
        {toastMessage && (
          <motion.div 
            id="curated-toast"
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-[#5A6351] text-[#F4F4F3] px-6 py-3 rounded-full text-xs font-sans-ui tracking-wider flex items-center space-x-2 shadow-xl border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 網頁主體內容 */}
      <main id="oasis-main">
        <AnimatePresence mode="wait">
          {currentView === 'cover' ? (
            
            // ================== 【首頁 - 雜誌封面總覽】 ==================
            <motion.div
              key="cover-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20"
            >
              {/* 大封面引言區 */}
              <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-[#5A6351]/8 border border-[#5A6351]/15 text-[#5A6351] rounded-full text-xs font-sans-ui tracking-widest font-semibold uppercase mb-6"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Curated Aesthetics</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#2C2C2A] leading-tight mb-6">
                  專為現代人打造的<br />
                  <span className="text-[#5A6351] underline decoration-[#5A6351]/20 decoration-wavy underline-offset-8">能量補給與效率綠洲</span>
                </h2>
                
                <p className="text-base md:text-lg text-[#2C2C2A]/70 leading-relaxed font-sans-ui font-light px-4">
                  Oasis Lab. 是一本線上生活微美學雜誌。我們拒絕粗俗庸俗的粗放式推銷，
                  透過主題式「微策展」，將嚴選的生活好物與深度故事相融，
                  為追求卓越生活的白領、數位游牧人士，構築一段優雅高質感的數位停留。
                </p>

                {/* 裝飾性的小卷軸指示 */}
                <div className="mt-12 flex justify-center items-center space-x-2 text-[#2C2C2A]/30">
                  <div className="w-8 h-[1px] bg-[#2C2C2A]/30" />
                  <Feather className="w-4 h-4" />
                  <div className="w-8 h-[1px] bg-[#2C2C2A]/30" />
                </div>
              </div>

              {/* PWA 桌面小程式特快推薦卡 (支援 RWD 自適應與離線感官) */}
              {showPwaBanner && (
                <motion.div 
                  id="pwa-install-banner"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-[#5A6351]/8 to-transparent border border-[#5A6351]/20 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto mb-20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_20px_rgba(90,99,81,0.02)]"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[#5A6351] text-white rounded-xl shadow-md shrink-0">
                      <Smartphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-serif font-extrabold text-[#2C2C2A] text-base md:text-lg flex flex-wrap items-center gap-2">
                        <span>將 Oasis Lab. 安裝至手機桌面主畫面</span>
                        <span className="scale-[0.85] origin-left px-2 py-0.5 bg-[#5A6351]/10 text-[#5A6351] text-[9px] font-sans-ui font-black rounded border border-[#5A6351]/20 uppercase tracking-widest">PWA Applet</span>
                      </h4>
                      <p className="font-sans-ui text-xs text-[#2C2C2A]/70 leading-relaxed mt-1.5">
                        支援完全的極美 RWD 寬高自適應！一鍵安裝至主畫面後，能如同原生 Applet 般滿畫面無框閱讀，開啟極速、節流、體驗臻至完美。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                    <button
                      onClick={handlePwaInstall}
                      className="bg-[#2C2C2A] hover:bg-[#3D3D3A] text-white font-sans-ui text-xs font-bold py-2.5 px-5 rounded-lg transition-all shadow-md cursor-pointer flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>立即下載至桌面</span>
                    </button>
                    <button
                      onClick={() => setShowPwaBanner(false)}
                      className="p-2 text-[#2C2C2A]/40 hover:text-[#2C2C2A] hover:bg-[#2C2C2A]/5 rounded-lg transition-colors cursor-pointer"
                      title="隱藏此提案"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 三個專題故事的網格佈局 (Grid) */}
              <div className="mb-24 h-auto">
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#2C2C2A]/10">
                  <span className="font-mono-data text-xs tracking-widest text-[#2C2C2A]/60 font-bold uppercase">
                    FEATURED STORIES // 精選專題 (ISSUE {String(currentIssueNumber).padStart(3, '0')})
                  </span>
                  <span className="font-sans-ui text-xs text-[#5A6351]">
                     點擊或懸停探索
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
                  {activeStories.map((story, i) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 * i, duration: 0.5, ease: 'easeOut' }}
                      className="group flex flex-col justify-between bg-white border border-[#2C2C2A]/5 hover:border-[#5A6351]/20 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(90,99,81,0.06)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div>
                        {/* 專題高質感配圖 */}
                        <div className="relative h-48 w-full overflow-hidden bg-[#2C2C2A]/5">
                          <img 
                            src={story.coverImage} 
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
                          <span className="absolute top-4 left-4 bg-[#F4F4F3] text-sm py-1 px-2.5 rounded-lg border border-[#2C2C2A]/5 font-sans-ui shadow-sm flex items-center space-x-1">
                            <span>{story.icon}</span>
                            <span className="font-mono-data text-xs font-medium text-[#5A6351]">{story.targetTag}</span>
                          </span>
                        </div>

                        {/* 專題內文卡片敘述區 */}
                        <div className="p-6 md:p-8">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono-data text-[11px] uppercase tracking-widest text-[#5A6351] font-bold block">
                              {story.subtitle}
                            </span>
                            <span className="font-mono-data text-[10px] text-[#2C2C2A]/45 bg-[#2C2C2A]/5 px-1.5 py-0.5 rounded">
                              👁️ {((storyClicks[story.id] || 0) + (storyOffsets[story.id] || 1000)).toLocaleString()}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2A] group-hover:text-[#5A6351] tracking-tight leading-snug mb-4 transition-colors">
                            {story.title}
                          </h3>
                          <p className="text-sm text-[#2C2C2A]/60 line-clamp-3 leading-relaxed font-sans-ui mb-4">
                            {story.description}
                          </p>
                        </div>
                      </div>

                      {/* 卡片底部的互動行為 */}
                      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
                        <button
                          onClick={() => handleViewStory(story.id)}
                          className="w-full inline-flex items-center justify-between py-2 px-4 border border-[#5A6351]/30 hover:border-[#5A6351] text-[#5A6351] hover:bg-[#5A6351]/5 transition-all text-xs font-sans-ui tracking-wider font-semibold rounded-lg cursor-pointer"
                        >
                          <span>探索專題內容</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 綠洲生活美學宣言（策展宗旨） */}
              <div className="bg-white border border-[#2C2C2A]/5 rounded-xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)] max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[#2C2C2A]/10 pb-6 md:pb-0 md:pr-8">
                  <span className="font-mono-data text-xs tracking-widest text-[#5A6351] font-bold uppercase mb-2">Oasis Manifesto</span>
                  <p className="text-2xl md:text-3xl font-extrabold tracking-tight">綠洲宣言</p>
                  <MapPin className="w-4 h-4 text-[#5A6351]/60 mt-4 hidden md:block" />
                </div>
                <div className="md:w-2/3">
                  <p className="font-sans-ui text-sm text-[#2C2C2A]/70 leading-relaxed mb-4 italic">
                    「當我們被快節奏的通知、滿載的代辦事項和無休止的會議淹沒時，
                    Oasis Lab. 想在混亂中保留一方不受打擾的大地。
                    我們深信，每一樣擺上桌頭的器物與裝備，都是折射生活態度的稜鏡。」
                  </p>
                  <p className="font-sans-ui text-xs text-[#2C2C2A]/50 leading-relaxed">
                    所有在此展示的商品，均經過編輯部層層篩選，去除關鍵字堆疊與花言巧語，
                    回歸原初的使用美學，以最高質感的格式，為現代人量身打造心靈的補給站。
                  </p>
                </div>
              </div>

            </motion.div>
          ) : currentView === 'shop' ? (
            
            // ================== 【精選商城 - 全單品選物美學】 ==================
            <motion.div
              key="shop-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 animate-fade-in"
            >
              {/* 美學商店 Header */}
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="font-mono-data text-xs tracking-widest text-[#5A6351] font-bold block mb-3 uppercase">
                  OASIS LAB. CURATED STORE // 線上選物商店
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C2C2A] mb-4">
                  生活器物的減法美學
                </h2>
                <p className="font-sans-ui text-sm text-[#2C2C2A]/60 leading-relaxed">
                  不堆砌炫目的行銷術語，不強推過度裝飾的消費。這裡的每一件器物，均與我們的雜誌主題深度共鳴，旨在為您的日常生活與商務工作，提供最和諧的物理回饋。
                </p>
              </div>

              {/* 美學控制面板：分類過濾與珍藏過濾 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-[#2C2C2A]/10">
                {/* 分類 Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'all', label: '全部嚴選單品' },
                    { key: '日常充電', label: '#日常充電' },
                    { key: '辦公室必備', label: '#辦公室必備' },
                    { key: '極簡旅行', label: '#極簡旅行' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setShopFilter(tab.key)}
                      className={`px-4 py-2 text-xs font-sans-ui font-semibold rounded-lg transition-all cursor-pointer ${
                        shopFilter === tab.key 
                          ? 'bg-[#5A6351] text-[#F4F4F3] shadow-sm font-bold' 
                          : 'bg-white text-[#2C2C2A]/70 hover:bg-[#2C2C2A]/5 border border-[#2C2C2A]/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 珍藏篩選切換 */}
                <button
                  onClick={() => setShopFilter(shopFilter === 'saved' ? 'all' : 'saved')}
                  className={`px-4 py-2 text-xs font-sans-ui font-semibold rounded-lg border flex items-center space-x-2 transition-all cursor-pointer ${
                    shopFilter === 'saved'
                      ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                      : 'bg-white border-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:bg-[#2C2C2A]/5'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${shopFilter === 'saved' ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>
                    您的珍藏品項 ({savedProducts.length})
                  </span>
                </button>
              </div>

              {/* 商品列表 */}
              {(() => {
                // 根據狀態過濾產品
                const filtered = editableProducts.filter(product => {
                  if (product.status !== 'active') return false;
                  if (shopFilter === 'saved') {
                    return savedProducts.includes(product.id);
                  }
                  if (shopFilter !== 'all') {
                    return product.context_tags.includes(shopFilter);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white border border-[#2C2C2A]/5 rounded-xl">
                      <Heart className="w-12 h-12 mx-auto text-[#2C2C2A]/20 mb-4 animate-pulse" />
                      <p className="font-serif text-lg font-bold">目前無相符的選物 Proposal</p>
                      <p className="font-sans-ui text-xs text-[#2C2C2A]/50 mt-2 max-w-md mx-auto leading-relaxed">
                        {shopFilter === 'saved' 
                          ? '您尚未收藏任何器物。在雜誌或商店選購時，點擊商品右上角的熱忱愛心，即可將其收納留存於此。'
                          : '此分類下的質感物件正在秘密空運海運中，敬請期待下一期刊的專題更新！'}
                      </p>
                      <button
                        onClick={() => setShopFilter('all')}
                        className="mt-6 inline-flex items-center space-x-1.5 bg-[#2C2C2A] text-white font-sans-ui text-xs px-4 py-2.5 rounded-lg cursor-pointer hover:bg-[#3D3D3A] transition-all"
                      >
                        <span>返回觀看全部商品</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                        className="bg-white border border-[#2C2C2A]/5 hover:border-[#5A6351]/20 rounded-xl overflow-hidden shadow-sm hover:shadow-[0_12px_32px_rgba(90,99,81,0.05)] transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          {/* 圖片封面與標籤 */}
                          <div 
                            onClick={() => handleOpenProductDetail(product)}
                            className="relative h-56 overflow-hidden bg-[#2C2C2A]/5 cursor-pointer"
                          >
                            <img
                              src={product.image_url}
                              alt={product.title_optimized}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* 分類標籤 */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[75%]">
                              {product.context_tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-[#F4F4F3]/90 text-[10px] text-[#2C2C2A] font-sans-ui font-bold border border-[#2C2C2A]/10 rounded-md"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            {/* 人氣精選徽章 */}
                            {product.is_popular && (
                              <div className="absolute bottom-4 left-4 flex items-center space-x-1 px-2.5 py-1 bg-[#2C2C2A]/85 backdrop-blur-sm rounded-full">
                                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                                <span className="font-mono-data text-[9px] text-amber-200 font-bold tracking-widest uppercase">Popular Pick</span>
                              </div>
                            )}

                            {/* 收藏愛心 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveProduct(product.id);
                              }}
                              className="absolute top-4 right-4 p-2 rounded-full bg-[#F4F4F3]/90 hover:bg-[#F4F4F3] border border-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                            >
                              <Heart className={`w-3.5 h-3.5 ${savedProducts.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                          </div>

                          <div 
                            onClick={() => handleOpenProductDetail(product)}
                            className="p-6 cursor-pointer"
                          >
                            <h3 className="text-base md:text-lg font-extrabold tracking-tight text-[#2C2C2A] line-clamp-2 leading-snug mb-2.5 group-hover:text-[#5A6351] transition-colors">
                              {product.title_optimized}
                            </h3>
                            <p className="text-xs text-[#2C2C2A]/60 font-sans-ui leading-relaxed line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        {/* 底層購買提案 */}
                        <div className="px-6 pb-6 pt-0 border-t border-[#2C2C2A]/5 mt-auto">
                          <div className="flex items-center justify-between pt-4">
                            <div className="flex flex-col">
                              <span className="font-sans-ui text-[9px] tracking-widest text-[#2C2C2A]/40 font-bold uppercase">
                                Curated Price
                              </span>
                              <span className="font-mono-data text-[#5A6351] text-base font-bold">
                                {product.price_display}
                              </span>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="font-mono-data text-[10px] text-[#2C2C2A]/40 mb-1">
                                🔥 {((productClicks[product.id] || 0) + (productOffsets[product.id] || 500)).toLocaleString()} 次查看
                              </span>
                              <button
                                onClick={() => handleOpenProductDetail(product)}
                                className="inline-flex items-center space-x-1.5 bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] text-xs font-sans-ui font-semibold py-2 px-3.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                              >
                                <span>{product.btn_text}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}

              {/* 美學商店溫馨小說明 */}
              <div className="bg-[#5A6351]/5 border-2 border-dashed border-[#5A6351]/15 rounded-xl p-8 mt-16 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-start space-x-3.5">
                  <span className="text-2xl mt-0.5">📦</span>
                  <div>
                    <h4 className="text-sm font-bold font-serif">選物出貨與配送說明</h4>
                    <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mt-1">
                      所有「Oasis Lab.」合作品項均享滿額免運，自備精裝提盒與慢活特許賀卡包裝。台北市提供當日快遞，讓生活溫度零距離送達。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => triggerToast('選物商店購物車串接系統完備！已準備好為您呈現最尊榮的配送。')}
                  className="bg-[#2C2C2A] text-white hover:bg-[#3D3D3A] text-xs font-sans-ui px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
                >
                  細閱配送規章與退換禮儀
                </button>
              </div>

            </motion.div>
          ) : currentView === 'archive' ? (
            
            // ================== 【歷史期刊典藏 - Archive】 ==================
            <motion.div
              key="archive-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20"
            >
              {/* 歷史期刊 Header */}
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="font-mono-data text-xs tracking-widest text-[#5A6351] font-bold block mb-3 uppercase">
                  OASIS LAB. ARCHIVES // 歷史期刊典藏
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C2C2A] mb-4">
                  時間長流中的靈感典藏
                </h2>
                <p className="font-sans-ui text-sm text-[#2C2C2A]/60 leading-relaxed">
                  每一次推出的全新主題專題，均會在此留存。我們將過去的文字、器物與生活哲思妥善歸納，為注重慢活美學的讀者，建構一個能隨時往返的智慧靈感庫。
                </p>
              </div>

              {/* 歷史期刊主列表（按 Issue 期刊號分組） */}
              {(() => {
                const groups: { [key: string]: Story[] } = {};
                archivedStories.forEach(story => {
                  const issueKey = story.date || "OTHER ARCHIVES";
                  if (!groups[issueKey]) {
                    groups[issueKey] = [];
                  }
                  groups[issueKey].push(story);
                });

                const groupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

                if (groupKeys.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white border border-[#2C2C2A]/5 rounded-xl">
                      <Compass className="w-12 h-12 mx-auto text-[#2C2C2A]/20 mb-4" />
                      <p className="font-serif text-lg font-bold">歷史特輯正在整編中</p>
                      <p className="font-sans-ui text-xs text-[#2C2C2A]/50 mt-2 max-w-md mx-auto leading-relaxed">
                        當前所有文章皆為「當期精選封面」。您可以前往雜誌首頁，點擊底部的「推出下一期」，體驗將當期內容一鍵自動歸入歷史存檔的動態美學！
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-16">
                    {groupKeys.map((issueKey) => (
                      <div key={issueKey} className="border-t border-[#2C2C2A]/10 pt-10">
                        {/* 期刊期數大標題 */}
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-8">
                          <h3 className="text-2xl font-bold font-serif text-[#2C2C2A] tracking-tight">
                            {issueKey}
                          </h3>
                          <span className="font-mono-data text-xs text-[#5A6351] tracking-widest uppercase font-semibold">
                            {groups[issueKey].length} 篇精選專題已歸檔
                          </span>
                        </div>

                        {/* 該期刊下的專題文章卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {groups[issueKey].map((story) => (
                            <motion.div
                              key={story.id}
                              whileHover={{ y: -4 }}
                              className="bg-white border border-[#2C2C2A]/5 hover:border-[#5A6351]/20 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group transition-all duration-300"
                            >
                              <div>
                                <div className="relative h-44 overflow-hidden bg-[#2C2C2A]/5">
                                  <img
                                    src={story.coverImage}
                                    alt={story.title}
                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute top-3 left-3 bg-[#F4F4F3]/95 text-xs py-1 px-2.5 rounded border border-[#2C2C2A]/5 font-sans-ui flex items-center space-x-1">
                                    <span>{story.icon}</span>
                                    <span className="font-mono-data text-[10px] font-semibold text-[#5A6351]">{story.targetTag}</span>
                                  </span>
                                </div>

                                <div className="p-6">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-mono-data text-[10px] uppercase tracking-widest text-[#5A6351] font-bold block">
                                      {story.subtitle}
                                    </span>
                                    <span className="font-mono-data text-[10px] text-[#2C2C2A]/45 bg-[#2C2C2A]/5 px-1.5 py-0.5 rounded">
                                      👁️ {((storyClicks[story.id] || 0) + (storyOffsets[story.id] || 1000)).toLocaleString()}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-bold text-[#2C2C2A] group-hover:text-[#5A6351] leading-snug transition-colors line-clamp-2">
                                    {story.title}
                                  </h4>
                                  <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mt-2.5 line-clamp-2">
                                    {story.description}
                                  </p>
                                </div>
                              </div>

                              <div className="px-6 pb-6 pt-0">
                                <button
                                  onClick={() => handleViewStory(story.id)}
                                  className="w-full inline-flex items-center justify-between py-2 px-3 border border-[#2C2C2A]/10 hover:border-[#5A6351] text-[#2C2C2A]/60 hover:text-[#5A6351] hover:bg-[#5A6351]/5 transition-all text-[11px] font-sans-ui tracking-wider font-semibold rounded-lg cursor-pointer"
                                >
                                  <span>細閱典藏內容 ({story.readTime})</span>
                                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 優雅小叮嚀 */}
              <div className="bg-[#2C2C2A] text-white rounded-xl p-8 md:p-10 mt-20 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="max-w-xl">
                  <h4 className="text-base font-bold font-serif mb-1">關於 Oasis Lab. 歷史館藏</h4>
                  <p className="font-sans-ui text-xs text-[#F4F4F3]/70 leading-relaxed">
                    在 Oasis Lab.，我們倡導溫和的、有意識的閱讀。所有歷史文章、器物配備均長期在此存留，隨侍每一位喜愛回顧經典的遠行者。
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentView('cover');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#5A6351] text-white hover:bg-[#4E5646] text-xs font-sans-ui px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
                >
                  返回主雜誌封面
                </button>
              </div>

            </motion.div>
          ) : currentView === 'admin' ? (
            
            // ================== 【管理者後台登入與控制 - Admin Portal】 ==================
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="font-mono-data text-xs tracking-widest text-[#5A6351] font-bold block mb-3 uppercase">
                  OASIS LAB. MASTER CONTROL // 系統智理後台
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C2C2A] mb-4">
                  策展發行與編輯控制中心
                </h2>
                <p className="font-sans-ui text-sm text-[#2C2C2A]/60 leading-relaxed">
                  此頁面僅提供給 Oasis Lab. 內部編輯與資深開發人員，操作模擬期刊更替、發行與 Archive 歸檔之核心權限。
                </p>
              </div>

              {!isAdminLoggedIn ? (
                <motion.div 
                  className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 max-w-md mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.03)]"
                  initial={{ scale: 0.98 }}
                  animate={{ scale: 1 }}
                >
                  <div className="flex items-center space-x-3 text-amber-600 mb-6 pb-4 border-b border-[#2C2C2A]/5">
                     <Lock className="w-5 h-5 animate-pulse" />
                     <span className="font-mono-data text-xs tracking-widest font-bold uppercase">AUTHENTICATION REQUIRED</span>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (adminUsername === 'admin' && adminPassword === '1234') {
                      setIsAdminLoggedIn(true);
                      triggerToast('🔓 歡迎回來，編輯與開發智理專家！已成功登入內部控制中心。');
                    } else {
                      triggerToast('❌ 驗證失敗：帳號或密碼輸入錯誤，請重試。(預設帳密: admin / 1234)');
                    }
                  }} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider mb-2">管理者帳號 (Username)</label>
                      <input
                        type="text"
                        placeholder="請輸入帳號 (預設: admin)"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider mb-2">密碼 (Password)</label>
                      <input
                        type="password"
                        placeholder="請輸入密碼 (預設: 1234)"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data tracking-widest"
                        required
                      />
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      <button
                        type="submit"
                        className="w-full bg-[#2C2C2A] hover:bg-[#3D3D3A] text-white font-sans-ui text-xs font-bold py-3 px-4 rounded-lg cursor-pointer transition-colors flex items-center justify-center space-x-2 shadow-md"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>安全驗證登入</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminUsername('admin');
                          setAdminPassword('1234');
                          setIsAdminLoggedIn(true);
                          triggerToast('🔓 快速模擬：系統已自動認證開發人員身分。');
                        }}
                        className="w-full bg-[#5A6351]/10 hover:bg-[#5A6351]/15 text-[#5A6351] font-sans-ui text-xs font-semibold py-2.5 px-4 rounded-lg cursor-pointer transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>一鍵快捷模擬登入 (1234)</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* 登入後控制台主區 */}
                  <div className="bg-white border border-[#2C2C2A]/10 hover:border-[#5A6351]/30 rounded-2xl p-8 md:p-10 shadow-[0_12px_45px_rgba(90,99,81,0.03)] group transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#2C2C2A]/10 mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                          <Feather className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <span className="font-mono-data text-[10px] text-emerald-600 font-bold tracking-widest uppercase block mb-1">
                            CURATOR STUDIO // 內容更新與模擬發行台
                          </span>
                          <h3 className="text-xl font-bold font-serif text-[#2C2C2A]">
                            雜誌封面與發布控制器
                            <span className="ml-2.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-sans-ui rounded border border-emerald-500/20 font-black tracking-widest uppercase">MASTER ACCOUNT</span>
                          </h3>
                          <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mt-1">
                            當前展示期刊：<strong className="text-[#2C2C2A]">ISSUE 0{currentIssueNumber} 期</strong>。點發布新期能自動將當期專題全數移存到歷史典藏區 (Archive)，重現真實線上發行。
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsAdminLoggedIn(false);
                          setAdminUsername('');
                          setAdminPassword('');
                          triggerToast('🔒 已安全登出 Oasis Lab. 系統智理後台。');
                        }}
                        className="px-4 py-2 border border-red-200 hover:bg-red-55 text-red-600 text-xs font-sans-ui font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        安全登出
                      </button>
                    </div>

                    {/* 發行模擬說明 */}
                    <div className="bg-[#F4F4F3] border border-[#2C2C2A]/5 p-6 rounded-xl space-y-3 mb-6">
                      <h4 className="font-serif font-bold text-sm text-[#2C2C2A]">發行模擬說明與狀態</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#2C2C2A]/60 font-sans-ui">
                        <div className="space-y-1 sm:col-span-2">
                          <p className="flex items-center space-x-1.5 text-xs text-[#2C2C2A]/70 font-semibold mb-1">
                            <span>💡 如何模擬真實發行：</span>
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>點擊發布新期刊後，當前專題內容會移存至「歷史期刊 (Archive)」歸檔。</li>
                            <li>AI 會自動搜尋最新美學產品與旅行趨勢，為您撰寫發布下一期新專題。</li>
                            <li>重置功能可以讓您隨時一鍵回復至初始 ISSUE 025 狀態。</li>
                          </ul>
                        </div>
                        <div className="flex flex-col justify-center items-center p-4 bg-white/60 border border-[#2C2C2A]/5 rounded-lg text-center">
                          <span className="font-mono-data text-[10px] text-[#2C2C2A]/40 font-bold uppercase tracking-wider block mb-1">CURRENT STATUS // 發行狀態</span>
                          <span className="font-mono-data text-xs text-[#5A6351] font-bold">
                            {currentIssueNumber === 25 ? "待發行新期刊" : `已發布 ISSUE ${String(currentIssueNumber).padStart(3, '0')} 新期刊`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                      {/* 動作一：AI 策展發布 */}
                      <div className="flex flex-col justify-between p-6 bg-[#5A6351]/5 border border-[#5A6351]/10 rounded-xl">
                        <div>
                          <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest block uppercase mb-1">DECISION A // AI 策展發布</span>
                          <h4 className="font-serif font-bold text-sm text-[#2C2C2A] mb-2">發布下一期全新期刊</h4>
                          <p className="text-xs text-[#2C2C2A]/50 font-sans-ui leading-relaxed mb-6">
                            聯網搜尋最新趨勢，調配極簡美學語調與選物關聯，發布第 {String(currentIssueNumber + 1).padStart(3, '0')} 期文章。
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setNomadKeyword('');
                            setOfficeKeyword('');
                            setMinimalistTravelKeyword('');
                            setShowKeywordModal(true);
                          }}
                          disabled={isGenerating}
                          className={`w-full text-white font-sans-ui text-xs font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                            isGenerating 
                              ? 'bg-[#5A6351]/50 cursor-not-allowed' 
                              : 'bg-[#5A6351] hover:bg-[#4E5646] cursor-pointer'
                          }`}
                        >
                          <Sparkles className={`w-4 h-4 text-white ${isGenerating ? 'animate-spin' : ''}`} />
                          <span>{isGenerating ? '正在聯網搜尋與 AI 寫作中...' : `發布 ISSUE ${String(currentIssueNumber + 1).padStart(3, '0')} 全新期刊`}</span>
                        </button>
                      </div>

                      {/* 動作二：系統狀態重置 */}
                      <div className="flex flex-col justify-between p-6 bg-[#2C2C2A]/5 border border-[#2C2C2A]/10 rounded-xl">
                        <div>
                          <span className="font-mono-data text-[10px] text-[#2C2C2A]/50 font-bold tracking-widest block uppercase mb-1">DECISION B // 系統狀態重置</span>
                          <h4 className="font-serif font-bold text-sm text-[#2C2C2A] mb-2">回復指定期刊設定</h4>
                          <p className="text-xs text-[#2C2C2A]/50 font-sans-ui leading-relaxed mb-6">
                            選擇將整個期刊系統與文章配置完美重置回指定的歷史期數狀態，小於所選期數的歷史封存將被保留，大於等於的將被清除。
                          </p>
                        </div>
                        <div className="flex flex-col gap-3.5">
                          <div className="flex items-center space-x-2 bg-white/50 border border-[#2C2C2A]/15 rounded-lg px-3 py-2">
                            <span className="font-sans-ui text-xs text-[#2C2C2A]/60 shrink-0">重置至：</span>
                            <select
                              value={rollbackIssueNum}
                              onChange={(e) => setRollbackIssueNum(parseInt(e.target.value, 10))}
                              className="flex-1 bg-transparent text-[#2C2C2A] text-xs font-sans-ui font-semibold focus:outline-none cursor-pointer"
                            >
                              {(() => {
                                const options = [];
                                for (let i = 25; i <= currentIssueNumber; i++) {
                                  options.push(
                                    <option key={i} value={i} className="text-[#2C2C2A]">
                                      第 {i} 期 (ISSUE {String(i).padStart(3, '0')})
                                    </option>
                                  );
                                }
                                return options;
                              })()}
                            </select>
                          </div>
                          
                          <button
                            onClick={() => handleRollbackToIssue(rollbackIssueNum)}
                            className="w-full bg-[#2C2C2A] hover:bg-[#3D3D3A] text-white font-sans-ui text-xs font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-center cursor-pointer whitespace-nowrap"
                          >
                            <span>確認重置至指定期刊</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 專題文字編輯器智理台 */}
                  <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_12px_45px_rgba(90,99,81,0.03)] transition-all duration-300">
                    <div className="flex items-center space-x-3 text-[#2C2C2A] pb-4 border-b border-[#2C2C2A]/5 mb-6">
                      <Feather className="w-5 h-5 text-[#5A6351]" />
                      <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">EDITORIAL DESK // 專題文字編輯室</span>
                    </div>

                    <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-6">
                      在此您可以直接編輯當前第 <strong>{String(currentIssueNumber).padStart(3, '0')}</strong> 期的三篇 Active 精選專題內容。選擇下方的分頁標籤即可切換，修改後點擊儲存，前台以及深度詳細頁的文字即會即時更新。
                    </p>

                    {/* 專題 Tabs 切換標籤 */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                      {activeStories.map((story, index) => {
                        const isSelected = story.id === selectedEditStoryId;
                        return (
                          <button
                            key={story.id}
                            type="button"
                            onClick={() => setSelectedEditStoryId(story.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-sans-ui font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#5A6351] text-[#F4F4F3] border-[#5A6351] shadow-sm'
                                : 'bg-[#F4F4F3]/50 text-[#2C2C2A]/70 hover:bg-[#2C2C2A]/5 border-[#2C2C2A]/10'
                            }`}
                          >
                            <span>{story.icon}</span>
                            <span className="truncate max-w-[120px]">{story.title || `專題 0${index + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 編輯表單內容 */}
                    {activeStories.find(s => s.id === selectedEditStoryId) && (
                      <div className="space-y-5 font-sans-ui text-xs text-[#2C2C2A]/80">
                        <div>
                          <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider mb-2">專題標題 (Title)</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="請輸入專題標題"
                            className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-serif font-bold text-sm transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider mb-2">專題引言 / 摘要 (Description)</label>
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="請輸入 1-2 句吸引讀者的引言"
                            className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui leading-relaxed transition-all resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider mb-2">深度專題內文 (Content)</label>
                          <textarea
                            rows={10}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="請輸入深度內文，段落間請以兩次換行隔開"
                            className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-serif leading-loose text-justify transition-all"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSaveStoryEdits}
                            className="w-full bg-[#5A6351] hover:bg-[#4E5646] text-white font-sans-ui text-xs font-bold py-3 px-4 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>儲存並發布此專題變更</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 實際數字與 點擊率 統計智理台 */}
                  <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2C2C2A]/5 mb-6">
                      <div className="flex items-center space-x-3 text-[#2C2C2A]">
                        <Database className="w-5 h-5 text-[#5A6351]" />
                        <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">REAL-TIME CTR ANALYTICS // 實際點擊數據統計中心</span>
                      </div>
                      <button
                        onClick={() => {
                          const defaultStoryClicks: {[key: string]: number} = {};
                          const allS = [...activeStories, ...archivedStories, ...NEXT_ISSUE_STORIES];
                          allS.forEach(s => {
                            defaultStoryClicks[s.id] = 0;
                          });
                          setStoryClicks(defaultStoryClicks);

                          const defaultProdClicks: {[key: string]: number} = {};
                          PRODUCTS.forEach(p => {
                            defaultProdClicks[p.id] = 0;
                          });
                          setProductClicks(defaultProdClicks);
                          triggerToast('🔄 智理統計數據已成功重置為預設初始值。');
                        }}
                        className="text-[10px] font-sans-ui text-[#5A6351] hover:text-[#4E5646] font-semibold underline transition-colors cursor-pointer"
                      >
                        重置實際點擊統計
                      </button>
                    </div>

                    <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-6">
                      此模組統計讀者在 Oasis Lab. 產生的真實對話與行文軌跡。所有查看專題、前往品牌合作通路等<strong>實際點擊數</strong>均會被儲存，並在此與隨機偏移量彙整，演算出前台呈現的高質感補給熱度。
                    </p>

                    {/* 發布和導購概述小卡 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#5A6351]/5 border border-[#5A6351]/15 rounded-xl p-5">
                        <span className="font-mono-data text-[10px] text-[#5A6351] font-bold block mb-1 uppercase">TOTAL ACTUAL STORY CLICKS / 專題點擊</span>
                        <div className="text-3xl font-mono-data font-black text-[#5A6351] flex items-baseline space-x-1.5">
                          <span>{Object.values(storyClicks).reduce((a: number, b: number) => a + b, 0)}</span>
                          <span className="text-xs font-sans-ui font-normal text-[#2C2C2A]/50">次實際點擊</span>
                        </div>
                      </div>
                      <div className="bg-[#2C2C2A]/4 border border-[#2C2C2A]/10 rounded-xl p-5">
                        <span className="font-mono-data text-[10px] text-[#2C2C2A]/60 font-bold block mb-1 uppercase">TOTAL ACTUAL PRODUCT CLICKS / 商品點擊</span>
                        <div className="text-3xl font-mono-data font-black text-[#2C2C2A] flex items-baseline space-x-1.5">
                          <span>{Object.values(productClicks).reduce((a: number, b: number) => a + b, 0)}</span>
                          <span className="text-xs font-sans-ui font-normal text-[#2C2C2A]/50">次實際查看</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* 專題點擊細節表 */}
                      <div>
                        <h4 className="text-xs font-mono-data text-[#5A6351] font-bold tracking-wider uppercase mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span>1. 專題故事點閱明細 (Stories Views)</span>
                          <span className="text-[10px] font-sans-ui font-normal text-[#2C2C2A]/40">點擊熱度算法：(實際點擊數 + 隨機 1XXX)</span>
                        </h4>
                        
                        <div className="overflow-x-auto border border-[#2C2C2A]/10 rounded-xl bg-[#F4F4F3]/30">
                          <table className="w-full text-left font-sans-ui text-xs text-[#2C2C2A]">
                            <thead>
                              <tr className="bg-[#F4F4F3] border-b border-[#2C2C2A]/10 text-[#2C2C2A]/60 text-[10px] uppercase font-bold tracking-wider">
                                <th className="p-3">專題 ID / 名稱</th>
                                <th className="p-3 text-center">實際點閱 (真實)</th>
                                <th className="p-3 text-center">隨機偏移 (Offset)</th>
                                <th className="p-3 text-right">前台顯示數</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2C2C2A]/5 font-mono-data">
                              {allStories.map(story => {
                                const real = storyClicks[story.id] || 0;
                                const offset = storyOffsets[story.id] || 1000;
                                return (
                                  <tr key={story.id} className="hover:bg-[#F4F4F3]/80">
                                    <td className="p-3 font-sans-ui font-medium">
                                      <div className="font-bold flex items-center space-x-1.5 text-xs text-[#2C2C2A]">
                                        <span>{story.icon}</span>
                                        <span className="line-clamp-1">{story.title}</span>
                                      </div>
                                      <div className="text-[9px] font-mono-data text-[#2C2C2A]/40 leading-none mt-0.5">#{story.id}</div>
                                    </td>
                                    <td className="p-3 text-center font-bold text-emerald-600">{real}</td>
                                    <td className="p-3 text-center text-[#2C2C2A]/40 font-normal">+{offset}</td>
                                    <td className="p-3 text-right font-black text-[#5A6351]">{(real + offset).toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 商品點擊細節表 */}
                      <div>
                        <h4 className="text-xs font-mono-data text-[#5A6351] font-bold tracking-wider uppercase mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span>2. 選物導購點擊明細 (Products Clicks)</span>
                          <span className="text-[10px] font-sans-ui font-normal text-[#2C2C2A]/40">查看點擊算法：(實際點擊 + (500-999隨機))</span>
                        </h4>
                        
                        <div className="overflow-x-auto border border-[#2C2C2A]/10 rounded-xl bg-[#F4F4F3]/30 font-sans-ui">
                          <table className="w-full text-left font-sans-ui text-xs text-[#2C2C2A]">
                            <thead>
                              <tr className="bg-[#F4F4F3] border-b border-[#2C2C2A]/10 text-[#2C2C2A]/60 text-[10px] uppercase font-bold tracking-wider">
                                <th className="p-3">嚴選單品名稱</th>
                                <th className="p-3 text-center">實際查看 (真實)</th>
                                <th className="p-3 text-center">隨機偏移 (Offset)</th>
                                <th className="p-3 text-right">前台顯示數</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2C2C2A]/5 font-mono-data">
                              {PRODUCTS.map(product => {
                                const real = productClicks[product.id] || 0;
                                const offset = productOffsets[product.id] || 500;
                                return (
                                  <tr key={product.id} className="hover:bg-[#F4F4F3]/80">
                                    <td className="p-3 font-sans-ui font-medium">
                                      <div className="font-bold text-[#2C2C2A] text-xs line-clamp-1">{product.title_optimized}</div>
                                      <div className="text-[9px] font-mono-data text-[#2C2C2A]/40 leading-none mt-0.5">ID: {product.id}</div>
                                    </td>
                                    <td className="p-3 text-center font-bold text-amber-600">{real}</td>
                                    <td className="p-3 text-center text-[#2C2C2A]/40 font-normal font-mono-data">+{offset}</td>
                                    <td className="p-3 text-right font-black text-[#5A6351]">{(real + offset).toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 額外模擬：商品待審查模塊 / Pending Items Review */}
                  <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center space-x-3 text-[#2C2C2A] mb-6 pb-4 border-b border-[#2C2C2A]/5">
                      <CheckCircle2 className="w-5 h-5 text-[#5A6351]" />
                      <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">HUMAN-IN-THE-LOOP // 半自動審核佇列</span>
                    </div>
                    <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-6">
                      此處展示未來將加載的商品或由 AI 專家端自動分析生成的聯名內容。依據系統架構，所有新生成的商品狀態會固定標記為 <code className="bg-[#2C2C2A]/10 px-1 py-0.5 rounded text-[11px] font-mono-data text-[#2C2C2A]">status: "pending"</code>。在此可供團隊進行上架審核。
                    </p>
                    <div className="border border-dashed border-[#2C2C2A]/15 rounded-xl p-6 text-center text-xs text-[#2C2C2A]/40 font-sans-ui italic">
                      暫無審查中 (Pending) 的商品待處理。AI 智理引擎狀態良好。
                    </div>
                  </div>

                  {/* ================== 【後台 Shop 商品編輯器】 ================== */}
                  <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                    {/* 頂部標題欄 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 pb-6 border-b border-[#2C2C2A]/8">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-[#5A6351]/10 rounded-xl text-[#5A6351]">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest uppercase block mb-1">
                            SHOP EDITOR // 選物商城管理系統
                          </span>
                          <h3 className="text-xl font-bold font-serif text-[#2C2C2A]">
                            商品內容即時編輯台
                          </h3>
                          <p className="font-sans-ui text-xs text-[#2C2C2A]/55 leading-relaxed mt-1">
                            選取商品後可即時修改所有欄位，儲存後前台 Shop 頁面與詳情面板將同步更新。共 {editableProducts.length} 款商品。
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditableProducts(PRODUCTS);
                          try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(PRODUCTS)); } catch(e) {}
                          setSelectedEditProductId('');
                          triggerToast('🔄 商品資料已重置為系統預設值。');
                        }}
                        className="text-[10px] font-sans-ui text-red-400 hover:text-red-600 font-semibold underline transition-colors cursor-pointer whitespace-nowrap"
                      >
                        重置所有商品為預設值
                      </button>
                    </div>

                    <div className="p-8 pt-6">
                      {/* 商品選取列表 */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-xs font-mono-data text-[#2C2C2A]/50 font-bold tracking-wider uppercase">Step 1 — 選擇要編輯的商品</h4>
                            <p className="text-[10px] font-sans-ui text-[#2C2C2A]/35 mt-0.5 flex items-center space-x-1">
                              <GripVertical className="w-3 h-3" />
                              <span>可拖曳排序，前台商品順序即時更新</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEditProductId('__NEW__');
                              setEditProductTitle('');
                              setEditProductPrice('');
                              setEditProductUrl('');
                              setEditProductBtnText('探索生活靈感');
                              setEditProductDescription('');
                              setEditProductImageUrl('');
                              setEditProductTags('');
                              setEditProductStatus('active');
                              setEditProductIsPopular(false);
                              setConfirmDeleteProductId('');
                            }}
                            className="inline-flex items-center space-x-1.5 bg-[#5A6351]/10 hover:bg-[#5A6351]/20 text-[#5A6351] text-xs font-sans-ui font-bold px-3.5 py-2 rounded-lg border border-[#5A6351]/20 transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>新增商品</span>
                          </button>
                        </div>
                        <DndContext
                          sensors={dndSensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={editableProducts.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="flex flex-col gap-2">
                              {editableProducts.map((product) => {
                                const isSelected = product.id === selectedEditProductId;
                                const isPendingDelete = confirmDeleteProductId === product.id;
                                return (
                                  <SortableProductRow
                                    key={product.id}
                                    product={product}
                                    isSelected={isSelected}
                                    isPendingDelete={isPendingDelete}
                                    onSelect={() => {
                                      setSelectedEditProductId(product.id);
                                      setEditProductTitle(product.title_optimized);
                                      setEditProductPrice(product.price_display);
                                      setEditProductUrl(product.affiliate_url);
                                      setEditProductBtnText(product.btn_text);
                                      setEditProductDescription(product.description);
                                      setEditProductImageUrl(product.image_url);
                                      setEditProductTags(product.context_tags.join(', '));
                                      setEditProductStatus(product.status);
                                      setEditProductIsPopular(product.is_popular ?? false);
                                      setConfirmDeleteProductId('');
                                    }}
                                    onDeleteRequest={() => setConfirmDeleteProductId(product.id)}
                                    onDeleteConfirm={() => {
                                      const next = editableProducts.filter(p => p.id !== product.id);
                                      setEditableProducts(next);
                                      try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                                      setConfirmDeleteProductId('');
                                      if (selectedEditProductId === product.id) setSelectedEditProductId('');
                                      triggerToast(`🗑️ 商品《${product.title_optimized.slice(0,12)}...》已刪除，前台即時同步移除。`);
                                    }}
                                    onDeleteCancel={() => setConfirmDeleteProductId('')}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>

                      {/* 編輯 / 新增 表單 */}
                      {(selectedEditProductId && (selectedEditProductId === '__NEW__' || editableProducts.find(p => p.id === selectedEditProductId))) && (
                        <motion.div
                          key={selectedEditProductId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-[#2C2C2A]/8 pt-6 space-y-5"
                        >
                          <h4 className="text-xs font-mono-data text-[#2C2C2A]/50 font-bold tracking-wider uppercase flex items-center justify-between">
                            <span className="flex items-center space-x-2">
                              {selectedEditProductId === '__NEW__' ? <PlusCircle className="w-3.5 h-3.5 text-[#5A6351]" /> : <Edit3 className="w-3.5 h-3.5" />}
                              <span>{selectedEditProductId === '__NEW__' ? 'New Product — 新增商品資料' : 'Step 2 — 編輯商品內容欄位'}</span>
                            </span>
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* 商品名稱 */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品優化標題</label>
                              <input
                                type="text"
                                value={editProductTitle}
                                onChange={(e) => setEditProductTitle(e.target.value)}
                                placeholder="商品的完整優化標題"
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-serif font-bold text-sm transition-all"
                              />
                            </div>

                            {/* 價格 */}
                            <div>
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">價格顯示文字</label>
                              <input
                                type="text"
                                value={editProductPrice}
                                onChange={(e) => setEditProductPrice(e.target.value)}
                                placeholder="例：NT$ 1,980 或 洽詢優惠"
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
                              />
                            </div>

                            {/* 按鈕文字 */}
                            <div>
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">導購按鈕文字</label>
                              <input
                                type="text"
                                value={editProductBtnText}
                                onChange={(e) => setEditProductBtnText(e.target.value)}
                                placeholder="例：探索生活靈感、前往選購"
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
                              />
                            </div>

                            {/* 購買連結 */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                                <Link className="w-3 h-3" />
                                <span>聯盟行銷 / 購買連結 (Affiliate URL)</span>
                              </label>
                              <input
                                type="url"
                                value={editProductUrl}
                                onChange={(e) => setEditProductUrl(e.target.value)}
                                placeholder="https://www.momoshop.com.tw/..."
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
                              />
                            </div>

                            {/* 商品圖片 URL */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品圖片 URL</label>
                              <div className="flex gap-3">
                                <input
                                  type="url"
                                  value={editProductImageUrl}
                                  onChange={(e) => setEditProductImageUrl(e.target.value)}
                                  placeholder="https://images.unsplash.com/..."
                                  className="flex-1 bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
                                />
                                {editProductImageUrl && (
                                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#2C2C2A]/10 flex-shrink-0">
                                    <img src={editProductImageUrl} alt="預覽" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 分類標籤 */}
                            <div>
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">分類標籤 (逗號分隔)</label>
                              <input
                                type="text"
                                value={editProductTags}
                                onChange={(e) => setEditProductTags(e.target.value)}
                                placeholder="日常充電, 辦公室必備, 極簡旅行"
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
                              />
                              <p className="text-[10px] text-[#2C2C2A]/40 font-sans-ui mt-1">可用值：日常充電 / 辦公室必備 / 極簡旅行</p>
                            </div>

                            {/* 上架狀態 + 人氣商品 */}
                            <div>
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品上架狀態</label>
                              <div className="flex gap-2">
                                {(['active', 'pending', 'draft'] as const).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEditProductStatus(s)}
                                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-sans-ui font-bold border transition-all cursor-pointer ${
                                      editProductStatus === s
                                        ? s === 'active' ? 'bg-emerald-500 text-white border-emerald-500'
                                          : s === 'pending' ? 'bg-amber-400 text-white border-amber-400'
                                          : 'bg-gray-400 text-white border-gray-400'
                                        : 'bg-[#F4F4F3]/50 text-[#2C2C2A]/60 border-[#2C2C2A]/10 hover:bg-[#2C2C2A]/5'
                                    }`}
                                  >
                                    {s === 'active' ? '🟢 上架' : s === 'pending' ? '🟡 待審' : '⚫ 草稿'}
                                  </button>
                                ))}
                              </div>
                              {/* 人氣商品開關 */}
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => setEditProductIsPopular(!editProductIsPopular)}
                                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    editProductIsPopular
                                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                                      : 'bg-[#F4F4F3]/50 border-[#2C2C2A]/10 text-[#2C2C2A]/50 hover:border-[#2C2C2A]/20'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5">
                                    <Star className={`w-4 h-4 ${
                                      editProductIsPopular ? 'text-amber-400 fill-amber-400' : 'text-[#2C2C2A]/30'
                                    }`} />
                                    <div className="text-left">
                                      <p className="text-xs font-sans-ui font-bold">人氣精選 Popular Pick</p>
                                      <p className="text-[10px] font-sans-ui opacity-70">影響前台商品卡片顯示金色徽章</p>
                                    </div>
                                  </div>
                                  <div className={`w-10 h-5 rounded-full transition-all relative ${
                                    editProductIsPopular ? 'bg-amber-400' : 'bg-[#2C2C2A]/15'
                                  }`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                                      editProductIsPopular ? 'left-5.5' : 'left-0.5'
                                    }`} />
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* 商品簡介描述 */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品一句話特點描述</label>
                              <textarea
                                rows={3}
                                value={editProductDescription}
                                onChange={(e) => setEditProductDescription(e.target.value)}
                                placeholder="簡明扼要地描述此商品最核心的功能亮點與適用族群..."
                                className="w-full bg-[#F4F4F3]/50 border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui leading-relaxed transition-all resize-none"
                              />
                            </div>
                          </div>

                          {/* 儲存按鈕區 */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#2C2C2A]/8">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedEditProductId === '__NEW__') {
                                  // 新增商品
                                  const newId = `prod-custom-${Date.now()}`;
                                  const newProduct: Product = {
                                    id: newId,
                                    title_optimized: editProductTitle || '新商品',
                                    price_display: editProductPrice || 'NT$ 0',
                                    affiliate_url: editProductUrl || '#',
                                    btn_text: editProductBtnText || '查看商品',
                                    context_tags: editProductTags.split(',').map(t => t.trim()).filter(Boolean),
                                    status: editProductStatus,
                                    is_popular: editProductIsPopular,
                                    image_url: editProductImageUrl || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
                                    description: editProductDescription || ''
                                  };
                                  const next = [...editableProducts, newProduct];
                                  setEditableProducts(next);
                                  try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                                  setSelectedEditProductId(newId);
                                  triggerToast(`🎉 新商品《${(editProductTitle || '新商品').slice(0,15)}》已成功新增並上架至前台 Shop！`);
                                } else {
                                  // 更新商品
                                  const updatedProducts = editableProducts.map(p => {
                                    if (p.id !== selectedEditProductId) return p;
                                    return {
                                      ...p,
                                      title_optimized: editProductTitle,
                                      price_display: editProductPrice,
                                      affiliate_url: editProductUrl,
                                      btn_text: editProductBtnText,
                                      description: editProductDescription,
                                      image_url: editProductImageUrl,
                                      context_tags: editProductTags.split(',').map(t => t.trim()).filter(Boolean),
                                      status: editProductStatus,
                                      is_popular: editProductIsPopular
                                    };
                                  });
                                  setEditableProducts(updatedProducts);
                                  try {
                                    localStorage.setItem('oasis_editable_products_v1', JSON.stringify(updatedProducts));
                                  } catch(e) {}
                                  triggerToast(`✨ 商品《${editProductTitle.slice(0, 15)}...》已成功更新並即時同步至前台！`);
                                }
                              }}
                              className="flex-1 sm:flex-initial bg-[#5A6351] hover:bg-[#4E5646] text-white font-sans-ui text-xs font-bold py-3 px-6 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{selectedEditProductId === '__NEW__' ? '建立並上架新商品' : '儲存並發布此商品變更'}</span>
                            </button>
                            {selectedEditProductId !== '__NEW__' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirmDeleteProductId === selectedEditProductId) {
                                    const next = editableProducts.filter(p => p.id !== selectedEditProductId);
                                    setEditableProducts(next);
                                    try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                                    setSelectedEditProductId('');
                                    setConfirmDeleteProductId('');
                                    triggerToast(`🗑️ 商品《${editProductTitle.slice(0,12)}...》已已刪除，前台即時同步移除。`);
                                  } else {
                                    setConfirmDeleteProductId(selectedEditProductId);
                                  }
                                }}
                                className={`px-5 py-3 text-xs font-sans-ui font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                                  confirmDeleteProductId === selectedEditProductId
                                    ? 'bg-red-500 hover:bg-red-600 text-white border border-red-500'
                                    : 'border border-red-200 hover:bg-red-50 text-red-400 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{confirmDeleteProductId === selectedEditProductId ? '再次點擊確認刪除' : '刪除此商品'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setSelectedEditProductId(''); setConfirmDeleteProductId(''); }}
                              className="px-5 py-3 border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 text-xs text-[#2C2C2A]/60 font-sans-ui font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {!selectedEditProductId && (
                        <div className="border border-dashed border-[#5A6351]/20 rounded-xl p-8 text-center mt-4">
                          <ShoppingBag className="w-10 h-10 mx-auto text-[#5A6351]/30 mb-3" />
                          <p className="font-sans-ui text-sm text-[#2C2C2A]/40 font-medium">請從上方選取一款商品進行編輯，或點擊《新增商品》新增一筆</p>
                          <p className="font-sans-ui text-xs text-[#2C2C2A]/30 mt-1">所有欄位修改即時同步，無需重新整理頁面</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center mt-12 pt-6 border-t border-[#2C2C2A]/5">
                <button
                  onClick={() => {
                    setCurrentView('cover');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-sans-ui text-[#2C2C2A]/50 hover:text-[#5A6351] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回綠洲主畫面</span>
                </button>
              </div>
            </motion.div>
          ) : (
            
            // ================== 【專題內頁 - 沉浸式故事與導購】 ==================
            <motion.div
              key="story-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-16"
            >
              {/* 返回首頁導覽按鈕 */}
              <div className="mb-10 flex justify-between items-center">
                <button
                  onClick={() => {
                    setCurrentView('cover');
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="inline-flex items-center space-x-2 text-xs font-sans-ui text-[#2C2C2A]/60 hover:text-[#5A6351] font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← 返回雜誌首頁</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleShareStory(currentStory?.title || '')}
                    className="p-2 rounded-full border border-[#2C2C2A]/10 hover:bg-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-[#2C2C2A] transition-colors cursor-pointer"
                    title="分享此專題"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <span className="h-4 w-[1px] bg-[#2C2C2A]/20" />
                  <span className="font-mono-data text-xs text-[#2C2C2A]/50">
                    Oasis Lab. Selection
                  </span>
                </div>
              </div>

              {currentStory && (
                <div>
                  
                  {/* 沉浸式特刊 Header 區 */}
                  <div className="text-center mb-12">
                    <span className="font-mono-data text-xs tracking-widest text-[#5A6351] font-bold block mb-3 uppercase">
                      {currentStory.subtitle}
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2C2C2A] mb-4 leading-tight">
                      {currentStory.title}
                    </h1>
                    
                    <div className="flex justify-center items-center flex-wrap gap-4 text-xs font-sans-ui text-[#2C2C2A]/50 mb-8">
                      <span>{currentStory.author}</span>
                      <span className="h-3 w-[1px] bg-[#2C2C2A]/20" />
                      <span>{currentStory.readTime}</span>
                      <span className="h-3 w-[1px] bg-[#2C2C2A]/20" />
                      <span className="font-mono-data">{currentStory.date}</span>
                      <span className="h-3 w-[1px] bg-[#2C2C2A]/20" />
                      <span className="flex items-center space-x-1 font-mono-data">
                        <span>👁️</span> 
                        <span>{((storyClicks[currentStory.id] || 0) + (storyOffsets[currentStory.id] || 1000)).toLocaleString()} 次點擊</span>
                      </span>
                    </div>

                    {/* 專題主形象大圖 */}
                    <div className="w-full h-64 md:h-100 rounded-xl overflow-hidden shadow-md relative">
                      <img 
                        src={currentStory.coverImage} 
                        alt={currentStory.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>

                  {/* 深度故事內文區 */}
                  <div className="max-w-3xl mx-auto mb-16">
                    {/* 引言區：以大字體展示該專題的生活態度文案，包裹在帶有鼠尾草綠邊條的白色卡片中 */}
                    <motion.div 
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white border-l-4 border-[#5A6351] border-y border-r border-[#2C2C2A]/5 p-6 md:p-8 rounded-r-xl shadow-sm mb-10"
                    >
                      <h4 className="font-mono-data text-[10px] tracking-widest text-[#5A6351] font-bold uppercase mb-2">Curator Quote // 引言</h4>
                      <p className="text-base md:text-[17px] text-[#2C2C2A]/80 leading-relaxed italic font-serif">
                        “ {currentStory.description} ”
                      </p>
                    </motion.div>

                    {/* 文章正文，支援段落呈現 */}
                    <div className="text-[#2C2C2A]/80 leading-loose text-base md:text-lg font-serif tracking-normal space-y-6">
                      {currentStory.content.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="text-justify font-serif">
                          {pIdx === 0 ? (
                            // 首段首字放大 (Drop Cap)
                            <>
                              <span className="align-top font-serif text-5xl font-extrabold pr-2 float-left leading-[0.8] text-[#5A6351] mt-1 select-none">
                                {paragraph.charAt(0)}
                              </span>
                              {paragraph.slice(1)}
                            </>
                          ) : (
                            paragraph
                          )}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* 商品展示區：文章下方動態渲染商品網格 (Product Grid) */}
                  <div className="border-t border-[#2C2C2A]/10 pt-16 mt-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                      <div>
                        <div className="inline-flex items-center space-x-2 text-[#5A6351] mb-2">
                          <Tag className="w-4 h-4" />
                          <span className="font-mono-data text-xs tracking-widest font-bold uppercase">
                            SHOP THE STORY // 專題配戴好物
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                          選物美學・動態導購
                        </h3>
                        <p className="font-sans-ui text-xs text-[#2C2C2A]/50 mt-1">
                          以下為您嚴選符合此篇「<strong className="text-[#5A6351]">{currentStory.targetTag}</strong>」主題的頂級品項：
                        </p>
                      </div>

                      {/* 動態狀態展示 */}
                      <span className="font-mono-data text-[11px] bg-[#5A6351]/10 text-[#5A6351] px-3 py-1.5 rounded-lg border border-[#5A6351]/20">
                        目前檢索標籤 : #{currentStory.targetTag}
                      </span>
                    </div>

                    {/* 商品卡片 Grid 物件 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                      {getFilteredProducts(currentStory).map((product, pIdx) => (
                        <motion.div 
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.98, y: 15 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true, margin: '-50px' }}
                          transition={{ delay: pIdx * 0.1, duration: 0.5 }}
                          className="bg-white border border-[#2C2C2A]/5 hover:border-[#5A6351]/20 rounded-xl overflow-hidden shadow-sm hover:shadow-[0_12px_32px_rgba(90,99,81,0.05)] transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            {/* 商品圖片與懸停效果 */}
                            <div 
                              onClick={() => handleOpenProductDetail(product)}
                              className="relative h-64 overflow-hidden bg-[#2C2C2A]/5 group cursor-pointer"
                            >
                              <img 
                                src={product.image_url} 
                                alt={product.title_optimized}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {product.context_tags.map(tag => (
                                  <span 
                                    key={tag}
                                    className={`px-2.5 py-1 text-[10px] font-sans-ui font-bold rounded-md border flex items-center space-x-1 shadow-sm ${
                                      tag === currentStory.targetTag 
                                        ? 'bg-[#5A6351] text-[#F4F4F3] border-transparent' 
                                        : 'bg-[#F4F4F3] text-[#2C2C2A]/70 border-[#2C2C2A]/10'
                                    }`}
                                  >
                                    <span className="scale-75 font-mono">#</span>
                                    <span>{tag}</span>
                                  </span>
                                ))}
                              </div>

                              {/* 收藏按鈕 */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveProduct(product.id);
                                }}
                                className="absolute top-4 right-4 p-2 rounded-full bg-[#F4F4F3]/90 hover:bg-[#F4F4F3] border border-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                                title={savedProducts.includes(product.id) ? "取消珍藏" : "珍藏此物件"}
                              >
                                <Heart className={`w-4 h-4 ${savedProducts.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </button>
                            </div>

                            {/* 商品描述與優化標題 */}
                            <div 
                              onClick={() => handleOpenProductDetail(product)}
                              className="p-6 md:p-8 cursor-pointer"
                            >
                              <h4 className="text-lg md:text-xl font-extrabold tracking-tight text-[#2C2C2A] line-clamp-2 leading-snug mb-3">
                                {product.title_optimized}
                              </h4>
                              <p className="text-xs md:text-sm text-[#2C2C2A]/60 font-sans-ui leading-relaxed mb-4">
                                {product.description}
                              </p>
                            </div>
                          </div>

                          {/* 價格與行動按鈕 */}
                          <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 border-t border-[#2C2C2A]/5 mt-auto">
                            <div className="flex items-center justify-between pt-4">
                              <div className="flex flex-col">
                                <span className="font-sans-ui text-[10px] tracking-widest text-[#2C2C2A]/40 font-bold uppercase">
                                  Curated Price
                                </span>
                                <span className="font-mono-data text-[#5A6351] text-lg font-bold">
                                  {product.price_display}
                                </span>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="font-mono-data text-[10px] text-[#2C2C2A]/40 mb-1">
                                  🔥 {((productClicks[product.id] || 0) + (productOffsets[product.id] || 500)).toLocaleString()} 次查看
                                </span>
                                <button
                                  onClick={() => handleOpenProductDetail(product)}
                                  className="inline-flex items-center space-x-2 bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] text-xs font-sans-ui font-semibold py-2 px-4 shadow-[0_2px_10px_rgba(90,99,81,0.15)] rounded-lg transition-colors cursor-pointer"
                                >
                                  <span>{product.btn_text}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 當有重疊標籤的說明提示 */}
                    <div className="text-center mt-12 mb-6 text-xs text-[#2C2C2A]/40 font-sans-ui">
                      ※ 提示：部分好物如雙肩包、充電座與濾杯具備多屬性標籤，已在不同的生活專題實現重疊與交叉推薦。
                    </div>
                  </div>

                  {/* 返回底部按鈕 */}
                  <div className="flex justify-center mt-20 border-t border-[#2C2C2A]/10 pt-10">
                    <button
                      onClick={() => {
                        setCurrentView('cover');
                        window.scrollTo({ top: 0, behavior: 'instant' });
                      }}
                      className="bg-[#2C2C2A] hover:bg-[#3D3D3A] text-[#F4F4F3] px-8 py-3 rounded-lg text-xs font-sans-ui tracking-wider transition-all flex items-center space-x-2 shadow-md cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>返回首頁總覽</span>
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* iOS Safari / Android 手動引導 PWA 說明彈窗 */}
      <AnimatePresence>
        {showManualPwaGuide && (
          <motion.div 
            id="pwa-guide-modal"
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
                  <Smartphone className="w-5 h-5 animate-pulse" />
                  <span className="font-sans-ui text-xs tracking-widest font-bold uppercase">Desktop Applet Guide</span>
                </div>
                <button 
                  onClick={() => setShowManualPwaGuide(false)}
                  className="p-1 rounded-full hover:bg-[#2C2C2A]/5 transition-colors text-[#2C2C2A]/60 hover:text-[#2C2C2A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-2 tracking-tight">將「Oasis Lab.」安裝至手機桌面</h3>
              <p className="font-sans-ui text-xs text-[#2C2C2A]/70 mb-6 leading-relaxed">
                若您的瀏覽器此時未自動跳出安裝詢問，請參照下方簡明指引手動加入。
              </p>

              {/* 手動指南步驟 */}
              <div className="space-y-4 font-sans-ui text-xs text-[#2C2C2A]/80 mb-6">
                <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-[#2C2C2A]/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5A6351]/10 text-[#5A6351] font-bold text-[10px] shrink-0">1</span>
                  <div>
                    <p className="font-bold">Apple iOS (Safari 瀏覽器)</p>
                    <p className="text-[#2C2C2A]/60 mt-0.5">點按 Safari 瀏覽器中央下方的 <strong className="text-[#2C2C2A]">「分享 (Share)」</strong> 按鈕（向上箭頭圖示）。</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-[#2C2C2A]/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5A6351]/10 text-[#5A6351] font-bold text-[10px] shrink-0">2</span>
                  <div>
                    <p className="font-bold">加入主畫面</p>
                    <p className="text-[#2C2C2A]/60 mt-0.5">在彈出選項列表中，往上滑動並點選 <strong className="text-[#2C2C2A]">「加入主畫面 (Add to Home Screen)」</strong>。</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-[#2C2C2A]/5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#5A6351]/10 text-[#5A6351] font-bold text-[10px] shrink-0">3</span>
                  <div>
                    <p className="font-bold">Android 以及其他 Chrome</p>
                    <p className="text-[#2C2C2A]/60 mt-0.5">點選右側的 <strong className="text-[#2C2C2A]">「三個小圓點」</strong> 展開清單，再選取 <strong className="text-[#2C2C2A]">「安裝應用程式」</strong> 即可。</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#5A6351]/5 border-l-2 border-[#5A6351] p-3 text-[11px] font-sans-ui text-[#5A6351]/90 rounded mb-6">
                💡 PWA 桌面小程式安全、輕量、不佔用個人手機大容量儲存，更方便隨時高質感閱讀！
              </div>

              <button 
                onClick={() => setShowManualPwaGuide(false)}
                className="w-full bg-[#5A6351] hover:bg-[#4E5646] text-[#F4F4F3] py-2.5 rounded-lg text-center font-sans-ui font-medium text-xs transition-colors cursor-pointer"
              >
                好的，我已瞭解
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 策展關鍵字設定氣泡彈窗 */}
      <AnimatePresence>
        {showKeywordModal && (
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
                  onClick={() => setShowKeywordModal(false)}
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
                  onClick={() => setShowKeywordModal(false)}
                  className="flex-1 border border-[#2C2C2A]/15 hover:bg-[#2C2C2A]/5 py-2.5 rounded-lg text-center font-sans-ui text-xs text-[#2C2C2A]/70 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowKeywordModal(false);
                    handleGenerateNextIssue({
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
        )}
      </AnimatePresence>

      {/* 底部浮動 PWA 快捷手冊 */}
      {!isAppInstalled && (
        <div className="fixed bottom-6 right-6 z-30 font-sans-ui">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePwaInstall}
            className="flex items-center space-x-1.5 bg-[#5A6351] text-[#F4F4F3] hover:bg-[#4E5646] text-xs font-bold py-2.5 px-4 shadow-xl rounded-full border border-white/10 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>安裝 Applet</span>
          </motion.button>
        </div>
      )}

      {/* 雜誌底部資訊 (Footer) */}
      <footer id="magazine-footer" className="bg-[#2C2C2A] text-[#F4F4F3]/80 pt-20 pb-12 px-6 md:px-12 mt-24 border-t border-[#F4F4F3]/5">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-[#F4F4F3]/10">
            
            {/* Column 1: Brand Brand */}
            <div className="md:col-span-4 flex flex-col justify-between">
              <div>
                <span className="font-mono-data text-[#5A6351] text-xs tracking-widest font-bold uppercase block mb-3">
                  Oasis Lab.
                </span>
                <p className="text-3xl font-bold font-serif text-[#F4F4F3] tracking-tight mb-4">
                  現代人的隨身生活綠洲。
                </p>
                <p className="font-sans-ui text-xs text-[#F4F4F3]/50 leading-relaxed max-w-xs">
                  由微策展啟發的生活器物誌，在快節奏都市日常中重新探尋物理與精神專注的頻率。
                </p>
              </div>
            </div>

            {/* Column 2: Company Details */}
            <div className="md:col-span-4 font-sans-ui text-xs space-y-3 text-[#F4F4F3]/70">
              <span className="font-mono-data text-xs text-[#5A6351] font-bold tracking-widest uppercase block mb-1">
                COMPANY INFO // 企業資訊
              </span>
              <p className="font-medium text-[#F4F4F3] text-sm">元啟實業有限公司</p>
              <p className="text-[#F4F4F3]/50 font-mono-data">Arche Global Co., Ltd.</p>
              <div className="pt-2 space-y-1.5 text-[#F4F4F3]/60">
                <p>統一編號：<span className="font-mono-data">60327997</span></p>
                <p>通訊地址：111 台北市士林區忠誠路一段 129 號</p>
              </div>
            </div>

            {/* Column 3: Contact & Support */}
            <div className="md:col-span-4 font-sans-ui text-xs space-y-3 text-[#F4F4F3]/70">
              <span className="font-mono-data text-xs text-[#5A6351] font-bold tracking-widest uppercase block mb-1">
                CONTACT & SUPPORT // 聯繫管道
              </span>
              <div className="space-y-1.5 text-[#F4F4F3]/60">
                <p>客服信箱：<a href="mailto:info@archeglobal.com.tw" className="hover:text-white underline decoration-dotted transition-colors font-mono-data">info@archeglobal.com.tw</a></p>
                <p>客服電話：<span className="font-mono-data">0900-190-110</span></p>
                <p>服務時間：週一至週五 <span className="font-mono-data">10:00 - 18:00</span></p>
              </div>

              {/* Social Channels */}
              <div className="pt-4">
                <span className="font-mono-data text-[10px] text-[#F4F4F3]/40 tracking-widest uppercase block mb-2">Social Channels</span>
                <div className="flex space-x-4">
                  <span className="text-[#F4F4F3]/40 hover:text-white transition-colors cursor-pointer text-xs flex items-center space-x-1" onClick={() => triggerToast('LINE 官方帳號正在緊鑼密鼓設定中，敬請期待。')}>
                    <span>LINE</span>
                  </span>
                  <span className="text-[#F4F4F3]/40 hover:text-white transition-colors cursor-pointer text-xs flex items-center space-x-1" onClick={() => triggerToast('Instagram 官方帳號正在籌備與策劃全新靈感中。')}>
                    <span>Instagram</span>
                  </span>
                  <span className="text-[#F4F4F3]/40 hover:text-white transition-colors cursor-pointer text-xs flex items-center space-x-1" onClick={() => triggerToast('Facebook 粉絲專頁籌備中，最新消息絕不漏接。')}>
                    <span>Facebook</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Metas */}
          <div className="flex flex-col md:flex-row justify-between items-center text-[11px] font-sans-ui text-[#F4F4F3]/40 gap-4 pt-10">
            <p>
              &copy; 2026 Arche Global. All rights reserved. 版權所有 元啟實業有限公司。
              <button 
                onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="ml-4 font-mono-data text-[10px] text-[#F4F4F3]/15 hover:text-[#5A6351] tracking-wider transition-colors cursor-pointer bg-transparent border-none p-0 inline-flex items-center space-x-1"
                title="Admin Control"
              >
                <span>// Curator Studio</span>
              </button>
            </p>
            <p className="font-mono-data tracking-widest text-[#5A6351]">
              CRAFTED WITH INTENTIONAL SLOW DESIGN // 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
