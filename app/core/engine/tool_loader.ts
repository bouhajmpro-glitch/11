// app/core/engine/tool_loader.ts

export interface ToolDef {
  id: string;
  name: string;
  category: string;
  url: string;
  type: 'script' | 'css' | 'api_endpoint';
  globalVar?: string;
}

// حالة النظام (الذاكرة الحية للأدوات)
let DYNAMIC_REGISTRY: ToolDef[] = [];
const loadedScripts = new Set<string>();

// دالة التهيئة (تستدعى عند بدء التطبيق)
// هذه الدالة تذهب للإنترنت (أو ملف محلي) وتجلب أحدث قائمة أدوات
export async function initToolsEngine() {
  try {
    // في المستقبل: هذا الرابط سيكون رابط GitHub Raw لملف JSON الذي يحدثه الروبوت
    // حالياً: سنقرأ من ملف public/tools.json
    const res = await fetch('/tools.json'); 
    if (res.ok) {
      const data = await res.json();
      DYNAMIC_REGISTRY = data.tools;
      console.log(`🧠 Engine: Discovered ${DYNAMIC_REGISTRY.length} tools dynamically.`);
    }
  } catch (e) {
    console.error("Engine Init Failed", e);
  }
}

// دالة البحث عن أداة (ديناميكية)
export function findTool(id: string) {
  return DYNAMIC_REGISTRY.find(t => t.id === id);
}

// دالة الحصول على كل الأدوات (للعرض)
export function getAllTools() {
  return DYNAMIC_REGISTRY;
}

// دالة التحميل الذكي (The Smart Loader)
export async function loadTool(toolId: string): Promise<any> {
  // 1. البحث في السجل الديناميكي
  let tool = findTool(toolId);
  
  // 2. إذا لم نجدها، نحاول البحث في الإنترنت (الذكاء الفائق)
  // (هنا يمكننا إضافة منطق يبحث في مستودع GitHub مباشرة)
  if (!tool) {
    console.warn(`Tool ${toolId} not known. Searching cloud...`);
    return null;
  }

  // 3. التحميل (نفس المنطق السابق لكن على بيانات ديناميكية)
  if (tool.type === 'script') {
    if (loadedScripts.has(toolId)) return (window as any)[tool.globalVar || ''];
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = tool.url;
      script.async = true;
      script.onload = () => {
        loadedScripts.add(toolId);
        console.log(`✅ Engine: ${tool.name} Activated.`);
        resolve((window as any)[tool.globalVar || '']);
      };
      script.onerror = () => reject(new Error(`Failed ${tool.name}`));
      document.body.appendChild(script);
    });
  }
  
  // ... (باقي الأنواع CSS, API)
}
