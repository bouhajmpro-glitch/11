// app/core/analysis/insights.ts
import { WeatherData } from '../weather/types';
import { 
  HeartPulse, Shirt, Palmtree, Car, Bug, Zap, Camera, Home, 
  Thermometer, Activity, Droplets, Wind, Fish, Flame, Smile, 
  Telescope, Tent, Sun, Anchor, Snowflake, Battery, CloudRain, Eye, Umbrella
} from 'lucide-react';

export interface Insight {
  cat: string;
  title: string;
  val: string;
  reason: string;
  icon: any;
  color: string;
}

export const generateInsights = (data: WeatherData): Insight[] => {
  const i: Insight[] = [];
  
  // --- 1. الصحة (Health) ---
  const headache = (data.pressure < 1005 || data.pressure > 1025) ? "خطر مرتفع" : "منخفض";
  i.push({ cat: "الصحة", title: "الصداع النصفي", val: headache, reason: headache === "منخفض" ? "الضغط الجوي مستقر ومثالي." : "تذبذب حاد في الضغط قد يثير الشقيقة.", icon: HeartPulse, color: headache === "منخفض" ? "text-green-500" : "text-red-500" });

  const fluRisk = (data.temp < 10 && data.humidity > 70) ? "مرتفع" : "منخفض";
  i.push({ cat: "الصحة", title: "خطر الإنفلونزا", val: fluRisk, reason: "البرد والرطوبة يضعفان المناعة.", icon: Thermometer, color: fluRisk === "مرتفع" ? "text-red-500" : "text-green-500" });

  const joints = (data.humidity > 80 || data.pressure < 1000) ? "مؤلمة" : "مريحة";
  i.push({ cat: "الصحة", title: "المفاصل", val: joints, reason: "الضغط المنخفض يزيد تمدد الأنسجة.", icon: Activity, color: joints === "مؤلمة" ? "text-orange-500" : "text-green-500" });

  const hydration = data.temp > 25 ? "اشرب بكثرة" : "طبيعي";
  i.push({ cat: "الصحة", title: "الماء", val: hydration, reason: "الحرارة تزيد التعرق.", icon: Droplets, color: "text-blue-500" });

  // --- 2. المنزل (Home) ---
  const laundry = (data.humidity < 50 && data.rainProb < 10) ? "انشر الآن" : "استخدم المجفف";
  i.push({ cat: "المنزل", title: "الغسيل", val: laundry, reason: "الجو جاف ومشمس.", icon: Shirt, color: laundry.includes("انشر") ? "text-green-500" : "text-orange-500" });

  const plants = data.soilMoisture < 0.25 ? "اسقِ فوراً" : "التربة رطبة";
  i.push({ cat: "المنزل", title: "النباتات", val: plants, reason: `رطوبة التربة ${data.soilMoisture.toFixed(2)} م³/م³.`, icon: Palmtree, color: plants.includes("اسق") ? "text-blue-500" : "text-green-500" });

  const ventilation = (data.uvIndex < 8 && data.temp < 28) ? "افتح النوافذ" : "أغلقها";
  i.push({ cat: "المنزل", title: "التهوية", val: ventilation, reason: "جودة الهواء والحرارة مناسبة.", icon: Wind, color: "text-emerald-500" });

  const ac = data.temp > 26 ? "تكييف ضروري" : (data.temp < 18 ? "تدفئة" : "إيقاف");
  i.push({ cat: "المنزل", title: "التكييف", val: ac, reason: "للحفاظ على الطاقة.", icon: Snowflake, color: "text-indigo-500" });

  // --- 3. الخارج (Outdoors) ---
  const carWash = data.rainProb > 30 ? "أجّل الغسيل" : "وقت مثالي";
  i.push({ cat: "الخارج", title: "غسيل السيارة", val: carWash, reason: data.rainProb > 30 ? "مطر متوقع قريباً." : "لا مطر في الأفق.", icon: Car, color: "text-purple-500" });

  const bbq = (data.windSpeed < 15 && data.rainProb < 5) ? "شواء ممتاز" : "صعب";
  i.push({ cat: "الخارج", title: "الشواء", val: bbq, reason: "الرياح هادئة.", icon: Flame, color: "text-orange-600" });

  const fishing = (data.pressure > 1015 && data.pressure < 1025) ? "صيد وفير" : "صيد شحيح";
  i.push({ cat: "الخارج", title: "الصيد", val: fishing, reason: "الأسماك تنشط في الضغط المرتفع.", icon: Fish, color: "text-cyan-600" });

  const drone = (data.windSpeed < 20 && data.windGusts < 30) ? "طيران آمن" : "خطر";
  i.push({ cat: "الخارج", title: "الدرون", val: drone, reason: "سرعة الرياح مناسبة.", icon: Zap, color: drone.includes("آمن") ? "text-green-500" : "text-red-500" });

  // --- 4. البيئة (Nature) ---
  const mosquito = (data.temp > 22 && data.humidity > 60) ? "نشاط مرتفع" : "منخفض";
  i.push({ cat: "البيئة", title: "البعوض", val: mosquito, reason: "يفضل الحرارة والرطوبة.", icon: Bug, color: "text-red-600" });

  const stargazing = (data.cloudCover < 10 && !data.isDay) ? "رصد مذهل" : "محجوب";
  i.push({ cat: "البيئة", title: "النجوم", val: stargazing, reason: "السماء صافية تماماً.", icon: Telescope, color: "text-indigo-400" });

  const frizz = data.dewPoint > 16 ? "شعر مجعد" : "شعر ناعم";
  i.push({ cat: "الجمال", title: "الشعر", val: frizz, reason: "نقطة الندى عالية.", icon: Smile, color: "text-pink-500" });

  const camping = (data.temp > 12 && data.rainProb < 10) ? "ليلة رائعة" : "غير مناسب";
  i.push({ cat: "البيئة", title: "التخييم", val: camping, reason: "الجو معتدل وجاف.", icon: Tent, color: "text-green-700" });

  return i;
};
