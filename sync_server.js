const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/save', (req, res) => {
  try {
    const { stories, archived, products } = req.body;
    
    if (!stories || !products) {
      return res.status(400).send('Missing data');
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
      console.log('Could not parse existing NEXT_ISSUE_STORIES, defaulting to empty array.');
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
    console.log('Successfully saved online data directly into local src/data.ts!');

    res.send('資料已成功寫回本機電腦！正在為您全自動打包並部署至雲端...');

    console.log('Starting background build and deploy (npm run deploy)...');
    exec('npm run deploy', (err, stdout, stderr) => {
      if (err) {
        console.error('Deployment failed:', err);
      } else {
        console.log('Deployment successful!\n', stdout);
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).send('Error saving data: ' + e.message);
  }
});

app.listen(3099, () => {
  console.log('Temporary sync server is running on http://localhost:3099');
});
