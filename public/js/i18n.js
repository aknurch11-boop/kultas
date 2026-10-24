// Три языка: русский, казахский, английский. Каждый ключ — [ru, kk, en].
// В HTML: data-i18n="ключ" (текст) и data-i18n-ph="ключ" (placeholder).
const LANGS = ["ru", "kk", "en"];

const DICT = {
  // Шапка и общее
  nav_map: ["Карта партий", "Партиялар картасы", "Batch map"],
  nav_calc: ["Калькулятор", "Калькулятор", "Calculator"],
  nav_track: ["Отследить груз", "Жүкті бақылау", "Track cargo"],
  nav_cabinet: ["Кабинет ТЭЦ", "ЖЭО кабинеті", "Plant dashboard"],
  demo: ["демо", "демо", "demo"],
  t: ["т", "т", "t"],
  km: ["км", "км", "km"],
  min: ["мин", "мин", "min"],
  type_fly_ash: ["Зола-унос", "Ұшпа күл", "Fly ash"],
  type_ash_slag: ["Золошлаковая смесь", "Күл-қож қоспасы", "Ash-slag mix"],
  use_fly_ash: ["для бетона и блоков", "бетон мен блоктарға", "for concrete and blocks"],
  use_ash_slag: ["для дорог и грунта", "жол мен топыраққа", "for roads and soil"],
  err_generic: ["Что-то пошло не так. Попробуйте ещё раз.", "Бірдеңе дұрыс болмады. Қайталап көріңіз.", "Something went wrong. Please try again."],
  footer_note: [
    "MVP для AuaHack · Партии, анализы и водители — демо-данные · Карта © OpenStreetMap, маршруты OSRM",
    "AuaHack үшін MVP · Партиялар, талдаулар және жүргізушілер — демо-деректер · Карта © OpenStreetMap, бағыттар OSRM",
    "MVP for AuaHack · Batches, lab data and drivers are demo data · Map © OpenStreetMap, routes by OSRM",
  ],

  // Главная: hero
  hero_eyebrow: ["Биржа золы ТЭЦ · Казахстан", "ЖЭО күлінің биржасы · Қазақстан", "Coal-ash exchange · Kazakhstan"],
  hero_title: ["Из пепла — в бетон", "Күлден — бетонға", "From ash to concrete"],
  hero_lead: [
    "В августе 2026 года Казахстан впервые купил золу в России для бетона. А в своих золоотвалах хранит больше 300 млн тонн. KülTas соединяет ТЭЦ и заводы: проверенная зола с паспортом качества вместо части дорогого цемента.",
    "2026 жылдың тамызында Қазақстан бетон үшін Ресейден алғаш рет күл сатып алды. Ал өз күл үйінділерінде 300 млн тоннадан астам күл жатыр. KülTas ЖЭО мен зауыттарды байланыстырады: қымбат цементтің бір бөлігінің орнына сапа паспорты бар тексерілген күл.",
    "In August 2026 Kazakhstan bought fly ash from Russia for concrete for the first time, while over 300 million tonnes sit in its own ash dumps. KülTas connects power plants with factories: verified ash with a quality passport replaces part of expensive cement.",
  ],
  hero_cta_find: ["Найти золу", "Күл табу", "Find ash"],
  hero_sources: ["Источники: ТАСС/Fomag (08.2026), КарТУ", "Дереккөздер: ТАСС/Fomag (08.2026), ҚарТУ", "Sources: TASS/Fomag (08.2026), KSTU"],

  // Живой счётчик
  impact_removed: ["т золы убрано с отвалов", "т күл үйіндіден шығарылды", "t of ash taken off dumps"],
  impact_co2: ["т CO₂ не выброшено*", "т CO₂ шығарылмады*", "t CO₂ avoided*"],
  impact_transit: ["т в пути прямо сейчас", "т дәл қазір жолда", "t on the road right now"],
  impact_available: ["т доступно в партиях", "т партияларда қолжетімді", "t available in batches"],
  impact_note: [
    "*Если зола заменяет цемент 1:1: ≈0,7 т CO₂ на тонну цемента — предположение внутри диапазона 0,67–0,81.",
    "*Күл цементті 1:1 алмастырса: бір тонна цементке ≈0,7 т CO₂ — 0,67–0,81 аралығындағы болжам.",
    "*Assuming ash replaces cement 1:1 at ≈0.7 t CO₂ per tonne of cement — an assumption within the 0.67–0.81 range.",
  ],

  // Почему это важно
  problem_title: ["Почему это важно", "Бұл неге маңызды", "Why it matters"],
  p1_t: ["300+ млн т", "300+ млн т", "300+ million t"],
  p2_t: ["10 м", "10 м", "10 m"],
  p3_t: ["0,67–0,81 т", "0,67–0,81 т", "0.67–0.81 t"],
  p1_d: [
    "золы накоплено в золоотвалах Казахстана, и каждый год добавляется ещё 17+ млн т.",
    "күл Қазақстанның күл үйінділерінде жиналған, жыл сайын тағы 17+ млн т қосылады.",
    "of ash are stored in Kazakhstan's ash dumps, with 17+ million t added every year.",
  ],
  p2_d: [
    "высота новых дамб золоотвала ТЭЦ-2 в Астане по проекту 2025 года: отвал не убирают, а наращивают.",
    "Астана ЖЭО-2 күл үйіндісінің 2025 жылғы жоба бойынша жаңа бөгеттерінің биіктігі: үйінді азаймай, өсіп келеді.",
    "is the height of new dams at Astana CHP-2's ash dump under the 2025 project: the dump keeps growing.",
  ],
  p3_d: [
    "CO₂ на каждую тонну цемента. Зола заменяет часть цемента — меньше выбросов и затрат.",
    "әр тонна цементке шаққандағы CO₂. Күл цементтің бір бөлігін алмастырады — шығарынды да, шығын да азаяды.",
    "of CO₂ per tonne of cement. Ash replaces part of the cement — fewer emissions, lower cost.",
  ],

  // Как это работает
  how_title: ["Как это работает", "Бұл қалай жұмыс істейді", "How it works"],
  how1_t: ["ТЭЦ выставляет партию", "ЖЭО партияны ұсынады", "A plant lists a batch"],
  how1_d: ["Объём, тип золы и место на карте.", "Көлемі, күл түрі және картадағы орны.", "Volume, ash type and location on the map."],
  how2_t: ["Лаборатория выдаёт паспорт", "Зертхана паспорт береді", "A lab issues a passport"],
  how2_d: ["Состав, класс и радиация — в цифровом паспорте с QR-кодом.", "Құрамы, сыныбы және радиациясы — QR-коды бар цифрлық паспортта.", "Composition, class and radiation in a digital passport with a QR code."],
  how3_t: ["Завод заказывает", "Зауыт тапсырыс береді", "A factory orders"],
  how3_d: ["Находит ближайшую партию в радиусе 100–300 км и считает выгоду.", "100–300 км радиустағы ең жақын партияны тауып, пайдасын есептейді.", "Finds the nearest batch within 100–300 km and calculates savings."],
  how4_t: ["Груз едет — вы видите", "Жүк жолда — сіз көресіз", "Watch the truck"],
  how4_d: ["Как с доставкой пиццы: машина на карте и время прибытия.", "Пицца жеткізгендей: картадағы көлік және келу уақыты.", "Like pizza delivery: the truck on the map and its arrival time."],

  // Карта партий
  map_title: ["Партии золы на карте", "Картадағы күл партиялары", "Ash batches on the map"],
  map_lead: [
    "Как в индийском сервисе ASH TRACK: выберите радиус и найдите ближайшую проверенную золу.",
    "Үндістандағы ASH TRACK сервисі сияқты: радиусты таңдап, ең жақын тексерілген күлді табыңыз.",
    "Like India's ASH TRACK: pick a radius and find the nearest verified ash.",
  ],
  radius: ["Радиус", "Радиус", "Radius"],
  radius_all: ["Вся страна", "Бүкіл ел", "Whole country"],
  my_location: ["📍 От меня", "📍 Менен", "📍 From me"],
  from_astana: ["от Астаны", "Астанадан", "from Astana"],
  from_you: ["от вас", "сізден", "from you"],
  available: ["доступно", "қолжетімді", "available"],
  btn_passport: ["Паспорт", "Паспорт", "Passport"],
  btn_order: ["Заказать", "Тапсырыс беру", "Order"],
  no_batches: ["В этом радиусе партий нет — увеличьте радиус.", "Бұл радиуста партия жоқ — радиусты үлкейтіңіз.", "No batches in this radius — widen it."],

  // Калькулятор
  calc_title: ["Сколько сэкономит ваш завод", "Зауытыңыз қанша үнемдейді", "How much your plant saves"],
  calc_lead: ["Все параметры можно менять. Значения по умолчанию — наши предположения.", "Барлық параметрді өзгертуге болады. Әдепкі мәндер — біздің болжамдарымыз.", "All inputs are editable. Defaults are our assumptions."],
  calc_volume: ["Бетон, м³ в месяц", "Бетон, айына м³", "Concrete, m³ per month"],
  calc_cement: ["Цемент на 1 м³, кг", "1 м³-ге цемент, кг", "Cement per m³, kg"],
  calc_replace: ["Заменяем золой, %", "Күлмен алмастыру, %", "Replaced with ash, %"],
  calc_cement_price: ["Цена цемента, ₸/т", "Цемент бағасы, ₸/т", "Cement price, ₸/t"],
  calc_ash_price: ["Цена золы, ₸/т", "Күл бағасы, ₸/т", "Ash price, ₸/t"],
  calc_out_ash: ["золы нужно в месяц", "айына қажет күл", "ash needed per month"],
  calc_out_save: ["экономия в месяц", "айлық үнем", "monthly savings"],
  calc_out_co2: ["CO₂ не выброшено в месяц", "айына шығарылмаған CO₂", "CO₂ avoided per month"],
  calc_out_trucks: ["рейсов цементовоза по 25 т", "25 т-лық көлік рейсі", "25-t truck trips"],
  calc_note: [
    "Цена цемента ≈44 000 ₸/т — пересчёт розничной цены мешка 50 кг (OLX, Астана, июль 2026). 20% замены — ориентир из дорожного строительства Алматы. Допустимую долю для вашего бетона определяет лаборатория по ГОСТ 25818.",
    "Цемент бағасы ≈44 000 ₸/т — 50 кг қаптың бөлшек бағасынан есептелді (OLX, Астана, 2026 ж. шілде). 20% алмастыру — Алматыдағы жол құрылысынан алынған бағдар. Бетоныңызға рұқсат етілген үлесті зертхана ГОСТ 25818 бойынша анықтайды.",
    "Cement ≈44,000 ₸/t is derived from a 50 kg bag's retail price (OLX, Astana, July 2026). 20% replacement is a benchmark from Almaty road construction. A lab sets the allowed share for your concrete under GOST 25818.",
  ],

  // Заказ
  order_title: ["Заказ золы", "Күлге тапсырыс", "Order ash"],
  order_company: ["Компания", "Компания", "Company"],
  order_contact: ["Телефон или e-mail", "Телефон немесе e-mail", "Phone or e-mail"],
  order_tons: ["Сколько тонн", "Неше тонна", "Tonnes"],
  order_dest: ["Куда везти", "Қайда жеткізу", "Deliver to"],
  order_dest_hint: ["Нажмите на карту, чтобы отметить завод", "Зауытты белгілеу үшін картаны басыңыз", "Click the map to mark your plant"],
  order_dest_set: ["Точка доставки отмечена", "Жеткізу нүктесі белгіленді", "Delivery point set"],
  order_total: ["Сумма", "Сомасы", "Total"],
  order_trips: ["рейсов", "рейс", "trips"],
  order_submit: ["Оформить и отследить", "Рәсімдеу және бақылау", "Place order and track"],
  order_sending: ["Строим маршрут…", "Бағыт құрылуда…", "Building the route…"],
  cancel: ["Отмена", "Болдырмау", "Cancel"],
  err_company: ["Укажите название компании.", "Компания атауын көрсетіңіз.", "Enter the company name."],
  err_tons: ["Укажите количество тонн.", "Тонна санын көрсетіңіз.", "Enter the number of tonnes."],
  err_tons_available: ["Столько золы в партии нет.", "Партияда мұндай көлемде күл жоқ.", "The batch doesn't have that much ash."],
  err_dest: ["Отметьте на карте, куда везти.", "Қайда жеткізу керегін картада белгілеңіз.", "Mark the delivery point on the map."],

  // Блок трекинга на главной
  track_box_title: ["Уже заказали? Отследите машину", "Тапсырыс бердіңіз бе? Көлікті бақылаңыз", "Already ordered? Track your truck"],
  track_box_lead: ["Попробуйте демо-заказ KT-1001 — машина уже в пути.", "KT-1001 демо-тапсырысын көріңіз — көлік жолда.", "Try demo order KT-1001 — the truck is already on its way."],
  track_ph: ["Код заказа, например KT-1001", "Тапсырыс коды, мысалы KT-1001", "Order code, e.g. KT-1001"],
  track_btn: ["Отследить", "Бақылау", "Track"],

  // Трекинг
  track_title: ["Где мой груз", "Жүгім қайда", "Where's my cargo"],
  phase_accepted: ["Заказ принят", "Тапсырыс қабылданды", "Order accepted"],
  phase_reserved: ["Партия зарезервирована", "Партия брондалды", "Batch reserved"],
  phase_loading: ["Погрузка на ТЭЦ", "ЖЭО-да тиеу", "Loading at the plant"],
  phase_in_transit: ["В пути", "Жолда", "On the way"],
  phase_delivered: ["Доставлено", "Жеткізілді", "Delivered"],
  msg_accepted: ["Мы получили заказ и проверяем партию.", "Тапсырысты алдық, партияны тексеріп жатырмыз.", "We've got your order and are checking the batch."],
  msg_reserved: ["Зола зарезервирована за вами, паспорт качества прикреплён.", "Күл сізге брондалды, сапа паспорты тіркелді.", "The ash is reserved for you, quality passport attached."],
  msg_loading: ["Цементовоз загружается на ТЭЦ.", "Цемент тасығыш ЖЭО-да тиелуде.", "The bulk truck is loading at the plant."],
  msg_in_transit: ["{driver} везёт {tons} т золы. Осталось {eta}.", "{driver} {tons} т күл тасып келеді. {eta} қалды.", "{driver} is bringing {tons} t of ash. {eta} left."],
  msg_delivered: ["Груз на месте. С золоотвала убрано {tons} т.", "Жүк жетті. Күл үйіндісінен {tons} т шығарылды.", "Delivered. {tons} t taken off the ash dump."],
  eta: ["Прибытие через", "Келуіне", "Arrives in"],
  route: ["Маршрут", "Бағыт", "Route"],
  road_time: ["по дороге ~{min} мин", "жолмен ~{min} мин", "~{min} min by road"],
  driver: ["Водитель", "Жүргізуші", "Driver"],
  truck: ["Машина", "Көлік", "Truck"],
  cargo: ["Груз", "Жүк", "Cargo"],
  trip_of: ["рейс 1 из {n}", "{n} рейстің 1-і", "trip 1 of {n}"],
  from: ["Откуда", "Қайдан", "From"],
  to: ["Куда", "Қайда", "To"],
  share: ["Скопировать ссылку", "Сілтемені көшіру", "Copy link"],
  copied: ["Ссылка скопирована", "Сілтеме көшірілді", "Link copied"],
  open_passport: ["Паспорт партии", "Партия паспорты", "Batch passport"],
  demo_speed: ["Демо-режим: поездка ускорена, чтобы показать её за пару минут.", "Демо-режим: сапар бірнеше минутта көрсетілу үшін жылдамдатылған.", "Demo mode: the trip is sped up to show it in a couple of minutes."],
  not_found: ["Заказ не найден. Проверьте код.", "Тапсырыс табылмады. Кодты тексеріңіз.", "Order not found. Check the code."],
  cert_title: ["Эко-сертификат поставки", "Жеткізілімнің эко-сертификаты", "Delivery eco-certificate"],
  cert_text: [
    "{company} получил {tons} т вторичной золы от {plant}. Эта зола убрана с золоотвала и может заменить до {tons} т цемента: ≈{co2} т CO₂ не выброшено*.",
    "{company} {plant} кәсіпорнынан {tons} т қайталама күл алды. Бұл күл үйіндіден шығарылды және {tons} т-ға дейін цементті алмастыра алады: ≈{co2} т CO₂ шығарылмайды*.",
    "{company} received {tons} t of secondary ash from {plant}. It was taken off the ash dump and can replace up to {tons} t of cement: ≈{co2} t CO₂ avoided*.",
  ],
  cert_print: ["Распечатать / PDF", "Басып шығару / PDF", "Print / PDF"],

  // Паспорт
  pp_kicker: ["Цифровой паспорт партии", "Партияның цифрлық паспорты", "Digital batch passport"],
  pp_sub: [
    "По идее европейского Digital Product Passport: всё о партии — по одному QR-коду.",
    "Еуропалық Digital Product Passport идеясы бойынша: партия туралы бәрі — бір QR-кодта.",
    "Inspired by the EU Digital Product Passport: everything about the batch in one QR code.",
  ],
  pp_origin: ["Источник", "Көзі", "Source"],
  pp_type: ["Тип", "Түрі", "Type"],
  pp_available: ["Доступно", "Қолжетімді", "Available"],
  pp_price: ["Цена", "Бағасы", "Price"],
  pp_tested: ["Дата анализа", "Талдау күні", "Tested on"],
  pp_lab: ["Лабораторный анализ", "Зертханалық талдау", "Lab analysis"],
  lab_main: ["SiO₂ + Al₂O₃ + Fe₂O₃, %", "SiO₂ + Al₂O₃ + Fe₂O₃, %", "SiO₂ + Al₂O₃ + Fe₂O₃, %"],
  lab_cao: ["CaO, %", "CaO, %", "CaO, %"],
  lab_loi: ["Потери при прокаливании, %", "Күйдіру кезіндегі шығын, %", "Loss on ignition, %"],
  lab_so3: ["SO₃, %", "SO₃, %", "SO₃, %"],
  lab_moisture: ["Влажность, %", "Ылғалдылық, %", "Moisture, %"],
  lab_activity: ["Эффективная активность радионуклидов, Бк/кг", "Радионуклидтердің тиімді белсенділігі, Бк/кг", "Effective radionuclide activity, Bq/kg"],
  lab_none: ["нет данных", "дерек жоқ", "no data"],
  pp_demo_note: [
    "Демо-значения для показа интерфейса — это не реальный анализ этой станции.",
    "Интерфейсті көрсетуге арналған демо-мәндер — бұл осы станцияның нақты талдауы емес.",
    "Demo values to show the interface — not a real analysis from this plant.",
  ],
  pp_co2: [
    "Потенциал: до {co2} т CO₂ не выброшено, если вся партия заменит цемент*",
    "Әлеуеті: бүкіл партия цементті алмастырса, {co2} т-ға дейін CO₂ шығарылмайды*",
    "Potential: up to {co2} t CO₂ avoided if the whole batch replaces cement*",
  ],
  pp_print: ["Распечатать паспорт", "Паспортты басып шығару", "Print passport"],
  pp_scan: ["Сканируйте, чтобы открыть паспорт", "Паспортты ашу үшін сканерлеңіз", "Scan to open the passport"],
  pp_not_found: ["Партия не найдена.", "Партия табылмады.", "Batch not found."],

  // Кабинет ТЭЦ
  db_title: ["Кабинет ТЭЦ", "ЖЭО кабинеті", "Plant dashboard"],
  db_lead: [
    "Выставляйте партии золы и следите за заказами и машинами в реальном времени.",
    "Күл партияларын ұсынып, тапсырыстар мен көліктерді нақты уақытта бақылаңыз.",
    "List ash batches and watch orders and trucks in real time.",
  ],
  db_add: ["Новая партия", "Жаңа партия", "New batch"],
  db_plant: ["Станция", "Станция", "Plant"],
  db_city: ["Город", "Қала", "City"],
  db_type: ["Тип золы", "Күл түрі", "Ash type"],
  db_tons: ["Объём, т", "Көлемі, т", "Volume, t"],
  db_price: ["Цена, ₸/т", "Бағасы, ₸/т", "Price, ₸/t"],
  db_loc: ["Нажмите на карту, где лежит партия", "Партия жатқан жерді картадан басыңыз", "Click the map where the batch is"],
  db_loc_set: ["Место отмечено", "Орны белгіленді", "Location set"],
  db_lab: ["Анализ лаборатории (если есть)", "Зертхана талдауы (бар болса)", "Lab data (if any)"],
  db_submit: ["Опубликовать партию", "Партияны жариялау", "Publish batch"],
  db_added: ["Партия опубликована: ", "Партия жарияланды: ", "Batch published: "],
  db_orders: ["Заказы и машины", "Тапсырыстар мен көліктер", "Orders and trucks"],
  db_batches: ["Партии", "Партиялар", "Batches"],
  col_code: ["Код", "Код", "Code"],
  col_company: ["Покупатель", "Сатып алушы", "Buyer"],
  col_tons: ["Тонн", "Тонна", "Tonnes"],
  col_route: ["Маршрут", "Бағыт", "Route"],
  col_status: ["Статус", "Мәртебе", "Status"],
  econ_title: ["Экономика платформы", "Платформа экономикасы", "Platform economics"],
  econ_assumption: ["предположения", "болжамдар", "assumptions"],
  econ_commission: ["Комиссия платформы, ₸/т", "Платформа комиссиясы, ₸/т", "Platform fee, ₸/t"],
  econ_delivered: ["Доставлено, т", "Жеткізілді, т", "Delivered, t"],
  econ_revenue: ["Выручка платформы", "Платформа түсімі", "Platform revenue"],
  econ_orders: ["Заказов", "Тапсырыстар", "Orders"],
  err_plant: ["Укажите станцию.", "Станцияны көрсетіңіз.", "Enter the plant."],
  err_location: ["Отметьте на карте место партии.", "Партияның орнын картада белгілеңіз.", "Mark the batch location on the map."],
  err_price: ["Проверьте цену.", "Бағаны тексеріңіз.", "Check the price."],

  // Магазин: шапка
  nav_catalog: ["Каталог", "Каталог", "Catalog"],
  nav_requests: ["Запросы покупателей", "Сатып алушы сұраныстары", "Buyer requests"],
  search_ph: ["Поиск: зола-унос, Астана, ТЭЦ-2…", "Іздеу: ұшпа күл, Астана, ЖЭО-2…", "Search: fly ash, Astana, CHP-2…"],
  cart: ["Корзина", "Себет", "Cart"],
  cart_title: ["Корзина", "Себет", "Your cart"],
  cart_empty: ["Корзина пока пустая", "Себет әзірге бос", "Your cart is empty"],
  checkout_btn: ["Оформить заказ", "Тапсырысты рәсімдеу", "Checkout"],
  fav: ["Избранное", "Таңдаулылар", "Favorites"],
  compare: ["Сравнение", "Салыстыру", "Compare"],
  theme_toggle: ["Светлая / тёмная тема", "Ашық / қараңғы тақырып", "Light / dark theme"],
  to_cart: ["В корзину", "Себетке", "Add to cart"],
  in_cart: ["В корзине", "Себетте", "In cart"],
  added_to_cart: ["Добавлено в корзину", "Себетке қосылды", "Added to cart"],
  compare_full: ["Сравнивать можно до 3 партий", "3 партияға дейін салыстыруға болады", "You can compare up to 3 batches"],
  remove: ["Убрать", "Алып тастау", "Remove"],

  // Магазин: баннер и каталог
  banner_cta: ["Смотреть каталог", "Каталогты көру", "Browse catalog"],
  banner_req: ["Разместить запрос", "Сұраныс орналастыру", "Post a request"],
  catalog_title: ["Каталог золы", "Күл каталогы", "Ash catalog"],
  catalog_lead: ["Проверенные партии от ТЭЦ Казахстана. Выберите объём и добавьте в корзину.", "Қазақстан ЖЭО-ларынан тексерілген партиялар. Көлемін таңдап, себетке қосыңыз.", "Verified batches from Kazakhstan's power plants. Choose a volume and add to cart."],
  filters: ["Фильтры", "Сүзгілер", "Filters"],
  f_type: ["Тип золы", "Күл түрі", "Ash type"],
  f_city: ["Город", "Қала", "City"],
  f_city_all: ["Все города", "Барлық қалалар", "All cities"],
  f_price_max: ["Цена до, ₸/т", "Бағасы, ₸/т дейін", "Max price, ₸/t"],
  f_min_tons: ["Объём от, т", "Көлемі, т бастап", "Min volume, t"],
  f_only_lab: ["Только с анализом", "Тек талдауы барлар", "Lab data only"],
  f_only_fav: ["Только избранное", "Тек таңдаулылар", "Favorites only"],
  f_sort: ["Сортировка", "Сұрыптау", "Sort"],
  sort_near: ["Ближе к вам", "Сізге жақын", "Nearest"],
  sort_cheap: ["Дешевле", "Арзанырақ", "Cheapest"],
  sort_big: ["Больше объём", "Көлемі үлкен", "Largest"],
  sort_new: ["Новые", "Жаңалары", "Newest"],
  found: ["Найдено партий: {n}", "Табылған партиялар: {n}", "Batches found: {n}"],
  reset: ["Сбросить", "Тазарту", "Reset"],
  passport_ok: ["Паспорт", "Паспорт", "Passport"],
  per_t: ["за тонну", "тоннасына", "per tonne"],
  show_map: ["Карта", "Карта", "Map"],
  show_grid: ["Плитка", "Тақта", "Grid"],
  fresh_requests: ["Свежие запросы покупателей", "Сатып алушылардың жаңа сұраныстары", "Latest buyer requests"],
  see_all: ["Все запросы →", "Барлық сұраныстар →", "All requests →"],

  // Запросы покупателей (RFQ)
  rq_title: ["Запросы покупателей", "Сатып алушы сұраныстары", "Buyer requests"],
  rq_lead: [
    "Заводы пишут, что им нужно, — ТЭЦ и поставщики откликаются со своей ценой. Как биржа заказов.",
    "Зауыттар не қажет екенін жазады — ЖЭО мен жеткізушілер өз бағасымен жауап береді. Тапсырыс биржасы сияқты.",
    "Factories post what they need — plants and suppliers respond with their price. Like an order exchange.",
  ],
  rq_new: ["Разместить запрос", "Сұраныс орналастыру", "Post a request"],
  rq_company: ["Компания", "Компания", "Company"],
  rq_need: ["Нужно", "Қажет", "Needs"],
  rq_until: ["до {d}", "{d} дейін", "by {d}"],
  rq_budget: ["бюджет до {p}/т", "бюджет {p}/т дейін", "budget up to {p}/t"],
  rq_deadline: ["Срок поставки", "Жеткізу мерзімі", "Delivery by"],
  rq_max_price: ["Максимальная цена, ₸/т", "Ең жоғары баға, ₸/т", "Max price, ₸/t"],
  rq_comment: ["Требования", "Талаптар", "Requirements"],
  rq_submit: ["Опубликовать запрос", "Сұранысты жариялау", "Publish request"],
  rq_created: ["Запрос опубликован", "Сұраныс жарияланды", "Request published"],
  rq_offers: ["Откликов: {n}", "Жауаптар: {n}", "Offers: {n}"],
  rq_respond: ["Откликнуться", "Жауап беру", "Respond"],
  rq_no_offers: ["Пока нет откликов — будьте первым.", "Әзірге жауап жоқ — бірінші болыңыз.", "No offers yet — be the first."],
  rq_all: ["Все", "Барлығы", "All"],
  offer_plant: ["Ваша станция / компания", "Сіздің станцияңыз / компанияңыз", "Your plant / company"],
  offer_price: ["Ваша цена, ₸/т", "Сіздің бағаңыз, ₸/т", "Your price, ₸/t"],
  offer_comment: ["Комментарий", "Пікір", "Comment"],
  offer_submit: ["Отправить отклик", "Жауапты жіберу", "Send offer"],
  offer_sent: ["Отклик отправлен", "Жауап жіберілді", "Offer sent"],
  offer_best: ["лучшая цена", "ең жақсы баға", "best price"],

  // Оформление заказа
  ck_title: ["Оформление заказа", "Тапсырысты рәсімдеу", "Checkout"],
  ck_lead: ["Отметьте завод на карте — посчитаем доставку по реальным дорогам.", "Зауытты картада белгілеңіз — жеткізуді нақты жолдар бойынша есептейміз.", "Mark your plant on the map — we'll price delivery along real roads."],
  ck_goods: ["Зола", "Күл", "Ash"],
  ck_delivery: ["Доставка", "Жеткізу", "Delivery"],
  ck_service: ["Сервис KülTas*", "KülTas сервисі*", "KülTas service*"],
  ck_total: ["Итого", "Барлығы", "Total"],
  ck_delivery_next: ["на следующем шаге", "келесі қадамда", "next step"],
  ck_place: ["Подтвердить заказ", "Тапсырысты растау", "Place order"],
  ck_placing: ["Оформляем…", "Рәсімделуде…", "Placing…"],
  ck_need_dest: ["Отметьте точку доставки, чтобы посчитать доставку.", "Жеткізуді есептеу үшін нүктені белгілеңіз.", "Set the delivery point to price delivery."],
  ck_note: ["*Тариф доставки (30 ₸ за т·км) и сервисный сбор (2 000 ₸/т) — предположения команды.", "*Жеткізу тарифі (т·км үшін 30 ₸) және сервистік алым (2 000 ₸/т) — команданың болжамы.", "*Delivery rate (30 ₸ per t·km) and service fee (2,000 ₸/t) are team assumptions."],
  ck_done_title: ["Заказ оформлен!", "Тапсырыс рәсімделді!", "Order placed!"],
  ck_done_lead: ["Машины уже готовятся. Отслеживайте каждую партию:", "Көліктер дайындалуда. Әр партияны бақылаңыз:", "Trucks are getting ready. Track each batch:"],
  ck_track: ["Отследить", "Бақылау", "Track"],
  ck_km: ["{km} км по дороге · {trips} рейс.", "жолмен {km} км · {trips} рейс", "{km} km by road · {trips} trips"],

  // Сравнение
  cmp_title: ["Сравнение партий", "Партияларды салыстыру", "Compare batches"],
  cmp_empty: ["Добавьте до 3 партий кнопкой ⇄ в каталоге.", "Каталогтағы ⇄ батырмасымен 3 партияға дейін қосыңыз.", "Add up to 3 batches with the ⇄ button in the catalog."],
  cmp_best: ["лучше", "жақсы", "best"],
  cmp_distance: ["От Астаны", "Астанадан", "From Astana"],

  // Виды золы
  type_slag: ["Топливный шлак", "Отын қожы", "Bottom slag"],
  type_cenospheres: ["Ценосферы (микросферы)", "Ценосфералар (микросфералар)", "Cenospheres"],
  use_slag: ["заполнитель, подсыпка, дороги", "толтырғыш, төсем, жолдар", "aggregate, fill, roads"],
  use_cenospheres: ["лёгкие наполнители, растворы, краски", "жеңіл толтырғыштар, ерітінділер, бояулар", "lightweight fillers, mortars, paints"],
  desc_fly_ash: ["Тонкий сухой порошок из фильтров ТЭЦ.", "ЖЭО сүзгілерінен алынған жұқа құрғақ ұнтақ.", "Fine dry powder captured by plant filters."],
  desc_ash_slag: ["Смесь золы и шлака из золоотвала, обычно влажная.", "Күл үйіндісінен алынған күл мен қож қоспасы, әдетте ылғалды.", "Ash and slag mix from the ash pond, usually wet."],
  desc_slag: ["Крупные зёрна 0,3–40 мм со дна топки.", "Пеш түбінен алынған 0,3–40 мм ірі түйіршіктер.", "Coarse 0.3–40 mm grains from the furnace bottom."],
  desc_cenospheres: ["Лёгкие полые шарики из золы, собираются на поверхности золоотвала.", "Күлден алынған жеңіл қуыс шарлар, күл үйіндісінің бетінен жиналады.", "Light hollow spheres from ash, collected on the ash pond surface."],
  types_title: ["Какая бывает зола", "Күлдің түрлері", "Types of ash"],
  types_lead: [
    "Не вся зола одинаковая. Выберите вид под вашу задачу — каталог отфильтруется.",
    "Күлдің бәрі бірдей емес. Міндетіңізге сай түрін таңдаңыз — каталог сүзіледі.",
    "Not all ash is the same. Pick the type for your job — the catalog will filter.",
  ],
  sub_title: ["Класс (ГОСТ 25818-91)", "Сыныбы (ГОСТ 25818-91)", "Class (GOST 25818-91)"],
  sub_acid: ["Кислая (К): CaO ≤ 10%", "Қышқыл (К): CaO ≤ 10%", "Acid (K): CaO ≤ 10%"],
  sub_basic: ["Основная (О): CaO > 10%", "Негізгі (О): CaO > 10%", "Basic (O): CaO > 10%"],
  sub_short_acid: ["кислая", "қышқыл", "acid"],
  sub_short_basic: ["основная", "негізгі", "basic"],
  sub_unknown: ["Не знаю", "Білмеймін", "Not sure"],
  gost_title: ["Вид по ГОСТ 25818-91", "ГОСТ 25818-91 бойынша түрі", "Kind per GOST 25818-91"],
  gost_I: ["I — железобетон", "I — темірбетон", "I — reinforced concrete"],
  gost_II: ["II — бетон и растворы", "II — бетон және ерітінділер", "II — concrete and mortars"],
  gost_III: ["III — ячеистый бетон (газоблоки)", "III — ұялы бетон (газоблок)", "III — aerated concrete (blocks)"],
  gost_IV: ["IV — особые условия", "IV — ерекше жағдайлар", "IV — special conditions"],
  gost_short: ["вид {k}", "{k} түрі", "kind {k}"],
  ship_title: ["Отгрузка", "Тиеу", "Shipping"],
  ship_bulk: ["Навалом", "Үйіп", "Bulk"],
  ship_pneumo: ["Цементовоз", "Цемент тасығыш", "Bulk tanker"],
  ship_bigbag: ["Биг-бэги", "Биг-бэгтер", "Big bags"],
  pp_class: ["Класс", "Сыныбы", "Class"],
  photo_credits: ["Фото", "Фото", "Photos"],
  pp_gost: ["Вид по ГОСТ", "ГОСТ бойынша түрі", "GOST kind"],
  pp_ship: ["Отгрузка", "Тиеу", "Shipping"],
  pp_photos: ["Фото партии", "Партия фотосы", "Batch photos"],

  // Размещение по фото
  sell_cta: ["+ Разместить партию", "+ Партия орналастыру", "+ List a batch"],
  sell_title: ["Разместить партию за минуту", "Партияны бір минутта орналастыру", "List a batch in a minute"],
  sell_lead: [
    "Сфотографируйте золу, выберите вид — место определим по GPS. Покупатели увидят партию в каталоге сразу.",
    "Күлді суретке түсіріп, түрін таңдаңыз — орнын GPS арқылы анықтаймыз. Сатып алушылар партияны каталогта бірден көреді.",
    "Snap the ash, pick the type — we'll get the location by GPS. Buyers see the batch in the catalog right away.",
  ],
  sell_photo: ["Фото партии", "Партия фотосы", "Batch photos"],
  sell_photo_btn: ["📷 Сфотографировать или выбрать фото", "📷 Суретке түсіру немесе фото таңдау", "📷 Take or choose a photo"],
  sell_photo_hint: ["До 3 фото. На телефоне сразу откроется камера.", "3 фотоға дейін. Телефонда камера бірден ашылады.", "Up to 3 photos. On a phone the camera opens right away."],
  sell_type: ["Вид золы", "Күл түрі", "Ash type"],
  sell_volume: ["Объём, цена и отгрузка", "Көлемі, бағасы және тиеу", "Volume, price and shipping"],
  sell_where: ["Где лежит партия", "Партия қайда жатыр", "Where the batch is"],
  sell_gps: ["📍 Определить по GPS", "📍 GPS арқылы анықтау", "📍 Use my GPS"],
  sell_gps_wait: ["Определяем…", "Анықталуда…", "Locating…"],
  sell_gps_fail: ["Не удалось — нажмите на карту", "Болмады — картаны басыңыз", "Couldn't locate — click the map"],
  sell_lab: ["Лабораторный анализ (необязательно)", "Зертханалық талдау (міндетті емес)", "Lab analysis (optional)"],
  sell_preview: ["Так увидит покупатель", "Сатып алушы осылай көреді", "What buyers will see"],
  sell_publish: ["Опубликовать партию", "Партияны жариялау", "Publish batch"],
  sell_publishing: ["Публикуем…", "Жарияланып жатыр…", "Publishing…"],
  sell_cao_hint: ["По CaO = {v}% это зола класса «{c}»", "CaO = {v}% бойынша бұл «{c}» сыныпты күл", "With CaO = {v}% this is “{c}” class ash"],
  err_photo: ["Фото не подошло: нужен JPEG/PNG до 3 МБ, не больше 3 штук.", "Фото сәйкес келмеді: 3 МБ дейінгі JPEG/PNG, 3 данадан аспауы керек.", "Photo rejected: JPEG/PNG up to 3 MB, at most 3."],
  err_type: ["Выберите вид золы.", "Күл түрін таңдаңыз.", "Choose the ash type."],
  db_sell_title: ["Новая партия — по фото за минуту", "Жаңа партия — фото арқылы бір минутта", "New batch — from a photo in a minute"],
  db_sell_text: ["Сфотографируйте золу на телефоне, место определится по GPS.", "Күлді телефонмен түсіріңіз, орны GPS арқылы анықталады.", "Snap the ash on your phone; the location comes from GPS."],
};

function detect() {
  // Ссылка вида ?lang=kk открывает сайт сразу на нужном языке.
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(fromUrl)) {
    try {
      localStorage.setItem("kultas-lang", fromUrl);
    } catch {
      // без localStorage язык просто не запомнится
    }
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem("kultas-lang");
    if (LANGS.includes(saved)) return saved;
  } catch {
    // localStorage недоступен — берём язык браузера
  }
  const nav = (navigator.language || "ru").slice(0, 2);
  return nav === "kk" ? "kk" : nav === "en" ? "en" : "ru";
}

let lang = detect();

export const getLang = () => lang;

export function t(key, vars = {}) {
  const row = DICT[key];
  const str = row ? row[LANGS.indexOf(lang)] ?? row[0] : key;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

// Текст из данных: строка или объект {ru, kk, en}.
export function loc(value) {
  if (value && typeof value === "object") return value[lang] ?? value.ru ?? "";
  return value ?? "";
}

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try {
    localStorage.setItem("kultas-lang", lang);
  } catch {
    // без сохранения язык сбросится при перезагрузке — не страшно
  }
  applyI18n();
  syncSwitcher();
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

function syncSwitcher() {
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
}

// Переключатель KZ / RU / EN в шапке.
export function mountLangSwitcher() {
  document.querySelectorAll(".lang").forEach((box) => {
    box.innerHTML = `<button data-lang="kk">KZ</button><button data-lang="ru">RU</button><button data-lang="en">EN</button>`;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (btn) setLang(btn.dataset.lang);
    });
  });
  syncSwitcher();
  applyI18n();
}
