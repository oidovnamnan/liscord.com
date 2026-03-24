// ============ AD TEMPLATES — Canvas Rendering Engine ============

export interface AdTemplate {
    id: string;
    name: string;
    emoji: string;
    width: number;
    height: number;
    category: 'landscape' | 'square' | 'story';
    description: string;
    /** If true, this is an overlay template (product image = full background + label card) */
    isOverlay?: boolean;
    render: (ctx: CanvasRenderingContext2D, product: AdProduct, options: AdOptions) => void;
}

export interface AdProduct {
    name: string;
    price: number;
    comparePrice?: number;
    image: HTMLImageElement | null;
    description?: string;
}

export type LabelPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'center';

export interface AdOptions {
    businessName: string;
    badgeText?: string;
    promoText?: string;
    storefront?: string;
    /** Label position for overlay templates */
    labelPosition?: LabelPosition;
    /** Label opacity 0-100 */
    labelOpacity?: number;
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

// ── Label position calculator ──

interface LabelRect { x: number; y: number; w: number; h: number; }

function getLabelRect(canvasW: number, canvasH: number, cardW: number, cardH: number, position: LabelPosition, margin = 40): LabelRect {
    switch (position) {
        case 'top-left': return { x: margin, y: margin, w: cardW, h: cardH };
        case 'top-right': return { x: canvasW - cardW - margin, y: margin, w: cardW, h: cardH };
        case 'bottom-left': return { x: margin, y: canvasH - cardH - margin, w: cardW, h: cardH };
        case 'bottom-right': return { x: canvasW - cardW - margin, y: canvasH - cardH - margin, w: cardW, h: cardH };
        case 'bottom-center': return { x: (canvasW - cardW) / 2, y: canvasH - cardH - margin, w: cardW, h: cardH };
        case 'center': return { x: (canvasW - cardW) / 2, y: (canvasH - cardH) / 2, w: cardW, h: cardH };
        default: return { x: canvasW - cardW - margin, y: canvasH - cardH - margin, w: cardW, h: cardH };
    }
}

function getOpacity(options: AdOptions): number {
    return (options.labelOpacity ?? 95) / 100;
}

// ============ OVERLAY LABEL TEMPLATES ============
// Product image fills the entire canvas. A label card floats on top.

const overlayWhiteCard: AdTemplate = {
    id: 'overlay_white', name: 'Цагаан карт', emoji: '🏷️',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Цагаан карт — цэвэрхэн, мэргэжлийн',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 460, cardH = 280;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        // Card shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        // Blue accent line
        ctx.fillStyle = '#4285f4';
        ctx.fillRect(x + 4, y + 24, 3, cardH - 48);
        // Label
        ctx.fillStyle = '#4285f4'; ctx.font = 'bold 15px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('БҮТЭЭГДЭХҮҮН', x + 24, y + 26);
        // Name
        ctx.fillStyle = '#111'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 54, cardW - 48, 32, 2);
        // Description
        if (p.description) {
            ctx.fillStyle = '#666'; ctx.font = '400 15px system-ui';
            wrapText(ctx, p.description, x + 24, y + 126, cardW - 48, 20, 2);
        }
        // Price
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 40px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 52);
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 18px system-ui'; ctx.fillStyle = '#999';
            const pw = ctx.measureText(formatPrice(p.price)).width;
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, x + 30 + pw, y + cardH - 40);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + 30 + pw, y + cardH - 32); ctx.lineTo(x + 30 + pw + tw, y + cardH - 32); ctx.stroke();
        }
        if (o.badgeText) drawBadge(ctx, o.badgeText, pos.includes('right') ? 30 : 1080 - 200, pos.includes('top') ? 1080 - 60 : 30, '#e74c3c', '#fff');
    }
};

const overlayDarkCard: AdTemplate = {
    id: 'overlay_dark', name: 'Хар карт', emoji: '🖤',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Хар дэвсгэр + алтан үнэ',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 460, cardH = 270;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
        ctx.fillStyle = `rgba(20,20,20,${opacity})`;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        // Gold line
        ctx.fillStyle = '#c9a43e';
        ctx.fillRect(x + 4, y + 24, 3, cardH - 48);
        // Label
        ctx.fillStyle = '#c9a43e'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('PREMIUM', x + 24, y + 28);
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 54, cardW - 48, 32, 2);
        // Description
        if (p.description) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '400 15px system-ui';
            wrapText(ctx, p.description, x + 24, y + 126, cardW - 48, 20, 2);
        }
        // Price gold
        ctx.fillStyle = '#c9a43e'; ctx.font = 'bold 40px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 50);
        if (o.badgeText) drawBadge(ctx, o.badgeText, pos.includes('right') ? 30 : 1080 - 200, pos.includes('top') ? 1080 - 60 : 30, '#c9a43e', '#0a0a0a');
    }
};

const overlayGlassCard: AdTemplate = {
    id: 'overlay_glass', name: 'Шилэн', emoji: '🪟',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Glassmorphism — тунгалаг',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 460, cardH = 260;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(255,255,255,${opacity * 0.75})`;
        roundRect(ctx, x, y, cardW, cardH, 20);
        ctx.fill();
        // Border glow
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.4})`;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, cardW, cardH, 20);
        ctx.stroke();
        ctx.restore();
        // Name
        ctx.fillStyle = '#111'; ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, x + 24, y + 24, cardW - 48, 34, 2);
        // Description
        if (p.description) {
            ctx.fillStyle = '#444'; ctx.font = '400 15px system-ui';
            wrapText(ctx, p.description, x + 24, y + 100, cardW - 48, 20, 2);
        }
        // Price
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 56);
        if (o.badgeText) drawBadge(ctx, o.badgeText, pos.includes('right') ? 30 : 1080 - 200, pos.includes('top') ? 1080 - 60 : 30, '#e74c3c', '#fff');
    }
};

const overlayMinimalStrip: AdTemplate = {
    id: 'overlay_strip', name: 'Зурвас', emoji: '📐',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Доод зурвас — нэр + үнэ',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const opacity = getOpacity(o);
        const pos = o.labelPosition || 'bottom-center';
        const stripH = 160;
        let stripY: number;
        if (pos.includes('top')) stripY = 0;
        else stripY = 1080 - stripH;
        // Background strip
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.7})`;
        ctx.fillRect(0, stripY, 1080, stripH);
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 32px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 40, stripY + 24, 700, 38, 2);
        // Price right
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 48px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(formatPrice(p.price), 1040, stripY + 55);
        if (o.badgeText) {
            ctx.font = 'bold 20px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'right';
            ctx.fillText(o.badgeText, 1040, stripY + 120);
        }
    }
};

const overlayRedTag: AdTemplate = {
    id: 'overlay_red', name: 'Улаан таг', emoji: '🔴',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Улаан дэвсгэр + цагаан текст',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 440, cardH = 250;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(231,76,60,0.3)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        ctx.fillStyle = `rgba(231,76,60,${opacity})`;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || 'ХЯМДРАЛ', x + 24, y + 24);
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 52, cardW - 48, 32, 2);
        // Price
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 56);
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 20px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const pw = ctx.measureText(formatPrice(p.price)).width;
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, x + 30 + pw, y + cardH - 42);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + 30 + pw, y + cardH - 34); ctx.lineTo(x + 30 + pw + tw, y + cardH - 34); ctx.stroke();
        }
    }
};

const overlayBlueTag: AdTemplate = {
    id: 'overlay_blue', name: 'Цэнхэр', emoji: '🔵',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Цэнхэр карт + цагаан текст',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-left';
        const opacity = getOpacity(o);
        const cardW = 440, cardH = 250;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(59,130,246,0.3)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        const grad = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
        grad.addColorStop(0, `rgba(37,99,235,${opacity})`);
        grad.addColorStop(1, `rgba(59,130,246,${opacity})`);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || 'ШИНЭ БАРАА', x + 24, y + 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 52, cardW - 48, 32, 2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 56);
    }
};

const overlayGreenTag: AdTemplate = {
    id: 'overlay_green', name: 'Ногоон', emoji: '🟢',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Ногоон карт — organic look',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 440, cardH = 250;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(16,185,129,0.3)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        const grad = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
        grad.addColorStop(0, `rgba(5,150,105,${opacity})`);
        grad.addColorStop(1, `rgba(16,185,129,${opacity})`);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || 'ХЯМД', x + 24, y + 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 52, cardW - 48, 32, 2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 56);
    }
};

const overlayPurple: AdTemplate = {
    id: 'overlay_purple', name: 'Нил ягаан', emoji: '💜',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Нил ягаан gradient карт',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 460, cardH = 260;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(139,92,246,0.3)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        const grad = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
        grad.addColorStop(0, `rgba(99,102,241,${opacity})`);
        grad.addColorStop(1, `rgba(139,92,246,${opacity})`);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || '✨ ОНЦЛОХ', x + 24, y + 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
        wrapText(ctx, p.name, x + 24, y + 52, cardW - 48, 34, 2);
        if (p.description) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '400 15px system-ui';
            wrapText(ctx, p.description, x + 24, y + 130, cardW - 48, 20, 2);
        }
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 56);
    }
};

const overlayOrangeTag: AdTemplate = {
    id: 'overlay_orange', name: 'Улбар шар', emoji: '🟠',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Улбар шар gradient карт',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-left';
        const opacity = getOpacity(o);
        const cardW = 440, cardH = 240;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(249,115,22,0.3)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        const grad = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
        grad.addColorStop(0, `rgba(234,88,12,${opacity})`);
        grad.addColorStop(1, `rgba(249,115,22,${opacity})`);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || '🔥 SALE', x + 24, y + 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 24, y + 52, cardW - 48, 32, 2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 42px system-ui';
        ctx.fillText(formatPrice(p.price), x + 24, y + cardH - 52);
    }
};

const overlayRoundBadge: AdTemplate = {
    id: 'overlay_round', name: 'Дугуй', emoji: '⭕',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Дугуй badge — үнэ голд',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const sz = 260;
        const margin = 50;
        let cx: number, cy: number;
        if (pos === 'top-left') { cx = margin + sz / 2; cy = margin + sz / 2; }
        else if (pos === 'top-right') { cx = 1080 - margin - sz / 2; cy = margin + sz / 2; }
        else if (pos === 'bottom-left') { cx = margin + sz / 2; cy = 1080 - margin - sz / 2; }
        else if (pos === 'center') { cx = 540; cy = 540; }
        else if (pos === 'bottom-center') { cx = 540; cy = 1080 - margin - sz / 2; }
        else { cx = 1080 - margin - sz / 2; cy = 1080 - margin - sz / 2; }
        // Circle
        ctx.save();
        ctx.shadowColor = 'rgba(231,76,60,0.3)'; ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(231,76,60,${opacity})`;
        ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Price center
        ctx.fillStyle = '#fff'; ctx.font = 'bold 38px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(p.price), cx, cy - 8);
        // Small name
        ctx.font = 'bold 16px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(p.name.substring(0, 20), cx, cy + 32);
        if (o.badgeText) {
            ctx.font = 'bold 14px system-ui';
            ctx.fillText(o.badgeText, cx, cy - 42);
        }
    }
};

// ── Gradient overlay (landscape) ──

const overlayGradientFB: AdTemplate = {
    id: 'overlay_gradient_fb', name: 'FB Overlay', emoji: '🖼️',
    width: 1200, height: 628, category: 'landscape', isOverlay: true,
    description: 'FB хэмжээ — gradient overlay',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1200, 628);
        const opacity = getOpacity(o);
        const grad = ctx.createLinearGradient(0, 300, 0, 628);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, `rgba(0,0,0,${opacity * 0.4})`);
        grad.addColorStop(1, `rgba(0,0,0,${opacity * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 628);
        if (o.badgeText) drawBadge(ctx, o.badgeText, 60, 40, '#e74c3c', '#fff');
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 440, 700, 48, 2);
        ctx.font = 'bold 56px system-ui'; ctx.fillStyle = '#ffd700';
        ctx.fillText(formatPrice(p.price), 60, 545);
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const overlayCatalog: AdTemplate = {
    id: 'overlay_catalog', name: 'Каталог', emoji: '📋',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Дээд зураг + доод цагаан панел',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 760);
        const opacity = getOpacity(o);
        if (o.badgeText) drawBadge(ctx, o.badgeText, 30, 30, '#e74c3c', '#fff');
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fillRect(0, 720, 1080, 360);
        const shadowGrad = ctx.createLinearGradient(0, 700, 0, 740);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 700, 1080, 40);
        ctx.fillStyle = '#6366f1'; ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText((o.promoText || 'БҮТЭЭГДЭХҮҮН').toUpperCase(), 50, 750);
        ctx.fillStyle = '#111'; ctx.font = 'bold 34px system-ui';
        wrapText(ctx, p.name, 50, 782, 980, 42, 2);
        if (p.description) {
            ctx.fillStyle = '#666'; ctx.font = '400 20px system-ui';
            wrapText(ctx, p.description, 50, 870, 980, 26, 2);
        }
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 52px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), 50, 960);
        ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#bbb'; ctx.textAlign = 'right';
        ctx.fillText(o.businessName, 1030, 1040);
    }
};

const overlayStory: AdTemplate = {
    id: 'overlay_story', name: 'Story Overlay', emoji: '📲',
    width: 1080, height: 1920, category: 'story', isOverlay: true,
    description: 'Story — бүтэн зураг + gradient доор',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1920);
        const opacity = getOpacity(o);
        const grad = ctx.createLinearGradient(0, 1200, 0, 1920);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.3, `rgba(0,0,0,${opacity * 0.5})`);
        grad.addColorStop(1, `rgba(0,0,0,${opacity * 0.9})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 1000, 1080, 920);
        if (o.badgeText) {
            ctx.fillStyle = '#e74c3c';
            roundRect(ctx, 340, 80, 400, 60, 30); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, 540, 110);
        }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 48px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 1500, 960, 58, 3);
        ctx.font = 'bold 72px system-ui'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), 60, 1720);
        drawWatermark(ctx, o.businessName, 1080, 1920);
    }
};

// ============ CLASSIC TEMPLATES (non-overlay) ============

const templateSale: AdTemplate = {
    id: 'sale', name: 'Хямдрал', emoji: '🔥',
    width: 1200, height: 628, category: 'landscape',
    description: 'Хямдралын зар — том зураг + үнэ',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 628);
        grad.addColorStop(0, '#ff6b35'); grad.addColorStop(1, '#d63031');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 628);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.arc(1100, 100, 200, 0, Math.PI * 2); ctx.fill();
        drawProductImage(ctx, p.image, 60, 60, 500, 508, 24);
        const badge = o.badgeText || 'ХЯМДРАЛ';
        ctx.font = 'bold 28px system-ui';
        const bm = ctx.measureText(badge);
        ctx.fillStyle = '#fff'; roundRect(ctx, 600, 60, bm.width + 40, 50, 25); ctx.fill();
        ctx.fillStyle = '#d63031'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(badge, 620, 85);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 600, 140, 560, 44, 3);
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '600 28px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const oldPrice = formatPrice(p.comparePrice);
            ctx.fillText(oldPrice, 600, 340);
            const tw = ctx.measureText(oldPrice).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(600, 354); ctx.lineTo(600 + tw, 354); ctx.stroke();
        }
        ctx.font = 'bold 64px system-ui'; ctx.fillStyle = '#fff';
        ctx.fillText(formatPrice(p.price), 600, p.comparePrice ? 380 : 340);
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateMinimal: AdTemplate = {
    id: 'minimal', name: 'Минимал', emoji: '💎',
    width: 1200, height: 628, category: 'landscape',
    description: 'Цагаан дэвсгэр — elegant',
    render(ctx, p, o) {
        ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, 1200, 628);
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 2;
        roundRect(ctx, 20, 20, 1160, 588, 20); ctx.stroke();
        drawProductImage(ctx, p.image, 60, 60, 480, 508, 16);
        ctx.fillStyle = '#111'; ctx.font = 'bold 34px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 590, 100, 560, 42, 3);
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(590, 290); ctx.lineTo(1100, 290); ctx.stroke();
        ctx.font = 'bold 52px system-ui'; ctx.fillStyle = '#111';
        ctx.fillText(formatPrice(p.price), 590, 320);
        ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#bbb'; ctx.textAlign = 'right';
        ctx.fillText(o.businessName, 1140, 560);
    }
};

const templateDarkPremium: AdTemplate = {
    id: 'dark_premium', name: 'Dark Premium', emoji: '🖤',
    width: 1200, height: 628, category: 'landscape',
    description: 'Хар дэвсгэр + алтан текст',
    render(ctx, p, o) {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 1200, 628);
        ctx.strokeStyle = '#c9a43e'; ctx.lineWidth = 1;
        roundRect(ctx, 30, 30, 1140, 568, 4); ctx.stroke();
        drawProductImage(ctx, p.image, 60, 60, 480, 508, 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 590, 80, 560, 46, 3);
        const lg = ctx.createLinearGradient(590, 280, 1100, 280);
        lg.addColorStop(0, '#c9a43e'); lg.addColorStop(1, 'transparent');
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(590, 280); ctx.lineTo(1100, 280); ctx.stroke();
        ctx.font = 'bold 56px system-ui'; ctx.fillStyle = '#c9a43e';
        ctx.fillText(formatPrice(p.price), 590, 310);
        if (o.badgeText) drawBadge(ctx, o.badgeText, 590, 430, '#c9a43e', '#0a0a0a');
        drawWatermark(ctx, o.businessName, 1200, 628);
    }
};

const templateSquare: AdTemplate = {
    id: 'square', name: 'Квадрат', emoji: '⬜',
    width: 1080, height: 1080, category: 'square',
    description: 'IG квадрат — 1080×1080',
    render(ctx, p, o) {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1080);
        drawProductImage(ctx, p.image, 40, 40, 1000, 660, 20);
        ctx.fillStyle = '#111'; ctx.font = 'bold 38px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 60, 730, 960, 48, 3);
        ctx.font = 'bold 60px system-ui'; ctx.fillStyle = '#e74c3c';
        ctx.fillText(formatPrice(p.price), 60, 900);
        if (o.badgeText) drawBadge(ctx, o.badgeText, 60, 1010, '#e74c3c', '#fff');
        ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#ccc';
        ctx.textAlign = 'right'; ctx.fillText(o.businessName, 1020, 1050);
    }
};

const templateStory: AdTemplate = {
    id: 'story', name: 'Story', emoji: '📱',
    width: 1080, height: 1920, category: 'story',
    description: 'Story формат — 1080×1920',
    render(ctx, p, o) {
        const grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, '#0f0c29'); grad.addColorStop(0.5, '#302b63'); grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);
        drawProductImage(ctx, p.image, 60, 200, 960, 960, 24);
        if (o.badgeText) {
            ctx.fillStyle = '#ff6b6b'; roundRect(ctx, 340, 80, 400, 60, 30); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, 540, 110);
        }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 540, 1220, 900, 56, 3);
        ctx.font = 'bold 80px system-ui'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
        ctx.fillText(formatPrice(p.price), 540, 1480);
        drawWatermark(ctx, o.businessName, 1080, 1920);
    }
};

// ── Content-focused templates (different card layouts) ──

const overlayPriceBig: AdTemplate = {
    id: 'overlay_price_big', name: 'Үнэ том', emoji: '💰',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Үнэ хамгийн том, нэр жижиг',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 420, cardH = 220;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 6;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.restore();
        // PRICE dominant at top
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 56px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(formatPrice(p.price), x + cardW / 2, y + 20);
        // Compare price
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 20px system-ui'; ctx.fillStyle = '#aaa';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, x + cardW / 2, y + 82);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x + cardW / 2 - tw / 2, y + 96);
            ctx.lineTo(x + cardW / 2 + tw / 2, y + 96); ctx.stroke();
        }
        // Divider
        ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 24, y + 110); ctx.lineTo(x + cardW - 24, y + 110); ctx.stroke();
        // Name below small
        ctx.fillStyle = '#333'; ctx.font = '600 18px system-ui';
        ctx.textAlign = 'center';
        wrapText(ctx, p.name, x + cardW / 2, y + 125, cardW - 40, 22, 2);
        // Badge/promo
        if (o.badgeText) {
            ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 12px system-ui';
            ctx.fillText(o.badgeText, x + cardW / 2, y + cardH - 20);
        }
    }
};

const overlaySplitInfo: AdTemplate = {
    id: 'overlay_split', name: 'Хуваасан', emoji: '◧',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Зүүн тал мэдээлэл, баруун тал тунгалаг',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const opacity = getOpacity(o);
        const pos = o.labelPosition || 'bottom-left';
        const isLeft = pos.includes('left') || pos === 'center' || pos === 'bottom-center';
        const panelW = 480;
        const panelX = isLeft ? 0 : 1080 - panelW;
        // Side panel gradient
        const grad = ctx.createLinearGradient(
            isLeft ? 0 : 1080, 0,
            isLeft ? panelW : 1080 - panelW, 0
        );
        grad.addColorStop(0, `rgba(0,0,0,${opacity * 0.85})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(panelX, 0, panelW, 1080);
        // Content
        const textX = isLeft ? 50 : 1080 - panelW + 50;
        // Badge
        if (o.badgeText) {
            ctx.fillStyle = '#e74c3c';
            roundRect(ctx, textX, 60, ctx.measureText(o.badgeText).width + 28 || 140, 34, 17);
            ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, textX + 14, 77);
        }
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, textX, 130, panelW - 100, 44, 4);
        // Description
        if (p.description) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '400 16px system-ui';
            wrapText(ctx, p.description, textX, 340, panelW - 100, 22, 3);
        }
        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(textX, 440); ctx.lineTo(textX + panelW - 100, 440); ctx.stroke();
        // Price
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 52px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), textX, 470);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 22px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, textX, 540);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(textX, 555); ctx.lineTo(textX + tw, 555); ctx.stroke();
        }
        // Store
        if (o.storefront) {
            ctx.font = '600 16px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('🛒 ' + o.storefront, textX, 900);
        }
        drawWatermark(ctx, o.businessName, 1080, 1080);
    }
};

const overlayPillTag: AdTemplate = {
    id: 'overlay_pill', name: 'Шошго пилл', emoji: '💊',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Жижигхэн pill хэлбэрийн шошго',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-left';
        const opacity = getOpacity(o);
        // Name pill
        ctx.font = 'bold 24px system-ui';
        const nameW = Math.min(ctx.measureText(p.name).width + 40, 800);
        const priceText = formatPrice(p.price);
        ctx.font = 'bold 28px system-ui';
        const priceW = ctx.measureText(priceText).width + 40;
        const totalW = nameW + priceW + 8;
        const pillH = 56;
        const margin = 40;
        let startX: number, startY: number;
        if (pos.includes('top')) startY = margin;
        else if (pos === 'center') startY = (1080 - pillH) / 2;
        else startY = 1080 - pillH - margin;
        if (pos.includes('left')) startX = margin;
        else if (pos.includes('right')) startX = 1080 - totalW - margin;
        else startX = (1080 - totalW) / 2;
        // Name pill (dark)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.85})`;
        roundRect(ctx, startX, startY, nameW, pillH, 28);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const shortName = p.name.length > 30 ? p.name.substring(0, 28) + '…' : p.name;
        ctx.fillText(shortName, startX + nameW / 2, startY + pillH / 2);
        // Price pill (red)
        ctx.save();
        ctx.shadowColor = 'rgba(231,76,60,0.3)'; ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(231,76,60,${opacity})`;
        roundRect(ctx, startX + nameW + 8, startY, priceW, pillH, 28);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        ctx.fillText(priceText, startX + nameW + 8 + priceW / 2, startY + pillH / 2);
        // Badge separate
        if (o.badgeText) {
            const badgeY = pos.includes('top') ? startY + pillH + 12 : startY - 46;
            drawBadge(ctx, o.badgeText, startX, badgeY, '#111', '#fff');
        }
    }
};

const overlayFullInfo: AdTemplate = {
    id: 'overlay_full_info', name: 'Бүрэн карт', emoji: '📝',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Бүтэн өргөн — бүх мэдээлэлтэй',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const opacity = getOpacity(o);
        const pos = o.labelPosition || 'bottom-center';
        const cardW = 1000, cardH = 240;
        const margin = 40;
        let cardY: number;
        if (pos.includes('top')) cardY = margin;
        else if (pos === 'center') cardY = (1080 - cardH) / 2;
        else cardY = 1080 - cardH - margin;
        const cardX = (1080 - cardW) / 2;
        // Wide card
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 6;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.restore();
        // Layout: [Badge] [Name + Desc] [Price]
        // Badge column
        if (o.badgeText) {
            ctx.fillStyle = '#e74c3c';
            roundRect(ctx, cardX + 20, cardY + 20, 80, 80, 14);
            ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            // Split badge text into 2 lines if needed
            const words = o.badgeText.split(' ');
            if (words.length > 1) {
                ctx.fillText(words[0], cardX + 60, cardY + 54);
                ctx.fillText(words.slice(1).join(' '), cardX + 60, cardY + 70);
            } else {
                ctx.fillText(o.badgeText, cardX + 60, cardY + 60);
            }
        }
        // Name + description center
        const nameX = o.badgeText ? cardX + 120 : cardX + 24;
        ctx.fillStyle = '#111'; ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, nameX, cardY + 28, 540, 34, 2);
        if (p.description) {
            ctx.fillStyle = '#888'; ctx.font = '400 15px system-ui';
            wrapText(ctx, p.description, nameX, cardY + 110, 540, 20, 3);
        }
        // Price right
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 46px system-ui';
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText(formatPrice(p.price), cardX + cardW - 24, cardY + 40);
        // Compare price
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 20px system-ui'; ctx.fillStyle = '#bbb';
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, cardX + cardW - 24, cardY + 100);
            const tw = ctx.measureText(old).width;
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + cardW - 24 - tw, cardY + 113);
            ctx.lineTo(cardX + cardW - 24, cardY + 113);
            ctx.stroke();
        }
        // Business name
        ctx.font = '600 14px system-ui'; ctx.fillStyle = '#bbb';
        ctx.textAlign = 'right';
        ctx.fillText(o.businessName, cardX + cardW - 24, cardY + cardH - 30);
        // Storefront
        if (o.storefront) {
            ctx.textAlign = 'left';
            ctx.fillText('🛒 ' + o.storefront, nameX, cardY + cardH - 30);
        }
    }
};

// ── 10 PREMIUM OVERLAY TEMPLATES ──

const overlayDiagonal: AdTemplate = {
    id: 'overlay_diagonal', name: 'Диагональ', emoji: '📐',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Диагональ хэлбэрийн шошго',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const opacity = getOpacity(o);
        const pos = o.labelPosition || 'bottom-right';
        // Diagonal slash
        ctx.save();
        const isRight = pos.includes('right') || pos === 'bottom-center';
        const isTop = pos.includes('top');
        ctx.translate(isRight ? 1080 : 0, isTop ? 0 : 1080);
        ctx.rotate(isRight ? (isTop ? 0.35 : -0.35) : (isTop ? -0.35 : 0.35));
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.88})`;
        ctx.fillRect(-200, isTop ? -20 : -220, 900, 220);
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.name.substring(0, 35), 250, isTop ? 60 : -140);
        // Price
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), 250, isTop ? 120 : -70);
        // Badge
        if (o.badgeText) {
            ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 16px system-ui';
            ctx.fillText(o.badgeText, 250, isTop ? 18 : -190);
        }
        ctx.restore();
    }
};

const overlayNeon: AdTemplate = {
    id: 'overlay_neon', name: 'Неон', emoji: '✨',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Неон гэрлийн хүрээтэй карт',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const cardW = 440, cardH = 260;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        // Neon glow
        ctx.save();
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 25;
        ctx.strokeStyle = `rgba(0,255,136,${opacity})`;
        ctx.lineWidth = 3;
        roundRect(ctx, x, y, cardW, cardH, 14);
        ctx.stroke();
        // Inner glow line
        ctx.shadowBlur = 15;
        roundRect(ctx, x + 3, y + 3, cardW - 6, cardH - 6, 12);
        ctx.stroke();
        ctx.restore();
        // Dark fill
        ctx.fillStyle = `rgba(8,8,8,${opacity * 0.92})`;
        roundRect(ctx, x + 4, y + 4, cardW - 8, cardH - 8, 11);
        ctx.fill();
        // Neon label
        ctx.fillStyle = '#00ff88'; ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.badgeText || '★ ОНЦЛОХ', x + 22, y + 22);
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui';
        wrapText(ctx, p.name, x + 22, y + 50, cardW - 44, 32, 2);
        // Price neon
        ctx.save();
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#00ff88'; ctx.font = 'bold 44px system-ui';
        ctx.fillText(formatPrice(p.price), x + 22, y + cardH - 58);
        ctx.restore();
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 18px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
            const pw = ctx.measureText(formatPrice(p.price)).width;
            const old = formatPrice(p.comparePrice);
            ctx.fillText(old, x + 28 + pw, y + cardH - 42);
        }
    }
};

const overlayMiniTag: AdTemplate = {
    id: 'overlay_mini', name: 'Мини тэг', emoji: '🔖',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Маш жижиг, нямбай шошго',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-left';
        const opacity = getOpacity(o);
        const tagW = 280, tagH = 100;
        const { x, y } = getLabelRect(1080, 1080, tagW, tagH, pos, 24);
        // Tiny rounded card
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, x, y, tagW, tagH, 14);
        ctx.fill();
        ctx.restore();
        // Name tiny
        ctx.fillStyle = '#333'; ctx.font = '600 14px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const shortName = p.name.length > 25 ? p.name.substring(0, 23) + '…' : p.name;
        ctx.fillText(shortName, x + 14, y + 14);
        // Price bold
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 32px system-ui';
        ctx.fillText(formatPrice(p.price), x + 14, y + 40);
        // Color accent dot
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath(); ctx.arc(x + tagW - 24, y + tagH / 2, 8, 0, Math.PI * 2); ctx.fill();
    }
};

const overlayStriped: AdTemplate = {
    id: 'overlay_striped', name: 'Зураасан', emoji: '🏳️',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Судалтай banner шошго',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-center';
        const opacity = getOpacity(o);
        const bW = 700, bH = 160;
        const margin = 40;
        let bx: number, by: number;
        if (pos.includes('left')) bx = margin;
        else if (pos.includes('right')) bx = 1080 - bW - margin;
        else bx = (1080 - bW) / 2;
        if (pos.includes('top')) by = margin;
        else if (pos === 'center') by = (1080 - bH) / 2;
        else by = 1080 - bH - margin;
        // Banner with stripes
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(220,38,38,${opacity})`;
        roundRect(ctx, bx, by, bW, bH, 12);
        ctx.fill();
        ctx.restore();
        // Diagonal stripes
        ctx.save();
        roundRect(ctx, bx, by, bW, bH, 12);
        ctx.clip();
        ctx.strokeStyle = `rgba(255,255,255,0.08)`;
        ctx.lineWidth = 18;
        for (let i = -bH; i < bW + bH; i += 36) {
            ctx.beginPath();
            ctx.moveTo(bx + i, by);
            ctx.lineTo(bx + i - bH, by + bH);
            ctx.stroke();
        }
        ctx.restore();
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, bx + bW / 2, by + 20, bW - 40, 34, 2);
        // Price
        ctx.fillStyle = '#fff'; ctx.font = 'bold 42px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(formatPrice(p.price), bx + bW / 2, by + bH - 55);
    }
};

const overlayCTA: AdTemplate = {
    id: 'overlay_cta', name: 'Дуудлага', emoji: '🛒',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Call-to-action товчтой',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-center';
        const opacity = getOpacity(o);
        const cardW = 520, cardH = 260;
        const { x, y } = getLabelRect(1080, 1080, cardW, cardH, pos);
        // Card
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 25;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, x, y, cardW, cardH, 18);
        ctx.fill();
        ctx.restore();
        // Name
        ctx.fillStyle = '#111'; ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, x + 22, y + 20, cardW - 44, 30, 2);
        // Price
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 38px system-ui';
        ctx.fillText(formatPrice(p.price), x + 22, y + 95);
        // Compare
        if (p.comparePrice && p.comparePrice > p.price) {
            ctx.font = '500 18px system-ui'; ctx.fillStyle = '#aaa';
            const pw = ctx.measureText(formatPrice(p.price)).width;
            ctx.fillText(formatPrice(p.comparePrice), x + 28 + pw, y + 112);
        }
        // CTA Button
        const btnW = cardW - 44, btnH = 48, btnX = x + 22, btnY = y + cardH - 68;
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
        btnGrad.addColorStop(0, '#8b5cf6'); btnGrad.addColorStop(1, '#6366f1');
        ctx.fillStyle = btnGrad;
        roundRect(ctx, btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.badgeText || '🛒 Худалдаж авах', btnX + btnW / 2, btnY + btnH / 2);
    }
};

const overlayDualCard: AdTemplate = {
    id: 'overlay_dual', name: 'Хос карт', emoji: '🃏',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Хос жижиг карт — нэр + үнэ тусдаа',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const margin = 30;
        const nameW = 360, nameH = 90, priceW = 200, priceH = 70;
        let baseX: number, baseY: number;
        if (pos.includes('left')) baseX = margin;
        else if (pos.includes('right')) baseX = 1080 - nameW - margin;
        else baseX = (1080 - nameW) / 2;
        if (pos.includes('top')) baseY = margin;
        else if (pos === 'center') baseY = (1080 - nameH - priceH - 10) / 2;
        else baseY = 1080 - nameH - priceH - 10 - margin;
        // Name card
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, baseX, baseY, nameW, nameH, 14);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#111'; ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, baseX + 16, baseY + 16, nameW - 32, 28, 2);
        // Price card (offset slightly right)
        const priceX = baseX + 20, priceY = baseY + nameH + 10;
        ctx.save();
        ctx.shadowColor = 'rgba(231,76,60,0.2)'; ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(231,76,60,${opacity})`;
        roundRect(ctx, priceX, priceY, priceW, priceH, 14);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 30px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(p.price), priceX + priceW / 2, priceY + priceH / 2);
    }
};

const overlayFrame: AdTemplate = {
    id: 'overlay_frame', name: 'Хүрээ', emoji: '🖼️',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Elegant хүрээ + доод мэдээлэл',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const opacity = getOpacity(o);
        // Elegant thin frame
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.9})`;
        ctx.lineWidth = 3;
        roundRect(ctx, 30, 30, 1020, 1020, 8);
        ctx.stroke();
        // Inner frame
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.4})`;
        ctx.lineWidth = 1;
        roundRect(ctx, 42, 42, 996, 996, 6);
        ctx.stroke();
        // Bottom info bar inside frame
        const barH = 130;
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.7})`;
        ctx.fillRect(43, 1080 - 43 - barH, 994, barH);
        const barY = 1080 - 43 - barH;
        // Name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 70, barY + 18, 600, 34, 2);
        // Price right
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 42px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(formatPrice(p.price), 1010, barY + 20);
        // Business
        ctx.font = '600 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'right';
        ctx.fillText(o.businessName, 1010, barY + barH - 28);
        // Badge top-left
        if (o.badgeText) {
            ctx.fillStyle = `rgba(231,76,60,${opacity})`;
            roundRect(ctx, 43, 43, 200, 50, 0);
            ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, 143, 68);
        }
    }
};

const overlayBubble: AdTemplate = {
    id: 'overlay_bubble', name: 'Бөмбөлөг', emoji: '💬',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Бөмбөлөг хэлбэрийн мессеж',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        const bW = 420, bH = 200;
        const { x, y } = getLabelRect(1080, 1080, bW, bH + 20, pos);
        // Speech bubble
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 20;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        roundRect(ctx, x, y, bW, bH, 20);
        ctx.fill();
        // Tail
        ctx.beginPath();
        const tailX = pos.includes('left') ? x + 60 : x + bW - 60;
        const tailDir = pos.includes('top') ? -1 : 1;
        const tailBase = pos.includes('top') ? y : y + bH;
        ctx.moveTo(tailX - 15, tailBase);
        ctx.lineTo(tailX + 5, tailBase + 22 * tailDir);
        ctx.lineTo(tailX + 20, tailBase);
        ctx.fill();
        ctx.restore();
        // Name
        ctx.fillStyle = '#111'; ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, x + 22, y + 18, bW - 44, 28, 2);
        // Divider dots
        ctx.fillStyle = '#ddd';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.arc(x + 22 + i * 12, y + 90, 2, 0, Math.PI * 2); ctx.fill();
        }
        // Price
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 40px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(p.price), x + 22, y + 110);
        // Badge right
        if (o.badgeText) {
            ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(o.badgeText, x + bW - 22, y + bH - 28);
        }
    }
};

const overlaySeal: AdTemplate = {
    id: 'overlay_seal', name: 'Тамга', emoji: '🔴',
    width: 1080, height: 1080, category: 'square', isOverlay: true,
    description: 'Тамга хэлбэрийн дугуй + нэр зурвас',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1080);
        const pos = o.labelPosition || 'bottom-right';
        const opacity = getOpacity(o);
        // Price seal (large circle)
        const sz = 220;
        const margin = 50;
        let cx: number, cy: number;
        if (pos === 'top-left') { cx = margin + sz / 2; cy = margin + sz / 2; }
        else if (pos === 'top-right') { cx = 1080 - margin - sz / 2; cy = margin + sz / 2; }
        else if (pos === 'bottom-left') { cx = margin + sz / 2; cy = 1080 - margin - sz / 2 - 60; }
        else if (pos === 'center') { cx = 540; cy = 480; }
        else if (pos === 'bottom-center') { cx = 540; cy = 1080 - margin - sz / 2 - 60; }
        else { cx = 1080 - margin - sz / 2; cy = 1080 - margin - sz / 2 - 60; }
        // Outer ring
        ctx.save();
        ctx.shadowColor = 'rgba(220,38,38,0.3)'; ctx.shadowBlur = 20;
        ctx.strokeStyle = `rgba(220,38,38,${opacity})`;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2); ctx.stroke();
        // Inner dashed ring
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, sz / 2 - 12, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Fill
        ctx.fillStyle = `rgba(220,38,38,${opacity * 0.9})`;
        ctx.beginPath(); ctx.arc(cx, cy, sz / 2 - 18, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Price
        ctx.fillStyle = '#fff'; ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(p.price), cx, cy - 6);
        // Small text
        ctx.font = 'bold 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(o.badgeText || 'ОНЦЛОХ ҮНЭ', cx, cy + 28);
        // Name strip below seal
        const stripW = 500, stripH = 50;
        const stripX = cx - stripW / 2, stripY = cy + sz / 2 + 14;
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.8})`;
        roundRect(ctx, stripX, stripY, stripW, stripH, 25);
        ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const shortName = p.name.length > 35 ? p.name.substring(0, 33) + '…' : p.name;
        ctx.fillText(shortName, cx, stripY + stripH / 2);
    }
};

const overlaySwipe: AdTemplate = {
    id: 'overlay_swipe', name: 'Свайп', emoji: '👆',
    width: 1080, height: 1920, category: 'story', isOverlay: true,
    description: 'Story свайп — дараах мэдрэгч загвар',
    render(ctx, p, o) {
        drawProductImage(ctx, p.image, 0, 0, 1080, 1920);
        const opacity = getOpacity(o);
        // Bottom gradient
        const grad = ctx.createLinearGradient(0, 1300, 0, 1920);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.3, `rgba(0,0,0,${opacity * 0.5})`);
        grad.addColorStop(1, `rgba(0,0,0,${opacity * 0.95})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 1100, 1080, 820);
        // Badge pill top
        if (o.badgeText) {
            const bw = ctx.measureText(o.badgeText).width + 40 || 160;
            ctx.fillStyle = '#e74c3c';
            roundRect(ctx, (1080 - bw) / 2, 100, bw, 50, 25);
            ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(o.badgeText, 540, 125);
        }
        // Product name
        ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        wrapText(ctx, p.name, 540, 1450, 920, 54, 3);
        // Price
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 68px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(formatPrice(p.price), 540, 1660);
        // Swipe up indicator
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(520, 1810); ctx.lineTo(540, 1790); ctx.lineTo(560, 1810);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '600 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Дээш шудрах', 540, 1830);
        // Store
        drawWatermark(ctx, o.businessName, 1080, 1870);
    }
};

// ============ EXPORT ALL ============

export const AD_TEMPLATES: AdTemplate[] = [
    // Overlay label templates (primary — best for ads)
    overlayWhiteCard,
    overlayDarkCard,
    overlayGlassCard,
    overlayMinimalStrip,
    overlayRedTag,
    overlayBlueTag,
    overlayGreenTag,
    overlayPurple,
    overlayOrangeTag,
    overlayRoundBadge,
    overlayPriceBig,
    overlaySplitInfo,
    overlayPillTag,
    overlayFullInfo,
    overlayCatalog,
    overlayGradientFB,
    overlayStory,
    overlayDiagonal,
    overlayNeon,
    overlayMiniTag,
    overlayStriped,
    overlayCTA,
    overlayDualCard,
    overlayFrame,
    overlayBubble,
    overlaySeal,
    overlaySwipe,
    // Classic templates
    templateSale,
    templateMinimal,
    templateDarkPremium,
    templateSquare,
    templateStory,
];

// ============ RENDER UTILITY ============

/**
 * Load image for canvas use with multiple fallback strategies:
 * 1. fetch→blob→objectURL (bypasses CORS taint)
 * 2. img with crossOrigin='anonymous' (needs CORS headers)
 * 3. img WITHOUT crossOrigin (always works, but canvas gets tainted)
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
    // Strategy 1: fetch→blob (best — bypasses canvas taint)
    try {
        const response = await fetch(src, { mode: 'cors' });
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            return await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Blob load failed')); };
                img.src = url;
            });
        }
    } catch { /* fall through */ }

    // Strategy 2: img with crossOrigin (needs server CORS)
    try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('crossOrigin load failed'));
            img.src = src;
        });
    } catch { /* fall through */ }

    // Strategy 3: img WITHOUT crossOrigin (always works, canvas gets tainted)
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
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
    try {
        return canvas.toDataURL('image/png');
    } catch {
        // Canvas tainted by cross-origin image — re-render without image
        const ctx2 = canvas.getContext('2d')!;
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        template.render(ctx2, { ...product, image: null }, options);
        return canvas.toDataURL('image/png');
    }
}

