import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!DOCTYPE html>
<html lang="mn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Нууцлалын Бодлого - Liscord</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #334155; line-height: 1.7; }
        .container { max-width: 720px; margin: 0 auto; padding: 40px 24px; }
        h1 { font-size: 1.8rem; color: #0f172a; margin-bottom: 8px; }
        .date { color: #94a3b8; font-size: 0.85rem; margin-bottom: 32px; }
        h2 { font-size: 1.15rem; color: #1e293b; margin: 24px 0 8px; }
        p, li { font-size: 0.95rem; margin-bottom: 12px; }
        ul { padding-left: 24px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.82rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Нууцлалын Бодлого</h1>
        <p class="date">Сүүлд шинэчилсэн: 2026 оны 3-р сарын 18</p>

        <h2>1. Ерөнхий мэдээлэл</h2>
        <p>Liscord ("бид", "манай") нь таны хувийн мэдээллийн нууцлалыг хамгаалахыг чухалчилдаг. Энэхүү бодлого нь бидний цуглуулж, ашиглаж буй мэдээллийн талаар тайлбарлана.</p>

        <h2>2. Цуглуулах мэдээлэл</h2>
        <p>Бид дараах мэдээллийг цуглуулж болно:</p>
        <ul>
            <li><strong>Facebook Messenger мэдээлэл:</strong> Таны нэр, профайл зураг, мессежийн агуулга — зөвхөн харилцагчдад үйлчилгээ үзүүлэх зорилгоор</li>
            <li><strong>Захиалгын мэдээлэл:</strong> Нэр, утас, хаяг — захиалга боловсруулах зорилгоор</li>
            <li><strong>Төлбөрийн мэдээлэл:</strong> Төлбөрийн дүн, төлөв — зөвхөн QPay-ээр дамжуулан боловсруулна</li>
        </ul>

        <h2>3. Мэдээллийн ашиглалт</h2>
        <p>Таны мэдээллийг зөвхөн дараах зорилгоор ашиглана:</p>
        <ul>
            <li>Захиалга боловсруулах, хүргэлт хийх</li>
            <li>Messenger-ээр харилцах, хариу өгөх</li>
            <li>Гишүүнчлэлийн үйлчилгээ үзүүлэх</li>
        </ul>

        <h2>4. Мэдээллийн хамгаалалт</h2>
        <p>Бид таны мэдээллийг Google Firebase-ийн аюулгүй дэд бүтцэд хадгалдаг бөгөөд зөвхөн эрх бүхий ажилтнууд хандах боломжтой.</p>

        <h2>5. Гуравдагч талд дамжуулалт</h2>
        <p>Бид таны мэдээллийг гуравдагч талд худалдахгүй, түрээслэхгүй. Зөвхөн төлбөрийн боловсруулалт (QPay) болон Facebook Messenger API-д шаардлагатай хүрээнд дамжуулна.</p>

        <h2>6. Мэдээллийн устгал</h2>
        <p>Та хүссэн үедээ бидэнтэй холбогдож өөрийн хувийн мэдээллийг устгуулах хүсэлт гаргаж болно. Устгалын хүсэлтийг 30 хоногийн дотор биелүүлнэ.</p>

        <h2>7. Холбоо барих</h2>
        <p>Нууцлалтай холбоотой асуулт байвал: <strong>oidovnamnan7@gmail.com</strong></p>

        <div class="footer">
            <p>© 2026 Liscord. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
    </div>
</body>
</html>`);
}
