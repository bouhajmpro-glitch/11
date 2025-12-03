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
  // --- 7. أدوات مساعدة إضافية (Utils) ---
  { id: 'lodash', name: 'Lodash', desc: 'أدوات JS', category: 'util', url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', type: 'script', globalVar: '_' },
  { id: 'moment', name: 'Moment.js', desc: 'معالجة وقت', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js', type: 'script', globalVar: 'moment' },
  { id: 'axios', name: 'Axios', desc: 'طلبات HTTP', category: 'util', url: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', type: 'script', globalVar: 'axios' },
  { id: 'socketio', name: 'Socket.IO', desc: 'اتصال حي', category: 'util', url: 'https://cdn.socket.io/4.5.4/socket.io.min.js', type: 'script', globalVar: 'io' },
  { id: 'uuid', name: 'UUID', desc: 'توليد معرفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js', type: 'script', globalVar: 'uuid' },
  { id: 'crypto', name: 'CryptoJS', desc: 'تشفير', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', type: 'script', globalVar: 'CryptoJS' },
  { id: 'filesaver', name: 'FileSaver', desc: 'حفظ ملفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', type: 'script', globalVar: 'saveAs' },
  { id: 'jszip', name: 'JSZip', desc: 'ضغط ملفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', type: 'script', globalVar: 'JSZip' },
  { id: 'pdfmake', name: 'PDFMake', desc: 'إنشاء PDF', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js', type: 'script', globalVar: 'pdfMake' },
  { id: 'howler', name: 'Howler.js', desc: 'مكتبة صوت', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js', type: 'script', globalVar: 'Howl' },

  // --- 8. مصادر إضافية (Extra Sources) ---
  { id: 'solar-wind', name: 'NOAA Solar', desc: 'رياح شمسية', category: 'space', url: 'https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json', type: 'api_endpoint' },
  { id: 'gdacs', name: 'GDACS Alert', desc: 'طوارئ عالمية', category: 'data', url: 'https://www.gdacs.org/xml/rss.xml', type: 'api_endpoint' },
  { id: 'carbon', name: 'Carbon API', desc: 'انبعاثات', category: 'data', url: 'https://api.carbonintensity.org.uk/intensity', type: 'api_endpoint' },
  { id: 'openuv', name: 'OpenUV', desc: 'أشعة UV', category: 'data', url: 'https://api.openuv.io/api/v1/uv', type: 'api_endpoint' },
  { id: 'stormglass', name: 'StormGlass', desc: 'بيانات بحرية', category: 'data', url: 'https://api.stormglass.io/v2/weather', type: 'api_endpoint' },
  { id: 'ticketmaster', name: 'TicketMaster', desc: 'أحداث محلية', category: 'data', url: 'https://app.ticketmaster.com/discovery/v2/events.json', type: 'api_endpoint' },
  { id: 'newsapi', name: 'News API', desc: 'أخبار العالم', category: 'data', url: 'https://newsapi.org/v2/top-headlines', type: 'api_endpoint' },
  { id: 'anime', name: 'Anime.js', desc: 'محرك حركة', category: 'viz', url: 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js', type: 'script', globalVar: 'anime' },
  { id: 'gsap', name: 'GSAP', desc: 'حركة احترافية', category: 'viz', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', type: 'script', globalVar: 'gsap' },
  { id: 'recharts', name: 'Recharts', desc: 'رسوم React', category: 'viz', url: 'https://unpkg.com/recharts/umd/Recharts.js', type: 'script', globalVar: 'Recharts' },
  { id: 'plotly', name: 'Plotly.js', desc: 'رسوم علمية', category: 'viz', url: 'https://cdn.plot.ly/plotly-2.24.1.min.js', type: 'script', globalVar: 'Plotly' },
  { id: 'echarts', name: 'ECharts', desc: 'خرائط بايدو', category: 'viz', url: 'https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js', type: 'script', globalVar: 'echarts' },
  { id: 'vis', name: 'Vis.js', desc: 'شبكات ورسوم', category: 'viz', url: 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js', type: 'script', globalVar: 'vis' },
  { id: 'esri', name: 'Esri Leaflet', desc: 'خرائط Esri', category: 'map', url: 'https://unpkg.com/esri-leaflet@3.0.10/dist/esri-leaflet.js', type: 'script', globalVar: 'L.esri' },
  { id: 'stamen', name: 'Stamen Maps', desc: 'خرائط فنية', category: 'map', url: 'https://stamen-maps.a.ssl.fastly.net/js/tile.stamen.js', type: 'script' },
  { id: 'faceapi', name: 'Face API', desc: 'تعرف وجوه', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/face-api.js', type: 'script', globalVar: 'faceapi' },
  { id: 'ml5', name: 'ML5.js', desc: 'AI للمبتدئين', category: 'ai', url: 'https://unpkg.com/ml5@latest/dist/ml5.min.js', type: 'script', globalVar: 'ml5' },
  { id: 'onnx', name: 'ONNX Runtime', desc: 'تشغيل نماذج', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js', type: 'script', globalVar: 'ort' },
  { id: 'tesseract', name: 'Tesseract.js', desc: 'قراءة نصوص', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/tesseract.js@v2.1.0/dist/tesseract.min.js', type: 'script', globalVar: 'Tesseract' },
  { id: 'danfo', name: 'Danfo.js', desc: 'Pandas للويب', category: 'data', url: 'https://cdn.jsdelivr.net/npm/danfojs/dist/index.min.js', type: 'script', globalVar: 'dfd' },
  { id: 'natural', name: 'Natural', desc: 'لغويات NLP', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/natural', type: 'script' }
  // --- 7. أدوات مساعدة إضافية (Utils) ---
  { id: 'lodash', name: 'Lodash', desc: 'أدوات JS', category: 'util', url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', type: 'script', globalVar: '_' },
  { id: 'moment', name: 'Moment.js', desc: 'معالجة وقت', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js', type: 'script', globalVar: 'moment' },
  { id: 'axios', name: 'Axios', desc: 'طلبات HTTP', category: 'util', url: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', type: 'script', globalVar: 'axios' },
  { id: 'socketio', name: 'Socket.IO', desc: 'اتصال حي', category: 'util', url: 'https://cdn.socket.io/4.5.4/socket.io.min.js', type: 'script', globalVar: 'io' },
  { id: 'uuid', name: 'UUID', desc: 'توليد معرفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js', type: 'script', globalVar: 'uuid' },
  { id: 'crypto', name: 'CryptoJS', desc: 'تشفير', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', type: 'script', globalVar: 'CryptoJS' },
  { id: 'filesaver', name: 'FileSaver', desc: 'حفظ ملفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', type: 'script', globalVar: 'saveAs' },
  { id: 'jszip', name: 'JSZip', desc: 'ضغط ملفات', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', type: 'script', globalVar: 'JSZip' },
  { id: 'pdfmake', name: 'PDFMake', desc: 'إنشاء PDF', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js', type: 'script', globalVar: 'pdfMake' },
  { id: 'howler', name: 'Howler.js', desc: 'مكتبة صوت', category: 'util', url: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js', type: 'script', globalVar: 'Howl' },

  // --- 8. مصادر إضافية (Extra Sources) ---
  { id: 'solar-wind', name: 'NOAA Solar', desc: 'رياح شمسية', category: 'space', url: 'https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json', type: 'api_endpoint' },
  { id: 'gdacs', name: 'GDACS Alert', desc: 'طوارئ عالمية', category: 'data', url: 'https://www.gdacs.org/xml/rss.xml', type: 'api_endpoint' },
  { id: 'carbon', name: 'Carbon API', desc: 'انبعاثات', category: 'data', url: 'https://api.carbonintensity.org.uk/intensity', type: 'api_endpoint' },
  { id: 'openuv', name: 'OpenUV', desc: 'أشعة UV', category: 'data', url: 'https://api.openuv.io/api/v1/uv', type: 'api_endpoint' },
  { id: 'stormglass', name: 'StormGlass', desc: 'بيانات بحرية', category: 'data', url: 'https://api.stormglass.io/v2/weather', type: 'api_endpoint' },
  { id: 'ticketmaster', name: 'TicketMaster', desc: 'أحداث محلية', category: 'data', url: 'https://app.ticketmaster.com/discovery/v2/events.json', type: 'api_endpoint' },
  { id: 'newsapi', name: 'News API', desc: 'أخبار العالم', category: 'data', url: 'https://newsapi.org/v2/top-headlines', type: 'api_endpoint' },
  { id: 'anime', name: 'Anime.js', desc: 'محرك حركة', category: 'viz', url: 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js', type: 'script', globalVar: 'anime' },
  { id: 'gsap', name: 'GSAP', desc: 'حركة احترافية', category: 'viz', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', type: 'script', globalVar: 'gsap' },
  { id: 'recharts', name: 'Recharts', desc: 'رسوم React', category: 'viz', url: 'https://unpkg.com/recharts/umd/Recharts.js', type: 'script', globalVar: 'Recharts' },
  { id: 'plotly', name: 'Plotly.js', desc: 'رسوم علمية', category: 'viz', url: 'https://cdn.plot.ly/plotly-2.24.1.min.js', type: 'script', globalVar: 'Plotly' },
  { id: 'echarts', name: 'ECharts', desc: 'خرائط بايدو', category: 'viz', url: 'https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js', type: 'script', globalVar: 'echarts' },
  { id: 'vis', name: 'Vis.js', desc: 'شبكات ورسوم', category: 'viz', url: 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js', type: 'script', globalVar: 'vis' },
  { id: 'esri', name: 'Esri Leaflet', desc: 'خرائط Esri', category: 'map', url: 'https://unpkg.com/esri-leaflet@3.0.10/dist/esri-leaflet.js', type: 'script', globalVar: 'L.esri' },
  { id: 'stamen', name: 'Stamen Maps', desc: 'خرائط فنية', category: 'map', url: 'https://stamen-maps.a.ssl.fastly.net/js/tile.stamen.js', type: 'script' },
  { id: 'faceapi', name: 'Face API', desc: 'تعرف وجوه', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/face-api.js', type: 'script', globalVar: 'faceapi' },
  { id: 'ml5', name: 'ML5.js', desc: 'AI للمبتدئين', category: 'ai', url: 'https://unpkg.com/ml5@latest/dist/ml5.min.js', type: 'script', globalVar: 'ml5' },
  { id: 'onnx', name: 'ONNX Runtime', desc: 'تشغيل نماذج', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js', type: 'script', globalVar: 'ort' },
  { id: 'tesseract', name: 'Tesseract.js', desc: 'قراءة نصوص', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/tesseract.js@v2.1.0/dist/tesseract.min.js', type: 'script', globalVar: 'Tesseract' },
  { id: 'danfo', name: 'Danfo.js', desc: 'Pandas للويب', category: 'data', url: 'https://cdn.jsdelivr.net/npm/danfojs/dist/index.min.js', type: 'script', globalVar: 'dfd' },
  { id: 'natural', name: 'Natural', desc: 'لغويات NLP', category: 'ai', url: 'https://cdn.jsdelivr.net/npm/natural', type: 'script' }

  // ... (هنا يمكنك إضافة الـ 100 أداة الأخرى بنفس النمط: الاسم، الرابط، النوع)
];
