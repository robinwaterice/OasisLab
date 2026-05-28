const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('正在以 UTF-8 安全編碼模式讀取您的剪貼簿...');

const tempFilePath = path.join(__dirname, 'temp_clip.txt');

// Let PowerShell write the clipboard directly to a file using UTF-8 encoding
exec(`powershell -NoProfile -Command "Get-Clipboard | Out-File -FilePath '${tempFilePath}' -Encoding utf8"`, (err) => {
  if (err) {
    console.error('無法讀取剪貼簿，請確保已複製內容：', err);
    return;
  }
  
  try {
    // Read the temp file containing the clipboard text
    let rawText = fs.readFileSync(tempFilePath, 'utf8').trim();
    
    // Remove potential UTF-8 BOM (Byte Order Mark) if present
    if (rawText.charCodeAt(0) === 0xFEFF) {
      rawText = rawText.slice(1);
    }

    if (!rawText.startsWith('{') || !rawText.endsWith('}')) {
      console.error('❌ 錯誤：剪貼簿中的資料格式不正確，請重新確認您是否完整複製了指令！');
      // Clean up temp file
      try { fs.unlinkSync(tempFilePath); } catch(e) {}
      return;
    }

    const data = JSON.parse(rawText);
    const { stories, archived, products } = data;

    if (!stories || !products) {
      console.error('❌ 錯誤：剪貼簿中缺少關鍵專題或商品欄位。');
      try { fs.unlinkSync(tempFilePath); } catch(e) {}
      return;
    }

    const parsedStories = JSON.parse(stories);
    const parsedArchived = JSON.parse(archived || '[]');
    const parsedProducts = JSON.parse(products);

    const dataTsPath = path.join(__dirname, 'src', 'data.ts');
    
    // Read NEXT_ISSUE_STORIES to preserve them if they exist
    let nextIssueStories = [];
    try {
      const currentContent = fs.readFileSync(dataTsPath, 'utf8');
      const match = currentContent.match(/export const NEXT_ISSUE_STORIES: Story\[\] = (\[[\s\S]*?\]);/);
      if (match) {
        nextIssueStories = JSON.parse(match[1]);
      }
    } catch (e) {
      console.log('未偵測到或無法解析 NEXT_ISSUE_STORIES，預設為空陣列。');
    }

    const updatedDataTs = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, Product } from './types';

export const STORIES: Story[] = ${JSON.stringify(parsedStories, null, 2)};

export const HISTORICAL_STORIES: Story[] = ${JSON.stringify(parsedArchived, null, 2)};

export const NEXT_ISSUE_STORIES: Story[] = ${JSON.stringify(nextIssueStories, null, 2)};

export const PRODUCTS: Product[] = ${JSON.stringify(parsedProducts, null, 2)};
`;

    fs.writeFileSync(dataTsPath, updatedDataTs, 'utf8');
    console.log('🎉 成功！已將線上修改的專題與商品資料全自動寫入本機 src/data.ts！');

    // Clean up temporary file
    try { fs.unlinkSync(tempFilePath); } catch(e) {}

    // Automatically trigger deployment
    console.log('正在為您啟動自動打包與部署 (npm run deploy)...');
    exec('npm run deploy', (deployErr, deployStdout) => {
      if (deployErr) {
        console.error('❌ 部署失敗：', deployErr);
      } else {
        console.log('🎉 部署成功！所有裝置與無痕視窗都已完成同步：\n', deployStdout);
      }
    });

  } catch (e) {
    console.error('❌ 解析剪貼簿資料時出錯，請確保已複製完整資料：', e.message);
    try { fs.unlinkSync(tempFilePath); } catch(e) {}
  }
});
