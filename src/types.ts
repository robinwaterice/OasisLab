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
  image_url: string; // 商品質感模擬圖
  description: string; // 商品一句話特點描述
}
