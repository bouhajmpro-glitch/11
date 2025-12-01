// scripts/brain.js
const fs = require('fs');

// محاكاة لعملية "زحف" ذكية (في الواقع يمكننا استخدام RSS parser هنا)
// هذا السكربت يولد "نشرة ذكية" محدثة
async function runBrain() {
  console.log("🤖 Brain: Waking up...");

  // 1. مصادر الأخبار (محاكاة لبيانات حية)
  const newsSources = [
    { title: "تحذير عالمي: ظاهرة النينو تشتد", severity: "warning" },
    { title: "ناسا ترصد توهجاً شمسياً ضخماً", severity: "info" },
    { title: "دراسة: 2025 عام التحولات المناخية", severity: "science" }
  ];

  // 2. توليد بيانات جديدة بناءً على الوقت الحالي
  const timestamp = new Date().toISOString();
  const generatedNews = newsSources.map(n => ({
    ...n,
    id: `news-${Date.now()}-${Math.random()}`,
    date: timestamp
  }));

  // 3. حفظ النتيجة في ملف JSON عام
  const data = {
    lastUpdate: timestamp,
    news: generatedNews,
    systemStatus: "active"
  };

  // كتابة الملف في مجلد public لكي يستطيع التطبيق قراءته
  // ملاحظة: في بيئة GitHub Actions، سنقوم بعمل Commit لهذا الملف
  fs.writeFileSync('./public/brain-data.json', JSON.stringify(data, null, 2));
  
  console.log("✅ Brain: Data updated successfully.");
}

runBrain();
