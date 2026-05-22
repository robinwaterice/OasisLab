/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Story {
  id: string;
  icon: string;
  subtitle: string;
  title: string;
  description: string;
  content: string;
  targetTag: string; // 用於比對商品 context_tags 的關鍵標籤
  coverImage: string; // 專題高質感封面圖
  author: string; // 專題作者/策展人
  readTime: string; // 閱讀時間
  date: string; // 出刊日期
}

export interface Product {
  id: string;
  title_optimized: string;
  price_display: string;
  affiliate_url: string;
  btn_text: string;
  context_tags: string[];
  status: 'active' | 'pending' | 'draft';
  is_popular?: boolean; // 人氣商品標記，前台顯示「人氣精選」徽章
  image_url: string; // 商品質感模擬圖
  description: string; // 商品一句話特點描述
  story_behind?: string; // 精美的商品設計故事與理念
  features?: string[]; // 精美的三大設計亮點
  specifications?: { label: string; value: string }[]; // 完整的工藝或技術規格
  designer_critique?: string; // 策展人/主編的深度美學講評
}

