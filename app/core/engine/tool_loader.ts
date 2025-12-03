// app/core/engine/tool_loader.ts
import { ToolDef, FALLBACK_TOOLS } from '../config/tools_registry';

// الذاكرة الحية (Live Registry)
let DYNAMIC_REGISTRY: ToolDef[] = [];
const loadedScripts = new Set<string>();

/**
 * 1. وظيفة التهيئة (The Initializer)
 * تحاول جلب الملف من السحابة، وإذا فشلت، تستخدم الاحتياطي الصلب.
 */
export async function initToolsEngine() {
  if (DYNAMIC_REGISTRY.length > 0) return; // تم التحميل مسبقاً

  try {
    console.log("📡 Engine: Attempting to fetch dynamic tools...");
    const res = await fetch('/tools.json'); // الملف الذي يحدثه الروبوت
    
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tools) && data.tools.length > 0) {
        DYNAMIC_REGISTRY = data.tools;
        console.log(`✅ Engine: Loaded ${DYNAMIC_REGISTRY.length} dynamic tools.`);
        return;
      }
    }
    throw new Error("Invalid or empty JSON");
  } catch (e) {
    console.warn("⚠️ Engine: Cloud sync failed. Activating Fallback Protocol.");
    // تفعيل خطة الطوارئ: استخدام القائمة الصلبة
    DYNAMIC_REGISTRY = FALLBACK_TOOLS;
    console.log(`🛡️ Engine: Fallback active with ${DYNAMIC_REGISTRY.length} core tools.`);
  }
}

/**
 * 2. وظيفة الاسترجاع (The Getter)
 * تعيد القائمة الحالية (سواء كانت سحابية أو احتياطية)
 */
export function getAllTools(): ToolDef[] {
  // إذا لم يتم التهيئة بعد، نعيد الاحتياطي فوراً لعدم تعطيل الواجهة
  return DYNAMIC_REGISTRY.length > 0 ? DYNAMIC_REGISTRY : FALLBACK_TOOLS;
}

/**
 * 3. وظيفة التحميل الذكي (The Smart Loader)
 * تقوم بحقن السكربت في الصفحة فقط عند الحاجة
 */
export async function loadTool(toolId: string): Promise<any> {
  // البحث في السجل الحالي
  const tool = getAllTools().find(t => t.id === toolId);
  
  if (!tool) {
    console.error(`❌ Tool ${toolId} not found in registry.`);
    return null;
  }

  // أ) نوع سكربت (JS Library)
  if (tool.type === 'script') {
    // هل هو محمل مسبقاً؟
    if (loadedScripts.has(toolId)) {
      console.log(`⚡ ${tool.name} is already loaded.`);
      return (window as any)[tool.globalVar || ''];
    }

    console.log(`🚀 Loading ${tool.name}...`);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = tool.url;
      script.async = true;
      script.onload = () => {
        loadedScripts.add(toolId);
        console.log(`✅ ${tool.name} Ready.`);
        resolve((window as any)[tool.globalVar || '']);
      };
      script.onerror = () => {
        console.error(`🔥 Failed to load ${tool.name}`);
        reject(new Error(`Failed to load ${tool.name}`));
      };
      document.body.appendChild(script);
    });
  }

  // ب) نوع ستايل (CSS)
  if (tool.type === 'css') {
    if (document.querySelector(`link[href="${tool.url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tool.url;
    document.head.appendChild(link);
    return;
  }

  // ج) نوع API (JSON Data)
  if (tool.type === 'api_endpoint') {
    try {
      const res = await fetch(tool.url);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  return null;
}
