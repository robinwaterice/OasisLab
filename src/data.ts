/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, Product } from './types';

export const STORIES: Story[] = [
  {
    id: 'story-01',
    icon: '💻',
    subtitle: 'STORY 01 // 數位游牧',
    title: '數位游牧民的桌面進化論',
    description: '重塑物理空間的束縛，在流動的咖啡廳跟共同工作空間中，構築最高效、最優雅的精神據點。',
    content: `對於身在遠方的創造者而言，「桌面」不再是一張固定的松木板，而是一個隨身攜帶、可在三十秒內組裝完成的精神聖殿。它必須足夠簡化、足夠純粹，容不下任何一絲冗餘的線材。

在這個流動的時代，我們重新定義能量的補給。透過化繁為簡的電量中樞、極輕便的隨行背包，將多餘的裝備遺留在後方。當每一次插拔、每一次翻找都被縮減至最少，指尖下奔流的，便是無礙的專注與自由。

我們探訪了十位在京都、巴里島與清邁一邊漫遊一邊寫作的跨界創作者，為你篩選出這幾款能讓你在任何角落「迅速充電、隨時就位」的硬核美學裝備。`,
    targetTag: '日常充電',
    coverImage: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1200&q=80',
    author: '編輯部・Eli Lin',
    readTime: '4 Mins Read',
    date: 'ISSUE 042 // MAY 2026'
  },
  {
    id: 'story-02',
    icon: '☕',
    subtitle: 'STORY 02 // 辦公美學',
    title: '社畜的辦公室續命指南',
    description: '在被行事曆切割的日常裡，用充滿仪式感的物件重新錨定生活的重心，找回呼吸的節奏。',
    content: `下午三點一刻，室內燈光過於刺眼，冷氣運轉的嗡嗡聲與重複的鍵盤敲擊重疊。這不是你最靈動的時刻，但這可以是你最溫柔的時刻。

當身體陷在椅子中的時間無限延長，我們亟需一些實體上的「錨點」來找回感官的平衡。是一張能溫柔托住腰椎的靠墊，還是一杯在辦公桌角靜靜滴漏、散發柑橘與茉莉香氣的手沖咖啡？

這些並非無謂的消費，而是在高壓現實中，奪回生活微小控制權的「必要儀式」。用極簡的設計與人體工學，向不妥協的靈魂致敬。`,
    targetTag: '辦公室必備',
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=1200&q=80',
    author: '策展人・Siri Chen',
    readTime: '5 Mins Read',
    date: 'ISSUE 042 // MAY 2026'
  },
  {
    id: 'story-03',
    icon: '✈️',
    subtitle: 'STORY 03 // 極簡美學',
    title: '極簡旅行裝備的減法藝術',
    description: '一場說走就走的商務派駐與遠行。把收納做成哲學，將重量壓回零度，只帶走最好的自己。',
    content: `整理行李，在某種意義上是與自我內在慾望的深刻對話。我們總是以為自己需要帶上全世界，最後卻只是背負了多餘的焦慮。

「一件優秀的裝備，必須同時具備多種解答。」在出差與轉機的夾縫中，防潑水的乾淨雙肩收納，能讓我們優雅地滑過安檢通道；超薄的防丟定位，則在忙頓的旅店中提供了最不具侵入性的安全感。

當身上包袱回歸極簡，眼前的景色才真正開始清晰。精準的挑選，是為了展開一場無負擔的輕盈思維之旅。`,
    targetTag: '極簡旅行',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    author: '資深旅人・Homer Chang',
    readTime: '3 Mins Read',
    date: 'ISSUE 042 // MAY 2026'
  }
];

export const HISTORICAL_STORIES: Story[] = [
  {
    id: 'story-h01',
    icon: '🌿',
    subtitle: 'STORY 01 // 植栽自然學',
    title: '居家綠植的自然氣息學',
    description: '引綠意入窗，在斑駁的光影中，與龜背芋和虎尾蘭共同生活，重新調研空氣與身心的微氣候。',
    content: `植物從不說謊。它用一片葉子的焦黃或常綠，無聲地向你匯報著光、濕度與微風的流通。

在我們每天工作超過十小時的密閉空間中，添置一點「活體綠意」，並非純粹的室內裝飾。在指尖觸碰溫潤泥土、細數每一次抽芽的清晨，我們正將原本被數位螢幕緊扣的感官，重新錨定回植物性的和諧節奏中。

這是一份與自然共同生長的專注練習。為桌角添一盆苔球，讓每一口呼吸都多幾分森林般的潔淨與坦然。`,
    targetTag: '辦公室必備',
    coverImage: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80',
    author: '植物引路人・Yara Lin',
    readTime: '5 Mins Read',
    date: 'ISSUE 041 // APR 2026'
  },
  {
    id: 'story-h02',
    icon: '💼',
    subtitle: 'STORY 02 // 植鞣工藝',
    title: '極簡皮革收納的本色美學',
    description: '歲月痕跡沉澱，用天然植鞣牛皮的細膩溫度，收納多餘線材與手札日記，實踐歷久彌新的長效承諾。',
    content: `人工化學塑料是均勻、冰冷且容易被遺棄的。而一塊植鞣牛皮，卻承載著生命的溫度，隨著使用者的汗水、日光照射、與指尖摩挲，逐漸在邊角渲染出溫潤的焦蜜糖色。

極簡，不代表冰冷與棄絕質感。當我們將行囊中的多餘包裝抽離，只留下一本皮質紮實的極簡活頁隨筆，和一個觸感細膩的快收線座，每一次拿出裝備的過程，皆成了一場手指感官的曼妙儀式。

用天然物件的舊化（Aging），來對抗都市生活的折舊與磨損。這正是我們極力推薦的永續選物哲学。`,
    targetTag: '極簡旅行',
    coverImage: 'https://images.unsplash.com/photo-1530521951575-7bb863977288?auto=format&fit=crop&w=1200&q=80',
    author: '工藝主編・Mao Wu',
    readTime: '3 Mins Read',
    date: 'ISSUE 041 // APR 2026'
  },
  {
    id: 'story-h03',
    icon: '🍵',
    subtitle: 'STORY 03 // 儀式感',
    title: '清晨茶浴與心流定錨之法',
    description: '在喧囂的一天開啟前，為自己預留二十分鐘的靜默茶浴時光。以茶洗心，安定每一瞬起伏的思緒。',
    content: `「在倒熱水的那一秒鐘，白色的裊裊熱氣升騰，那是世界上最安靜、最值得感恩的時間。」

茶葉在沸水中舒展，每一次翻滾都象徵著心境的自淨與沈澱。當茶湯的甘甜在口中化開，我們不只為身心「注入電量」，更在心中播下一個穩固、無畏浮躁的錨點。

當晨間的意識有了這場洗禮，後續再密集的視訊會議、再複雜的報表，都無法輕易戳破這道由溫潤茶湯所編織的平靜護欄。`,
    targetTag: '日常充電',
    coverImage: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=1200&q=80',
    author: '茶人・Ryu Shen',
    readTime: '4 Mins Read',
    date: 'ISSUE 040 // MAR 2026'
  }
];

export const NEXT_ISSUE_STORIES: Story[] = [
  {
    id: 'story-n01',
    icon: '🏕️',
    subtitle: 'STORY 01 // 輕量野外學',
    title: '防水探險背架的極限減法',
    description: '走向大山大海！攜手防撕裂超輕多功能探險背包，實踐無痕山林與自我極限的對話。',
    content: `當我們抵達柏油路的終點，迎面而來的除了壯闊的峰巒，更有最直接的重力挑戰。每一克多餘的重量，都將在漫漫攀爬中考驗著意志。

一隻兼具精準重力分配系統與耐磨防雨的探險背包，將能化身為跋涉中最適意的物理支護。這不僅是背包，而是你在荒野孤寂中的忠實同盟。

將所有的生存所需歸納在 40 公升之內，此即為走向浩瀚無垠大自然前的終極修行與最和諧的減法藝術。`,
    targetTag: '極簡旅行',
    coverImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80',
    author: '徒步評論家・Kary Tseng',
    readTime: '4 Mins Read',
    date: 'ISSUE 043 // JUN 2026'
  },
  {
    id: 'story-n02',
    icon: '🪵',
    subtitle: 'STORY 02 // 案頭升降美學',
    title: '人體工學站立式升降美學',
    description: '坐與站的節律切換。用櫻桃原木質感升降，釋放雙腿靜脈壓力，在姿態調整中煥發全新創意的波長。',
    content: `人體不是為了久坐八小時而演化出來的。肌肉和骨骼的惰性，需要透過規律的站立拉伸來重新喚醒、注入靈動。

不只重視實用性，更在乎居家原木的感官共鳴。我們引入了頂級櫻桃木製程的智慧電動升降案板，無刷低噪馬達滑動如順滑奶油。

在工作與思辨的空檔中自然切换，重新釋放緊繃的腰肌，讓大腦重新浸潤在氧氣飽滿的流動靈感中。`,
    targetTag: '辦公室必備',
    coverImage: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1200&q=80',
    author: '人體工學主筆・Alan Ko',
    readTime: '3 Mins Read',
    date: 'ISSUE 043 // JUN 2026'
  },
  {
    id: 'story-n03',
    icon: '🕯️',
    subtitle: 'STORY 03 // 嗅覺感官',
    title: '微光閱讀與深夜的嗅覺療癒',
    description: '香草與雪松的微妙揉合，天然大豆香氛蠟燭，在沉靜深夜的書房中，構築最厚實的安全邊界。',
    content: `當整座城市的喧囂與白日喧鬧在大燈關閉後漸漸褪去，書房 corner 的這盞微黃燭火，就是您向靈魂作深度傾訴的最佳信號。

我們嚴選無毒天然植物大豆蠟，揉合了沉穩雪松與微甜岩蘭草香調。香氣是無形的畫筆，在空氣中渲染出一圈不可侵入、完全自我的寧靜氛圍。

翻開一本微黃的實體舊書，伴隨木芯燃燒的清脆辟啪聲，讓日常所受的浮躁與委屈悉數在暖白芬芳中和煦消散。`,
    targetTag: '日常充電',
    coverImage: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80',
    author: '香氛調香師・Joanna Xu',
    readTime: '5 Mins Read',
    date: 'ISSUE 043 // JUN 2026'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    title_optimized: '無線桌上美學｜極簡磁吸三合一無線充電座',
    price_display: 'NT$ 2,480',
    affiliate_url: 'https://example.com/item/magnetic-charger',
    btn_text: '探索生活靈感',
    context_tags: ['日常充電', '辦公室必備'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1622445262465-248195766433?auto=format&fit=crop&w=600&q=80',
    description: '懸浮磁吸設計，告別凌亂線材，為 iPhone、Apple Watch 與 AirPods 同時注入飽滿的桌面能量。'
  },
  {
    id: 'prod-02',
    title_optimized: '差旅的隱形秘書｜防丟極薄卡片式智慧定位器',
    price_display: 'NT$ 980',
    affiliate_url: 'https://example.com/item/card-tracker',
    btn_text: '入手差旅伴侶',
    context_tags: ['極簡旅行'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    description: '僅 1.6mm 極致厚度，可輕鬆置於皮夾與護照套內。強大全球定位網絡讓你的珍貴物件永不離線。'
  },
  {
    id: 'prod-03',
    title_optimized: '晨間專注儀式｜日本特選手沖陶瓷濾杯禮盒',
    price_display: 'NT$ 1,580',
    affiliate_url: 'https://example.com/item/ceramic-dripper',
    btn_text: '開啟專注晨光',
    context_tags: ['日常充電', '辦公室必備'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    description: '由有田燒職人純手工打造，多肋紋內部引流結構，精準控制萃取時流速，澄淨每一口咖啡的感官。'
  },
  {
    id: 'prod-04',
    title_optimized: '辦公室的脊椎救星｜日本減壓人體工學護腰墊',
    price_display: 'NT$ 1,880',
    affiliate_url: 'https://example.com/item/ergonomic-cushion',
    btn_text: '舒緩緊繃腰背',
    context_tags: ['辦公室必備'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=600&q=80',
    description: '環抱式仿生曲面結構，3D 高回彈記憶棉，完美填補久坐時的腰椎空隙，分散脊椎底部的沉重壓力。'
  },
  {
    id: 'prod-05',
    title_optimized: '漫遊者的無感行囊｜防潑水極簡商務雙肩包',
    price_display: 'NT$ 3,200',
    affiliate_url: 'https://example.com/item/minimal-backpack',
    btn_text: '輕裝奔向遠方',
    context_tags: ['極簡旅行', '日常充電'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    description: 'Cordura 防潑水耐磨面料，內置獨立 16 吋筆電防震層與快充線路穿孔，實踐最高度的移動美學。'
  },
  {
    id: 'prod-06',
    title_optimized: '溫控美學｜霧面不鏽鋼智慧真空保溫瓦片瓶',
    price_display: 'NT$ 1,680',
    affiliate_url: 'https://example.com/item/smart-bottle',
    btn_text: '感觸溫度細節',
    context_tags: ['日常充電', '極簡旅行'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    description: '雙層高效真空保溫，附有極簡式 LCD 感應式外蓋，讓你隨時調控日常補水，每一口皆是最純粹的溫度。'
  },
  {
    id: 'prod-07',
    title_optimized: '觸覺的物理治癒｜天然橡木加厚羊毛氈電腦墊',
    price_display: 'NT$ 1,480',
    affiliate_url: 'https://example.com/item/desk-pad',
    btn_text: '升華案頭觸摸',
    context_tags: ['辦公室必備'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    description: '採用天然美麗諾精紡羊毛氈，搭配抗滑天然栓木大底，溫潤軟熟的壓感，為長時打字的手術臂建立舒緩緩衝。'
  },
  {
    id: 'prod-08',
    title_optimized: '無干擾聽覺空間｜美學主動式降噪真無線耳機',
    price_display: 'NT$ 5,280',
    affiliate_url: 'https://example.com/item/anc-earbuds',
    btn_text: '遮蔽都市塵囂',
    context_tags: ['日常充電', '極簡旅行', '辦公室必備'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    description: '45dB 精準感知智慧調頻降噪，搭配低共振複合振膜，在任何咖啡廳或喧囂的車廂內，均能為您保留那份靈感淨土。'
  }
];
