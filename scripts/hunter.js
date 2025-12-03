const fs = require('fs');
const https = require('https');

// قائمة المرشحين (يمكنك توسيعها لاحقاً بروابط بحث حقيقية)
const DISCOVERIES = [
  "https://cdn.jsdelivr.net/npm/chart.js", // أداة (JS)
  "https://api.weather.gov/points/33.5,-7.5", // مصدر (API)
  "https://unpkg.com/three", // أداة
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson" // مصدر
];

async function runHunter() {
  console.log("🕵️‍♂️ Hunter: Scanning the web...");

  // 1. تحميل الملفين الحاليين
  const sourcesDB = require('../public/sources.json');
  const toolsDB = require('../public/tools.json');

  for (const url of DISCOVERIES) {
    // 2. التصنيف الذكي
    if (url.endsWith('.js') || url.includes('cdn') || url.includes('unpkg')) {
      // هذه أداة!
      if (!toolsDB.tools.find(t => t.url === url)) {
        console.log(`🔧 Found Tool: ${url}`);
        toolsDB.tools.push({
          id: `auto-tool-${Date.now()}`,
          name: "Auto Tool",
          category: "util",
          url: url,
          type: "script"
        });
      }
    } else {
      // هذا مصدر بيانات!
      if (!sourcesDB.sources.find(s => s.url === url)) {
        console.log(`📡 Found Source: ${url}`);
        sourcesDB.sources.push({
          id: `auto-source-${Date.now()}`,
          name: "Auto Source",
          url: url,
          type: "special",
          region: "world",
          priority: 5
        });
      }
    }
  }

  // 3. الحفظ
  fs.writeFileSync('./public/sources.json', JSON.stringify(sourcesDB, null, 2));
  fs.writeFileSync('./public/tools.json', JSON.stringify(toolsDB, null, 2));
  console.log("✅ Database Updated!");
}

runHunter();
