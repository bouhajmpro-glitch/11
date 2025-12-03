// app/core/config/tools_registry.ts

export type ToolCategory = 'map' | 'viz' | 'ai' | 'data' | 'space' | 'util' | '3d';
export type LoadType = 'script' | 'css' | 'api_endpoint' | 'module';

export interface ToolDef {
  id: string;
  name: string;
  desc?: string;
  category: ToolCategory;
  url: string; // رابط CDN أو API
  type: LoadType;
  globalVar?: string; // اسم المتغير العام (مثلاً L لـ Leaflet)
}

export const FALLBACK_TOOLS: ToolDef[] = [
  // --- 1. عمالقة الخرائط (Mapping Giants) ---
  { id: 'leaflet', name: 'Leaflet JS', desc: 'الخريطة الأساسية الخفيفة', category: 'map', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', type: 'script', globalVar: 'L' },
  { id: 'leaflet-css', name: 'Leaflet CSS', desc: 'ستايل الخريطة', category: 'map', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', type: 'css' },
  { id: 'cesium', name: 'CesiumJS', desc: 'الكرة الأرضية ثلاثية الأبعاد (ناسا)', category: '3d', url: 'https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js', type: 'script', globalVar: 'Cesium' },
  { id: 'mapbox', name: 'Mapbox GL', desc: 'خرائط فيكتور سريعة', category: 'map', url: 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', type: 'script', globalVar: 'mapboxgl' },
  { id: 'openlayers', name: 'OpenLayers', desc: 'خرائط علمية معقدة', category: 'map', url: 'https://cdn.jsdelivr.net/npm/ol@v8.1.0/dist/ol.js', type: 'script', globalVar: 'ol' },
  { id: 'deckgl', name: 'Deck.gl', desc: 'تصور البيانات الضخمة (أوبر)', category: 'viz', url: 'https://unpkg.com/deck.gl@latest/dist.min.js', type: 'script', globalVar: 'deck' },

  // --- 2. الذكاء الاصطناعي (AI & ML) ---
  { id: 'tfjs', name: 'TensorFlow.js', desc: 'الذكاء الاصطناعي في المتصفح', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs', type: 'script', globalVar: 'tf' },
  { id: 'mobilenet', name: 'MobileNet', desc: 'نموذج التعرف على الصور', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet', type: 'script', globalVar: 'mobilenet' },
  { id: 'webllm', name: 'WebLLM', desc: 'تشغيل Llama-3 محلياً', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm', type: 'script' },
  { id: 'brain-js', name: 'Brain.js', desc: 'شبكات عصبية بسيطة', category: 'ai', url: 'https://unpkg.com/brain.js', type: 'script', globalVar: 'brain' },

  // --- 3. الرسم البياني والتصور (Data Viz) ---
  { id: 'd3', name: 'D3.js', desc: 'أقوى مكتبة رسوم بيانية', category: 'viz', url: 'https://d3js.org/d3.v7.min.js', type: 'script', globalVar: 'd3' },
  { id: 'chartjs', name: 'Chart.js', desc: 'رسوم بيانية بسيطة', category: 'viz', url: 'https://cdn.jsdelivr.net/npm/chart.js', type: 'script', globalVar: 'Chart' },
  { id: 'threejs', name: 'Three.js', desc: 'رسوم ثلاثية الأبعاد', category: '3d', url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', type: 'script', globalVar: 'THREE' },
  { id: 'p5', name: 'P5.js', desc: 'فن إبداعي وتصور', category: 'viz', url: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js', type: 'script', globalVar: 'p5' },

  // --- 4. أدوات التحليل الجغرافي (Geo Analysis) ---
  { id: 'turf', name: 'Turf.js', desc: 'الرياضيات الجغرافية', category: 'util', url: 'https://cdn.jsdelivr.net/npm/@turf/turf/turf.min.js', type: 'script', globalVar: 'turf' },
  { id: 'proj4', name: 'Proj4js', desc: 'تحويل الإحداثيات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js', type: 'script', globalVar: 'proj4' },
  { id: 'geobuf', name: 'Geobuf', desc: 'ضغط الخرائط', category: 'util', url: 'https://unpkg.com/geobuf/dist/geobuf.js', type: 'script', globalVar: 'geobuf' },

  // --- 5. مصادر البيانات الحية (Data APIs) ---
  { id: 'open-meteo', name: 'Open-Meteo API', desc: 'طقس عالمي', category: 'data', url: 'https://api.open-meteo.com/v1/forecast', type: 'api_endpoint' },
  { id: 'nasa-power', name: 'NASA POWER', desc: 'طاقة شمسية', category: 'data', url: 'https://power.larc.nasa.gov/api/temporal/daily', type: 'api_endpoint' },
  { id: 'usgs-quake', name: 'USGS Earthquakes', desc: 'زلازل حية', category: 'data', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', type: 'api_endpoint' },
  { id: 'nasa-eonet', name: 'NASA EONET', desc: 'كوارث طبيعية', category: 'data', url: 'https://eonet.gsfc.nasa.gov/api/v3/events', type: 'api_endpoint' },
  { id: 'rainviewer', name: 'RainViewer API', desc: 'رادار أمطار', category: 'data', url: 'https://api.rainviewer.com/public/weather-maps.json', type: 'api_endpoint' },
  { id: 'waqi', name: 'WAQI Air Quality', desc: 'جودة هواء', category: 'data', url: 'https://api.waqi.info/feed/here/', type: 'api_endpoint' },
  
  // --- 6. الفضاء (Space) ---
  { id: 'nasa-apod', name: 'NASA APOD', desc: 'صورة اليوم الفلكية', category: 'space', url: 'https://api.nasa.gov/planetary/apod', type: 'api_endpoint' },
  { id: 'spacex', name: 'SpaceX API', desc: 'إطلاق الصواريخ', category: 'space', url: 'https://api.spacexdata.com/v4/launches/latest', type: 'api_endpoint' },

  // ... (هنا يمكنك إضافة الـ 100 أداة الأخرى بنفس النمط: الاسم، الرابط، النوع)
];
