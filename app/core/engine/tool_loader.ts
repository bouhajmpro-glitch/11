// app/core/engine/tool_loader.ts
import { ToolDef, FALLBACK_TOOLS } from '../config/tools_registry';

let DYNAMIC_REGISTRY: ToolDef[] = [];
const loadedScripts = new Set<string>();

/**
 * 1. وظيفة التهيئة (The Initializer)
 * التعديل: إضافة ?t=... لمنع التخزين المؤقت (Cache Busting)
 */
export async function initToolsEngine() {
  // إزالة شرط التوقف للسماح بالتحديث عند إعادة الدخول للصفحة
  // if (DYNAMIC_REGISTRY.length > 0) return; 

  try {
    console.log("📡 Engine: Fetching tools registry...");
    // الحيلة هنا: إضافة وقت عشوائي للرابط لإجبار المتصفح على جلب الملف الجديد
    const res = await fetch(`/tools.json?t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache' }
    }); 
    
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tools) && data.tools.length > 0) {
        DYNAMIC_REGISTRY = data.tools;
        console.log(`✅ Engine: Loaded ${DYNAMIC_REGISTRY.length} dynamic tools.`);
        return;
      }
    }
    throw new Error("Invalid JSON");
  } catch (e) {
    console.warn("⚠️ Engine: Cloud sync failed. Activating Fallback.");
    // استخدام القائمة الاحتياطية الكاملة
    DYNAMIC_REGISTRY = FALLBACK_TOOLS;
  }
}

/**
 * 2. وظيفة الاسترجاع
 */
export function getAllTools(): ToolDef[] {
  return DYNAMIC_REGISTRY.length > 0 ? DYNAMIC_REGISTRY : FALLBACK_TOOLS;
}

/**
 * 3. وظيفة التحميل الذكي
 */
export async function loadTool(toolId: string): Promise<any> {
  const tool = getAllTools().find(t => t.id === toolId);
  
  if (!tool) {
    console.error(`❌ Tool ${toolId} not found.`);
    return null;
  }

  // أ) سكربت JS
  if (tool.type === 'script') {
    if (loadedScripts.has(toolId)) {
      console.log(`⚡ ${tool.name} already active.`);
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
        // لا نرفض الوعد (Reject) بالكامل لتجنب انهيار الواجهة، بل نعيد null
        resolve(null); 
      };
      document.body.appendChild(script);
    });
  }

  // ب) ستايل CSS
  if (tool.type === 'css') {
    if (document.querySelector(`link[href="${tool.url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tool.url;
    document.head.appendChild(link);
    return;
  }

  // ج) API Endpoint
  if (tool.type === 'api_endpoint') {
    try {
      const res = await fetch(tool.url);
      return await res.json();
    } catch (e) { return null; }
  }

  return null;
}
