const fs = require('fs');
const https = require('https');

// إعدادات الحماية
const CONFIG = {
  timeout: 5000, // 5 ثواني فقط لكل مصدر
  retries: 2,    // محاولتان
  userAgent: 'SentientSky-Bot/1.0 (Educational Research)', // هوية مهذبة
};

// تحميل قاعدة البيانات
const DB_PATH = './public/sources_db.json';
const OUTPUT_PATH = './public/global_state.json';

// دالة جلب آمنة (The Safe Fetcher)
const fetchSafe = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': CONFIG.userAgent },
      timeout: CONFIG.timeout
    }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null); // فشل صامت (لا توقف النظام)
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data); // التحقق من أنها JSON
          resolve(json);
        } catch (e) {
          resolve(null); // بيانات فاسدة
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
};

// المحرك الرئيسي
async function runCrawler() {
  console.log("🛡️ Universal Crawler: Starting secure scan...");
  
  let sourcesDB;
  try {
    sourcesDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error("❌ Database not found!");
    process.exit(1);
  }

  const results = {
    updatedAt: new Date().toISOString(),
    data: {}
  };

  // حلقة الزحف (Sequential to avoid rate limits)
  for (const source of sourcesDB.sources) {
    // استبدال المتغيرات (محاكاة لموقع افتراضي: الدار البيضاء)
    let url = source.url
      .replace('{lat}', '33.5731')
      .replace('{lon}', '-7.5898')
      .replace('{date}', new Date().toISOString().split('T')[0]);

    console.log(`🌐 Pinging: ${source.name}...`);
    
    let data = await fetchSafe(url);
    
    // إعادة المحاولة (Retry Logic)
    if (!data && CONFIG.retries > 0) {
      console.log(`   ⚠️ Retrying ${source.name}...`);
      data = await fetchSafe(url);
    }

    if (data) {
      // الاستخراج الذكي (Mapping Logic)
      // هنا يمكننا إضافة كود لاستخراج القيمة المحددة بناءً على source.mapping
      results.data[source.id] = {
        status: 'active',
        raw: data // نخزن البيانات الخام (مؤقتاً) للمعالجة لاحقاً
      };
      console.log(`   ✅ Secured data from ${source.name}`);
    } else {
      results.data[source.id] = { status: 'dead' };
      console.log(`   ❌ Source dead: ${source.name}`);
    }
  }

  // الحفظ النهائي
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log("💾 Global State Saved.");
}

runCrawler();
