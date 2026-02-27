export interface StorefrontTheme {
    id: string;
    name: string;
    description: string;
    color: string;
    price: number;
    isPremium: boolean;
    previewUrl?: string;
    categories?: string[]; // Recommended for these business categories
}

export const STOREFRONT_THEMES: StorefrontTheme[] = [
    { id: 'minimal', name: 'Minimalist Grid', description: 'Цэмцгэр, Apple хэв маяг. Үндсэн загвар.', color: '#f3f4f6', price: 0, isPremium: false, categories: ['general', 'online_shop', 'custom'] },
    { id: 'editorial', name: 'Editorial', description: 'Vogue/Zara хувцас загварын сэтгүүл шиг харагдац.', color: '#fdf6e3', price: 49000, isPremium: true, categories: ['online_shop', 'tailoring', 'photo_studio'] },
    { id: 'commerce', name: 'Dynamic Commerce', description: 'Amazon/Shopee хэв маяг, олон бараанд тохиромжтой.', color: '#e0f2fe', price: 59000, isPremium: true, categories: ['online_shop', 'wholesale', 'thrift_store'] },
    { id: 'appetite', name: 'Appetite', description: 'Wolt шиг хурдан сагслах, хоолны салбарт тохиромжтой.', color: '#ffedd5', price: 49000, isPremium: true, categories: ['food_delivery', 'bakery', 'bar_pub'] },
    { id: 'finedining', name: 'Fine Dining', description: 'Классик ресторан, тансаг зэрэглэлийн үйлчилгээ.', color: '#0f1115', price: 79000, isPremium: true, categories: ['bar_pub', 'hotel'] },
    { id: 'cafe', name: 'Cafe & Bakery', description: 'Дулаахан, органик мэдрэмж төрүүлэм.', color: '#fdfaf6', price: 39000, isPremium: true, categories: ['bakery', 'coffee_shop'] },
    { id: 'grocery', name: 'Supermarket', description: 'Хүнсний дэлгүүр, ангилал ихтэй стор.', color: '#16a34a', price: 49000, isPremium: true, categories: ['pharmacy', 'grocery', 'liquor_store'] },
    { id: 'service', name: 'Service Booking', description: 'Цаг захиалга, үйлчилгээний төвүүдэд.', color: '#4f46e5', price: 59000, isPremium: true, categories: ['beauty_salon', 'clinic', 'veterinary', 'childcare', 'fitness'] },
    { id: 'agency', name: 'Agency Portfolio', description: 'Минимал танилцуулга, бүтээлч агентлаг.', color: '#ffffff', price: 39000, isPremium: true, categories: ['printing', 'agency', 'photo_studio'] },
    { id: 'saas', name: 'Digital & SaaS', description: 'Програм хангамж, дижитал бүтээгдэхүүн.', color: '#0b0f19', price: 69000, isPremium: true, categories: ['education', 'utilities'] },
    { id: 'b2b', name: 'B2B Wholesale', description: 'Бөөнөөр захиалах, бизнесийн харилцаа.', color: '#f8f9fa', price: 89000, isPremium: true, categories: ['wholesale', 'cargo', 'transport'] },
    { id: 'autoparts', name: 'Auto Parts', description: 'Сэлбэгийн каталог, хайлт давамгайлсан.', color: '#1a1f2b', price: 59000, isPremium: true, categories: ['auto_parts', 'repair', 'car_wash'] },
    { id: 'furniture', name: 'Furniture & Decor', description: 'Интерьер дизайн, том зурагтай харагдац.', color: '#faf9f8', price: 69000, isPremium: true, categories: ['furniture', 'real_estate', 'construction'] },
    { id: 'artisan', name: 'Handcraft / Eco', description: 'Байгалийн, эко, гар урлалын дэлгүүр.', color: '#fdfaf6', price: 49000, isPremium: true, categories: ['flowers', 'artisan', 'thrift_store'] },
    { id: 'oneproduct', name: 'Single Product', description: 'Нэг бараанд зориулсан лэндинг хуудас.', color: '#ffffff', price: 29000, isPremium: true, categories: ['general', 'custom'] },
    { id: 'gamer', name: 'Gamer Gear', description: 'Тоног төхөөрөмж, неон болон бараан стиль.', color: '#09090b', price: 59000, isPremium: true, categories: ['entertainment'] },
    { id: 'lookbook', name: 'Lookbook Masonry', description: 'Pinterest хэв маяг бүхий галерей.', color: '#ffffff', price: 39000, isPremium: true, categories: ['photo_studio', 'artisan'] },
    { id: 'streetwear', name: 'Street Drop', description: 'Бараан, орчин үеийн, залуусын стиль.', color: '#000000', price: 49000, isPremium: true, categories: ['online_shop', 'streetwear'] },
    { id: 'cosmetics', name: 'Cosmetics', description: 'Зөөлөн, гоо сайхны бүтээгдхүүнд.', color: '#faf4f0', price: 49000, isPremium: true, categories: ['beauty_salon', 'cosmetics'] },
    { id: 'tech', name: 'Tech Specs', description: 'Электроникийн дээд зэрэглэлийн харагдац.', color: '#2b6cb0', price: 79000, isPremium: true, categories: ['it_services', 'tech'] }
];
