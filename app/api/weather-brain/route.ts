import { NextResponse } from 'next/server';

// هذا الكود يعمل على السيرفر فقط (Server-Side)
// لا يستهلك بطارية المستخدم نهائياً

export async function POST(request: Request) {
  try {
    const { lat, lon } = await request.json();

    // 1. السيرفر هو من يتصل بـ Open-Meteo (أسرع وأوفر للبيانات)
    const params = [
      'temperature_2m', 'wind_speed_10m', 'wind_direction_10m',
      'cape', 'lifted_index', 'showers', 'snow_depth'
    ].join(',');

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${params}&hourly=pressure_msl&forecast_days=1`
    );
    
    const data = await res.json();
    const current = data.current;

    // 2. التحليل الذكي (The Brain) - يتم هنا وليس في الهاتف
    // حساب "مؤشر الخطر" (Risk Score) من 0 إلى 100
    let riskScore = 0;
    let riskLabel = "آمن";
    let alerts = [];

    // تحليل العواصف
    if (current.cape > 500) {
      riskScore += 30;
      alerts.push("جو غير مستقر");
    }
    if (current.cape > 1500) {
      riskScore += 50;
      alerts.push("خطر صواعق مرتفع");
    }

    // تحليل الرياح
    if (current.wind_speed_10m > 40) {
      riskScore += 40;
      alerts.push("رياح عاصفية");
    }

    // تحديد اللون بناءً على النتيجة
    if (riskScore > 70) riskLabel = "خطر";
    else if (riskScore > 30) riskLabel = "حذر";

    // 3. تجهيز بيانات الرياح المخففة (Optimized Wind Vector)
    // نرسل للهاتف فقط ما يحتاجه للرسم
    const windVector = {
      u: current.wind_speed_10m * Math.sin(current.wind_direction_10m * Math.PI / 180),
      v: current.wind_speed_10m * Math.cos(current.wind_direction_10m * Math.PI / 180),
      speed: current.wind_speed_10m
    };

    // إرسال "الزبدة" فقط للهاتف
    return NextResponse.json({
      processed: true,
      location: { lat, lon },
      analysis: {
        score: riskScore,
        label: riskLabel,
        alerts: alerts,
        summary: `الوضع الحالي: ${riskLabel} (${riskScore}%)`
      },
      visuals: {
        wind: windVector,
        temp_color: current.temperature_2m > 30 ? '#ef4444' : '#3b82f6'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Brain malfunction' }, { status: 500 });
  }
}