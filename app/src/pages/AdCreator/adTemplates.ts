// ============ AD TEMPLATES — Canvas Rendering Engine ============

export interface AdTemplate {
    id: string;
    name: string;
    emoji: string;
    width: number;
    height: number;
    category: 'landscape' | 'square' | 'story';
    description: string;
    render: (ctx: CanvasRenderingContext2D, product: AdProduct, options: AdOptions) => void;
}

export interface AdProduct {
    name: string;
    price: number;
    comparePrice?: number;
    image: HTMLImageElement | null;
    description?: string;
}

export interface AdOptions {
    businessName: string;
    badgeText?: string;
    promoText?: string;
    storefront?: string;
}

// ── Helpers ──

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawProductImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, radius = 0) {
    if (!img) {
        ctx.fillStyle = '#e5e7eb';
        roundRect(ctx, x, y, w, h, radius);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('📷', x + w / 2, y + h / 2 + 8);
        return;
    }
    ctx.save();
    if (radius > 0) {
        roundRect(ctx, x, y, w, h, radius);
        ctx.clip();
    }
    // Cover-fit
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > boxRatio) {
        sw = img.height * boxRatio;
        sx = (img.width - sw) / 2;
    } else {
        sh = img.width / boxRatio;
        sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
}

function formatPrice(n: number): string {
    return n.toLocaleString() + '₮';
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string) {
    ctx.font = 'bold 22px system-ui';
    const m = ctx.measureText(text);
    const pw = 16, ph = 8;
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, m.width + pw * 2, 36, 18);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pw, y + 18);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2): number {
    const words = text.split(' ');
    let line = '';
    let lines = 0;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line) {
            lines++;
            if (lines > maxLines) break;
            ctx.fillText(line.trim(), x, y);
            y += lineHeight;
            line = word + ' ';
        } else {
            line = test;
        }
    }
    if (lines < maxLines) {
        ctx.fillText(line.trim(), x, y);
        y += lineHeight;
    }
    return y;
}

function drawWatermark(ctx: CanvasRenderingContext2D, text: string, w: number, h: number) {
    if (!text) return;
    ctx.font = 'bold 14px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, w - 20, h - 14);
}

// ============ TEMPLATES ============

const templateSale: AdTemplate = {
    id: 'sale', name: 'Хямдрал', emoji: '🔥',
    width: 1200, height: 628, category: 'landscape',
    description: 'Хямдралын зар — том зураг + хуучин/шинэ үнэ',
    render(ctx, p, o) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#ff6b35');
        grad.addColorStop(1, '#d63031');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        // Decorative circles
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.arc(1100, 100, 200, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(100, 550, 150, 0, Math.PI * 2); ctx.fill();
        // Product image
        drawProductImage(ctx, p.image, 60, 60, 500, 508, 24);
        // Badge
        const badge = o.badgeText || 'ХЯМДРАЛ';
        ctx.font = 'bold 28px system-ui';
        const bm = ctx.measureText(badge);
        ctx.fillStyle = '#fff';
        roundRect(ctx, 600, 60, bm.width + 40, 50, 25);
        ctx.fill();
        ctx.fillStyle = '#d63031';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, 620, 85);
        // Product name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 600, 140, 560, 44, 3);
        // Compare price (strikethrough)
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 28px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const oldPrice = formatPrice(p.comparePrice);
            ctx.fillText(oldPrice, 600, 340);
            const tw = ctx.measureText(oldPrice).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(600, 354); ctx.lineTo(600 + tw, 354); ctx.stroke();
        }
        // Price
        ctx.font = 'bold 64px system-ui';
        ctx.fillStyle = '#fff';
        ctx.fillText(formatPrice(p.price), 600, p.comparePrice ? 380 : 340);
        // Business name
        drawWatermark(ctx, o.businessName, 1200, 628);
        // Storefront link
        if (o.storefront) {
            ctx.font = '600 20px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'left';
            ctx.fillText('🛒 ' + o.storefront, 600, 560);
        }
    }
};

const templateNewArrival: AdTemplate = {
    id: 'new_arrival', name: 'Шинэ ирц', emoji: '✨',
    width: 1200, height: 628, category: 'landscape',
    description: 'Шинэ бараа — gradient + "ШИНЭ" badge',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#667eea');
        grad.addColorStop(1, '#764ba2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.arc(300, 314, 400, 0, Math.PI * 2); ctx.fill();
        // Image
        drawProductImage(ctx, p.image, 620, 40, 540, 548, 20);
        // Badge
        drawBadge(ctx, o.badgeText || '✨ ШИНЭ', 60, 60, '#fff', '#764ba2');
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 140, 520, 50, 3);
        // Price
        ctx.font = 'bold 56px system-ui';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(formatPrice(p.price), 60, 400);
        // Business
        drawWatermark(ctx, o.businessName, 1200, 628);
        if (o.storefront) {
            ctx.font = '600 20px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.textAlign = 'left';
            ctx.fillText('🛒 ' + o.storefront, 60, 560);
        }
    }
};

const templateMinimal: AdTemplate = {
    id: 'minimal', name: 'Минимал', emoji: '💎',
    width: 1200, height: 628, category: 'landscape',
    description: 'Цагаан дэвсгэр — цэвэр, elegant',
    render(ctx, p, o) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, 1200, 628);
        // Subtle border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        roundRect(ctx, 20, 20, 1160, 588, 20);
        ctx.stroke();
        // Image centered
        drawProductImage(ctx, p.image, 60, 60, 480, 508, 16);
        // Name
        ctx.fillStyle = '#111';
        ctx.font = 'bold 34px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 590, 100, 560, 42, 3);
        // Thin line
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(590, 290); ctx.lineTo(1100, 290); ctx.stroke();
        // Price
        ctx.font = 'bold 52px system-ui';
        ctx.fillStyle = '#111';
        ctx.fillText(formatPrice(p.price), 590, 320);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 24px system-ui';
            ctx.fillStyle = '#999';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 590, 390);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(590, 402); ctx.lineTo(590 + tw, 402); ctx.stroke();
        }
        // Business
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#bbb';
        ctx.textAlign = 'right';
        ctx.fillText(o.businessName, 1140, 560);
    }
};

const templatePastel: AdTemplate = {
    id: 'pastel', name: 'Pastel', emoji: '🌸',
    width: 1200, height: 628, category: 'landscape',
    description: 'Зөөлөн pastel өнгө — rounded frame',
    render(ctx, p, o) {
        ctx.fillStyle = '#fce4ec';
        ctx.fillRect(0, 0, 1200, 628);
        // Soft blobs
        ctx.fillStyle = '#f8bbd0';
        ctx.beginPath(); ctx.arc(200, 500, 180, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e1bee7';
        ctx.beginPath(); ctx.arc(1000, 150, 200, 0, Math.PI * 2); ctx.fill();
        // Image with rounded border
        ctx.fillStyle = '#fff';
        roundRect(ctx, 50, 50, 500, 528, 28);
        ctx.fill();
        drawProductImage(ctx, p.image, 60, 60, 480, 508, 22);
        // Name
        ctx.fillStyle = '#4a148c';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 600, 100, 540, 46, 3);
        // Price card
        ctx.fillStyle = '#fff';
        roundRect(ctx, 600, 340, 300, 80, 16);
        ctx.fill();
        ctx.font = 'bold 44px system-ui';
        ctx.fillStyle = '#ad1457';
        ctx.textAlign = 'center';
        ctx.fillText(formatPrice(p.price), 750, 395);
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 600, 460, '#ad1457', '#fff');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateDarkPremium: AdTemplate = {
    id: 'dark_premium', name: 'Dark Premium', emoji: '🖤',
    width: 1200, height: 628, category: 'landscape',
    description: 'Хар дэвсгэр + алтан текст',
    render(ctx, p, o) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 1200, 628);
        // Gold accents
        ctx.strokeStyle = '#c9a43e';
        ctx.lineWidth = 1;
        roundRect(ctx, 30, 30, 1140, 568, 4);
        ctx.stroke();
        // Image
        drawProductImage(ctx, p.image, 60, 60, 480, 508, 8);
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 590, 80, 560, 46, 3);
        // Gold line
        const lg = ctx.createLinearGradient(590, 280, 1100, 280);
        lg.addColorStop(0, '#c9a43e');
        lg.addColorStop(1, 'transparent');
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(590, 280); ctx.lineTo(1100, 280); ctx.stroke();
        // Price
        ctx.font = 'bold 56px system-ui';
        ctx.fillStyle = '#c9a43e';
        ctx.fillText(formatPrice(p.price), 590, 310);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 24px system-ui';
            ctx.fillStyle = '#666';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 590, 385);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(590, 397); ctx.lineTo(590 + tw, 397); ctx.stroke();
        }
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 590, 430, '#c9a43e', '#0a0a0a');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templatePriceFocus: AdTemplate = {
    id: 'price_focus', name: 'Үнэ фокус', emoji: '🎯',
    width: 1200, height: 628, category: 'landscape',
    description: 'Үнэ том, бараа жижиг — үнэ дээр фокус',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        // Small product image top-right
        drawProductImage(ctx, p.image, 820, 60, 320, 320, 20);
        // BIG PRICE
        ctx.font = 'bold 120px system-ui';
        ctx.fillStyle = '#00cec9';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(formatPrice(p.price), 60, 120);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 40px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 60, 260);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(60, 285); ctx.lineTo(60 + tw, 285); ctx.stroke();
        }
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px system-ui';
        wrapText(ctx, p.name, 60, 360, 700, 42, 3);
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 60, 520, '#00cec9', '#1a1a2e');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateFBBlue: AdTemplate = {
    id: 'fb_blue', name: 'FB Blue', emoji: '🟦',
    width: 1200, height: 628, category: 'landscape',
    description: 'Facebook-ийн цэнхэр өнгөтэй',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 0, 628);
        grad.addColorStop(0, '#1877f2');
        grad.addColorStop(1, '#0d47a1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.arc(600, 314, 500, 0, Math.PI * 2); ctx.fill();
        // White card
        ctx.fillStyle = '#fff';
        roundRect(ctx, 40, 40, 540, 548, 20);
        ctx.fill();
        drawProductImage(ctx, p.image, 50, 50, 520, 400, 16);
        // Name on card
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 470, 500, 30, 2);
        // Price on blue side
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 56px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), 630, 150);
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 630, 250, 'rgba(255,255,255,0.2)', '#fff');
        // Store link
        if (o.storefront) {
            ctx.font = 'bold 22px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText('🛒 ' + o.storefront, 630, 460);
        }
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateUrgent: AdTemplate = {
    id: 'urgent', name: 'Яаралтай', emoji: '🔴',
    width: 1200, height: 628, category: 'landscape',
    description: 'Улаан "ХЯЗГААРТАЙ" — urgency стиль',
    render(ctx, p, o) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 1200, 628);
        // Red stripes
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(0, 0, 1200, 8);
        ctx.fillRect(0, 620, 1200, 8);
        // Product
        drawProductImage(ctx, p.image, 60, 50, 460, 520, 16);
        // URGENT badge
        ctx.fillStyle = '#e74c3c';
        roundRect(ctx, 560, 50, 580, 60, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.badgeText || '🔴 ТООГООР ХЯЗГААРТАЙ', 850, 80);
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 560, 140, 580, 46, 3);
        // Price
        ctx.font = 'bold 64px system-ui';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(formatPrice(p.price), 560, 350);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 28px system-ui';
            ctx.fillStyle = '#666';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 560, 430);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(560, 446); ctx.lineTo(560 + tw, 446); ctx.stroke();
        }
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateNature: AdTemplate = {
    id: 'nature', name: 'Байгаль', emoji: '🟢',
    width: 1200, height: 628, category: 'landscape',
    description: 'Ногоон gradient — organic look',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#134e5e');
        grad.addColorStop(1, '#71b280');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.arc(900, 314, 380, 0, Math.PI * 2); ctx.fill();
        // Image
        drawProductImage(ctx, p.image, 620, 40, 540, 548, 20);
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 38px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 80, 520, 50, 3);
        // Price
        ctx.font = 'bold 56px system-ui';
        ctx.fillStyle = '#a8e6cf';
        ctx.fillText(formatPrice(p.price), 60, 360);
        if (o.badgeText) drawBadge(ctx, o.badgeText, 60, 460, 'rgba(255,255,255,0.2)', '#fff');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateSquare: AdTemplate = {
    id: 'square', name: 'Квадрат', emoji: '⬜',
    width: 1080, height: 1080, category: 'square',
    description: 'IG квадрат формат — 1080×1080',
    render(ctx, p, o) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 1080, 1080);
        // Image top
        drawProductImage(ctx, p.image, 40, 40, 1000, 660, 20);
        // Name
        ctx.fillStyle = '#111';
        ctx.font = 'bold 38px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 730, 960, 48, 3);
        // Price
        ctx.font = 'bold 60px system-ui';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(formatPrice(p.price), 60, 900);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 28px system-ui';
            ctx.fillStyle = '#999';
            const pw = ctx.measureText(formatPrice(p.price)).width;
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 60 + pw + 20, 920);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(60 + pw + 20, 935); ctx.lineTo(60 + pw + 20 + tw, 935); ctx.stroke();
        }
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 60, 1010, '#e74c3c', '#fff');
        // Business
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#ccc';
        ctx.textAlign = 'right';
        ctx.fillText(o.businessName, 1020, 1050);
    }
};

const templateStory: AdTemplate = {
    id: 'story', name: 'Story', emoji: '📱',
    width: 1080, height: 1920, category: 'story',
    description: 'FB/IG story формат — 1080×1920',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.5, '#302b63');
        grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);
        // Product image — large center
        drawProductImage(ctx, p.image, 60, 200, 960, 960, 24);
        // Badge top
        if (o.badgeText) {
            ctx.fillStyle = '#ff6b6b';
            roundRect(ctx, 340, 80, 400, 60, 30);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, 540, 110);
        }
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 44px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 540, 1220, 900, 56, 3);
        // Price
        ctx.font = 'bold 80px system-ui';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(formatPrice(p.price), 540, 1480);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 36px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, 540, 1580);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(540 - tw / 2, 1600); ctx.lineTo(540 + tw / 2, 1600); ctx.stroke();
        }
        // Store
        if (o.storefront) {
            ctx.font = 'bold 24px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('🛒 ' + o.storefront, 540, 1780);
        }
        drawWatermark(ctx, o.businessName, 1080, 1920);
    }
};

const templateGradientWave: AdTemplate = {
    id: 'gradient_wave', name: 'Градиент', emoji: '🌊',
    width: 1200, height: 628, category: 'landscape',
    description: 'Олон өнгийн gradient wave',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#fc5c7d');
        grad.addColorStop(0.5, '#6a82fb');
        grad.addColorStop(1, '#05dfd7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        // Wave effect
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        for (let x = 0; x <= 1200; x += 10) {
            ctx.lineTo(x, 400 + Math.sin(x * 0.01) * 60);
        }
        ctx.lineTo(1200, 628); ctx.lineTo(0, 628); ctx.closePath(); ctx.fill();
        // White card
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        roundRect(ctx, 580, 40, 580, 548, 24);
        ctx.fill();
        // Product image
        drawProductImage(ctx, p.image, 40, 60, 500, 508, 20);
        // Name on card
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 30px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 610, 70, 520, 40, 3);
        // Price on card
        ctx.font = 'bold 50px system-ui';
        ctx.fillStyle = '#fc5c7d';
        ctx.fillText(formatPrice(p.price), 610, 360);
        // Badge
        if (o.badgeText) drawBadge(ctx, o.badgeText, 610, 440, '#fc5c7d', '#fff');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

// ============ EXPORT ALL ============

export const AD_TEMPLATES: AdTemplate[] = [
    templateSale,
    templateNewArrival,
    templateMinimal,
    templatePastel,
    templateDarkPremium,
    templatePriceFocus,
    templateFBBlue,
    templateUrgent,
    templateNature,
    templateSquare,
    templateStory,
    templateGradientWave,
];

// ============ RENDER UTILITY ============

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed: ' + src));
        img.src = src;
    });
}

export async function renderAdImage(
    template: AdTemplate,
    product: AdProduct,
    options: AdOptions
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = template.width;
    canvas.height = template.height;
    const ctx = canvas.getContext('2d')!;
    template.render(ctx, product, options);
    return canvas.toDataURL('image/png');
}
