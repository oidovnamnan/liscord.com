const fs = require('fs');
const path = require('path');

const modulesPath = path.join(__dirname, 'src/config/modules.ts');
const appPath = path.join(__dirname, 'src/App.tsx');

const extraModules = [
    { id: "dental-clinic", name: "Шүдний Эмнэлэг", description: "Өвчтөн, цаг захиалга, түүх", icon: "Stethoscope", category: "industry" },
    { id: "pharmacy", name: "Эмийн Сан", description: "Эмийн хугацаа, жор, борлуулалт", icon: "Pill", category: "industry" },
    { id: "gym-fitness", name: "Фитнес Клуб", description: "Гишүүнчлэл, төлбөр, цагийн хуваарь", icon: "Dumbbell", category: "industry" },
    { id: "salon-spa", name: "Салон & Спа", description: "Гоо сайханч, үйлчилгээ, цаг", icon: "Scissors", category: "industry" },
    { id: "real-estate", name: "Үл Хөдлөх", description: "Байр, түрээс, зуучлагч, гэрээ", icon: "Home", category: "industry" },
    { id: "construction", name: "Барилга & Засвар", description: "Төсөв, материал, гүйцэтгэл", icon: "HardHat", category: "industry" },
    { id: "auto-repair", name: "Авто Засвар", description: "Ажлын хуудас, сэлбэг, түүх", icon: "Wrench", category: "industry" },
    { id: "rental", name: "Түрээсийн Үйлчилгээ", description: "Машин, тоног төхөөрөмж түрээс", icon: "Car", category: "industry" },
    { id: "logistics-3pl", name: "3PL Карго", description: "Гуравдагч талын тээвэр, нэгтгэл", icon: "Truck", category: "logistics" },
    { id: "fleet-mgt", name: "Автобааз Удирдлага", description: "GPS шүтэлцээ, түлш, засвар", icon: "Bus", category: "logistics" },
    { id: "dispatch", name: "Диспетчер", description: "Ачаа хуваарилалт, жолооч хяналт", icon: "MapPin", category: "logistics" },
    { id: "customs", name: "Гааль & Мэдүүлэг", description: "Гаалийн бичиг баримт, татвар", icon: "ScrollText", category: "logistics" },
    { id: "travel-agency", name: "Аялал Жуулчлал", description: "Тур, тийз, зочид буудал, виз", icon: "Plane", category: "industry" },
    { id: "hotel-mgt", name: "Зочид Буудал", description: "Өрөөний захиалга (PMS), цэвэрлэгээ", icon: "Bed", category: "industry" },
    { id: "event-planning", name: "Эвент Зохион Байгуулалт", description: "Төлөвлөгөө, тасалбар, зочин", icon: "PartyPopper", category: "industry" },
    { id: "ticketing", name: "Тасалбар & Reservation", description: "Автобус, тоглолт, хил", icon: "Ticket", category: "industry" },
    { id: "school-mgt", name: "Сургууль, Цэцэрлэг", description: "Сурагч багшийн ирц төлбөр", icon: "GraduationCap", category: "education" },
    { id: "e-learning", name: "Онлайн Сургалт", description: "Хичээл, шалгалт, сертификат", icon: "BookOpen", category: "education" },
    { id: "tutor", name: "Давтлага & Ментор", description: "Ганцаарчилсан багш, өдрийн тэмдэглэл", icon: "UserCheck", category: "education" },
    { id: "library", name: "Номын Сан", description: "Үлдэгдэл, түрээс, торгууль", icon: "Library", category: "education" },
    { id: "manufacturing-erp", name: "Үйлдвэрлэл (BOM)", description: "Орц норм, гарц, хаягдал", icon: "Factory", category: "manufacturing" },
    { id: "maintenance", name: "Тоног Төхөөрөмж (CMMS)", description: "Төлөвлөгөөт засвар үйлчилгээ", icon: "Hammer", category: "manufacturing" },
    { id: "quality-assurance", name: "Чанарын Баталгаажуулалт", description: "Анализ, дээж дүгнэлт", icon: "ShieldCheck", category: "manufacturing" },
    { id: "iot-sensors", name: "IoT Мониторинг", description: "Температур, даралт хяналт", icon: "Cpu", category: "manufacturing" },
    { id: "law-firm", name: "Хуулийн Фирм", description: "Хэрэг, үйлчлүүлэгч, цаг бүртгэл", icon: "Scale", category: "professional" },
    { id: "accounting-firm", name: "Нягтлангийн Үйлчилгээ", description: "Олон харилцагчийн санхүү хөтлөлт", icon: "BookMarked", category: "professional" },
    { id: "consulting", name: "Зөвлөх Үйлчилгээ", description: "Төсөл, зөвлөгөөний хуваарь", icon: "Briefcase", category: "professional" },
    { id: "insurance", name: "Даатгал", description: "Нөхөн төлбөр, даатгалын хугацаа", icon: "Umbrella", category: "professional" },
    { id: "cleaning", name: "Цэвэрлэгээ үйлчилгээ", description: "Ажилчдын хуваарь, объект", icon: "Sparkles", category: "service" },
    { id: "laundry", name: "Хими Цэвэрлэгээ", description: "Хувцас хүлээж авах, шошголох", icon: "Shirt", category: "service" },
    { id: "print-shop", name: "Хэвлэх Үйлдвэр", description: "Дизайн, файл хадгалах, өртөг", icon: "Printer", category: "service" },
    { id: "tailor", name: "Оёдол, Эсгүүр", description: "Захиалгат хэмжээ, материал", icon: "Scissors", category: "service" },
    { id: "subscription-box", name: "Сар бүрийн Багц", description: "Тогтмол хүргэлтийн хайрцаг", icon: "Gift", category: "ecommerce" },
    { id: "auction", name: "Дуудлага Худалдаа", description: "Үнэ хаялцах, тендер", icon: "Gavel", category: "ecommerce" },
    { id: "classifieds", name: "Зар Мэдээ", description: "Хэрэглэгчийн зар, урамшуулал", icon: "Newspaper", category: "ecommerce" },
    { id: "affiliate-marketing", name: "Affiliate Сүлжээ", description: "Реферал линк, шимтгэл тооцоо", icon: "Share2", category: "marketing" },
    { id: "influencer", name: "Инфлюэнсер CRM", description: "Хамтын ажиллагаа төлбөр өгөөж", icon: "Camera", category: "marketing" },
    { id: "seo-tools", name: "SEO Үнэлгээ", description: "Түлхүүр үг, түвшингийн хяналт", icon: "Search", category: "marketing" },
    { id: "content-mgt", name: "Контент Төлөвлөгөө", description: "Нийтлэл, сошиал постууд хуваарь", icon: "PenTool", category: "marketing" },
    { id: "workflow-automation", name: "Ухаалаг Урсгал", description: "Цахим гарын үсэг, зөвшөөрөл", icon: "Workflow", category: "tools" },
    { id: "document-mgt", name: "Бичиг Баримт (EDM)", description: "Архив, хуваалцах хуулбарлах", icon: "Files", category: "tools" },
    { id: "whatsapp-api", name: "WhatsApp Бизнес", description: "Мессеж илгээх бот ба интеграци", icon: "MessageSquare", category: "tools" },
    { id: "sms-gateway", name: "SMS Платформ", description: "Сурталчилгааны баталгаажуулах код", icon: "Smartphone", category: "tools" },
    { id: "voip-pbx", name: "Дуудлагын Төв (VoIP)", description: "Бичлэг, чиглүүлэг, IVR", icon: "Headset", category: "tools" },
    { id: "chatbot-ai", name: "AI Чатбот", description: "Харилцагчид өөрөө үйлчлэх хиймэл оюун", icon: "Bot", category: "ai" },
    { id: "image-gen", name: "Бүтээгдэхүүн Зураг AI", description: "Хиймэл оюунаар тайрах засах", icon: "Image", category: "ai" },
    { id: "text-analytics", name: "Сэтгэл Зүйн Анализ", description: "Сэтгэгдэл уншиж эерэг сөрөгийг дүгнэх", icon: "Brain", category: "ai" },
    { id: "parking", name: "Зогсоол Удирдлага", description: "Дугаар таних, сарын эрх төлбөр", icon: "CarFront", category: "facility" },
    { id: "property-mgt", name: "СӨХ & Хөрөнгө", description: "Ашиглалтын зардал дуудлага", icon: "Building", category: "facility" },
    { id: "energy-mgt", name: "Эрчим Хүч хяналт", description: "Ус, цахилгаан, ухаалаг толуур", icon: "Zap", category: "facility" },
    { id: "animal-clinic", name: "Мал Эмнэлэг", description: "Амьтны түүх амьд жин вакцин", icon: "PawPrint", category: "industry" },
    { id: "farm-mgt", name: "Фермийн Удирдлага", description: "Газар тариалан, мал аж ахуй ургац", icon: "Tractor", category: "industry" },
    { id: "butchery", name: "Мал Төхөөрөх Үйлдвэр", description: "Мах, шулам, жин шулгалт", icon: "Beef", category: "industry" },
    { id: "mining", name: "Уул Уурхай", description: "Уурхайн олборлолт кэмп түлш", icon: "Pickaxe", category: "industry" },
    { id: "micro-finance", name: "Бичил Санхүү (ББСБ)", description: "Эргэн төлөлт хуваарь гэрээ", icon: "Briefcase", category: "finance" },
    { id: "stock-broker", name: "Хувьцаа & Арилжаа", description: "Захиалгын сан хөрөнгийн үнэлгээ", icon: "TrendingUp", category: "finance" },
    { id: "crowdfunding", name: "Хамтын Санхүүжилт", description: "Төслийн хөрөнгө босголт хувь", icon: "Users", category: "finance" },
    { id: "hris", name: "Нэгдсэн Ажилтан (HRIS)", description: "Ажилтны бүх амьдралын мөчлөг", icon: "IdCard", category: "staff" },
    { id: "okr-tracker", name: "OKR & Зорилт", description: "Байгууллагын дунд хугацааны зорилт", icon: "Target", category: "staff" },
    { id: "whistleblower", name: "Ёс Зүй & Гомдол", description: "Нэр нууцлах өргөдөл гомдол", icon: "Megaphone", category: "staff" },
    { id: "game-server", name: "Тоглоомын Сервер", description: "Саак, клан, дотоод худалдаа", icon: "Gamepad2", category: "entertainment" },
    { id: "cinema-pos", name: "Кино Театр", description: "Суудал сонгох тасалбар попкорн", icon: "Film", category: "entertainment" },
    { id: "karaoke", name: "Караоке систем", description: "Цаг тоолох өрөө микрофон", icon: "Mic2", category: "entertainment" },
    { id: "night-club", name: "Шөнийн Клуб", description: "Ширээ такс буйдан", icon: "Music", category: "entertainment" },
    { id: "billiards", name: "Биллярд & Снукер", description: "Тоглолтын цаг тоолуур төлбөр", icon: "CircleDot", category: "entertainment" },
    { id: "pc-gaming", name: "PC Тоглоомын Газар", description: "Компьютер хянах цаг цэнэглэх", icon: "MonitorSmartphone", category: "entertainment" },
    { id: "lotto", name: "Сугалаа Тэмцээн", description: "Шоу тохирол шагналын сан", icon: "Trophy", category: "entertainment" },
    { id: "donation", name: "Хандив & ТББ", description: "Төсөл хэрэгжүүлэх тайлан ил тод", icon: "HeartHandshake", category: "nonprofit" },
    { id: "volunteer", name: "Сайн Дурынхан", description: "Идэвхтэн гишүүдийн цаг урамшуулал", icon: "HelpingHand", category: "nonprofit" },
    { id: "membership-club", name: "Клуб Гишүүнчлэл", description: "Төрийн бус эвсэл холбоо", icon: "Building2", category: "nonprofit" },
    { id: "church", name: "Сүм Хийд", description: "Нийгэмлэг өглөг ном буян", icon: "Church", category: "nonprofit" },
    { id: "cemetery", name: "Оршуулгын Газар", description: "Мэдээлэл цэцэрлэгжүүлэлт төлбөр", icon: "Trees", category: "nonprofit" },
    { id: "car-wash", name: "Авто Угаалга", description: "Дараалал үйлчилгээний төрөл ажилтан", icon: "Droplets", category: "industry" },
    { id: "valet", name: "Валет Паркинг", description: "Түлхүүр өгөх авах бүртгэл", icon: "Car", category: "industry" },
    { id: "ride-hailing", name: "Дуудлагын Жолооч", description: "Захиалга маршрут тариф", icon: "Pointer", category: "industry" },
    { id: "delivery-partner", name: "Хүргэлтийн Түнш", description: "Ресторанаас авах хүргэх апп", icon: "Bike", category: "industry" },
    { id: "laundry-locker", name: "Локер Пасс", description: "Ухаалаг хайрцаг код тайлах", icon: "Lock", category: "industry" },
    { id: "water-delivery", name: "Ус Хүргэлт", description: "Баллон буцаалт тогтмол хүргэлт", icon: "Drop", category: "industry" },
    { id: "gas-station", name: "Штац & ШТС", description: "Түлш сав картын хөнгөлөлт", icon: "Fuel", category: "industry" },
    { id: "ev-charging", name: "EV Цэнэглэгч", description: "Цахилгаан машин зогсоол квт цаг", icon: "Zap", category: "industry" },
    { id: "bakery", name: "Талх Нарийн Боов", description: "Жор цех хадгалах хугацаа", icon: "Cake", category: "industry" },
    { id: "butchery-pos", name: "Махны Дэлгүүр", description: "Огтлол жигнүүр сүлжээ", icon: "Axe", category: "industry" },
    { id: "jewelry", name: "Үнэт Эдлэл", description: "Грамм сорьц гэрчилгээ үнэлгээ", icon: "Gem", category: "industry" },
    { id: "flower-shop", name: "Цэцгийн Дэлгүүр", description: "Баглаа хүргэлт мэндчилгээ", icon: "Flower2", category: "industry" },
    { id: "bookstore", name: "Номын Дэлгүүр", description: "Зохиолч хэвлэл ангилал", icon: "Book", category: "industry" },
    { id: "pharmacy-b2b", name: "Эмийн Бөөний", description: "Эмийн сангууд хангах тендер", icon: "Microscope", category: "b2b" },
    { id: "fmcg-distro", name: "FMCG Дистрибьютер", description: "Вэнсэллинг борлуулалтын суваг", icon: "PackageSearch", category: "b2b" },
    { id: "import-export", name: "Импорт & Экспорт", description: "Гадаад худалдаа бичиг гаалийн", icon: "Globe2", category: "b2b" },
    { id: "software-reseller", name: "IT Reseller", description: "Лиценз хянах сунгалтын нэхэмжлэх", icon: "Laptop", category: "b2b" },
    { id: "ad-agency", name: "Медиа Агентлаг", description: "Спорт реклам ТВ байршуулалт", icon: "Tv", category: "b2b" },
    { id: "translation", name: "Орчуулгын Товчоо", description: "Хуудас үг тоолох баталгаа", icon: "Languages", category: "professional" },
    { id: "photo-studio", name: "Зургийн Студи", description: "Түрээс цаг угаах үйлчилгээ", icon: "Camera", category: "professional" },
    { id: "architect", name: "Архитектур", description: "Төсөл зураг төсөл норм үнэлгээ", icon: "PencilRuler", category: "professional" },
    { id: "interior", name: "Интерьер Дизайн", description: "Материал төсөв гаргах рендер", icon: "PaintRoller", category: "professional" },
    { id: "security-guard", name: "Харуул Хамгаалалт", description: "Ээлж дуудлага обьект хянах", icon: "Shield", category: "professional" },
    { id: "credit-score", name: "Зээлийн Мэдээлэл", description: "Муу зээлдэгч түүх үнэлгээ", icon: "FileWarning", category: "finance" },
    { id: "collection", name: "Авлага Барагдуулах", description: "Дуудлага анхааруулга шүүх", icon: "PhoneCall", category: "finance" },
    { id: "wallet", name: "Цахим Хэтэвч", description: "Цэнэглэлт шилжүүлэг бонус", icon: "WalletCards", category: "finance" },
    { id: "payment-gateway", name: "Пэймэнт Гэйтвэй", description: "Visa QPay холболтын гүйлгээ", icon: "CreditCard", category: "finance" },
    { id: "tax-compliance", name: "Татварын Тайлан", description: "Тайлан бэлдэх илгээх eTaс", icon: "Landmark", category: "finance" }
];

async function updateModules() {
    let source = fs.readFileSync(modulesPath, 'utf-8');

    console.log(`Injecting ${extraModules.length} extra modules directly.`);

    const elementsToInject = extraModules.map(m => `    {
        id: '${m.id}',
        name: '${m.name}',
        description: '${m.description}',
        icon: '${m.icon}',
        route: '/app/${m.id}',
        isCore: false,
        category: '${m.category}',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    }`).join(',\n');

    // Inject at the end of the array inside LISCORD_MODULES
    const updatedSource = source.replace(/\];/, `,\n${elementsToInject}\n];`);
    fs.writeFileSync(modulesPath, updatedSource, 'utf-8');

    // Update App.tsx logic iteratively
    let appSource = fs.readFileSync(appPath, 'utf-8');

    let routesToInject = extraModules.map(m => `            <Route path="${m.id}" element={<ModuleGuard moduleId="${m.id}"><ShellPage title="${m.name}" /></ModuleGuard>} />`).join('\n');

    appSource = appSource.replace(/(<Route path="appointments" element={<ModuleGuard moduleId="appointments"><AppointmentsPage \/><\/ModuleGuard>} \/>)/, `$1\n${routesToInject}`);
    fs.writeFileSync(appPath, appSource, 'utf-8');

    console.log('Done successfully injecting 200 total modules layout!');
}

updateModules();
