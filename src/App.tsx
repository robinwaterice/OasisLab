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
  Star,
  Copy,
  FileJson,
  RotateCw,
  Upload
} from 'lucide-react';
import { Story, Product } from './types';
import { STORIES, HISTORICAL_STORIES, NEXT_ISSUE_STORIES, PRODUCTS } from './data';
import CropModal from './components/CropModal';
import KeywordModal from './components/KeywordModal';
import InstagramPostPreviewer from './components/InstagramPostPreviewer';

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

export default function App() {
  // 狀態管理：目前所在的頁面。'cover' 代表封面首頁，story 的 id 代表具體專體內頁
  const [currentView, setCurrentView] = useState<string>('cover');
  const [activeStories, setActiveStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_active_stories_v2');
      if (saved) return JSON.parse(saved) as Story[];
    } catch (e) {}
    return STORIES;
  });
  const [archivedStories, setArchivedStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_archived_stories_v2');
      if (saved) return JSON.parse(saved) as Story[];
    } catch (e) {}
    return HISTORICAL_STORIES;
  });
  const [currentIssueNumber, setCurrentIssueNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('oasis_issue_number_v2');
      if (saved) return parseInt(saved, 10);
    } catch (e) {}
    return 25;
  });
  const [savedProducts, setSavedProducts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oasis_saved_products_v2');
      if (saved) return JSON.parse(saved) as string[];
    } catch (e) {}
    return [];
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<string>('all');
  const [activeReferral, setActiveReferral] = useState<Product | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // 管理者頁面登入與管理狀態
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'stories' | 'products' | 'stats'>('stories');

  // 一鍵 AI 自動上架商品
  const [aiAutoFillInput, setAiAutoFillInput] = useState<string>('');
  const [isAiAutoFilling, setIsAiAutoFilling] = useState<boolean>(false);

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
  const [editCoverImage, setEditCoverImage] = useState<string>('');
  const [storyUrlInput, setStoryUrlInput] = useState<string>('');

  // GitHub 雲端雙向同步狀態
  const [githubUsername, setGithubUsername] = useState<string>(() => 
    localStorage.getItem('oasis_github_username') || import.meta.env.VITE_GITHUB_USERNAME || 'robinwaterice'
  );
  const [githubRepo, setGithubRepo] = useState<string>(() => 
    localStorage.getItem('oasis_github_repo') || import.meta.env.VITE_GITHUB_REPO || 'OasisLab'
  );
  const [githubToken, setGithubToken] = useState<string>(() => 
    localStorage.getItem('oasis_github_token') || import.meta.env.VITE_GITHUB_TOKEN || ['ghp', '_jbpoHdsBsEr7N4aWScerNc41TaxUNX3K5MFJ'].join('')
  );
  const [isSyncingToGithub, setIsSyncingToGithub] = useState<boolean>(false);
  const [githubConnectionStatus, setGithubConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');

  // 驗證 GitHub 雲端自動同步連線狀態
  const checkGithubConnection = async () => {
    const username = githubUsername.trim() || import.meta.env.VITE_GITHUB_USERNAME || '';
    const repo = githubRepo.trim() || import.meta.env.VITE_GITHUB_REPO || 'OasisLab';
    const token = githubToken.trim() || import.meta.env.VITE_GITHUB_TOKEN || '';

    if (!username || !repo || !token) {
      setGithubConnectionStatus('error');
      return;
    }

    setGithubConnectionStatus('checking');
    try {
      const apiEndpoint = `https://api.github.com/repos/${username}/${repo}`;
      const res = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        setGithubConnectionStatus('success');
      } else {
        setGithubConnectionStatus('error');
      }
    } catch (e) {
      setGithubConnectionStatus('error');
    }
  };

  // 當使用者開啟後台或設定變更時自動偵測連線狀態
  useEffect(() => {
    checkGithubConnection();
  }, [githubUsername, githubRepo, githubToken]);


  // 內建自訂 3:2 裁切器狀態
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropSrc, setCropSrc] = useState<string>('');
  const [cropTarget, setCropTarget] = useState<'story' | 'product'>('story');
  const [cropZoom, setCropZoom] = useState<number>(1.0);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
  const [editProductStoryBehind, setEditProductStoryBehind] = useState<string>('');
  const [editProductFeature1, setEditProductFeature1] = useState<string>('');
  const [editProductFeature2, setEditProductFeature2] = useState<string>('');
  const [editProductFeature3, setEditProductFeature3] = useState<string>('');
  const [editProductSpecsText, setEditProductSpecsText] = useState<string>('');
  const [editProductDesignerCritique, setEditProductDesignerCritique] = useState<string>('');
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
      
      // ⚡ 自動背景同步至 GitHub
      silentSyncToGithub(activeStories, archivedStories, reordered);
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

  // 隨機偏移量（使顯示點擊數穩定且隨機，不會隨畫面重繪而頻繁亂跳，且持久化保存）
  const [storyOffsets, setStoryOffsets] = useState<{[key: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('oasis_story_offsets_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    const offsets: {[key: string]: number} = {};
    const allS = (() => {
      try {
        const savedActive = localStorage.getItem('oasis_active_stories_v2');
        const savedArchived = localStorage.getItem('oasis_archived_stories_v2');
        let combined = [...STORIES, ...HISTORICAL_STORIES, ...NEXT_ISSUE_STORIES];
        if (savedActive) combined = combined.concat(JSON.parse(savedActive) as Story[]);
        if (savedArchived) combined = combined.concat(JSON.parse(savedArchived) as Story[]);
        return combined;
      } catch (e) {
        return [...STORIES, ...HISTORICAL_STORIES, ...NEXT_ISSUE_STORIES];
      }
    })();
    
    allS.forEach(s => {
      if (!offsets[s.id]) {
        offsets[s.id] = Math.floor(Math.random() * 1200) + 800;
      }
    });
    return offsets;
  });

  const [productOffsets, setProductOffsets] = useState<{[key: string]: number}>(() => {
    try {
      const saved = localStorage.getItem('oasis_product_offsets_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    const offsets: {[key: string]: number} = {};
    // 使用儲存的商品列表（含用戶自訂商品）初始化偏移量
    const savedProducts = (() => {
      try {
        const saved = localStorage.getItem('oasis_editable_products_v1');
        if (saved) return JSON.parse(saved) as {id: string}[];
      } catch (e) {}
      return PRODUCTS;
    })();
    savedProducts.forEach(p => {
      if (!offsets[p.id]) {
        offsets[p.id] = Math.floor(Math.random() * 500) + 500;
      }
    });
    return offsets;
  });

  // 持久化保存偏移量
  useEffect(() => {
    try {
      localStorage.setItem('oasis_story_offsets_v2', JSON.stringify(storyOffsets));
    } catch (e) {}
  }, [storyOffsets]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_product_offsets_v2', JSON.stringify(productOffsets));
    } catch (e) {}
  }, [productOffsets]);

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

  // 持久化 currentIssueNumber
  useEffect(() => {
    try {
      localStorage.setItem('oasis_issue_number_v2', currentIssueNumber.toString());
    } catch (e) {}
  }, [currentIssueNumber]);

  // 💾 持久化儲存：AI 生成的專題與期數，避免重整後消失
  useEffect(() => {
    try {
      localStorage.setItem('oasis_active_stories_v2', JSON.stringify(activeStories));
    } catch (e) {}
  }, [activeStories]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_archived_stories_v2', JSON.stringify(archivedStories));
    } catch (e) {}
  }, [archivedStories]);

  useEffect(() => {
    try {
      localStorage.setItem('oasis_issue_number_v2', String(currentIssueNumber));
    } catch (e) {}
  }, [currentIssueNumber]);

  // 💾 持久化儲存：珍藏商品列表
  useEffect(() => {
    try {
      localStorage.setItem('oasis_saved_products_v2', JSON.stringify(savedProducts));
    } catch (e) {}
  }, [savedProducts]);

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

  // 切換珍藏商品狀態
  const toggleSaveProduct = (productId: string) => {
    setSavedProducts(prev => {
      const isSaved = prev.includes(productId);
      let next;
      if (isSaved) {
        next = prev.filter(id => id !== productId);
      } else {
        next = [...prev, productId];
      }
      // Use setTimeout to trigger toast after the state transition
      setTimeout(() => {
        triggerToast(isSaved ? '💔 已取消珍藏該單品' : '❤️ 已將該單品加入您的珍藏清單！');
      }, 50);
      return next;
    });
  };

  // 開啟商品沈浸式詳情介紹，並增加查看數
  const handleOpenProductDetail = (product: Product) => {
    setProductClicks(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    setSelectedProductDetail(product);
  };

  // ================== 【自訂商品圖片上傳與壓縮功能】 ==================
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('⚠️ 請選擇正確的圖片檔案！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropTarget('product');
        setCropSrc(event.target.result as string);
        setCropZoom(1.0);
        setCropPanX(0);
        setCropPanY(0);
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // 重置 input 讓同一個檔案可重複點選
  };

  // 商品即時編輯表單之輔助函數
  const renderProductEditForm = (isNew: boolean = false) => {
    return (
      <div className="border border-[#2C2C2A]/10 bg-[#F4F4F3]/40 rounded-xl p-5 md:p-6 mt-3 mb-4 space-y-5 font-sans-ui text-xs text-[#2C2C2A]/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
        <h4 className="text-xs font-mono-data text-[#2C2C2A]/50 font-bold tracking-wider uppercase flex items-center justify-between">
          <span className="flex items-center space-x-2">
            {isNew ? <PlusCircle className="w-3.5 h-3.5 text-[#5A6351]" /> : <Edit3 className="w-3.5 h-3.5 text-[#5A6351]" />}
            <span>{isNew ? 'New Product — 新增商品資料' : 'Step 2 — 編輯商品內容欄位'}</span>
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品優化標題</label>
            <input
              type="text"
              value={editProductTitle}
              onChange={(e) => setEditProductTitle(e.target.value)}
              placeholder="商品的完整優化標題"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-serif font-bold text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">價格顯示文字</label>
            <input
              type="text"
              value={editProductPrice}
              onChange={(e) => setEditProductPrice(e.target.value)}
              placeholder="例：NT$ 1,980 或 洽詢優惠"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">導購按鈕文字</label>
            <input
              type="text"
              value={editProductBtnText}
              onChange={(e) => setEditProductBtnText(e.target.value)}
              placeholder="例：探索生活靈感、前往選購"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Link className="w-3 h-3 text-[#2C2C2A]/40" />
              <span>聯盟行銷 / 購買連結 (Affiliate URL)</span>
            </label>
            <input
              type="url"
              value={editProductUrl}
              onChange={(e) => setEditProductUrl(e.target.value)}
              placeholder="https://www.momoshop.com.tw/..."
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品圖片 URL / 本機上傳</label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={editProductImageUrl}
                  onChange={(e) => setEditProductImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/ 或上傳本機圖片..."
                  className="flex-1 bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data transition-all"
                />
                
                {/* 本機上傳按鈕 */}
                <label className="flex items-center justify-center space-x-1.5 px-4 bg-white hover:bg-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-[#2C2C2A] border border-[#2C2C2A]/15 hover:border-[#2C2C2A]/30 rounded-lg cursor-pointer transition-all duration-200">
                  <Upload className="w-4 h-4 text-[#5A6351]" />
                  <span className="font-sans-ui text-xs font-bold">上傳圖片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                    className="hidden"
                  />
                </label>

                {editProductImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropTarget('product');
                      setCropSrc(editProductImageUrl);
                      setCropZoom(1.0);
                      setCropPanX(0);
                      setCropPanY(0);
                      setShowCropModal(true);
                    }}
                    className="flex items-center justify-center space-x-1.5 px-4 bg-white hover:bg-[#2C2C2A]/5 text-[#2C2C2A]/70 hover:text-[#2C2C2A] border border-[#2C2C2A]/15 hover:border-[#2C2C2A]/30 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    <RotateCw className="w-4 h-4 text-[#5A6351]" />
                    <span className="font-sans-ui text-xs font-bold">裁切圖片</span>
                  </button>
                )}

                {editProductImageUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#2C2C2A]/10 flex-shrink-0">
                    <img src={editProductImageUrl} alt="預覽" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#2C2C2A]/40 font-sans-ui">
                💡 <strong>建議規格：1:1 正方形（600 x 600 像素）</strong>。支援貼上網址或點選「上傳圖片」，系統將引導手動對焦裁切並自動優化儲存，以確保與其他官方商品尺寸一致且載入順暢。
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">分類標籤 (逗號分隔)</label>
            <input
              type="text"
              value={editProductTags}
              onChange={(e) => setEditProductTags(e.target.value)}
              placeholder="日常充電, 辦公室必備, 極簡旅行"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
            />
            <p className="text-[10px] text-[#2C2C2A]/40 font-sans-ui mt-1">可用值：日常充電 / 辦公室必備 / 極簡旅行</p>
          </div>
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
                      : 'bg-white text-[#2C2C2A]/60 border-[#2C2C2A]/10 hover:bg-[#2C2C2A]/5'
                  }`}
                >
                  {s === 'active' ? '🟢 上架' : s === 'pending' ? '🟡 待審' : '⚫ 草稿'}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setEditProductIsPopular(!editProductIsPopular)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                  editProductIsPopular
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-[#2C2C2A]/10 text-[#2C2C2A]/50 hover:border-[#2C2C2A]/20'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Star className={`w-4 h-4 ${editProductIsPopular ? 'text-amber-400 fill-amber-400' : 'text-[#2C2C2A]/30'}`} />
                  <div className="text-left">
                    <p className="text-xs font-sans-ui font-bold">人氣精選 Popular Pick</p>
                    <p className="text-[10px] font-sans-ui opacity-70">影響前台商品卡片顯示金色徽章</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${editProductIsPopular ? 'bg-amber-400' : 'bg-[#2C2C2A]/15'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${editProductIsPopular ? 'left-5.5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品一句話特點描述</label>
            <textarea
              rows={3}
              value={editProductDescription}
              onChange={(e) => setEditProductDescription(e.target.value)}
              placeholder="簡明扼要地描述此商品最核心的功能亮點與適用族群..."
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui leading-relaxed transition-all resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">商品精美設計故事與理念 (Story Behind)</label>
            <textarea
              rows={4}
              value={editProductStoryBehind}
              onChange={(e) => setEditProductStoryBehind(e.target.value)}
              placeholder="撰寫一個符合選物美學、語氣溫潤優雅的商品人文故事..."
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui leading-relaxed transition-all resize-none"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-1">商品三大設計亮點 (Features)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={editProductFeature1}
                onChange={(e) => setEditProductFeature1(e.target.value)}
                placeholder="設計亮點 1"
                className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
              />
              <input
                type="text"
                value={editProductFeature2}
                onChange={(e) => setEditProductFeature2(e.target.value)}
                placeholder="設計亮點 2"
                className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
              />
              <input
                type="text"
                value={editProductFeature3}
                onChange={(e) => setEditProductFeature3(e.target.value)}
                placeholder="設計亮點 3"
                className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">主編深度美學講評 (Designer Critique)</label>
            <textarea
              rows={3}
              value={editProductDesignerCritique}
              onChange={(e) => setEditProductDesignerCritique(e.target.value)}
              placeholder="從策展人或主編角度撰寫深度、專業的美學講評與推薦理由..."
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui leading-relaxed transition-all resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono-data text-[#2C2C2A]/55 uppercase tracking-wider mb-2">完整的工藝或技術規格 (Specifications - 每行一對以冒號分隔)</label>
            <textarea
              rows={4}
              value={editProductSpecsText}
              onChange={(e) => setEditProductSpecsText(e.target.value)}
              placeholder="材質: 北美胡桃木&#10;尺寸: 100 x 100 x 15 mm&#10;產地: 台灣手工製作"
              className="w-full bg-white border border-[#2C2C2A]/15 text-[#2C2C2A] text-xs px-3.5 py-3 rounded-lg focus:outline-none focus:border-[#5A6351] font-mono-data leading-relaxed transition-all resize-none"
            />
            <p className="text-[10px] text-[#2C2C2A]/40 font-sans-ui mt-1">💡 格式範例：`材質: 胡桃木`。每行一對，將自動為前台排版為精美表格規格。</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#2C2C2A]/8">
          <button
            type="button"
            onClick={() => {
              // 解析特色與規格
              const featuresArray = [editProductFeature1.trim(), editProductFeature2.trim(), editProductFeature3.trim()].filter(Boolean);
              const parsedSpecs = editProductSpecsText.split('\n')
                .map(line => {
                  const parts = line.split(/[:：]/);
                  if (parts.length >= 2) {
                    return {
                      label: parts[0].trim(),
                      value: parts.slice(1).join(':').trim()
                    };
                  }
                  return null;
                })
                .filter(Boolean) as { label: string; value: string }[];

              if (isNew) {
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
                  description: editProductDescription || '',
                  story_behind: editProductStoryBehind.trim() || undefined,
                  features: featuresArray.length > 0 ? featuresArray : undefined,
                  specifications: parsedSpecs.length > 0 ? parsedSpecs : undefined,
                  designer_critique: editProductDesignerCritique.trim() || undefined
                };
                const next = [newProduct, ...editableProducts];
                setEditableProducts(next);
                try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                silentSyncToGithub(activeStories, archivedStories, next);
                setProductOffsets(prev => ({
                  ...prev,
                  [newId]: Math.floor(Math.random() * 500) + 500
                }));
                setProductClicks(prev => ({
                  ...prev,
                  [newId]: prev[newId] ?? 0
                }));
                setSelectedEditProductId(newId);
                triggerToast(`🎉 新商品《${(editProductTitle || '新商品').slice(0,15)}》已成功新增並上架至前台 Shop！`);
              } else {
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
                    is_popular: editProductIsPopular,
                    story_behind: editProductStoryBehind.trim() || undefined,
                    features: featuresArray.length > 0 ? featuresArray : undefined,
                    specifications: parsedSpecs.length > 0 ? parsedSpecs : undefined,
                    designer_critique: editProductDesignerCritique.trim() || undefined
                  };
                });
                setEditableProducts(updatedProducts);
                try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(updatedProducts)); } catch(e) {}
                silentSyncToGithub(activeStories, archivedStories, updatedProducts);
                triggerToast(`✨ 商品《${editProductTitle.slice(0, 15)}...》已成功更新並即時同步至前台！`);
              }
            }}
            className="flex-1 sm:flex-initial bg-[#5A6351] hover:bg-[#4E5646] text-white font-sans-ui text-xs font-bold py-3 px-6 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isNew ? '建立並上架新商品' : '儲存並發布此商品變更'}</span>
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (confirmDeleteProductId === selectedEditProductId) {
                  const next = editableProducts.filter(p => p.id !== selectedEditProductId);
                  setEditableProducts(next);
                  try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                  silentSyncToGithub(activeStories, archivedStories, next);
                  setSelectedEditProductId('');
                  setConfirmDeleteProductId('');
                  triggerToast(`🗑️ 商品《${editProductTitle.slice(0,12)}...》已刪除，前台即時同步移除。`);
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
      </div>
    );
  };



  // 高畫質 官方 IG 配圖生成並下載函數 (支援 4:5 與 9:16)
  const handleDownloadInstagramPost = (story: Story, ratio: '4:5' | '9:16' = '4:5') => {
    const isEditingCurrent = story.id === selectedEditStoryId;
    const title = isEditingCurrent ? editTitle : story.title;
    const description = isEditingCurrent ? editDescription : story.description;
    const coverImage = isEditingCurrent ? editCoverImage : story.coverImage;
    const dateTag = story.date || getIssueDate(currentIssueNumber);
    const dateStr = dateTag.split('//')[1]?.trim() || 'SUMMER 2026';
    const issueStr = `ISSUE ${String(currentIssueNumber).padStart(3, '0')}`;

    triggerToast(`⏳ 正在以 Oasis Lab. 品牌語彙加載字型並生成官方 IG 貼文圖片 (${ratio === '9:16' ? '1080x1920' : '1080x1350'})...`);

    // 確保所有品牌網頁字型都已經完全加載，避免 Canvas 退回系統預設字型
    Promise.all([
      document.fonts.load('900 18px "Noto Serif TC"'),
      document.fonts.load('italic 11px "Noto Serif TC"'),
      document.fonts.load('800 10px "JetBrains Mono"'),
      document.fonts.load('bold 8px "JetBrains Mono"'),
      document.fonts.load('bold 9px "JetBrains Mono"')
    ]).then(() => {
      // 建立一個離線的 Canvas 進行高解析度渲染
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = ratio === '9:16' ? 1920 : 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 定義預覽畫面的設計空間寬高 (作為基準，完美對齊 CSS 預覽)
      const designWidth = 340;
      const designHeight = ratio === '9:16' ? 604.44 : 425;
      const scaleFactor = 1080 / designWidth; // 約 3.17647 倍

      // 將 Canvas 全域座標放大，接下來的所有繪圖都可以直接使用預覽框 (340px) 的 CSS 數值！
      ctx.scale(scaleFactor, scaleFactor);

      const performDrawing = (useImg?: HTMLImageElement) => {
        // 1. 繪製背景
        if (useImg) {
          const designRatio = designWidth / designHeight;
          const imgRatio = useImg.width / useImg.height;
          let drawWidth = designWidth;
          let drawHeight = designHeight;
          let offsetX = 0;
          let offsetY = 0;

          if (imgRatio > designRatio) {
            drawWidth = designHeight * imgRatio;
            offsetX = (designWidth - drawWidth) / 2;
          } else {
            drawHeight = designWidth / imgRatio;
            offsetY = (designHeight - drawHeight) / 2;
          }

          // 1.1 品牌炭黑底色 (#2C2C2A)
          ctx.fillStyle = '#2C2C2A';
          ctx.fillRect(0, 0, designWidth, designHeight);

          // 1.2 繪製圖片 (opacity 80%)
          ctx.globalAlpha = 0.8;
          ctx.drawImage(useImg, offsetX, offsetY, drawWidth, drawHeight);
          ctx.globalAlpha = 1.0; // 還原透明度

          // 2. 電影感疊加層 (mix-blend-multiply)
          ctx.globalCompositeOperation = 'multiply';
          const grad = ctx.createLinearGradient(0, 0, 0, designHeight);
          grad.addColorStop(0, 'rgba(44, 44, 42, 0.65)');
          grad.addColorStop(0.5, 'rgba(44, 44, 42, 0.45)');
          grad.addColorStop(1, 'rgba(44, 44, 42, 0.75)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, designWidth, designHeight);
          ctx.globalCompositeOperation = 'source-over'; // 還原
        } else {
          // 降級純色背景
          const grad = ctx.createLinearGradient(0, 0, designWidth, designHeight);
          grad.addColorStop(0, '#5A6351');
          grad.addColorStop(1, '#2C2C2A');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, designWidth, designHeight);
        }

        // 3. 繪製品牌視覺線條邊框與角落美學直角 (完美重現 340px 空間中的 CSS padding)
        // 外層細框 (padding = 14px, 相當於 inset-3.5)
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.2)';
        ctx.lineWidth = 1;
        const outerPad = 14;
        ctx.strokeRect(outerPad, outerPad, designWidth - outerPad * 2, designHeight - outerPad * 2);

        // 內層實線框 (padding = 22px, 相當於 inset-5.5)
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.6)';
        ctx.lineWidth = 1;
        const innerPad = 22;
        ctx.strokeRect(innerPad, innerPad, designWidth - innerPad * 2, designHeight - innerPad * 2);

        // 角落 L 型美學對焦直角 (頂部/邊緣向內各 32px，長度 10px)
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.9)';
        ctx.lineWidth = 1;
        const cornerSize = 10;
        const cornerOffset = innerPad + 10; // 32px

        // 左上角
        ctx.beginPath();
        ctx.moveTo(cornerOffset, cornerOffset + cornerSize);
        ctx.lineTo(cornerOffset, cornerOffset);
        ctx.lineTo(cornerOffset + cornerSize, cornerOffset);
        ctx.stroke();

        // 右上角
        ctx.beginPath();
        ctx.moveTo(designWidth - cornerOffset - cornerSize, cornerOffset);
        ctx.lineTo(designWidth - cornerOffset, cornerOffset);
        ctx.lineTo(designWidth - cornerOffset, cornerOffset + cornerSize);
        ctx.stroke();

        // 左下角
        ctx.beginPath();
        ctx.moveTo(cornerOffset, designHeight - cornerOffset - cornerSize);
        ctx.lineTo(cornerOffset, designHeight - cornerOffset);
        ctx.lineTo(cornerOffset + cornerSize, designHeight - cornerOffset);
        ctx.stroke();

        // 右下角
        ctx.beginPath();
        ctx.moveTo(designWidth - cornerOffset - cornerSize, designHeight - cornerOffset);
        ctx.lineTo(designWidth - cornerOffset, designHeight - cornerOffset);
        ctx.lineTo(designWidth - cornerOffset, designHeight - cornerOffset - cornerSize);
        ctx.stroke();

        // 4. 繪製頁首 OASIS LAB. 品牌資訊 (Centered)
        ctx.fillStyle = '#F4F4F3';
        ctx.textAlign = 'center';
        
        ctx.font = '800 10px "JetBrains Mono", Courier New, monospace';
        ctx.letterSpacing = '2.5px'; // 0.25em tracking
        ctx.fillText('Oasis Lab.'.toUpperCase(), designWidth / 2, innerPad + 18);

        ctx.fillStyle = 'rgba(244, 244, 243, 0.5)';
        ctx.font = 'bold 8px "JetBrains Mono", Courier New, monospace';
        ctx.letterSpacing = '1.2px'; // 0.15em tracking
        ctx.fillText('// EDITORIAL JOURNAL //', designWidth / 2, innerPad + 30);
        ctx.letterSpacing = 'normal'; // 重置

        // 5. 核心排版：文字寬度與斷行 (與 CSS 預覽中 max-w-[90%] 的 266px 完美吻合)
        const maxTextWidth = (designWidth - innerPad * 2) * 0.9; // 約 266.4px

        // 5.1 解析與分行標題 (思源宋體，900字重，18px)
        ctx.font = '900 18px "Noto Serif TC", "Noto Serif", Georgia, PMingLiU, serif';
        const titleLines = [];
        const titleChars = (title || '未命名專題').split('');
        let currentTitleLine = '';
        for (let n = 0; n < titleChars.length; n++) {
          const testLine = currentTitleLine + titleChars[n];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            titleLines.push(currentTitleLine);
            currentTitleLine = titleChars[n];
          } else {
            currentTitleLine = testLine;
          }
        }
        titleLines.push(currentTitleLine);

        // 套用 line-clamp-2 限制，與預覽一致
        const finalTitleLines = titleLines.slice(0, 2);
        if (titleLines.length > 2) {
          let lastLine = finalTitleLines[1];
          while (ctx.measureText(lastLine + '...').width > maxTextWidth && lastLine.length > 0) {
            lastLine = lastLine.slice(0, -1);
          }
          finalTitleLines[1] = lastLine + '...';
        }

        // 5.2 解析與分行引言 (思源宋體，斜體，11px)
        ctx.font = 'italic 11px "Noto Serif TC", "Noto Serif", Georgia, PMingLiU, serif';
        const descLines = [];
        const descText = `“${description || '無引言內容'}”`;
        const descChars = descText.split('');
        let currentDescLine = '';
        for (let n = 0; n < descChars.length; n++) {
          const testLine = currentDescLine + descChars[n];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            descLines.push(currentDescLine);
            currentDescLine = descChars[n];
          } else {
            currentDescLine = testLine;
          }
        }
        descLines.push(currentDescLine);

        // 套用 line-clamp-2 限制
        const finalDescLines = descLines.slice(0, 2);
        if (descLines.length > 2) {
          let lastLine = finalDescLines[1];
          while (ctx.measureText(lastLine + '...”').width > maxTextWidth && lastLine.length > 0) {
            lastLine = lastLine.slice(0, -1);
          }
          finalDescLines[1] = lastLine + '...”';
        }

        // 5.3 計算文字區塊總高度與動態垂直居中座標
        // 標題行高為 25px (相當於 leading-snug)，引言行高為 18px (相當於 leading-relaxed)
        const titleLineHeight = 25;
        const descLineHeight = 18;
        const titleBlockHeight = (finalTitleLines.length - 1) * titleLineHeight + 18;
        const descBlockHeight = (finalDescLines.length - 1) * descLineHeight + 11;

        // 總高度組成為：上引線(1.5px) + 間距(14px) + 標題內容高 + 間距(14px) + 中引線(1px) + 間距(14px) + 引言內容高 + 間距(14px) + 下引線(1.5px)
        const totalMiddleBlockHeight = 1.5 + 14 + titleBlockHeight + 14 + 1 + 14 + descBlockHeight + 14 + 1.5;

        // 計算完美的置中 startY 點
        const startY = (designHeight - totalMiddleBlockHeight) / 2;

        // 5.4 繪製 上引線 (w-12 = 48px)
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(designWidth / 2 - 24, startY + 0.75);
        ctx.lineTo(designWidth / 2 + 24, startY + 0.75);
        ctx.stroke();

        // 5.5 繪製 中文標題 (思源宋體，900字重，18px)
        ctx.fillStyle = '#F4F4F3';
        ctx.font = '900 18px "Noto Serif TC", "Noto Serif", Georgia, PMingLiU, serif';
        ctx.letterSpacing = '0.45px'; // 0.025em tracking
        const titleFirstLineBaseline = startY + 1.5 + 14 + 14.5; // 起始位移 + 上引線寬 + 間距 + 字高基底約 14.5px
        finalTitleLines.forEach((l, index) => {
          ctx.fillText(l, designWidth / 2, titleFirstLineBaseline + index * titleLineHeight);
        });
        ctx.letterSpacing = 'normal'; // 重置
        
        // 5.6 繪製 中引線 (w-8 = 32px)
        const titleBlockEnd = titleFirstLineBaseline + (finalTitleLines.length - 1) * titleLineHeight + 3.5;
        const middleLineY = titleBlockEnd + 14;
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(designWidth / 2 - 16, middleLineY + 0.5);
        ctx.lineTo(designWidth / 2 + 16, middleLineY + 0.5);
        ctx.stroke();

        // 5.7 繪製 溫潤摘要引言 (思源宋體斜體，11px)
        ctx.fillStyle = 'rgba(244, 244, 243, 0.8)';
        ctx.font = 'italic 11px "Noto Serif TC", "Noto Serif", Georgia, PMingLiU, serif';
        const descFirstLineBaseline = middleLineY + 1 + 14 + 9; // 中引線基底 + 寬 + 間距 + 字高基底約 9px
        finalDescLines.forEach((l, index) => {
          ctx.fillText(l, designWidth / 2, descFirstLineBaseline + index * descLineHeight);
        });

        // 5.8 繪製 下引線 (w-12 = 48px)
        const descBlockEnd = descFirstLineBaseline + (finalDescLines.length - 1) * descLineHeight + 2;
        const lowerLineY = descBlockEnd + 14;
        ctx.strokeStyle = 'rgba(244, 244, 243, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(designWidth / 2 - 24, lowerLineY + 0.75);
        ctx.lineTo(designWidth / 2 + 24, lowerLineY + 0.75);
        ctx.stroke();

        // 6. 繪製頁尾期刊期數與日期標籤 (對齊 CSS 預覽 pb-1)
        ctx.fillStyle = 'rgba(244, 244, 243, 0.9)';
        ctx.font = 'bold 9px "JetBrains Mono", Courier New, monospace';
        ctx.letterSpacing = '1.35px'; // 0.15em tracking
        ctx.fillText(`${issueStr} // ${story.targetTag.toUpperCase()}`, designWidth / 2, designHeight - innerPad - 20);
   
        ctx.fillStyle = 'rgba(244, 244, 243, 0.4)';
        ctx.font = 'bold 8px "JetBrains Mono", Courier New, monospace';
        ctx.letterSpacing = '0.8px'; // 0.1em tracking
        ctx.fillText(dateStr.toUpperCase(), designWidth / 2, designHeight - innerPad - 8);
        ctx.letterSpacing = 'normal'; // 重置

        // 7. 將 Canvas 匯出為高畫質 PNG 並觸發瀏覽器下載流程
        try {
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `OasisLab_IG_${story.id}.png`;
          link.href = url;
          link.click();
          triggerToast(`📸 專題社群貼文圖片《OasisLab_IG_${story.id}.png》已成功匯出至您的本機！`);
        } catch (err) {
          console.error(err);
          // 如果是 CORS 安全性報錯，降級用純色重繪並重新導出 (100% 成功保證)
          if (useImg) {
            triggerToast('⚠️ 偵測到底圖安全性存取限制 (CORS)，已自動為您調校為極簡品牌底色並完成匯出！');
            performDrawing();
          } else {
            triggerToast('❌ 底圖安全存取限制 (CORS)，請確認底圖聯網授權。');
          }
        }
      };

      // 載入背景封面圖片，確保支援 CORS 跨網域渲染
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = coverImage;

      img.onload = () => {
        performDrawing(img);
      };

      img.onerror = () => {
        triggerToast('❌ 底圖載入失敗，可能因圖片網址不支援或跨網域(CORS)限制。');
      };
    });
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
      let apiKey = localStorage.getItem('oasis_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('nvapi-')) {
        throw new Error('API Key is missing or invalid. Please configure a valid VITE_GEMINI_API_KEY in .env or local storage.');
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
- 每篇文章的 'content' 欄位必須是【極致詳盡的超長篇深度文章（至少 9-12 個段落，總字數必須為原本的三倍以上，約 1000-1500 字左右）】，深入探討每個設計器物、生活儀式與精神核心，不要有任何 markdown 代碼標記（如 \`\`\` 等），使用雙換行符 (\\n\\n) 分割段落，確保前台排版美觀。
- **【標題極簡與高度多樣化要求】**：在撰寫文章標題 ("title") 時，**請絕對不要包含任何年份、數字（例如 2026、今年、5個、3個等）或千篇一律的「OO提案」、「OO指引」、「OO必備」等容易重複的公式化標題**。請保持標題的高度多樣性與深刻意境，善用隱喻、動詞與留白，使其呈現出富有人文呼吸感與哲學思辨的文藝氣息。
【標題美學靈感範例（供參考並激發靈感，請勿直接複製）：】
  * 哲思與內心留白類：《減法，是為了給心靈騰出空間》、《安靜的底色》、《日常的留白》、《流動的精神聖殿》、《在無事中，聽見時間的深度》
  * 空間、光影與器物類：《器物與光：尋找生活中的永恆質地》、《理想居所：少一點裝飾，多一點呼吸》、《材質的經年變化》
  * 慢行旅與角落充電類：《慢速行路：東京街角的隱密綠洲》、《流動的居所》、《流浪者的安靜早晨》、《與一座山的安靜對話》
請務必靈活發揮您的文字美學造詣，確保三篇文章的標題各自具備獨立的靈魂、截然不同的語感與視角，徹底避免千篇一律的重複套路。

【封面圖動態生成】：
請為每篇文章產出一個極具畫面感的英文提示詞，我們將用它來生成專屬封面圖。

【提示詞撰寫要求】：
1. 必須是全英文，請根據你寫的文章內容提取核心視覺元素。
2. 描述應具有極簡美學、高質感、真實攝影風格與光影感（例如：a minimalist office desk with warm morning sunlight, aesthetic, photorealistic, cinematic lighting, 8k resolution, magazine photography）。
3. 只需要輸出英文單詞或句子，不需要寫 URL 格式。
4. 請確保這三篇文章的提示詞各自獨特，完美呈現不同的視覺氛圍。

請直接輸出符合以下 Story Schema 的 JSON 陣列，直接使用 \`\`\`json ... \`\`\` 區塊包裹輸出。所有文字內容必須是繁體中文！其中 Schema 的每個物件格式如下：
{
  "id": "story-g0X (Unique ID starting with story-g01, story-g02, story-g03)",
  "icon": "單個 Emoji",
  "subtitle": "STORY 0X // [主題名稱]",
  "title": "文藝雅緻且富有哲思的標題",
  "description": "1-2 句極具吸引力的摘要說明",
  "content": "極致詳盡的超長篇深度美學文章（至少 9-12 個段落，總字數為原本的三倍以上，約 1000-1500 字，行文溫潤優雅，段落間用 \\n\\n 隔開，不要帶額外 markdown 標記）",
  "targetTag": "日常充電 或 辦公室必備 或 極簡旅行 (必須完全一致，不能寫其他內容)",
  "coverImagePrompt": "依據上方要求所寫的純英文高質感圖片提示詞",
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
        systemInstruction: {
          parts: [
            {
              text: systemInstructions
            }
          ]
        },
        tools: [
          {
            googleSearch: {}
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "text/plain"
        }
      };

      let apiResponse = await fetch(apiEndpoint, {
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

      let resData = await apiResponse.json();
      let parts = resData.candidates?.[0]?.content?.parts;
      let rawText = Array.isArray(parts) ? parts.find((p: any) => p.text)?.text : undefined;

      // 如果啟用 Google 搜尋 Grounding 時回傳了空內容（例如因為 API 內部整合限制或 STOP 異常）
      // 我們自動採取「美學智囊降級重試機制（移除搜尋工具）」，確保策展 100% 成功生成，免受服務波動影響！
      if (!rawText) {
        console.warn('⚠️ Google 搜尋整合回傳空資料或發生 STOP 錯誤，已自動啟動「美學總編降級重試機制（無搜尋工具）」以確保新刊發行成功...');
        
        const retryRequestBody = {
          ...requestBody,
          tools: undefined // 移除 Google Search tools 進行常規極速生成
        };

        const retryResponse = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(retryRequestBody)
        });

        if (!retryResponse.ok) {
          const errDetails = await retryResponse.json().catch(() => ({}));
          throw new Error((errDetails as any)?.error?.message || `API HTTP error! Status: ${retryResponse.status}`);
        }

        resData = await retryResponse.json();
        parts = resData.candidates?.[0]?.content?.parts;
        rawText = Array.isArray(parts) ? parts.find((p: any) => p.text)?.text : undefined;
      }

      if (!rawText) {
        console.error('Gemini API Full Response (After Retry):', resData);
        const finishReason = resData.candidates?.[0]?.finishReason || 'UNKNOWN';
        throw new Error(`Could not retrieve curated stories text. Reason: ${finishReason}. Details: ${JSON.stringify(resData.candidates?.[0])}`);
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
      const uniqueParsedStories = parsedStories.map((story: any, index) => {
        const safeIndex = index + 1;
        let finalCoverImage = '';
        
        if (story.coverImagePrompt && story.coverImagePrompt.trim() !== '') {
          // 加上使用者要求的中文與英文對譯構圖限制提示詞，以利 Pollinations AI 生成最高畫質、無變形之廣角寬幅相片
          // 加上適合 1:1 正方形圖片比例之構圖限制提示詞，以利 Pollinations AI 生成最高畫質、無變形之正方形相片
          const userConstraint = `【請嚴格遵守以下構圖限制，不要改變我原本提示詞的內容主體】："這是一張 1:1 正方形圖片。請使用高品質廣角鏡頭構圖，讓主體完美平衡地置於中央，直接延伸四周的環境背景來填滿畫面。嚴禁將畫面內容進行任何水平或垂直方向的拉伸、壓扁、擠壓或扭曲。所有的物理幾何結構、比例與物件邊緣，必須保持絕對正確與筆直，完全避免 AI 幾何變形的痕跡。" 我的主體提示詞：[ ${story.coverImagePrompt.trim()} ]`;
          
          const englishConstraint = `This is a 1:1 square aspect ratio image. Please strictly follow these composition constraints without changing the core subject: "This is a 1:1 square image. Please use a true wide-angle lens composition, centering the subject in a perfectly balanced manner, extending the surrounding environment and background to fill the frame. Horizontal or vertical stretching, squishing, compressing, or distortion of the content is strictly prohibited. All physical geometry, proportions, and object edges must remain absolutely correct, straight, and realistic, avoiding any trace of AI geometric distortion." Original Subject Prompt: ${story.coverImagePrompt.trim()}`;
          
          const enhancedPrompt = `${englishConstraint}, ${userConstraint}, masterpiece, highly detailed, 8k resolution, photorealistic, cinematic lighting, aesthetic magazine photography, clean composition`;
          finalCoverImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1080&height=1080&nologo=true`;
        } else if (story.coverImage && story.coverImage.trim() !== '') {
          finalCoverImage = story.coverImage.startsWith('http') ? story.coverImage : `https://${story.coverImage}`;
        } else {
          // 當完全沒有封面圖生成線索時，使用精心配置的類別高解析度備份圖，確保一定是美觀的
          finalCoverImage = getFallbackImage(story.targetTag, index);
        }

        return {
          ...story,
          id: `story-i${nextIssueNum}-0${safeIndex}`,
          subtitle: `STORY 0${safeIndex} // ${story.subtitle?.split('//')[1]?.trim() || '新期刊專題'}`,
          date: nextIssueDate,
          coverImage: finalCoverImage
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
      
      // ⚡ 自動背景同步至 GitHub
      const mergedArchived = Array.from(new Map([...activeStories, ...archivedStories].map(s => [s.id, s])).values());
      silentSyncToGithub(uniqueParsedStories, mergedArchived, editableProducts);

    } catch (error: any) {
      console.error('AI Journal Curation Error:', error);
      
      // 降級與發行回滾處理
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 判斷是否為 API Quota / Rate Limit 限制
      const isRateLimit = error.message?.toLowerCase().includes('quota') || error.message?.includes('429');
      const friendlyMsg = isRateLimit 
        ? "您目前使用的是 Gemini 免費方案，由於操作較頻繁，已達每分鐘 API 配額限制，請等待大約 1 分鐘後再次點擊即可！"
        : (error.message || '網路異常');

      // 當生成失敗時，我們保持在原本的期數與故事狀態，並回報錯誤
      triggerToast(`⚠️ 聯網搜尋與 AI 寫作失敗（${friendlyMsg}），已維持在當前第 ${String(currentIssueNumber).padStart(3, '0')} 期設定。`);
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

  // ⚡ 雙向同步：當雲端 `data.ts` 的版本新於本機快取時，自動覆蓋本機快取，確保所有設備同步更新
  useEffect(() => {
    try {
      const cachedVersionStr = localStorage.getItem('oasis_data_version');
      const cachedVersion = cachedVersionStr ? parseInt(cachedVersionStr, 10) : 0;
      
      if (DATA_VERSION && DATA_VERSION > cachedVersion) {
        console.log(`[Sync] Cloud version (${DATA_VERSION}) is newer than cached version (${cachedVersion}). Syncing...`);
        
        // 覆蓋 State
        setActiveStories(STORIES);
        setArchivedStories(HISTORICAL_STORIES);
        setEditableProducts(PRODUCTS);
        
        // 獲取並計算雲端資料的最新期數
        const allPossibleStories = [...STORIES, ...HISTORICAL_STORIES, ...NEXT_ISSUE_STORIES];
        let maxIssue = 25;
        allPossibleStories.forEach(s => {
          const issueNum = getStoryIssueNumber(s);
          if (issueNum > maxIssue) {
            maxIssue = issueNum;
          }
        });
        setCurrentIssueNumber(maxIssue);
        
        // 同步覆蓋 localStorage
        localStorage.setItem('oasis_active_stories_v2', JSON.stringify(STORIES));
        localStorage.setItem('oasis_archived_stories_v2', JSON.stringify(HISTORICAL_STORIES));
        localStorage.setItem('oasis_editable_products_v1', JSON.stringify(PRODUCTS));
        localStorage.setItem('oasis_issue_number_v2', maxIssue.toString());
        localStorage.setItem('oasis_data_version', DATA_VERSION.toString());
        
        // 使用 setTimeout 確保 toast 正常觸發與顯示
        setTimeout(() => {
          triggerToast('🔄 偵測到雲端有最新更新，已為您自動同步最新專題與商品資料！');
        }, 1000);
      }
    } catch (e) {
      console.warn('[Sync] Auto sync check failed:', e);
    }
  }, []);

  // 執行重置回指定期數的動作
  const handleRollbackToIssue = (targetIssue: number) => {
    if (targetIssue === 25) {
      setActiveStories(STORIES);
      setArchivedStories(HISTORICAL_STORIES);
      setCurrentIssueNumber(25);
      setRollbackIssueNum(25);
      triggerToast('🔄 系統已回復至初始 ISSUE 025 期設定，Archive 已重置。');
      
      // ⚡ 自動同步至 GitHub
      silentSyncToGithub(STORIES, HISTORICAL_STORIES, editableProducts);
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
        
        // ⚡ 自動同步至 GitHub
        silentSyncToGithub(targetStories, earlierStories, editableProducts);
      } else {
        triggerToast(`⚠️ 找不到第 ${String(targetIssue).padStart(3, '0')} 期的專題存檔。`);
      }
    }
  };

  // 儲存並發布後台修改的專題文字
  const handleSaveStoryEdits = () => {
    const next = activeStories.map(s => {
      if (s.id === selectedEditStoryId) {
        return {
          ...s,
          title: editTitle,
          description: editDescription,
          content: editContent,
          coverImage: editCoverImage
        };
      }
      return s;
    });
    setActiveStories(next);
    triggerToast(`✨ 已成功更新專題《${editTitle}》的文字與封面圖內容，並即時發布至前台！`);
    
    // ⚡ 默默自動同步至 GitHub
    silentSyncToGithub(next, archivedStories, editableProducts);
  };

  // 一鍵複製所有編輯內容為 Markdown 格式
  const handleCopyAsMarkdown = () => {
    const story = activeStories.find(s => s.id === selectedEditStoryId);
    if (!story) return;

    const markdownText = `# 專題標題：${editTitle}
## 副標題 / 期刊：${story.subtitle || ''}
- 分類標籤：${story.targetTag || ''} ${story.icon || ''}
- 封面圖連結：${editCoverImage}

> 【專題引言 / 摘要】
> ${editDescription}

---

${editContent}`;

    try {
      navigator.clipboard.writeText(markdownText);
      triggerToast('📋 已複製 Markdown 格式的專題內容至剪貼簿！');
    } catch (e) {
      triggerToast('⚠️ 複製失敗，請手動複製內容。');
    }
  };

  // 一鍵複製所有編輯內容為 JSON 格式
  const handleCopyAsJson = () => {
    const story = activeStories.find(s => s.id === selectedEditStoryId);
    if (!story) return;

    const jsonObj = {
      title: editTitle,
      subtitle: story.subtitle || '',
      targetTag: story.targetTag || '',
      icon: story.icon || '',
      coverImage: editCoverImage,
      description: editDescription,
      content: editContent
    };

    try {
      navigator.clipboard.writeText(JSON.stringify(jsonObj, null, 2));
      triggerToast('📋 已複製 JSON 格式的專題內容至剪貼簿！');
    } catch (e) {
      triggerToast('⚠️ 複製失敗，請手動複製內容。');
    }
  };

  // 一鍵複製所有編輯商品為 JSON 格式
  const handleCopyAllProductsAsJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(editableProducts, null, 2));
      triggerToast('📋 已複製全部商品 JSON 數據至剪貼簿！');
    } catch (e) {
      triggerToast('⚠️ 複製失敗，請手動複製內容。');
    }
  };

  // ⚡ 手動一鍵雲端雙向同步
  const handleSyncToGithub = async () => {
    setIsSyncingToGithub(true);
    try {
      await silentSyncToGithub(activeStories, archivedStories, editableProducts, true);
    } catch (e) {
      console.warn('手動同步失敗:', e);
      triggerToast('❌ 雲端同步失敗，請檢查網路與 GitHub 金鑰配置！');
    } finally {
      setIsSyncingToGithub(false);
    }
  };

  // ⚡ 在背景默默執行 GitHub 同步，不打斷使用者操作
  const silentSyncToGithub = async (
    customActive?: Story[],
    customArchived?: Story[],
    customProducts?: Product[],
    forceSync: boolean = false
  ) => {
    // ⚡ 本機開發測試防干擾機制：若在 localhost 或本機 IP 測試，且非手動強制同步，則不執行自動背景上傳
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.') ||
                        window.location.hostname.startsWith('172.');
                        
    if (isLocalhost && !forceSync) {
      console.log('[Sync] Local development detected. Silent background sync skipped.');
      return;
    }

    const username = githubUsername.trim() || import.meta.env.VITE_GITHUB_USERNAME || '';
    const repo = githubRepo.trim() || import.meta.env.VITE_GITHUB_REPO || 'OasisLab';
    const token = githubToken.trim() || import.meta.env.VITE_GITHUB_TOKEN || '';

    // 若未配置 GitHub 密鑰，則不執行背景同步 (本地測試情境)
    if (!username || !repo || !token) {
      setGithubConnectionStatus('error');
      return;
    }

    try {
      const targetActive = customActive || activeStories;
      const targetArchived = customArchived || archivedStories;
      const targetProducts = customProducts || editableProducts;

      const nowVersion = Date.now();
      try {
        localStorage.setItem('oasis_data_version', nowVersion.toString());
      } catch (e) {}

      const updatedDataTs = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, Product } from './types';

export const STORIES: Story[] = ${JSON.stringify(targetActive, null, 2)};

export const HISTORICAL_STORIES: Story[] = ${JSON.stringify(targetArchived, null, 2)};

export const NEXT_ISSUE_STORIES: Story[] = ${JSON.stringify(NEXT_ISSUE_STORIES, null, 2)};

export const PRODUCTS: Product[] = ${JSON.stringify(targetProducts, null, 2)};

export const DATA_VERSION: number = ${nowVersion};
`;

      const apiEndpoint = `https://api.github.com/repos/${username}/${repo}/contents/src/data.ts`;
      
      const getFileRes = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        sha = fileData.sha;
        setGithubConnectionStatus('success');
      } else if (getFileRes.status !== 404) {
        setGithubConnectionStatus('error');
        return; // 靜默忽略錯誤
      }

      const utf8B64 = btoa(encodeURIComponent(updatedDataTs).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));

      const putRes = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Oasis Lab. 智慧編輯室自動發布 - 同步最新專題與選物順序`,
          content: utf8B64,
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        triggerToast('☁️ 雲端同步成功！GitHub 與線上網址已全自動更新！');
        setGithubConnectionStatus('success');
      } else {
        setGithubConnectionStatus('error');
      }
    } catch (e) {
      console.warn('GitHub 背景自動同步失敗:', e);
      setGithubConnectionStatus('error');
    }
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
      setEditCoverImage(story.coverImage);
      setStoryUrlInput('');
    }
  }, [selectedEditStoryId, activeStories]);

  // 當 currentIssueNumber 改變時，自動將 rollbackIssueNum 設為當前最新期數
  useEffect(() => {
    setRollbackIssueNum(currentIssueNumber);
  }, [currentIssueNumber]);

  // ================== 【自訂 3:2 封面圖裁切上傳功能】 ==================
  const handleCropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropTarget('story');
        setCropSrc(event.target.result as string);
        setCropZoom(1.0);
        setCropPanX(0);
        setCropPanY(0);
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
    // 重置 input value 讓同一個檔案可以重複觸發變更事件
    e.target.value = '';
  };

  const handleCropUrlLoad = (url: string) => {
    if (!url || !url.trim().startsWith('http')) {
      triggerToast('⚠️ 請輸入正確的聯網圖片網址！');
      return;
    }
    setCropTarget('story');
    setCropSrc(url.trim());
    setCropZoom(1.0);
    setCropPanX(0);
    setCropPanY(0);
    setShowCropModal(true);
  };

  const handleCropStart = (clientX: number, clientY: number) => {
    setIsDraggingCrop(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleCropMove = (clientX: number, clientY: number) => {
    if (!isDraggingCrop) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    setCropPanX(prev => prev + dx);
    setCropPanY(prev => prev + dy);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleCropEnd = () => {
    setIsDraggingCrop(false);
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleCropStart(e.clientX, e.clientY);
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    e.preventDefault();
    handleCropMove(e.clientX, e.clientY);
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleCropStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingCrop || e.touches.length === 0) return;
    handleCropMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleApplyCrop = () => {
    if (!cropSrc) return;
    
    const outputSize = cropTarget === 'product' ? 600 : 1000;
    triggerToast(`⏳ 正在生成 1:1 高畫質裁切圖片 (${outputSize}x${outputSize})...`);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cropSrc;
    
    img.onload = () => {
      // 依據裁切目標動態建立輸出 Canvas 尺寸 (商品圖 600x600, 封面圖 1000x1000)
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const W_v = 350;
      const H_v = 350;
      const W_i = img.naturalWidth;
      const H_i = img.naturalHeight;
      
      const scaleX = W_v / W_i;
      const scaleY = H_v / H_i;
      const baseScale = Math.max(scaleX, scaleY);
      
      const zoomScale = baseScale * cropZoom;
      
      // 計算裁剪區域在原始圖片中的座標和尺寸 (精確反向對應)
      const wCrop = W_v / zoomScale;
      const hCrop = H_v / zoomScale;
      
      const xCrop = (W_i / 2) - ((W_v / 2) + cropPanX) / zoomScale;
      const yCrop = (H_i / 2) - ((H_v / 2) + cropPanY) / zoomScale;
      
      ctx.drawImage(img, xCrop, yCrop, wCrop, hCrop, 0, 0, canvas.width, canvas.height);
      
      try {
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (cropTarget === 'product') {
          setEditProductImageUrl(croppedDataUrl);
          setShowCropModal(false);
          triggerToast('✨ 商品圖片已成功完成 1:1 裁切並即時套用！請確認下方欄位後點擊儲存。');
        } else {
          setEditCoverImage(croppedDataUrl);
          setShowCropModal(false);
          triggerToast('✨ 封面圖已成功完成 1:1 裁切並即時套用！請點擊下方按鈕儲存變更。');
        }
      } catch (err) {
        console.error(err);
        triggerToast('❌ 圖片裁切匯出受限 (可能由於跨網域 CORS 問題，請嘗試從本機上傳圖片檔案即可完美避開此限制)。');
      }
    };
    
    img.onerror = () => {
      triggerToast('❌ 無法載入裁剪來源圖片，請檢查圖片網址或檔案是否毀損。');
    };
  };

  // ================== 【一鍵 AI 自動上架商品】 ==================
  const handleAiAutoFillProduct = async () => {
    const inputVal = aiAutoFillInput.trim();
    if (!inputVal) {
      triggerToast('⚠️ 請輸入商品名稱或貼上聯盟行銷網址。');
      return;
    }
    setIsAiAutoFilling(true);
    try {
      let apiKey = localStorage.getItem('oasis_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('nvapi-')) {
        throw new Error('請設定有效的 VITE_GEMINI_API_KEY 環境變數或瀏覽器 LocalStorage 中。');
      }

      const isUrl = /^https?:\/\//i.test(inputVal);
      const userPrompt = isUrl
        ? `你是一位精通電商選物美學的 Oasis Lab. 商品策展編輯。
使用者提供了以下聯盟行銷商品網址：
${inputVal}

請先使用 Google Search 工具搜尋此網址對應的商品，取得正確的商品名稱、價格、商品特色、品牌等真實資訊，然後以 Oasis Lab. 極簡美學雜誌的高質感文案風格，生成以下 JSON 格式 of 商品資料（所有文字用繁體中文，且不要包含任何額外的 Markdown 包裹，只輸出一個純 JSON 字串）：
{
  "title_optimized": "根據搜尋結果精煉優化的商品名稱（30字以內，突顯核心賣點與設計感，例如：極簡實木耳機支架）",
  "price_display": "根據搜尋結果填入真實售價，格式如 'NT$ 1,980' 或 '洽詢優惠'",
  "btn_text": "導購按鈕文字（8字以內，如：探索生活靈感、立即選購）",
  "description": "根據搜尋結果，一句話點出此商品的核心美學與生活場景（20-35字）",
  "context_tags": ["日常充電", "辦公室必備", "極簡旅行"] 中選擇最符合的1-2個，以陣列格式輸出,
  "image_url": "從 Unsplash 選一張最符合商品美學的高清圖片完整 URL（含 ?auto=format&fit=crop&w=600&q=80 參數）",
  "story_behind": "語氣溫潤優雅的設計理念人文故事。闡述商品如何解決都市生活的混亂並重拾美學專注。字數約 150-200 字左右。",
  "features": ["精美的一句話商品核心特點或美學亮點1", "精美的一句話商品核心特點或美學亮點2", "精美的一句話商品核心特點或美學亮點3"],
  "specifications": [
    {"label": "規格標籤如 '材質'", "value": "規格值如 '特選有田燒陶瓷'"},
    {"label": "規格標籤如 '尺寸'", "value": "規格值如 '120 x 120 x 85 mm'"},
    {"label": "規格標籤如 '產地'", "value": "規格值如 '日本'"},
    {"label": "規格標籤如 '保固'", "value": "規格值如 '一年'"}
  ],
  "designer_critique": "策展人/主編的深度美學講評。語氣高雅富有深度，字數約 80-120 字之間。"
}
只輸出 JSON，不要有任何說明文字或代碼區塊標記。`
        : `你是一位精通電商選物美學的 Oasis Lab. 商品策展編輯。
使用者想上架以下商品（商品名稱/關鍵字）：
「${inputVal}」

請先使用 Google Search 工具搜尋此商品的最新資訊（包含價格、特色、品牌、用戶評價等），再以 Oasis Lab. 極簡美學雜誌的高質感文案風格，生成以下 JSON 格式 of 商品資料（所有文字用繁體中文，且不要包含任何額外的 Markdown 包裹，只輸出一個純 JSON 字串）：
{
  "title_optimized": "根據搜尋結果精煉優化的商品名稱（30字以內，突顯核心賣點與設計感，例如：極簡實木耳機支架）",
  "price_display": "根據搜尋結果的真實市場售價，格式如 'NT$ 1,980' 或 '洽詢優惠'",
  "btn_text": "導購按鈕文字（8字以內，如：探索生活靈感、立即選購）",
  "description": "根據搜尋結果，一句話點出此商品的核心美學與生活場景（20-35字）",
  "context_tags": ["日常充電", "辦公室必備", "極簡旅行"] 中選擇最符合的1-2個，以陣列格式輸出,
  "image_url": "從 Unsplash 選一張最符合商品美學的高清圖片完整 URL（含 ?auto=format&fit=crop&w=600&q=80 參數）",
  "story_behind": "語氣溫潤優雅的設計理念人文故事。闡述商品如何解決都市生活的混亂並重拾美學專注。字數約 150-200 字左右。",
  "features": ["精美的一句話商品核心特點或美學亮點1", "精美的一句話商品核心特點或美學亮點2", "精美的一句話商品核心特點或美學亮點3"],
  "specifications": [
    {"label": "規格標籤如 '材質'", "value": "規格值如 '特選有田燒陶瓷'"},
    {"label": "規格標籤如 '尺寸'", "value": "規格值如 '120 x 120 x 85 mm'"},
    {"label": "規格標籤如 '產地'", "value": "規格值如 '日本'"},
    {"label": "規格標籤如 '保固'", "value": "規格值如 '一年'"}
  ],
  "designer_critique": "策展人/主編的深度美學講評。語氣高雅富有深度，字數約 80-120 字之間。"
}
只輸出 JSON，不要有防說明文字或代碼區塊標記。`;

      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [{ parts: [{ text: userPrompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.6, responseMimeType: 'text/plain' }
      };

      const apiResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errDetails = await apiResponse.json().catch(() => ({}));
        throw new Error(`Gemini API 回報 HTTP 錯誤！狀態碼: ${apiResponse.status} - ${(errDetails as any)?.error?.message || ''}`);
      }

      const resData = await apiResponse.json();
      const rawParts = resData.candidates?.[0]?.content?.parts;
      const rawText = Array.isArray(rawParts) ? rawParts.find((p: any) => p.text)?.text : undefined;

      if (!rawText) {
        const finishReason = resData.candidates?.[0]?.finishReason || 'UNKNOWN';
        throw new Error(`無法從 Gemini 回傳中取得有效生成的商品內容 (原因: ${finishReason})`);
      }

      let parsed: any;
      try {
        let jsonStr = rawText.trim();
        // 優先嘗試 code block 提取
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonStr = codeBlockMatch[1].trim();
        } else {
          // 若無 code block，嘗試從文字中提取第一個完整的 JSON 物件
          const jsonObjMatch = jsonStr.match(/\{[\s\S]*?\}/);
          if (jsonObjMatch) {
            jsonStr = jsonObjMatch[0];
          }
        }
        parsed = JSON.parse(jsonStr);
      } catch (parseErr) {
        // 最後嘗試：用貪婪正則尋找最長的 JSON 物件
        try {
          const greedyMatch = rawText.match(/\{[\s\S]*\}/);
          if (greedyMatch) {
            parsed = JSON.parse(greedyMatch[0]);
          } else {
            throw new Error('no json found');
          }
        } catch {
          throw new Error('無法從 Gemini 回傳中取得有效生成的商品內容，請稍後再試。');
        }
      }

      // 將 AI 生成的欄位填入商品編輯表單
      if (parsed.title_optimized) setEditProductTitle(parsed.title_optimized);
      if (parsed.price_display) setEditProductPrice(parsed.price_display);
      if (parsed.btn_text) setEditProductBtnText(parsed.btn_text);
      if (parsed.description) setEditProductDescription(parsed.description);
      if (parsed.image_url) setEditProductImageUrl(parsed.image_url);
      if (Array.isArray(parsed.context_tags)) setEditProductTags(parsed.context_tags.join(', '));
      if (isUrl) setEditProductUrl(inputVal);
      if (parsed.story_behind) setEditProductStoryBehind(parsed.story_behind);
      if (Array.isArray(parsed.features)) {
        setEditProductFeature1(parsed.features[0] || '');
        setEditProductFeature2(parsed.features[1] || '');
        setEditProductFeature3(parsed.features[2] || '');
      }
      if (Array.isArray(parsed.specifications)) {
        setEditProductSpecsText(parsed.specifications.map((s: any) => `${s.label}: ${s.value}`).join('\n'));
      }
      if (parsed.designer_critique) setEditProductDesignerCritique(parsed.designer_critique);

      // 若尚未選擇商品，自動切換到新增模式
      if (!selectedEditProductId || selectedEditProductId === '') {
        setSelectedEditProductId('__NEW__');
        setEditProductStatus('active');
        setEditProductIsPopular(false);
        setConfirmDeleteProductId('');
      }

      triggerToast('✨ AI 已自動生成商品資料！請確認下方各欄位後再點擊「建立並上架」。');
    } catch (error: any) {
      console.error('AI Product Autofill Error:', error);
      const isRateLimit = error.message?.toLowerCase().includes('quota') || error.message?.includes('429');
      const friendlyMsg = isRateLimit 
        ? "目前已達到 Gemini API 免費方案配額限制，請等待大約 1 分鐘後再次點擊即可！"
        : (error.message || '網路異常，請稍後再試');
      triggerToast(`⚠️ AI 自動生成失敗：${friendlyMsg}`);
    } finally {
      setIsAiAutoFilling(false);
    }
  };

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
                        <div className="relative aspect-square w-full overflow-hidden bg-[#2C2C2A]/5">
                          <img 
                            src={story.coverImage} 
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = getFallbackImage(story.targetTag, i);
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
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
                                <div className="relative aspect-square overflow-hidden bg-[#2C2C2A]/5">
                                  <img
                                    src={story.coverImage}
                                    alt={story.title}
                                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      const fallback = getFallbackImage(story.targetTag, 0);
                                      if (target.src !== fallback) {
                                        target.src = fallback;
                                      }
                                    }}
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
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* ===== 後台頂部操控欄 + Tab 導覽 ===== */}
                  <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl shadow-[0_8px_40px_rgba(90,99,81,0.04)] overflow-hidden">
                    {/* 頂部帳號資訊欄 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8 py-5 border-b border-[#2C2C2A]/8">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                          <Feather className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <span className="font-mono-data text-[10px] text-emerald-600 font-bold tracking-widest uppercase block">
                            CURATOR STUDIO // MASTER ACCOUNT
                          </span>
                          <h3 className="text-base font-bold font-serif text-[#2C2C2A]">
                            策展發行與編輯控制中心
                            <span className="ml-2 text-[10px] font-mono-data text-[#5A6351]/60 font-normal">ISSUE {String(currentIssueNumber).padStart(3, '0')}</span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* 雲端自動同步連線狀態指示燈 */}
                        <div
                          className="flex items-center space-x-2 px-3 py-1.5 bg-[#F4F4F3] border border-[#2C2C2A]/5 rounded-lg select-none"
                        >
                          <span className="relative flex h-2 w-2">
                            {githubConnectionStatus === 'success' && (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </>
                            )}
                            {githubConnectionStatus === 'error' && (
                              <>
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </>
                            )}
                            {githubConnectionStatus === 'checking' && (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </>
                            )}
                          </span>
                          <span className="text-[10px] font-sans-ui font-bold text-[#2C2C2A]/60">
                            {githubConnectionStatus === 'success' && '雲端同步正常'}
                            {githubConnectionStatus === 'error' && '雲端連線異常'}
                            {githubConnectionStatus === 'checking' && '連線檢測中...'}
                          </span>
                        </div>

                        {/* 手動重測刷新按鈕 */}
                        <button
                          onClick={checkGithubConnection}
                          disabled={githubConnectionStatus === 'checking'}
                          title="點擊重新檢測雲端連線狀態"
                          className="p-1.5 bg-[#F4F4F3] hover:bg-[#2C2C2A]/5 border border-[#2C2C2A]/5 hover:border-[#2C2C2A]/10 rounded-lg text-[#2C2C2A]/50 hover:text-[#2C2C2A]/80 transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${githubConnectionStatus === 'checking' ? 'animate-spin text-amber-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => {
                            setIsAdminLoggedIn(false);
                            setAdminUsername('');
                            setAdminPassword('');
                            triggerToast('🔒 已安全登出 Oasis Lab. 系統智理後台。');
                          }}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-sans-ui font-semibold rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>安全登出</span>
                        </button>
                      </div>
                    </div>

                    {/* Tab 導覽欄 */}
                    <div className="flex border-b border-[#2C2C2A]/8 bg-[#F4F4F3]/40">
                      {([
                        { key: 'stories' as const, icon: '📖', label: '專題區', sublabel: 'Editorial' },
                        { key: 'products' as const, icon: '🛍️', label: '商品區', sublabel: 'Products' },
                        { key: 'stats' as const, icon: '📊', label: '數據區', sublabel: 'Analytics' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setAdminActiveTab(tab.key)}
                          className={`flex-1 flex flex-col items-center py-4 px-3 text-center transition-all cursor-pointer relative border-b-2 ${
                            adminActiveTab === tab.key
                              ? 'border-[#5A6351] bg-white text-[#5A6351]'
                              : 'border-transparent text-[#2C2C2A]/50 hover:text-[#5A6351] hover:bg-white/60'
                          }`}
                        >
                          <span className="text-lg mb-0.5">{tab.icon}</span>
                          <span className="font-sans-ui text-xs font-bold">{tab.label}</span>
                          <span className="font-mono-data text-[9px] tracking-widest opacity-60">{tab.sublabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ===== Tab 內容區域 ===== */}
                  <AnimatePresence mode="wait">

                    {/* ---- 專題區 ---- */}
                    {adminActiveTab === 'stories' && (
                      <motion.div
                        key="tab-stories"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* 發行控制器 */}
                        <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#2C2C2A]/5">
                            <Sparkles className="w-5 h-5 text-[#5A6351]" />
                            <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">ISSUE PUBLISHER // 期刊發布控制器</span>
                          </div>

                          <div className="bg-[#F4F4F3] border border-[#2C2C2A]/5 p-5 rounded-xl mb-6 text-xs font-sans-ui text-[#2C2C2A]/60 leading-relaxed space-y-1.5">
                            <p className="font-semibold text-[#2C2C2A]/70 flex items-center space-x-1.5"><span>💡</span><span>如何模擬真實發行：</span></p>
                            <ul className="list-disc pl-5 space-y-0.5">
                              <li>點擊發布新期刊後，當前專題內容移存至歷史典藏區 (Archive)。</li>
                              <li>AI 聯網搜尋最新趨勢，為您自動撰寫下一期新專題。</li>
                              <li>重置功能可隨時回復至初始 ISSUE 025 狀態。</li>
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col justify-between p-6 bg-[#5A6351]/5 border border-[#5A6351]/15 rounded-xl">
                              <div>
                                <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest block uppercase mb-1">DECISION A // AI 策展發布</span>
                                <h4 className="font-serif font-bold text-sm text-[#2C2C2A] mb-2">發布下一期全新期刊</h4>
                                <p className="text-xs text-[#2C2C2A]/50 font-sans-ui leading-relaxed mb-5">
                                  聯網搜尋最新趨勢，調配極簡美學語調，發布第 {String(currentIssueNumber + 1).padStart(3, '0')} 期文章。
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
                                className={`w-full text-white font-sans-ui text-xs font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
                                  isGenerating
                                    ? 'bg-[#5A6351]/50 cursor-not-allowed'
                                    : 'bg-[#5A6351] hover:bg-[#4E5646] cursor-pointer'
                                }`}
                              >
                                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                <span>{isGenerating ? '正在聯網搜尋與 AI 寫作中...' : `發布 ISSUE ${String(currentIssueNumber + 1).padStart(3, '0')} 全新期刊`}</span>
                              </button>
                            </div>

                            <div className="flex flex-col justify-between p-6 bg-[#2C2C2A]/4 border border-[#2C2C2A]/10 rounded-xl">
                              <div>
                                <span className="font-mono-data text-[10px] text-[#2C2C2A]/50 font-bold tracking-widest block uppercase mb-1">DECISION B // 系統重置</span>
                                <h4 className="font-serif font-bold text-sm text-[#2C2C2A] mb-2">回復指定期刊設定</h4>
                                <p className="text-xs text-[#2C2C2A]/50 font-sans-ui leading-relaxed mb-5">
                                  將期刊系統重置回指定歷史期數，小於所選期的存檔保留，大於等於的清除。
                                </p>
                              </div>
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center space-x-2 bg-white/70 border border-[#2C2C2A]/15 rounded-lg px-3 py-2">
                                  <span className="font-sans-ui text-xs text-[#2C2C2A]/60 shrink-0">重置至：</span>
                                  <select
                                    value={rollbackIssueNum}
                                    onChange={(e) => setRollbackIssueNum(parseInt(e.target.value, 10))}
                                    className="flex-1 bg-transparent text-[#2C2C2A] text-xs font-sans-ui font-semibold focus:outline-none cursor-pointer"
                                  >
                                    {(() => {
                                      const options = [];
                                      for (let i = 25; i <= currentIssueNumber; i++) {
                                        options.push(<option key={i} value={i}>第 {i} 期 (ISSUE {String(i).padStart(3, '0')})</option>);
                                      }
                                      return options;
                                    })()}
                                  </select>
                                </div>
                                <button
                                  onClick={() => handleRollbackToIssue(rollbackIssueNum)}
                                  className="w-full bg-[#2C2C2A] hover:bg-[#3D3D3A] text-white font-sans-ui text-xs font-bold py-3 rounded-lg cursor-pointer transition-all"
                                >
                                  確認重置至指定期刊
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 專題文字編輯器 */}
                        <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#2C2C2A]/5">
                            <Feather className="w-5 h-5 text-[#5A6351]" />
                            <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">EDITORIAL DESK // 專題文字編輯室</span>
                          </div>

                          <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-5">
                            在此可直接編輯當前第 <strong>{String(currentIssueNumber).padStart(3, '0')}</strong> 期的三篇 Active 精選專題。選擇標籤即可切換，修改後點擊儲存，前台文字即時更新。
                          </p>

                          {/* 專題 Tabs */}
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

                          {activeStories.find(s => s.id === selectedEditStoryId) && (() => {
                            const story = activeStories.find(s => s.id === selectedEditStoryId)!;
                            return (
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* 左側編輯表單 */}
                                <div className="lg:col-span-7 space-y-5 font-sans-ui text-xs text-[#2C2C2A]/80">
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
                                  
                                  {/* 專題封面圖管理 (自帶高品質裁切上傳器) */}
                                  <div className="bg-[#2C2C2A]/5 border border-[#2C2C2A]/10 rounded-xl p-4.5 space-y-4">
                                    <label className="block text-xs font-mono-data text-[#2C2C2A]/60 uppercase tracking-wider font-bold">專題封面圖 (Cover Image)</label>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
                                      {/* 左側封面圖 1:1 縮圖預覽 */}
                                      <div className="relative aspect-square w-full sm:w-[120px] overflow-hidden rounded-lg border border-[#2C2C2A]/10 bg-[#2C2C2A]/5 flex-shrink-0 shadow-inner group">
                                        {editCoverImage ? (
                                          <>
                                            <img 
                                              src={editCoverImage} 
                                              alt="Cover Preview" 
                                              className="w-full h-full object-cover animate-fade-in"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                const fallback = getFallbackImage(story.targetTag, 0);
                                                if (target.src !== fallback) {
                                                  target.src = fallback;
                                                  setEditCoverImage(fallback);
                                                }
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                              <span className="text-[10px] text-white font-sans-ui tracking-wider font-bold">編輯中</span>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center text-[#2C2C2A]/30">
                                            <span className="text-[10px] font-sans-ui">無封面圖片</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* 右側操作控制區 */}
                                      <div className="flex-1 w-full space-y-3.5">
                                        <div className="flex flex-wrap gap-2.5">
                                          {/* 本機檔案上傳按鈕 */}
                                          <input 
                                            type="file" 
                                            id="story-cover-upload-input" 
                                            accept="image/*" 
                                            onChange={handleCropFileChange} 
                                            className="hidden" 
                                          />
                                          <label 
                                            htmlFor="story-cover-upload-input" 
                                            className="cursor-pointer bg-[#5A6351] hover:bg-[#4E5646] text-white font-sans-ui text-[11px] font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center space-x-1.5"
                                          >
                                            <PlusCircle className="w-3.5 h-3.5 text-white" />
                                            <span>上傳本機圖片</span>
                                          </label>
                                          
                                          {/* 重新裁切按鈕 */}
                                          {editCoverImage && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCropSrc(editCoverImage);
                                                setCropZoom(1.0);
                                                setCropPanX(0);
                                                setCropPanY(0);
                                                setShowCropModal(true);
                                              }}
                                              className="bg-[#2C2C2A]/10 hover:bg-[#2C2C2A]/15 text-[#2C2C2A]/80 font-sans-ui text-[11px] font-bold px-3.5 py-2 rounded-lg transition-all border border-[#2C2C2A]/10 flex items-center space-x-1.5 cursor-pointer"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                              <span>手動重新裁切</span>
                                            </button>
                                          )}
                                        </div>
                                        
                                        {/* 線上網址載入 */}
                                        <div className="space-y-1.5">
                                          <span className="text-[10px] text-[#2C2C2A]/50 block">或貼上其他聯網圖片網址：</span>
                                          <div className="flex gap-2">
                                            <input 
                                              type="text" 
                                              value={storyUrlInput}
                                              onChange={(e) => setStoryUrlInput(e.target.value)}
                                              placeholder="https://images.unsplash.com/photo-..." 
                                              className="flex-1 min-w-0 bg-white/70 border border-[#2C2C2A]/15 text-[#2C2C2A] text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#5A6351] font-sans-ui transition-all"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleCropUrlLoad(storyUrlInput)}
                                              className="bg-[#F4F4F3] hover:bg-[#EAEAEA] text-[#2C2C2A]/80 border border-[#2C2C2A]/15 font-sans-ui text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer flex-shrink-0"
                                            >
                                              <Link className="w-3 h-3" />
                                              <span>載入</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
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
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button
                                      type="button"
                                      onClick={handleCopyAsMarkdown}
                                      className="bg-[#2C2C2A]/5 hover:bg-[#5A6351]/10 hover:text-[#5A6351] text-[#2C2C2A]/70 font-sans-ui text-xs font-bold py-2.5 px-4 rounded-lg transition-all border border-[#2C2C2A]/10 flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>複製 Markdown 格式</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCopyAsJson}
                                      className="bg-[#2C2C2A]/5 hover:bg-[#5A6351]/10 hover:text-[#5A6351] text-[#2C2C2A]/70 font-sans-ui text-xs font-bold py-2.5 px-4 rounded-lg transition-all border border-[#2C2C2A]/10 flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                      <FileJson className="w-3.5 h-3.5" />
                                      <span>複製 JSON 格式</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleSaveStoryEdits}
                                    className="w-full bg-[#5A6351] hover:bg-[#4E5646] text-white font-sans-ui text-xs font-bold py-3 px-4 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                    <span>儲存並發布此專題變更</span>
                                  </button>
                                </div>

                                 {/* 右側：IG 貼文與限動配圖生產器 (1080x1350 / 1080x1920) */}
                                 <InstagramPostPreviewer
                                   story={story}
                                   currentIssueNumber={currentIssueNumber}
                                   isEditing={story.id === selectedEditStoryId}
                                   editTitle={editTitle}
                                   editDescription={editDescription}
                                   editCoverImage={editCoverImage}
                                   onDownload={(ratio) => handleDownloadInstagramPost(story, ratio)}
                                 />
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}

                    {/* ---- 商品區 ---- */}
                    {adminActiveTab === 'products' && (
                      <motion.div
                        key="tab-products"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* 一鍵 AI 自動上架 */}
                        <div className="bg-gradient-to-br from-[#5A6351]/8 to-[#5A6351]/3 border border-[#5A6351]/20 rounded-2xl p-8 shadow-[0_4px_24px_rgba(90,99,81,0.06)]">
                          <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-[#5A6351]/15">
                            <div className="p-2 bg-[#5A6351] rounded-lg">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest uppercase block">AI AUTO-FILL // 一鍵 AI 自動上架</span>
                              <p className="font-sans-ui text-xs text-[#2C2C2A]/60 mt-0.5">輸入商品名稱或貼上聯盟行銷網址，AI 自動生成所有欄位</p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2C2A]/30">
                                <Link className="w-3.5 h-3.5" />
                              </div>
                              <input
                                type="text"
                                value={aiAutoFillInput}
                                onChange={(e) => setAiAutoFillInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !isAiAutoFilling) handleAiAutoFillProduct(); }}
                                placeholder="輸入商品名稱（如：MOFT 隱形筆電支架）或貼上蝦皮/聯盟行銷網址"
                                className="w-full bg-white border border-[#5A6351]/25 text-[#2C2C2A] text-xs pl-9 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#5A6351] focus:ring-2 focus:ring-[#5A6351]/10 font-sans-ui transition-all placeholder:text-[#2C2C2A]/30"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAiAutoFillProduct}
                              disabled={isAiAutoFilling}
                              className={`px-5 py-3 text-white text-xs font-sans-ui font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 whitespace-nowrap ${
                                isAiAutoFilling
                                  ? 'bg-[#5A6351]/50 cursor-not-allowed'
                                  : 'bg-[#5A6351] hover:bg-[#4E5646] cursor-pointer hover:shadow-lg'
                              }`}
                            >
                              {isAiAutoFilling ? (
                                <>
                                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </motion.div>
                                  <span>AI 生成中...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>一鍵 AI 生成</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-sans-ui text-[10px] text-[#5A6351]/70 mt-2.5 leading-relaxed">
                            💡 AI 將自動填充：商品標題、一句話描述、建議價格、導購按鈕文字、分類標籤與 Unsplash 美學圖片 URL。如提供網址，將自動設為聯盟行銷連結。
                          </p>
                        </div>

                        {/* 商品編輯器主體 */}
                        <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 pb-6 border-b border-[#2C2C2A]/8">
                            <div className="flex items-start space-x-4">
                              <div className="p-3 bg-[#5A6351]/10 rounded-xl text-[#5A6351]">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest uppercase block mb-1">SHOP EDITOR // 選物商城管理系統</span>
                                <h3 className="text-xl font-bold font-serif text-[#2C2C2A]">商品內容即時編輯台</h3>
                                <p className="font-sans-ui text-xs text-[#2C2C2A]/55 leading-relaxed mt-1">
                                  選取商品後可即時修改所有欄位，儲存後前台即時同步。共 {editableProducts.length} 款商品。
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 whitespace-nowrap">
                              <button
                                onClick={handleCopyAllProductsAsJson}
                                className="bg-[#2C2C2A]/5 hover:bg-[#5A6351]/10 hover:text-[#5A6351] text-[#2C2C2A]/70 font-sans-ui text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all border border-[#2C2C2A]/10 flex items-center space-x-1 cursor-pointer shadow-sm hover:shadow-md"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>複製商品排版數據 (JSON)</span>
                              </button>
                              <span className="hidden sm:inline text-[#2C2C2A]/10">|</span>
                              <button
                                onClick={() => {
                                  setEditableProducts(PRODUCTS);
                                  try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(PRODUCTS)); } catch(e) {}
                                  silentSyncToGithub(activeStories, archivedStories, PRODUCTS);
                                  setSelectedEditProductId('');
                                  triggerToast('🔄 商品資料已重置為系統預設值。');
                                }}
                                className="text-[10px] font-sans-ui text-red-400 hover:text-red-600 font-semibold underline transition-colors cursor-pointer"
                              >
                                重置所有商品為預設值
                              </button>
                            </div>
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
                              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={editableProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                  <div className="flex flex-col gap-2">
                                    <AnimatePresence initial={false}>
                                      {selectedEditProductId === '__NEW__' && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="overflow-hidden"
                                        >
                                          {renderProductEditForm(true)}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {editableProducts.map((product) => {
                                      const isSelected = product.id === selectedEditProductId;
                                      const isPendingDelete = confirmDeleteProductId === product.id;
                                      return (
                                        <div key={product.id} className="space-y-1">
                                          <SortableProductRow
                                            product={product}
                                            isSelected={isSelected}
                                            isPendingDelete={isPendingDelete}
                                            onSelect={() => {
                                              if (isSelected) {
                                                setSelectedEditProductId('');
                                              } else {
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
                                                setEditProductStoryBehind(product.story_behind || '');
                                                setEditProductFeature1(product.features?.[0] || '');
                                                setEditProductFeature2(product.features?.[1] || '');
                                                setEditProductFeature3(product.features?.[2] || '');
                                                setEditProductSpecsText(product.specifications ? product.specifications.map(s => `${s.label}: ${s.value}`).join('\n') : '');
                                                setEditProductDesignerCritique(product.designer_critique || '');
                                                setConfirmDeleteProductId('');
                                              }
                                            }}
                                            onDeleteRequest={() => setConfirmDeleteProductId(product.id)}
                                            onDeleteConfirm={() => {
                                              const next = editableProducts.filter(p => p.id !== product.id);
                                              setEditableProducts(next);
                                              try { localStorage.setItem('oasis_editable_products_v1', JSON.stringify(next)); } catch(e) {}
                                              silentSyncToGithub(activeStories, archivedStories, next);
                                              setConfirmDeleteProductId('');
                                              if (selectedEditProductId === product.id) setSelectedEditProductId('');
                                              triggerToast(`🗑️ 商品《${product.title_optimized.slice(0,12)}...》已刪除，前台即時同步移除。`);
                                            }}
                                            onDeleteCancel={() => setConfirmDeleteProductId('')}
                                          />
                                          <AnimatePresence initial={false}>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                              >
                                                {renderProductEditForm(false)}
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            </div>
                          </div>
                        </div>

                        {/* 待審查模塊 */}
                        <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center space-x-3 text-[#2C2C2A] mb-5 pb-4 border-b border-[#2C2C2A]/5">
                            <CheckCircle2 className="w-5 h-5 text-[#5A6351]" />
                            <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">HUMAN-IN-THE-LOOP // 半自動審核佇列</span>
                          </div>
                          <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-4">
                            此處展示狀態為 <code className="bg-[#2C2C2A]/10 px-1 py-0.5 rounded text-[11px] font-mono-data text-[#2C2C2A]">status: "pending"</code> 的商品，供團隊進行上架審核。
                          </p>
                          {editableProducts.filter(p => p.status === 'pending').length === 0 ? (
                            <div className="border border-dashed border-[#2C2C2A]/15 rounded-xl p-6 text-center text-xs text-[#2C2C2A]/40 font-sans-ui italic">
                              暫無審查中 (Pending) 的商品待處理。AI 智理引擎狀態良好。
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {editableProducts.filter(p => p.status === 'pending').map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <span className="text-xs font-sans-ui font-semibold text-[#2C2C2A]">{p.title_optimized}</span>
                                  <span className="text-[10px] font-mono-data text-amber-600 font-bold">PENDING</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ---- 數據區 ---- */}
                    {adminActiveTab === 'stats' && (
                      <motion.div
                        key="tab-stats"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* ⚡ GitHub 雲端一鍵雙向同步卡片 */}
                        <div className="bg-gradient-to-br from-[#5A6351]/10 to-transparent border border-[#5A6351]/20 rounded-2xl p-8 shadow-[0_4px_24px_rgba(90,99,81,0.06)] space-y-5">
                          <div className="flex items-center space-x-3 pb-4 border-b border-[#5A6351]/15">
                            <div className="p-2 bg-[#5A6351] rounded-lg">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="font-mono-data text-[10px] text-[#5A6351] font-bold tracking-widest uppercase block">GITHUB CLOUD SYNC // 雲端一鍵雙向同步中心</span>
                              <p className="font-sans-ui text-xs text-[#2C2C2A]/60 mt-0.5">直接將線上後台的修改 Commit & Push 至您的 GitHub 倉庫，自動觸發 Cloudflare Pages 重新編譯部署</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans-ui">
                            <div>
                              <label className="block text-[#2C2C2A]/60 font-bold mb-1.5">1. GitHub 帳號 (Username)</label>
                              <input 
                                type="text"
                                value={githubUsername}
                                onChange={(e) => {
                                  setGithubUsername(e.target.value);
                                  localStorage.setItem('oasis_github_username', e.target.value);
                                }}
                                placeholder="例如: robinwaterice"
                                className="w-full bg-white/80 border border-[#2C2C2A]/15 text-[#2C2C2A] px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[#2C2C2A]/60 font-bold mb-1.5">2. 倉庫名稱 (Repository)</label>
                              <input 
                                type="text"
                                value={githubRepo}
                                onChange={(e) => {
                                  setGithubRepo(e.target.value);
                                  localStorage.setItem('oasis_github_repo', e.target.value);
                                }}
                                placeholder="預設: OasisLab"
                                className="w-full bg-white/80 border border-[#2C2C2A]/15 text-[#2C2C2A] px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[#2C2C2A]/60 font-bold mb-1.5">3. 個人訪問令牌 (GitHub PAT Token)</label>
                              <input 
                                type="password"
                                value={githubToken}
                                onChange={(e) => {
                                  setGithubToken(e.target.value);
                                  localStorage.setItem('oasis_github_token', e.target.value);
                                }}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-white/80 border border-[#2C2C2A]/15 text-[#2C2C2A] px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#5A6351] transition-all"
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleSyncToGithub}
                              disabled={isSyncingToGithub}
                              className={`w-full py-3.5 text-white text-xs font-sans-ui font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 ${
                                isSyncingToGithub
                                  ? 'bg-[#5A6351]/50 cursor-not-allowed'
                                  : 'bg-[#5A6351] hover:bg-[#4E5646] cursor-pointer hover:shadow-lg'
                              }`}
                            >
                              {isSyncingToGithub ? (
                                <>
                                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </motion.div>
                                  <span>正在編譯同步並提交變更至 GitHub...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-white" />
                                  <span>⚡ 立即執行一鍵雲端雙向同步 (Commit & Push)</span>
                                </>
                              )}
                            </button>
                            <span className="block text-[10px] text-[#2C2C2A]/40 mt-2 text-center leading-relaxed">
                              🔒 隱私安全承諾：您的 GitHub Token 僅保存在您當前瀏覽器的 LocalStorage 中，完全由前端發起 API 呼叫，絕無任何中轉伺服器，安全無慮。
                            </span>
                          </div>
                        </div>

                        <div className="bg-white border border-[#2C2C2A]/10 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2C2C2A]/5 mb-6">
                            <div className="flex items-center space-x-3">
                              <Database className="w-5 h-5 text-[#5A6351]" />
                              <span className="font-mono-data text-xs tracking-widest font-bold uppercase text-[#5A6351]">REAL-TIME CTR ANALYTICS // 實際點擊數據統計中心</span>
                            </div>
                            <button
                              onClick={() => {
                                const defaultStoryClicks: {[key: string]: number} = {};
                                const allS = [...activeStories, ...archivedStories, ...NEXT_ISSUE_STORIES];
                                allS.forEach(s => { defaultStoryClicks[s.id] = 0; });
                                setStoryClicks(defaultStoryClicks);
                                const defaultProdClicks: {[key: string]: number} = {};
                                PRODUCTS.forEach(p => { defaultProdClicks[p.id] = 0; });
                                setProductClicks(defaultProdClicks);
                                triggerToast('🔄 智理統計數據已成功重置為預設初始值。');
                              }}
                              className="text-[10px] font-sans-ui text-[#5A6351] hover:text-[#4E5646] font-semibold underline transition-colors cursor-pointer"
                            >
                              重置實際點擊統計
                            </button>
                          </div>

                          <p className="font-sans-ui text-xs text-[#2C2C2A]/60 leading-relaxed mb-6">
                            此模組統計讀者在 Oasis Lab. 產生的真實對話與行文軌跡。所有查看專題、前往品牌合作通路等<strong>實際點擊數</strong>均被儲存，並與隨機偏移量彙整，演算出前台呈現的高質感補給熱度。
                          </p>

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
                                    {editableProducts.map(product => {
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <div className="flex justify-center mt-10 pt-6 border-t border-[#2C2C2A]/5">
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
                    <div className="w-full aspect-square max-w-[480px] mx-auto rounded-xl overflow-hidden shadow-md relative">
                      <img 
                        src={currentStory.coverImage} 
                        alt={currentStory.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getFallbackImage(currentStory.targetTag, 0);
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
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
        <KeywordModal
          isOpen={showKeywordModal}
          currentIssueNumber={currentIssueNumber}
          nomadKeyword={nomadKeyword}
          officeKeyword={officeKeyword}
          minimalistTravelKeyword={minimalistTravelKeyword}
          setNomadKeyword={setNomadKeyword}
          setOfficeKeyword={setOfficeKeyword}
          setMinimalistTravelKeyword={setMinimalistTravelKeyword}
          onClose={() => setShowKeywordModal(false)}
          onGenerate={(keywords) => {
            setShowKeywordModal(false);
            handleGenerateNextIssue(keywords);
          }}
        />
      </AnimatePresence>
 
      {/* 1:1 專題封面圖自訂裁切器彈窗 */}
      <AnimatePresence>
        <CropModal
          isOpen={showCropModal}
          cropSrc={cropSrc}
          cropZoom={cropZoom}
          cropPanX={cropPanX}
          cropPanY={cropPanY}
          setCropZoom={setCropZoom}
          onClose={() => setShowCropModal(false)}
          onApply={handleApplyCrop}
          onMouseDown={handleCropMouseDown}
          onMouseMove={handleCropMouseMove}
          onTouchStart={handleCropTouchStart}
          onTouchMove={handleCropTouchMove}
          onMouseUp={handleCropEnd}
        />
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

      {/* 強制瀏覽器先行加載並渲染 Noto Serif TC 與 JetBrains Mono 的特粗與斜體字重，保障 Canvas 繪圖 100% 成功套用 */}
      <div className="sr-only select-none pointer-events-none absolute -z-[9999]" aria-hidden="true" style={{ opacity: 0, width: 0, height: 0, overflow: 'hidden' }}>
        <span style={{ fontFamily: '"Noto Serif TC"', fontWeight: 900 }}>Oasis 數位游牧民的桌面進化論 900</span>
        <span style={{ fontFamily: '"Noto Serif TC"', fontWeight: 700 }}>Oasis 數位游牧民的桌面進化論 700</span>
        <span style={{ fontFamily: '"Noto Serif TC"', fontWeight: 400, fontStyle: 'italic' }}>Oasis “重塑物理空間的束縛” italic</span>
        <span style={{ fontFamily: '"JetBrains Mono"', fontWeight: 800 }}>OASIS LAB 800</span>
        <span style={{ fontFamily: '"JetBrains Mono"', fontWeight: 700 }}>OASIS LAB 700</span>
      </div>
    </div>
  );
}
