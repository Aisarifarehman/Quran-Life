// QURAN LIFE — PHASE 2
// Architecture: plain text AI (no JSON), per-tab loading, cached, retry on fail
// Audio: 2 fallback URLs, never silent fail
// Translation: Quran.com API with language codes, not AI
// Search: instant, smooth, no delay

import { useState, useRef, useCallback, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────
const G = "#0f5132";
const GOLD = "#c9943a";

// ─── 114 SURAHS ──────────────────────────────────────────────
const SURAHS = [
  {n:1,name:"Al-Fatiha",ar:"الفاتحة",meaning:"The Opening",verses:7,type:"Meccan",juz:1,page:1},
  {n:2,name:"Al-Baqarah",ar:"البقرة",meaning:"The Cow",verses:286,type:"Medinan",juz:1,page:2},
  {n:3,name:"Ali Imran",ar:"آل عمران",meaning:"Family of Imran",verses:200,type:"Medinan",juz:3,page:50},
  {n:4,name:"An-Nisa",ar:"النساء",meaning:"The Women",verses:176,type:"Medinan",juz:4,page:77},
  {n:5,name:"Al-Maidah",ar:"المائدة",meaning:"The Table Spread",verses:120,type:"Medinan",juz:6,page:106},
  {n:6,name:"Al-Anam",ar:"الأنعام",meaning:"The Cattle",verses:165,type:"Meccan",juz:7,page:128},
  {n:7,name:"Al-Araf",ar:"الأعراف",meaning:"The Heights",verses:206,type:"Meccan",juz:8,page:151},
  {n:8,name:"Al-Anfal",ar:"الأنفال",meaning:"The Spoils of War",verses:75,type:"Medinan",juz:9,page:177},
  {n:9,name:"At-Tawbah",ar:"التوبة",meaning:"The Repentance",verses:129,type:"Medinan",juz:10,page:187},
  {n:10,name:"Yunus",ar:"يونس",meaning:"Jonah",verses:109,type:"Meccan",juz:11,page:208},
  {n:11,name:"Hud",ar:"هود",meaning:"Hud",verses:123,type:"Meccan",juz:11,page:221},
  {n:12,name:"Yusuf",ar:"يوسف",meaning:"Joseph",verses:111,type:"Meccan",juz:12,page:235},
  {n:13,name:"Ar-Rad",ar:"الرعد",meaning:"The Thunder",verses:43,type:"Medinan",juz:13,page:249},
  {n:14,name:"Ibrahim",ar:"إبراهيم",meaning:"Abraham",verses:52,type:"Meccan",juz:13,page:255},
  {n:15,name:"Al-Hijr",ar:"الحجر",meaning:"The Rocky Tract",verses:99,type:"Meccan",juz:14,page:262},
  {n:16,name:"An-Nahl",ar:"النحل",meaning:"The Bee",verses:128,type:"Meccan",juz:14,page:267},
  {n:17,name:"Al-Isra",ar:"الإسراء",meaning:"The Night Journey",verses:111,type:"Meccan",juz:15,page:282},
  {n:18,name:"Al-Kahf",ar:"الكهف",meaning:"The Cave",verses:110,type:"Meccan",juz:15,page:293},
  {n:19,name:"Maryam",ar:"مريم",meaning:"Mary",verses:98,type:"Meccan",juz:16,page:305},
  {n:20,name:"Ta-Ha",ar:"طه",meaning:"Ta-Ha",verses:135,type:"Meccan",juz:16,page:312},
  {n:21,name:"Al-Anbiya",ar:"الأنبياء",meaning:"The Prophets",verses:112,type:"Meccan",juz:17,page:322},
  {n:22,name:"Al-Hajj",ar:"الحج",meaning:"The Pilgrimage",verses:78,type:"Medinan",juz:17,page:332},
  {n:23,name:"Al-Muminun",ar:"المؤمنون",meaning:"The Believers",verses:118,type:"Meccan",juz:18,page:342},
  {n:24,name:"An-Nur",ar:"النور",meaning:"The Light",verses:64,type:"Medinan",juz:18,page:350},
  {n:25,name:"Al-Furqan",ar:"الفرقان",meaning:"The Criterion",verses:77,type:"Meccan",juz:18,page:359},
  {n:26,name:"Ash-Shuara",ar:"الشعراء",meaning:"The Poets",verses:227,type:"Meccan",juz:19,page:367},
  {n:27,name:"An-Naml",ar:"النمل",meaning:"The Ant",verses:93,type:"Meccan",juz:19,page:377},
  {n:28,name:"Al-Qasas",ar:"القصص",meaning:"The Stories",verses:88,type:"Meccan",juz:20,page:385},
  {n:29,name:"Al-Ankabut",ar:"العنكبوت",meaning:"The Spider",verses:69,type:"Meccan",juz:20,page:396},
  {n:30,name:"Ar-Rum",ar:"الروم",meaning:"The Romans",verses:60,type:"Meccan",juz:21,page:404},
  {n:31,name:"Luqman",ar:"لقمان",meaning:"Luqman",verses:34,type:"Meccan",juz:21,page:411},
  {n:32,name:"As-Sajdah",ar:"السجدة",meaning:"The Prostration",verses:30,type:"Meccan",juz:21,page:415},
  {n:33,name:"Al-Ahzab",ar:"الأحزاب",meaning:"The Combined Forces",verses:73,type:"Medinan",juz:21,page:418},
  {n:34,name:"Saba",ar:"سبأ",meaning:"Sheba",verses:54,type:"Meccan",juz:22,page:428},
  {n:35,name:"Fatir",ar:"فاطر",meaning:"Originator",verses:45,type:"Meccan",juz:22,page:434},
  {n:36,name:"Ya-Sin",ar:"يس",meaning:"Ya Sin",verses:83,type:"Meccan",juz:22,page:440},
  {n:37,name:"As-Saffat",ar:"الصافات",meaning:"Those Ranged in Rows",verses:182,type:"Meccan",juz:23,page:446},
  {n:38,name:"Sad",ar:"ص",meaning:"The Letter Sad",verses:88,type:"Meccan",juz:23,page:453},
  {n:39,name:"Az-Zumar",ar:"الزمر",meaning:"The Troops",verses:75,type:"Meccan",juz:23,page:458},
  {n:40,name:"Ghafir",ar:"غافر",meaning:"The Forgiver",verses:85,type:"Meccan",juz:24,page:467},
  {n:41,name:"Fussilat",ar:"فصلت",meaning:"Explained in Detail",verses:54,type:"Meccan",juz:24,page:477},
  {n:42,name:"Ash-Shura",ar:"الشورى",meaning:"The Consultation",verses:53,type:"Meccan",juz:25,page:483},
  {n:43,name:"Az-Zukhruf",ar:"الزخرف",meaning:"The Ornaments of Gold",verses:89,type:"Meccan",juz:25,page:489},
  {n:44,name:"Ad-Dukhan",ar:"الدخان",meaning:"The Smoke",verses:59,type:"Meccan",juz:25,page:496},
  {n:45,name:"Al-Jathiyah",ar:"الجاثية",meaning:"The Crouching",verses:37,type:"Meccan",juz:25,page:499},
  {n:46,name:"Al-Ahqaf",ar:"الأحقاف",meaning:"The Wind-Curved Sandhills",verses:35,type:"Meccan",juz:26,page:502},
  {n:47,name:"Muhammad",ar:"محمد",meaning:"Muhammad",verses:38,type:"Medinan",juz:26,page:507},
  {n:48,name:"Al-Fath",ar:"الفتح",meaning:"The Victory",verses:29,type:"Medinan",juz:26,page:511},
  {n:49,name:"Al-Hujurat",ar:"الحجرات",meaning:"The Rooms",verses:18,type:"Medinan",juz:26,page:515},
  {n:50,name:"Qaf",ar:"ق",meaning:"The Letter Qaf",verses:45,type:"Meccan",juz:26,page:518},
  {n:51,name:"Adh-Dhariyat",ar:"الذاريات",meaning:"The Winnowing Winds",verses:60,type:"Meccan",juz:26,page:520},
  {n:52,name:"At-Tur",ar:"الطور",meaning:"The Mount",verses:49,type:"Meccan",juz:27,page:523},
  {n:53,name:"An-Najm",ar:"النجم",meaning:"The Star",verses:62,type:"Meccan",juz:27,page:526},
  {n:54,name:"Al-Qamar",ar:"القمر",meaning:"The Moon",verses:55,type:"Meccan",juz:27,page:528},
  {n:55,name:"Ar-Rahman",ar:"الرحمن",meaning:"The Beneficent",verses:78,type:"Medinan",juz:27,page:531},
  {n:56,name:"Al-Waqiah",ar:"الواقعة",meaning:"The Inevitable",verses:96,type:"Meccan",juz:27,page:534},
  {n:57,name:"Al-Hadid",ar:"الحديد",meaning:"The Iron",verses:29,type:"Medinan",juz:27,page:537},
  {n:58,name:"Al-Mujadila",ar:"المجادلة",meaning:"The Pleading Woman",verses:22,type:"Medinan",juz:28,page:542},
  {n:59,name:"Al-Hashr",ar:"الحشر",meaning:"The Exile",verses:24,type:"Medinan",juz:28,page:545},
  {n:60,name:"Al-Mumtahanah",ar:"الممتحنة",meaning:"She That is to be Examined",verses:13,type:"Medinan",juz:28,page:549},
  {n:61,name:"As-Saf",ar:"الصف",meaning:"The Rows",verses:14,type:"Medinan",juz:28,page:551},
  {n:62,name:"Al-Jumuah",ar:"الجمعة",meaning:"The Congregation",verses:11,type:"Medinan",juz:28,page:553},
  {n:63,name:"Al-Munafiqun",ar:"المنافقون",meaning:"The Hypocrites",verses:11,type:"Medinan",juz:28,page:554},
  {n:64,name:"At-Taghabun",ar:"التغابن",meaning:"The Mutual Disillusion",verses:18,type:"Medinan",juz:28,page:556},
  {n:65,name:"At-Talaq",ar:"الطلاق",meaning:"The Divorce",verses:12,type:"Medinan",juz:28,page:558},
  {n:66,name:"At-Tahrim",ar:"التحريم",meaning:"The Prohibition",verses:12,type:"Medinan",juz:28,page:560},
  {n:67,name:"Al-Mulk",ar:"الملك",meaning:"The Sovereignty",verses:30,type:"Meccan",juz:29,page:562},
  {n:68,name:"Al-Qalam",ar:"القلم",meaning:"The Pen",verses:52,type:"Meccan",juz:29,page:564},
  {n:69,name:"Al-Haqqah",ar:"الحاقة",meaning:"The Reality",verses:52,type:"Meccan",juz:29,page:566},
  {n:70,name:"Al-Maarij",ar:"المعارج",meaning:"The Ascending Stairways",verses:44,type:"Meccan",juz:29,page:568},
  {n:71,name:"Nuh",ar:"نوح",meaning:"Noah",verses:28,type:"Meccan",juz:29,page:570},
  {n:72,name:"Al-Jinn",ar:"الجن",meaning:"The Jinn",verses:28,type:"Meccan",juz:29,page:572},
  {n:73,name:"Al-Muzzammil",ar:"المزمل",meaning:"The Enshrouded One",verses:20,type:"Meccan",juz:29,page:574},
  {n:74,name:"Al-Muddaththir",ar:"المدثر",meaning:"The Cloaked One",verses:56,type:"Meccan",juz:29,page:575},
  {n:75,name:"Al-Qiyamah",ar:"القيامة",meaning:"The Resurrection",verses:40,type:"Meccan",juz:29,page:577},
  {n:76,name:"Al-Insan",ar:"الإنسان",meaning:"The Human",verses:31,type:"Medinan",juz:29,page:578},
  {n:77,name:"Al-Mursalat",ar:"المرسلات",meaning:"The Emissaries",verses:50,type:"Meccan",juz:29,page:580},
  {n:78,name:"An-Naba",ar:"النبأ",meaning:"The Tidings",verses:40,type:"Meccan",juz:30,page:582},
  {n:79,name:"An-Naziat",ar:"النازعات",meaning:"Those Who Drag Forth",verses:46,type:"Meccan",juz:30,page:583},
  {n:80,name:"Abasa",ar:"عبس",meaning:"He Frowned",verses:42,type:"Meccan",juz:30,page:585},
  {n:81,name:"At-Takwir",ar:"التكوير",meaning:"The Overthrowing",verses:29,type:"Meccan",juz:30,page:586},
  {n:82,name:"Al-Infitar",ar:"الانفطار",meaning:"The Cleaving",verses:19,type:"Meccan",juz:30,page:587},
  {n:83,name:"Al-Mutaffifin",ar:"المطففين",meaning:"The Defrauding",verses:36,type:"Meccan",juz:30,page:587},
  {n:84,name:"Al-Inshiqaq",ar:"الانشقاق",meaning:"The Splitting Open",verses:25,type:"Meccan",juz:30,page:589},
  {n:85,name:"Al-Buruj",ar:"البروج",meaning:"The Mansions of the Stars",verses:22,type:"Meccan",juz:30,page:590},
  {n:86,name:"At-Tariq",ar:"الطارق",meaning:"The Morning Star",verses:17,type:"Meccan",juz:30,page:591},
  {n:87,name:"Al-Ala",ar:"الأعلى",meaning:"The Most High",verses:19,type:"Meccan",juz:30,page:591},
  {n:88,name:"Al-Ghashiyah",ar:"الغاشية",meaning:"The Overwhelming",verses:26,type:"Meccan",juz:30,page:592},
  {n:89,name:"Al-Fajr",ar:"الفجر",meaning:"The Dawn",verses:30,type:"Meccan",juz:30,page:593},
  {n:90,name:"Al-Balad",ar:"البلد",meaning:"The City",verses:20,type:"Meccan",juz:30,page:594},
  {n:91,name:"Ash-Shams",ar:"الشمس",meaning:"The Sun",verses:15,type:"Meccan",juz:30,page:595},
  {n:92,name:"Al-Layl",ar:"الليل",meaning:"The Night",verses:21,type:"Meccan",juz:30,page:595},
  {n:93,name:"Ad-Duha",ar:"الضحى",meaning:"The Morning Hours",verses:11,type:"Meccan",juz:30,page:596},
  {n:94,name:"Ash-Sharh",ar:"الشرح",meaning:"The Relief",verses:8,type:"Meccan",juz:30,page:596},
  {n:95,name:"At-Tin",ar:"التين",meaning:"The Fig",verses:8,type:"Meccan",juz:30,page:597},
  {n:96,name:"Al-Alaq",ar:"العلق",meaning:"The Clot",verses:19,type:"Meccan",juz:30,page:597},
  {n:97,name:"Al-Qadr",ar:"القدر",meaning:"The Power",verses:5,type:"Meccan",juz:30,page:598},
  {n:98,name:"Al-Bayyinah",ar:"البينة",meaning:"The Clear Proof",verses:8,type:"Medinan",juz:30,page:598},
  {n:99,name:"Az-Zalzalah",ar:"الزلزلة",meaning:"The Earthquake",verses:8,type:"Medinan",juz:30,page:599},
  {n:100,name:"Al-Adiyat",ar:"العاديات",meaning:"The Courser",verses:11,type:"Meccan",juz:30,page:599},
  {n:101,name:"Al-Qariah",ar:"القارعة",meaning:"The Calamity",verses:11,type:"Meccan",juz:30,page:600},
  {n:102,name:"At-Takathur",ar:"التكاثر",meaning:"The Rivalry in World Increase",verses:8,type:"Meccan",juz:30,page:600},
  {n:103,name:"Al-Asr",ar:"العصر",meaning:"The Declining Day",verses:3,type:"Meccan",juz:30,page:601},
  {n:104,name:"Al-Humazah",ar:"الهمزة",meaning:"The Traducer",verses:9,type:"Meccan",juz:30,page:601},
  {n:105,name:"Al-Fil",ar:"الفيل",meaning:"The Elephant",verses:5,type:"Meccan",juz:30,page:601},
  {n:106,name:"Quraysh",ar:"قريش",meaning:"Quraysh",verses:4,type:"Meccan",juz:30,page:602},
  {n:107,name:"Al-Maun",ar:"الماعون",meaning:"The Small Kindnesses",verses:7,type:"Meccan",juz:30,page:602},
  {n:108,name:"Al-Kawthar",ar:"الكوثر",meaning:"The Abundance",verses:3,type:"Meccan",juz:30,page:602},
  {n:109,name:"Al-Kafirun",ar:"الكافرون",meaning:"The Disbelievers",verses:6,type:"Meccan",juz:30,page:603},
  {n:110,name:"An-Nasr",ar:"النصر",meaning:"The Divine Support",verses:3,type:"Medinan",juz:30,page:603},
  {n:111,name:"Al-Masad",ar:"المسد",meaning:"The Palm Fiber",verses:5,type:"Meccan",juz:30,page:603},
  {n:112,name:"Al-Ikhlas",ar:"الإخلاص",meaning:"The Sincerity",verses:4,type:"Meccan",juz:30,page:604},
  {n:113,name:"Al-Falaq",ar:"الفلق",meaning:"The Daybreak",verses:5,type:"Meccan",juz:30,page:604},
  {n:114,name:"An-Nas",ar:"الناس",meaning:"The Mankind",verses:6,type:"Meccan",juz:30,page:604},
];

// Language → Quran.com translation ID mapping
// Dynamically loaded from Quran.com API on startup — no hardcoded guesses
const LANG_TRANSLATIONS = { en: 131, ar: null };

// Preferred author keywords per language for picking best translation
const PREF = {
  ur:["maududi","jalandhry","ahmed ali"],hi:["omari","hindi"],fr:["hamidullah"],
  de:["bubenheim"],es:["garcia"],tr:["diyanet","ozturk"],id:["indonesian"],
  ms:["basmeih","malay"],bn:["bengali"],fa:["makarem","ansarian"],
  ru:["kuliev","osmanov"],zh:["makin","chinese"],pt:["nasr"],it:["piccardo"],
  nl:["keyzer"],pl:["bielawski"],ko:["korean"],ja:["japanese"],
  sw:["swahili"],bs:["korkut"],uk:["ukrainian"],
};

async function loadTranslationIDs() {
  try {
    const r = await fetch("https://api.quran.com/api/v4/resources/translations");
    if (!r.ok) return;
    const d = await r.json();
    // Group by language name
    const byLang = {};
    for (const t of (d.translations || [])) {
      const lc = (t.language_name || "").toLowerCase();
      if (!byLang[lc]) byLang[lc] = [];
      byLang[lc].push(t);
    }
    // Language code -> API language name mapping
    const MAP = {
      ur:"urdu", hi:"hindi", fr:"french", de:"german", es:"spanish",
      tr:"turkish", id:"indonesian", ms:"malay", bn:"bengali", fa:"persian",
      ru:"russian", zh:"chinese", pt:"portuguese", it:"italian", nl:"dutch",
      pl:"polish", ko:"korean", ja:"japanese", sw:"swahili", bs:"bosnian",
      uk:"ukrainian", ta:"tamil", te:"telugu", ml:"malayalam", gu:"gujarati",
      ne:"nepali", my:"burmese", so:"somali", sq:"albanian", el:"greek",
      he:"hebrew", fi:"finnish", sv:"swedish", af:"afrikaans", kk:"kazakh",
      uz:"uzbek", am:"amharic", km:"khmer", mn:"mongolian", tg:"tajik",
      jv:"javanese", ha:"hausa", yo:"yoruba", tl:"tagalog",
    };
    for (const [code, langName] of Object.entries(MAP)) {
      const list = byLang[langName] || [];
      if (!list.length) continue;
      const prefs = PREF[code] || [];
      let best = null;
      for (const kw of prefs) {
        best = list.find(t =>
          (t.slug || "").toLowerCase().includes(kw) ||
          (t.author_name || "").toLowerCase().includes(kw) ||
          (t.name || "").toLowerCase().includes(kw)
        );
        if (best) break;
      }
      if (!best) best = list[0];
      if (best) LANG_TRANSLATIONS[code] = best.id;
    }
  } catch (e) { /* silently fail — English always works */ }
}
// Run immediately when app loads
loadTranslationIDs();

const LANGS = [
  {c:"en",n:"English",na:"English"},
  {c:"ur",n:"Urdu",na:"اردو"},
  {c:"ar",n:"Arabic",na:"العربية"},
  {c:"fr",n:"French",na:"Français"},
  {c:"de",n:"German",na:"Deutsch"},
  {c:"es",n:"Spanish",na:"Español"},
  {c:"tr",n:"Turkish",na:"Türkçe"},
  {c:"id",n:"Indonesian",na:"Bahasa Indonesia"},
  {c:"ms",n:"Malay",na:"Bahasa Melayu"},
  {c:"bn",n:"Bengali",na:"বাংলা"},
  {c:"hi",n:"Hindi",na:"हिंदी"},
  {c:"sw",n:"Swahili",na:"Kiswahili"},
  {c:"ha",n:"Hausa",na:"Hausa"},
  {c:"ps",n:"Pashto",na:"پښتو"},
  {c:"fa",n:"Persian",na:"فارسی"},
  {c:"pa",n:"Punjabi",na:"ਪੰਜਾਬੀ"},
  {c:"sd",n:"Sindhi",na:"سنڌي"},
  {c:"so",n:"Somali",na:"Soomaali"},
  {c:"zh",n:"Chinese",na:"中文"},
  {c:"ja",n:"Japanese",na:"日本語"},
  {c:"ko",n:"Korean",na:"한국어"},
  {c:"ru",n:"Russian",na:"Русский"},
  {c:"pt",n:"Portuguese",na:"Português"},
  {c:"it",n:"Italian",na:"Italiano"},
  {c:"ta",n:"Tamil",na:"தமிழ்"},
  {c:"te",n:"Telugu",na:"తెలుగు"},
  {c:"ml",n:"Malayalam",na:"മലയാളം"},
  {c:"gu",n:"Gujarati",na:"ગુજરાતી"},
  {c:"ne",n:"Nepali",na:"नेपाली"},
  {c:"my",n:"Burmese",na:"မြန်မာဘာသာ"},
  {c:"yo",n:"Yoruba",na:"Yorùbá"},
  {c:"sq",n:"Albanian",na:"Shqip"},
  {c:"uk",n:"Ukrainian",na:"Українська"},
  {c:"el",n:"Greek",na:"Ελληνικά"},
  {c:"he",n:"Hebrew",na:"עברית"},
  {c:"fi",n:"Finnish",na:"Suomi"},
  {c:"sv",n:"Swedish",na:"Svenska"},
  {c:"tl",n:"Filipino",na:"Filipino"},
  {c:"am",n:"Amharic",na:"አማርኛ"},
  {c:"zu",n:"Zulu",na:"isiZulu"},
  {c:"af",n:"Afrikaans",na:"Afrikaans"},
  {c:"bs",n:"Bosnian",na:"Bosanski"},
  {c:"kk",n:"Kazakh",na:"Қазақша"},
  {c:"uz",n:"Uzbek",na:"O'zbek"},
  {c:"mn",n:"Mongolian",na:"Монгол"},
  {c:"km",n:"Khmer",na:"ភាសាខ្មែរ"},
  {c:"tg",n:"Tajik",na:"Тоҷикӣ"},
  {c:"jv",n:"Javanese",na:"Basa Jawa"},
];

// ─── COUNTRIES → LANGUAGES (only codes that exist in LANGS) ───
const COUNTRIES = [
  {id:"in",flag:"🇮🇳",name:"India",langs:["hi","ur","bn","ta","te","ml","gu","pa","en"]},
  {id:"pk",flag:"🇵🇰",name:"Pakistan",langs:["ur","pa","sd","ps","en"]},
  {id:"bd",flag:"🇧🇩",name:"Bangladesh",langs:["bn","en"]},
  {id:"sa",flag:"🇸🇦",name:"Saudi Arabia",langs:["ar"]},
  {id:"ae",flag:"🇦🇪",name:"UAE",langs:["ar","en","ur","hi","ml","tl"]},
  {id:"id",flag:"🇮🇩",name:"Indonesia",langs:["id","jv"]},
  {id:"my",flag:"🇲🇾",name:"Malaysia",langs:["ms","en","ta","zh"]},
  {id:"tr",flag:"🇹🇷",name:"Turkey",langs:["tr"]},
  {id:"ir",flag:"🇮🇷",name:"Iran",langs:["fa"]},
  {id:"af",flag:"🇦🇫",name:"Afghanistan",langs:["ps","fa","uz"]},
  {id:"ng",flag:"🇳🇬",name:"Nigeria",langs:["ha","yo","en"]},
  {id:"eg",flag:"🇪🇬",name:"Egypt",langs:["ar"]},
  {id:"us",flag:"🇺🇸",name:"USA / UK",langs:["en","es"]},
  {id:"fr",flag:"🇫🇷",name:"France",langs:["fr","ar"]},
  {id:"de",flag:"🇩🇪",name:"Germany",langs:["de","tr"]},
  {id:"es",flag:"🇪🇸",name:"Spain",langs:["es"]},
  {id:"cn",flag:"🇨🇳",name:"China",langs:["zh"]},
  {id:"jp",flag:"🇯🇵",name:"Japan",langs:["ja"]},
  {id:"kr",flag:"🇰🇷",name:"South Korea",langs:["ko"]},
  {id:"ru",flag:"🇷🇺",name:"Russia",langs:["ru"]},
  {id:"br",flag:"🇧🇷",name:"Brazil / Portugal",langs:["pt"]},
  {id:"it",flag:"🇮🇹",name:"Italy",langs:["it"]},
  {id:"np",flag:"🇳🇵",name:"Nepal",langs:["ne","hi"]},
  {id:"mm",flag:"🇲🇲",name:"Myanmar",langs:["my"]},
  {id:"so",flag:"🇸🇴",name:"Somalia",langs:["so","ar"]},
  {id:"ke",flag:"🇰🇪",name:"Kenya / Tanzania",langs:["sw","en"]},
  {id:"al",flag:"🇦🇱",name:"Albania / Kosovo",langs:["sq"]},
  {id:"ua",flag:"🇺🇦",name:"Ukraine",langs:["uk","ru"]},
  {id:"gr",flag:"🇬🇷",name:"Greece",langs:["el"]},
  {id:"il",flag:"🇮🇱",name:"Israel / Palestine",langs:["he","ar"]},
  {id:"fi",flag:"🇫🇮",name:"Finland",langs:["fi","sv"]},
  {id:"se",flag:"🇸🇪",name:"Sweden",langs:["sv"]},
  {id:"ph",flag:"🇵🇭",name:"Philippines",langs:["tl","en"]},
  {id:"et",flag:"🇪🇹",name:"Ethiopia",langs:["am","so"]},
  {id:"za",flag:"🇿🇦",name:"South Africa",langs:["zu","af","en"]},
  {id:"ba",flag:"🇧🇦",name:"Bosnia",langs:["bs"]},
  {id:"kz",flag:"🇰🇿",name:"Kazakhstan",langs:["kk","ru"]},
  {id:"uz",flag:"🇺🇿",name:"Uzbekistan",langs:["uz","ru"]},
  {id:"mn",flag:"🇲🇳",name:"Mongolia",langs:["mn"]},
  {id:"kh",flag:"🇰🇭",name:"Cambodia",langs:["km"]},
  {id:"tj",flag:"🇹🇯",name:"Tajikistan",langs:["tg","ru"]},
];

const QARIS = [
  {id:"ar.alafasy",name:"Mishary Alafasy",short:"Mishary",origin:"Kuwait"},
  {id:"ar.abdurrahmanassudais",name:"Abdul Rahman Al-Sudais",short:"Al-Sudais",origin:"Saudi Arabia"},
  {id:"ar.mahermuaiqly",name:"Maher Al Muaiqly",short:"Al-Muaiqly",origin:"Saudi Arabia"},
  {id:"ar.saadalghamdi",name:"Saad Al-Ghamdi",short:"Al-Ghamdi",origin:"Saudi Arabia"},
];

// ─── 15 SAJDAH VERSES ────────────────────────────────────────
// These are the 14 obligatory + 1 recommended Sajdah verses in the Quran
const SAJDAH_VERSES = [
  {surah:7, verse:206, type:"wajib"},
  {surah:13, verse:15, type:"wajib"},
  {surah:16, verse:50, type:"wajib"},
  {surah:17, verse:109, type:"wajib"},
  {surah:19, verse:58, type:"wajib"},
  {surah:22, verse:18, type:"wajib"},
  {surah:22, verse:77, type:"recommended"},
  {surah:25, verse:60, type:"wajib"},
  {surah:27, verse:26, type:"wajib"},
  {surah:32, verse:15, type:"wajib"},
  {surah:38, verse:24, type:"recommended"},
  {surah:41, verse:38, type:"wajib"},
  {surah:53, verse:62, type:"wajib"},
  {surah:84, verse:21, type:"wajib"},
  {surah:96, verse:19, type:"wajib"},
];

function isSajdahVerse(surahNum, verseNum) {
  return SAJDAH_VERSES.find(s => s.surah === surahNum && s.verse === verseNum) || null;
}

const QUICK_LINKS = [
  {name:"Ayatul Kursi",ar:"آية الكرسي",surah:2,icon:"👑"},
  {name:"Al-Kahf",ar:"الكهف",surah:18,icon:"🕌"},
  {name:"Al-Mulk",ar:"الملك",surah:67,icon:"🌙"},
  {name:"Ar-Rahman",ar:"الرحمن",surah:55,icon:"💚"},
  {name:"Ya-Sin",ar:"يس",surah:36,icon:"⭐"},
  {name:"Al-Ikhlas",ar:"الإخلاص",surah:112,icon:"🤲"},
];

const ARABIC_ALPHA = [
  {l:"أ",n:"Alif",full:"ألف",s:"A",color:"#e74c3c",e:"🦁",w:"أسد",wt:"Asad",wm:"Lion"},
  {l:"ب",n:"Ba",full:"باء",s:"B",color:"#e67e22",e:"🦆",w:"بطة",wt:"Batta",wm:"Duck"},
  {l:"ت",n:"Ta",full:"تاء",s:"T",color:"#f39c12",e:"🍎",w:"تفاحة",wt:"Tuffaha",wm:"Apple"},
  {l:"ث",n:"Tha",full:"ثاء",s:"Th",color:"#27ae60",e:"🐍",w:"ثعبان",wt:"Thu'ban",wm:"Snake"},
  {l:"ج",n:"Jim",full:"جيم",s:"J",color:"#16a085",e:"🐪",w:"جمل",wt:"Jamal",wm:"Camel"},
  {l:"ح",n:"Ha",full:"حاء",s:"H",color:"#2980b9",e:"🐎",w:"حصان",wt:"Hisan",wm:"Horse"},
  {l:"خ",n:"Kha",full:"خاء",s:"Kh",color:"#8e44ad",e:"🐑",w:"خروف",wt:"Kharoof",wm:"Sheep"},
  {l:"د",n:"Dal",full:"دال",s:"D",color:"#c0392b",e:"🐻",w:"دب",wt:"Dubb",wm:"Bear"},
  {l:"ذ",n:"Dhal",full:"ذال",s:"Dh",color:"#d35400",e:"🐺",w:"ذئب",wt:"Dhi'b",wm:"Wolf"},
  {l:"ر",n:"Ra",full:"راء",s:"R",color:"#7f8c8d",e:"🍇",w:"رمان",wt:"Rumman",wm:"Pomegranate"},
  {l:"ز",n:"Zay",full:"زاي",s:"Z",color:"#2ecc71",e:"🌺",w:"زهرة",wt:"Zahra",wm:"Flower"},
  {l:"س",n:"Sin",full:"سين",s:"S",color:"#1abc9c",e:"🐟",w:"سمكة",wt:"Samaka",wm:"Fish"},
  {l:"ش",n:"Shin",full:"شين",s:"Sh",color:"#3498db",e:"☀️",w:"شمس",wt:"Shams",wm:"Sun"},
  {l:"ص",n:"Sad",full:"صاد",s:"S",color:"#9b59b6",e:"🦅",w:"صقر",wt:"Saqr",wm:"Falcon"},
  {l:"ض",n:"Dad",full:"ضاد",s:"D",color:"#e91e63",e:"🐸",w:"ضفدع",wt:"Difda'",wm:"Frog"},
  {l:"ط",n:"Ta",full:"طاء",s:"T",color:"#ff5722",e:"🥁",w:"طبل",wt:"Tabl",wm:"Drum"},
  {l:"ظ",n:"Dha",full:"ظاء",s:"Dh",color:"#795548",e:"🦌",w:"ظبي",wt:"Zabi",wm:"Deer"},
  {l:"ع",n:"Ain",full:"عين",s:"'A",color:"#607d8b",e:"🍇",w:"عنب",wt:"Inab",wm:"Grapes"},
  {l:"غ",n:"Ghain",full:"غين",s:"Gh",color:"#e74c3c",e:"🐦",w:"غراب",wt:"Ghurab",wm:"Crow"},
  {l:"ف",n:"Fa",full:"فاء",s:"F",color:"#e67e22",e:"🦋",w:"فراشة",wt:"Farasha",wm:"Butterfly"},
  {l:"ق",n:"Qaf",full:"قاف",s:"Q",color:"#f39c12",e:"🐱",w:"قطة",wt:"Qitta",wm:"Cat"},
  {l:"ك",n:"Kaf",full:"كاف",s:"K",color:"#27ae60",e:"🐶",w:"كلب",wt:"Kalb",wm:"Dog"},
  {l:"ل",n:"Lam",full:"لام",s:"L",color:"#16a085",e:"🎮",w:"لعبة",wt:"Lu'ba",wm:"Game"},
  {l:"م",n:"Mim",full:"ميم",s:"M",color:"#2980b9",e:"💧",w:"ماء",wt:"Ma'",wm:"Water"},
  {l:"ن",n:"Nun",full:"نون",s:"N",color:"#8e44ad",e:"🌟",w:"نجمة",wt:"Najma",wm:"Star"},
  {l:"ه",n:"Ha",full:"هاء",s:"H",color:"#c0392b",e:"🌙",w:"هلال",wt:"Hilal",wm:"Crescent"},
  {l:"و",n:"Waw",full:"واو",s:"W",color:"#d35400",e:"🌹",w:"وردة",wt:"Warda",wm:"Rose"},
  {l:"ي",n:"Ya",full:"ياء",s:"Y",color:"#7f8c8d",e:"🕊️",w:"يمامة",wt:"Yamama",wm:"Dove"},
];

// ─── VERSE CACHE ─────────────────────────────────────────────
const verseCache = {};

const LANG_NAMES = {
  en:"English",ur:"Urdu",ar:"Arabic",fr:"French",de:"German",es:"Spanish",
  tr:"Turkish",id:"Indonesian",ms:"Malay",bn:"Bengali",hi:"Hindi",sw:"Swahili",
  ha:"Hausa",ps:"Pashto",fa:"Persian",pa:"Punjabi",sd:"Sindhi",so:"Somali",
  zh:"Chinese",ja:"Japanese",ko:"Korean",ru:"Russian",pt:"Portuguese",it:"Italian",
  nl:"Dutch",pl:"Polish",ta:"Tamil",te:"Telugu",ml:"Malayalam",gu:"Gujarati",
  ne:"Nepali",my:"Burmese",yo:"Yoruba",sq:"Albanian",uk:"Ukrainian",el:"Greek",
  he:"Hebrew",fi:"Finnish",sv:"Swedish",tl:"Filipino",am:"Amharic",zu:"Zulu",
  af:"Afrikaans",bs:"Bosnian",kk:"Kazakh",uz:"Uzbek",mn:"Mongolian",km:"Khmer",
  tg:"Tajik",jv:"Javanese",ku:"Kurdish",
};

// Exact BCP-47 locale per language — ensures the browser picks the CORRECT
// voice/accent and never mixes languages during speech playback
const SPEECH_LOCALE = {
  en:"en-US",ur:"ur-PK",ar:"ar-SA",fr:"fr-FR",de:"de-DE",es:"es-ES",
  tr:"tr-TR",id:"id-ID",ms:"ms-MY",bn:"bn-BD",hi:"hi-IN",sw:"sw-KE",
  ha:"ha-NG",ps:"ps-AF",fa:"fa-IR",pa:"pa-IN",sd:"sd-PK",so:"so-SO",
  zh:"zh-CN",ja:"ja-JP",ko:"ko-KR",ru:"ru-RU",pt:"pt-PT",it:"it-IT",
  nl:"nl-NL",pl:"pl-PL",ta:"ta-IN",te:"te-IN",ml:"ml-IN",gu:"gu-IN",
  ne:"ne-NP",my:"my-MM",yo:"yo-NG",sq:"sq-AL",uk:"uk-UA",el:"el-GR",
  he:"he-IL",fi:"fi-FI",sv:"sv-SE",tl:"fil-PH",am:"am-ET",zu:"zu-ZA",
  af:"af-ZA",bs:"bs-BA",kk:"kk-KZ",uz:"uz-UZ",mn:"mn-MN",km:"km-KH",
  tg:"tg-TJ",jv:"jv-ID",ku:"ku-TR",
};

// REAL recorded human-voice translation audio — verified from everyayah.com
// One MP3 per verse, male reciter, continuous professional quality (same
// hosting model as our Arabic Qari audio). File pattern: SSSVVV.mp3
// e.g. Surah 1 Verse 1 = 001001.mp3
const REAL_AUDIO_TRANSLATIONS = {
  ur: { base: "https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/", reciter: "Shamshad Ali Khan" },
  fa: { base: "https://everyayah.com/data/translations/Fooladvand_Hedayatfar_40Kbps/", reciter: "Hedayatfar" },
  bs: { base: "https://everyayah.com/data/translations/besim_korkut_ajet_po_ajet/", reciter: "Besim Korkut" },
  en: { base: "https://everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/", reciter: "Ibrahim Walk" },
  az: { base: "https://everyayah.com/data/translations/azerbaijani/balayev/", reciter: "Balayev" },
};

function realAudioUrl(langCode, surahNum, verseNum) {
  const entry = REAL_AUDIO_TRANSLATIONS[langCode];
  if (!entry) return null;
  const s = String(surahNum).padStart(3, "0");
  const v = String(verseNum).padStart(3, "0");
  return `${entry.base}${s}${v}.mp3`;
}

// PER-SURAH real recorded translation audio — verified from archive.org.
// These play the WHOLE Surah as one continuous file (not per-verse), by a
// real human reciter. Used for languages where no per-verse recording exists.
const BANGLA_SURAH_FILES = {
  1: "001%20SURA%20FATIHA%20AND%20OPENING.mp3",
  2: "002%20SURA%20%20BAQARA.mp3",
  3: "003%20%20SURA%20%20AL%20%20IMRAN.mp3",
  4: "004%20SURA%20%20AN%20%20NISA.mp3",
  5: "005%20SURA%20%20AL%20%20MAIDA.mp3",
  6: "006%20%20SURA%20%20AL%20%20ANAM.mp3",
  7: "007%20SURA%20AL%20%20ARAF.mp3",
  8: "008%20SURA%20%20AN%20FAL.mp3",
  9: "009%20SURA%20%20TAWBA.mp3",
  10: "010%20%20SURA%20%20YUNUS.mp3",
  11: "011%20%20SURA%20%20HUD.mp3",
  12: "012%20%20SURA%20%20USUF.mp3",
  13: "013%20%20SURA%20%20RAAD.mp3",
  14: "014%20SURA%20%20IBRAHIM.mp3",
  15: "015%20%20SURA%20%20AL%20%20HI%20JR.mp3",
  16: "016%20%20SURA%20%20AN%20%20NAHAL.mp3",
  17: "017%20SURA%20%20BANI%20%20ISRAIEL.mp3",
  18: "018%20%20SURA%20%20AL%20%20KAHAF.mp3",
  19: "019%20%20SURA%20%20MARIYAM.mp3",
  20: "020%20%20SURA%20%20TOAHA.mp3",
  21: "021%20SURA%20%20AMBIA.mp3",
  22: "022%20%20SURA%20AL%20HAZZ.mp3",
  23: "023%20%20SURA%20%20MOMINOON.mp3",
  24: "024%20SURA%20AN%20NOOR.mp3",
  25: "025%20SURA%20AL%20FOORCAN.mp3",
  26: "026%20SURA%20%20AS%20SOOARA.mp3",
  27: "027%20SURA%20AN%20NAMAL.mp3",
  28: "028%20SURA%20AL%20KASAS.mp3",
  29: "029%20SURA%20AL%20%20ANKABOOT.mp3",
  30: "030%20SURA%20%20RA%20ROOM.mp3",
  31: "031%20SURA%20%20LOOKMAN.mp3",
  32: "032%20SURA%20AS%20SASDA.mp3",
  33: "033%20SURA%20AL%20AHZAB.mp3",
  34: "034%20%20SURA%20%20SABA.mp3",
  35: "035%20%20SURA%20%20FATIR.mp3",
  36: "036%20%20SURA%20%20YASIN.mp3",
  37: "037%20%20SURA%20%20ASSAFFAT.mp3",
  38: "038%20SURA%20%20SWAD.mp3",
  39: "039%20SURA%20AZ%20%20ZOOMAR.mp3",
  40: "040%20SURA%20AL%20%20MOMIN.mp3",
  41: "041%20SURA%20HAMIM%20AS%20SASDA.mp3",
  42: "042%20%20SURA%20AS%20SURA.mp3",
  43: "043%20%20SURA%20%20AZZOKROOF.mp3",
  44: "044%20SURA%20ADDOKHAN.mp3",
  45: "045%20%20SURA%20%20ZASYA.mp3",
  46: "046%20SURA%20AL%20AHKAB.mp3",
  47: "047%20%20SURA%20%20MOHAMMED.mp3",
  48: "048%20%20SURA%20%20FATTAH.mp3",
  49: "049%20%20SURA%20AL%20HUZURAT.mp3",
  50: "050%20SURA%20KAAF.mp3",
  51: "051%20%20SURA%20%20ZARIAT.mp3",
  52: "052%20SURA%20%20ATTOOR.mp3",
  53: "053%20SURA%20ANNZAM.mp3",
  54: "054%20SURA%20KAMAR.mp3",
  55: "055%20SURA%20AR%20RAHMAN.mp3",
  56: "056%20SURA%20%20WAKEYA.mp3",
  57: "057%20SURA%20%20HADID.mp3",
  58: "058%20%20SURA%20%20AL%20%20MUZADALA.mp3",
  59: "059%20SURA%20AL%20HASHOR.mp3",
  60: "060%20SURA%20AL%20MOMTAHANA.mp3",
  61: "061%20%20SURA%20%20ASSAF.mp3",
  62: "062%20SURA%20AL%20%20%20ZOOMA.mp3",
  63: "063%20SURA%20MONAFEKOON.mp3",
  64: "064%20%20SURA%20%20ATTAGABOON.mp3",
  65: "065%20SURA%20%20ATTALAK.mp3",
  66: "066%20SURA%20%20ATTAHRIM.mp3",
  67: "067%20SURA%20AL%20MULK.mp3",
  68: "068%20SURA%20AL%20KALAM.mp3",
  69: "069%20SURA%20AL%20HAKKA.mp3",
  70: "070%20SURA%20AL%20MAAREZ.mp3",
  71: "071%20SURA%20%20NOAH.mp3",
  72: "072%20%20SURA%20%20AL%20JINN.mp3",
  73: "073%20SURA%20AL%20MUZZAMMIL.mp3",
  74: "074%20SURA%20AL%20MUDDATHTHIR.mp3",
  75: "075%20SURA%20AL%20QIYAMA.mp3",
  76: "076%20SURA%20ADDAHOR.mp3",
  77: "077%20SURA%20AL%20MURSALAT.mp3",
  78: "078%20SURA%20AN%20NABA.mp3",
  79: "079%20%20SURA%20%20ANNAZIAT.mp3",
  80: "080%20SURA%20ABASA.mp3",
  81: "081%20SURA%20%20AT%20TAKWIR.mp3",
  82: "082%20SURA%20%20%20AL%20INFITOR.mp3",
  83: "083%20%20SURA%20%20%20AL%20MUTAFFIFIN.mp3",
  84: "084%20%20SURA%20%20%20AL%20%20INSHIQAQ.mp3",
  85: "085%20%20SURA%20%20%20AL%20BURUJ.mp3",
  86: "086%20SURA%20%20%20ATTARIQ.mp3",
  87: "087%20%20SURA%20%20%20AL%20A%27%20LA.mp3",
  88: "088%20%20SURA%20%20%20AL%20%20GHASHIYA.mp3",
  89: "089%20SURA%20%20%20AL%20%20FAJAR.mp3",
  90: "090%20%20SURA%20%20%20AL%20%20BALAD.mp3",
  91: "091%20SURA%20%20%20AL%20SHAMS.mp3",
  92: "092%20%20SURA%20%20%20AL%20LAYL.mp3",
  93: "093%20%20SURA%20%20%20AL%20DUHA.mp3",
  94: "094%20SURA%20%20%20AL%20%20INSHIRAH.mp3",
  95: "095%20SURA%20%20%20AL%20TIN.mp3",
  96: "096%20SURA%20%20%20AL%20ALAQ.mp3",
  97: "097%20%20SURA%20%20%20AL%20%20QADAR.mp3",
  98: "098%20%20SURA%20%20%20AL%20%20BAYYINA.mp3",
  99: "099%20%20SURA%20%20%20AL%20ZALZAL.mp3",
  100: "100%20%20SURA%20%20%20AL%20%20%20ADIYAT.mp3",
  101: "101%20%20SURA%20%20%20AL%20%20%20QARIA.mp3",
  102: "102%20%20SURA%20%20%20AL%20%20%20TAKATHUR.mp3",
  103: "103%20%20SURA%20%20%20AL%20%20ASR.mp3",
  104: "104%20%20SURA%20%20%20AL%20HUMAZA.mp3",
  105: "105%20%20SURA%20%20%20AL%20FIL.mp3",
  106: "106%20%20SURA%20%20QURAYSH.mp3",
  107: "107%20%20SURA%20%20AL%20MA%27%20UN.mp3",
  108: "108%20%20SURA%20%20AL%20KAWSHAR.mp3",
  109: "109%20%20SURA%20%20AL%20KAFIRUN.mp3",
  110: "110%20%20SURA%20%20AL%20NASR.mp3",
  111: "111%20%20SURA%20%20LAHAB.mp3",
  112: "112%20%20SURA%20%20AL%20IKHLAS.mp3",
  113: "113%20%20%20SURA%20%20AL%20FALAQ.mp3",
  114: "114%20%20SURA%20AL%20NAS.mp3",
};
const HINDI_SURAH_FILES = {
  1: "001%20Al-Fatiha%20%28The%20Opening%29.mp3",
  2: "002%20Al-Baqarah%20%28The%20Cow%29.mp3",
  3: "003%20Al-Imran%20%28The%20Family%20of%20Imran%29.mp3",
  4: "004%20An-Nissa%20%28The%20Women%29.mp3",
  5: "005%20Al-Maidah%20%28The%20Table%20Spread%29.mp3",
  6: "006%20Al-An_am%20%28The%20Cattle%29.mp3",
  7: "007%20Al-A_raf%20%28The%20Heights%29.mp3",
  8: "008%20Al-Anfal%20%28The%20Spoils%20of%20War%29.mp3",
  9: "009%20Al-Tauba%20%28The%20Repentance%29.mp3",
  10: "010%20Yunus%20%28Jonah%29.mp3",
  11: "011%20Hud%20%28The%20Prophet%20Hud%29.mp3",
  12: "012%20Yusuf%20%28Joseph%29.mp3",
  13: "013%20Ar-Rad%20%28The%20Thunder%29.mp3",
  14: "014%20Ibrahim%20%28Abraham%29.mp3",
  15: "015%20Al-Hijr%20%28The%20Rocky%20Tract%29.mp3",
  16: "016%20An-Nahl%20%28The%20Bee%29.mp3",
  17: "017%20Al-Isra%20%28The%20Journey%20by%20Night%29.mp3",
  18: "018%20Al-Kahf%20%28The%20Cave%29.mp3",
  19: "019%20Maryam%20%28Mary%29.mp3",
  20: "020%20Ta-Ha%20%28Twa-Ha%29.mp3",
  21: "021%20Al-Anbiya%20%28The%20Prophets%29.mp3",
  22: "022%20Al-Hajj%20%28The%20Pilgrimage%29.mp3",
  23: "023%20Al-Muminun%20%28The%20Believers%29.mp3",
  24: "024%20Al-Nour%20%28The%20Light%29.mp3",
  25: "025%20Al-Furqan%20%28The%20Criterion%29.mp3",
  26: "026%20Ash-Shuara%20%28The%20Poets%29.mp3",
  27: "027%20An-Naml%20%28The%20Ants%29.mp3",
  28: "028%20Al-Qasas%20%28The%20Narration%29.mp3",
  29: "029%20Al-Ankabut%20%28The%20Spider%29.mp3",
  30: "030%20Ar-Rum%20%28The%20Romans%29.mp3",
  31: "031%20Luqman%20%28Luqman%29.mp3",
  32: "032%20As-Sajdah%20%28The%20Prostration%29.mp3",
  33: "033%20Al-Ahzab%20%28The%20Confederates%29.mp3",
  34: "034%20Saba%20%28Sheba%29.mp3",
  35: "035%20Fatir%20%28The%20Originator%20of%20Creation%29.mp3",
  36: "036%20Ya-Sin%20%28Ya-Sin%29.mp3",
  37: "037%20As-Saffat%20%28The%20Rangers%29.mp3",
  38: "038%20Suad%20%28Saad%29.mp3",
  39: "039%20Az-Zumar%20%28The%20Groups%29.mp3",
  40: "040%20Ghafir%20%28The%20Forgiver%29.mp3",
  41: "041%20Fussilat%20%28Explained%20in%20Detail%29.mp3",
  42: "042%20Ash-Shura%20%28The%20Consultation%29.mp3",
  43: "043%20Az-Zukhruf%20%28The%20Gold%20Adornments%29.mp3",
  44: "044%20Ad-Dukhan%20%28The%20Smoke%29.mp3",
  45: "045%20Al-Jathiya%20%28The%20Kneeling%29.mp3",
  46: "046%20Al-Ahqaf%20%28The%20Curved%20Sandhills%29.mp3",
  47: "047%20Muhammad%20%28Muhammad%29.mp3",
  48: "048%20Al-Fath%20%28The%20Victory%29.mp3",
  49: "049%20Al-Hujurat%20%28The%20Dwellings%29.mp3",
  50: "050%20Qaf%20%28Qaf%29.mp3",
  51: "051%20Az-Zariyat%20%28The%20Winds%20that%20Scatter%29.mp3",
  52: "052%20At-Tur%20%28The%20Mount%29.mp3",
  53: "053%20An-Najm%20%28The%20Star%29.mp3",
  54: "054%20Al-Qamar%20%28The%20Moon%29.mp3",
  55: "055%20Ar-Rahman%20%28The%20Most%20Beneficent%29.mp3",
  56: "056%20Al-Waqia%20%28The%20Event%29.mp3",
  57: "057%20Al-Hadid%20%28Iron%29.mp3",
  58: "058%20Al-Mujadilah%20%28The%20Disputation%29.mp3",
  59: "059%20Al-Hashr%20%28The%20Gathering%29.mp3",
  60: "060%20Al-Mumtahinah%20%28The%20Examined%20One%29.mp3",
  61: "061%20As-Saff.mp3",
  62: "062%20Al-Jumuah%20%28Friday%29.mp3",
  63: "063%20Al-Munafiqun%20%28The%20Hypocrites%29.mp3",
  64: "064%20At-Taghabun%20%28Loss%20and%20Gain%29.mp3",
  65: "065%20At-Talaq%20%28The%20Divorce%29.mp3",
  66: "066%20At-Tahrem%20%28The%20Banning%29.mp3",
  67: "067%20Al-Mulk%20%28Dominion%29.mp3",
  68: "068%20Al-Qalam%20%28The%20Pen%29.mp3",
  69: "069%20Al-Haqqah%20%28The%20Reality%29.mp3",
  70: "070%20Al-Ma_arig%20%28The%20Ways%20of%20Ascent%29.mp3",
  71: "071%20Nuh%20%28Noah%29.mp3",
  72: "072%20Al-Jinn%20%28The%20Jinn%29.mp3",
  73: "073%20Al-Muzzammil%20%28Folded%20in%20Garments%29.mp3",
  74: "074%20Al-Muddaththir%20%28The%20One%20Enveloped%29.mp3",
  75: "075%20Al-Qiyamah%20%28The%20Resurrection%29.mp3",
  76: "076%20Al-Insan%20%28Man%29.mp3",
  77: "077%20Al-Mursalat%20%28Those%20Sent%20Forth%29.mp3",
  78: "078%20An-Nab%20%28The%20Great%20News%29.mp3",
  79: "079%20An-Naziat%20%28Those%20Who%20Pull%20Out%29.mp3",
  80: "080%20Abasa%20%28He%20Frowned%29.mp3",
  81: "081%20At-Takwir%20%28The%20Folding%20Up%29.mp3",
  82: "082%20Al-Infitar%20%28The%20Cleaving%29.mp3",
  83: "083%20Al-Mutaffifin%20%28Those%20Who%20Deal%20in%20Fraud%29.mp3",
  84: "084%20Al-Inshiqaq%20%28The%20Splitting%20Asunder%29.mp3",
  85: "085%20Al-Buruj%20%28The%20Big%20Stars%29.mp3",
  86: "086%20At-Tariq%20%28The%20Night-Comer%29.mp3",
  87: "087%20Al-A_la%20%28The%20Most%20High%29.mp3",
  88: "088%20Al-Ghashiyah%20%28The%20Overwhelming%29.mp3",
  89: "089%20Al-Fajr%20%28The%20Dawn%29.mp3",
  90: "090%20Al-Balad%20%28The%20City%29.mp3",
  91: "091%20Ash-Shams%20%28The%20Sun%29.mp3",
  92: "092%20Al-Lail%20%28The%20Night%29.mp3",
  93: "093%20Ad-Duha%20%28The%20ForenoonAfter%20Sunrise%29.mp3",
  94: "094%20Ash-Sharh%20%28The%20Opening%20Forth%29.mp3",
  95: "095%20At-Tin%20%28The%20Fig%29.mp3",
  96: "096%20Al-Alaq%20%28The%20Clot%29.mp3",
  97: "097%20Al-Qadr%20%28The%20Night%20of%20Decree%29.mp3",
  98: "098%20Al-Baiyinah%20%28The%20Clear%20Evidence%29.mp3",
  99: "099%20Az-Zalzalah%20%28The%20Earthquake%29.mp3",
  100: "100%20Al-_Adiyat%20%28Those%20That%20Run%29.mp3",
  101: "101%20Al-Qari_ah%20%28The%20Striking%20Hour%29.mp3",
  102: "102%20At-Takathur%20%28The%20Piling%20Up%29.mp3",
  103: "103%20Al-_Asr%20%28The%20Time%29.mp3",
  104: "104%20Al-Humazah%20%28The%20Slanderer%29.mp3",
  105: "105%20Al-Fil%20%28The%20Elephant%29.mp3",
  106: "106%20Quraish%20%28Quraish%29.mp3",
  107: "107%20Al-Ma_un%20%28The%20Small%20Kindnesses%29.mp3",
  108: "108%20Al-Kauthar%20%28A%20River%20in%20Paradise%29.mp3",
  109: "109%20Al-Kafirun%20%28The%20Disbelievers%29.mp3",
  110: "110%20An-Nasr%20%28The%20Help%29.mp3",
  111: "111%20Al-Masad%20%28The%20Palm%20Fiber%29.mp3",
  112: "112%20Al-Ikhlas%20%28The%20Purity%29.mp3",
  113: "113%20Al-Falaq%20%28The%20Day%20Break%29.mp3",
  114: "114%20An-Nas%20%28The%20Mankind%29.mp3",
};

const RUSSIAN_SURAH_FILES = {
  1: "%D0%A1%D1%83%D1%80%D0%B0%20001%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%90%D0%A2%D0%98%D0%A5%D0%90%20%28%D0%9E%D1%82%D0%BA%D1%80%D1%8B%D0%B2%D0%B0%D1%8E%D1%89%D0%B0%D1%8F%20%D0%9A%D0%BE%D1%80%D0%B0%D0%BD%29.mp3",
  2: "%D0%A1%D1%83%D1%80%D0%B0%20002%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%91%D0%90%D0%9A%D0%90%D0%A0%D0%90%20%28%D0%9A%D0%BE%D1%80%D0%BE%D0%B2%D0%B0%29.mp3",
  3: "%D0%A1%D1%83%D1%80%D0%B0%20003%20%E2%80%94%20%D0%90%D0%90%D0%9B%D0%98%20%D0%98%D0%9C%D0%A0%D0%90%D0%9D%20%28%D0%A1%D0%B5%D0%BC%D0%B5%D0%B9%D1%81%D1%82%D0%B2%D0%BE%20%D0%98%D0%BC%D1%80%D0%B0%D0%BD%D0%B0%29.mp3",
  4: "%D0%A1%D1%83%D1%80%D0%B0%20004%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%98%D0%A1%D0%90%20%28%D0%96%D0%B5%D0%BD%D1%89%D0%B8%D0%BD%D1%8B%29.mp3",
  5: "%D0%A1%D1%83%D1%80%D0%B0%20005%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%90%D0%98%D0%94%D0%90%20%28%D0%A2%D1%80%D0%B0%D0%BF%D0%B5%D0%B7%D0%B0%29.mp3",
  6: "%D0%A1%D1%83%D1%80%D0%B0%20006%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9D%D0%90%D0%9C%20%28%D0%A1%D0%BA%D0%BE%D1%82%29.mp3",
  7: "%D0%A1%D1%83%D1%80%D0%B0%20007%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%A0%D0%90%D0%A4%20%28%D0%9E%D0%B3%D1%80%D0%B0%D0%B4%D1%8B%29.mp3",
  8: "%D0%A1%D1%83%D1%80%D0%B0%20008%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9D%D0%A4%D0%90%D0%9B%D0%AC%20%28%D0%A2%D1%80%D0%BE%D1%84%D0%B5%D0%B8%29.mp3",
  9: "%D0%A1%D1%83%D1%80%D0%B0%20009%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%A3%D0%91%D0%90%20%28%D0%9F%D0%BE%D0%BA%D0%B0%D1%8F%D0%BD%D0%B8%D0%B5%29.mp3",
  10: "%D0%A1%D1%83%D1%80%D0%B0%20010%20%E2%80%94%20%D0%99%D0%A3%D0%9D%D0%A3%D0%A1%20%28%D0%98%D0%BE%D0%BD%D0%B0%29.mp3",
  11: "%D0%A1%D1%83%D1%80%D0%B0%20011%20%E2%80%94%20%D0%A5%D0%A3%D0%94%20%28%D0%A5%D1%83%D0%B4%29.mp3",
  12: "%D0%A1%D1%83%D1%80%D0%B0%20012%20%E2%80%94%20%D0%99%D0%A3%D0%A1%D0%A3%D0%A4%20%28%D0%98%D0%BE%D1%81%D0%B8%D1%84%29.mp3",
  13: "%D0%A1%D1%83%D1%80%D0%B0%20013%20%E2%80%94%20%D0%90%D0%A0-%D0%A0%D0%90%D0%90%D0%94%20%28%D0%93%D1%80%D0%BE%D0%BC%29.mp3",
  14: "%D0%A1%D1%83%D1%80%D0%B0%20014%20%E2%80%94%20%D0%98%D0%91%D0%A0%D0%90%D0%A5%D0%98%D0%9C%20%28%D0%90%D0%B2%D1%80%D0%B0%D0%B0%D0%BC%29.mp3",
  15: "%D0%A1%D1%83%D1%80%D0%B0%20015%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%98%D0%94%D0%96%D0%A0%20%28%D0%A5%D0%B8%D0%B4%D0%B6%D1%80%29.mp3",
  16: "%D0%A1%D1%83%D1%80%D0%B0%20016%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%A5%D0%9B%D0%AC%20%28%D0%9F%D1%87%D0%B5%D0%BB%D1%8B%29.mp3",
  17: "%D0%A1%D1%83%D1%80%D0%B0%20017%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%A1%D0%A0%D0%90%20%28%D0%9D%D0%BE%D1%87%D0%BD%D0%BE%D0%B9%20%D0%9F%D0%B5%D1%80%D0%B5%D0%BD%D0%BE%D1%81%29.mp3",
  18: "%D0%A1%D1%83%D1%80%D0%B0%20018%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%A5%D0%A4%20%28%D0%9F%D0%B5%D1%89%D0%B5%D1%80%D0%B0%29.mp3",
  19: "%D0%A1%D1%83%D1%80%D0%B0%20019%20%E2%80%94%20%D0%9C%D0%90%D0%A0%D0%AC%D0%AF%D0%9C%20%28%D0%9C%D0%B0%D1%80%D0%B8%D1%8F%29.mp3",
  20: "%D0%A1%D1%83%D1%80%D0%B0%20020%20%E2%80%94%20%D0%A2%D0%90%20%D0%A5%D0%90%20%28%D0%A2%D0%B0%20%D0%A5%D0%B0%29.mp3",
  21: "%D0%A1%D1%83%D1%80%D0%B0%20021%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9D%D0%91%D0%98%D0%99%D0%90%20%28%D0%9F%D1%80%D0%BE%D1%80%D0%BE%D0%BA%D0%B8%29.mp3",
  22: "%D0%A1%D1%83%D1%80%D0%B0%20022%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%90%D0%94%D0%96%D0%96%20%28%D0%9F%D0%B0%D0%BB%D0%BE%D0%BC%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D1%82%D0%B2%D0%BE%29.mp3",
  23: "%D0%A1%D1%83%D1%80%D0%B0%20023%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%9C%D0%98%D0%9D%D0%A3%D0%9D%20%28%D0%92%D0%B5%D1%80%D1%83%D1%8E%D1%89%D0%B8%D0%B5%29.mp3",
  24: "%D0%A1%D1%83%D1%80%D0%B0%20024%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%A3%D0%A0%20%28%D0%A1%D0%B2%D0%B5%D1%82%29.mp3",
  25: "%D0%A1%D1%83%D1%80%D0%B0%20025%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%A3%D0%A0%D0%9A%D0%90%D0%9D%20%28%D0%A0%D0%B0%D0%B7%D0%BB%D0%B8%D1%87%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  26: "%D0%A1%D1%83%D1%80%D0%B0%20026%20%E2%80%94%20%D0%90%D0%A8-%D0%A8%D0%A3%D0%90%D0%A0%D0%90%20%28%D0%9F%D0%BE%D1%8D%D1%82%D1%8B%29.mp3",
  27: "%D0%A1%D1%83%D1%80%D0%B0%20027%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%9C%D0%9B%D0%AC%20%28%D0%9C%D1%83%D1%80%D0%B0%D0%B2%D1%8C%D0%B8%29.mp3",
  28: "%D0%A1%D1%83%D1%80%D0%B0%20028%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%A1%D0%90%D0%A1%20%28%D0%A0%D0%B0%D1%81%D1%81%D0%BA%D0%B0%D0%B7%29.mp3",
  29: "%D0%A1%D1%83%D1%80%D0%B0%20029%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9D%D0%9A%D0%90%D0%91%D0%A3%D0%A2%20%28%D0%9F%D0%B0%D1%83%D0%BA%29.mp3",
  30: "%D0%A1%D1%83%D1%80%D0%B0%20030%20%E2%80%94%20%D0%90%D0%A0-%D0%A0%D0%A3%D0%9C%20%28%D0%A0%D0%B8%D0%BC%D0%BB%D1%8F%D0%BD%D0%B5%29.mp3",
  31: "%D0%A1%D1%83%D1%80%D0%B0%20031%20%E2%80%94%20%D0%9B%D0%A3%D0%9A%D0%9C%D0%90%D0%9D%20%28%D0%9B%D1%83%D0%BA%D0%BC%D0%B0%D0%BD%29.mp3",
  32: "%D0%A1%D1%83%D1%80%D0%B0%20032%20%E2%80%94%20%D0%90%D0%A1-%D0%A1%D0%90%D0%94%D0%96%D0%94%D0%90%20%28%D0%97%D0%B5%D0%BC%D0%BD%D0%BE%D0%B9%20%D0%9F%D0%BE%D0%BA%D0%BB%D0%BE%D0%BD%29.mp3",
  33: "%D0%A1%D1%83%D1%80%D0%B0%20033%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%A5%D0%97%D0%90%D0%91%20%28%D0%A1%D0%BE%D1%8E%D0%B7%D0%BD%D0%B8%D0%BA%D0%B8%29.mp3",
  34: "%D0%A1%D1%83%D1%80%D0%B0%20034%20%E2%80%94%20%D0%A1%D0%90%D0%91%D0%90%20%28%D0%A1%D0%B0%D0%B2%D0%B0%29.mp3",
  35: "%D0%A1%D1%83%D1%80%D0%B0%20035%20%E2%80%94%20%D0%A4%D0%90%D0%A2%D0%AB%D0%A0%20%28%D0%A2%D0%B2%D0%BE%D1%80%D0%B5%D1%86%29.mp3",
  36: "%D0%A1%D1%83%D1%80%D0%B0%20036%20%E2%80%94%20%D0%99%D0%90%20%D0%A1%D0%98%D0%9D%20%28%D0%99%D0%B0%20%D0%A1%D0%B8%D0%BD%29.mp3",
  37: "%D0%A1%D1%83%D1%80%D0%B0%20037%20%E2%80%94%20%D0%90%D0%A1-%D0%A1%D0%90%D0%A4%D0%A4%D0%90%D0%A2%20%28%D0%92%D1%8B%D1%81%D1%82%D1%80%D0%BE%D0%B8%D0%B2%D1%88%D0%B8%D0%B5%D1%81%D1%8F%29.mp3",
  38: "%D0%A1%D1%83%D1%80%D0%B0%20038%20%E2%80%94%20%D0%A1%D0%90%D0%94%20%28%D0%A1%D0%B0%D0%B4%29.mp3",
  39: "%D0%A1%D1%83%D1%80%D0%B0%20039%20%E2%80%94%20%D0%90%D0%97-%D0%97%D0%A3%D0%9C%D0%90%D0%A0%20%28%D0%A2%D0%BE%D0%BB%D0%BF%D1%8B%29.mp3",
  40: "%D0%A1%D1%83%D1%80%D0%B0%20040%20%E2%80%94%20%D0%93%D0%90%D0%A4%D0%98%D0%A0%20%28%D0%9F%D1%80%D0%BE%D1%89%D0%B0%D1%8E%D1%89%D0%B8%D0%B9%29.mp3",
  41: "%D0%A1%D1%83%D1%80%D0%B0%20041%20%E2%80%94%20%D0%A4%D0%A3%D0%A1%D0%A1%D0%AB%D0%9B%D0%90%D0%A2%20%28%D0%A0%D0%B0%D0%B7%D1%8A%D1%8F%D1%81%D0%BD%D0%B5%D0%BD%D1%8B%29.mp3",
  42: "%D0%A1%D1%83%D1%80%D0%B0%20042%20%E2%80%94%20%D0%90%D0%A8-%D0%A8%D0%A3%D0%A0%D0%90%20%28%D0%A1%D0%BE%D0%B2%D0%B5%D1%82%29.mp3",
  43: "%D0%A1%D1%83%D1%80%D0%B0%20043%20%E2%80%94%20%D0%90%D0%97-%D0%97%D0%A3%D0%A5%D0%A0%D0%A3%D0%A4%20%28%D0%A3%D0%BA%D1%80%D0%B0%D1%88%D0%B5%D0%BD%D0%B8%D1%8F%29.mp3",
  44: "%D0%A1%D1%83%D1%80%D0%B0%20044%20%E2%80%94%20%D0%90%D0%94-%D0%94%D0%A3%D0%A5%D0%90%D0%9D%20%28%D0%94%D1%8B%D0%BC%29.mp3",
  45: "%D0%A1%D1%83%D1%80%D0%B0%20045%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%94%D0%96%D0%90%D0%A1%D0%98%D0%99%D0%90%20%28%D0%9A%D0%BE%D0%BB%D0%B5%D0%BD%D0%BE%D0%BF%D1%80%D0%B5%D0%BA%D0%BB%D0%BE%D0%BD%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5%29.mp3",
  46: "%D0%A1%D1%83%D1%80%D0%B0%20046%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%A5%D0%9A%D0%90%D0%A4%20%28%D0%91%D0%B0%D1%80%D1%85%D0%B0%D0%BD%D1%8B%29.mp3",
  47: "%D0%A1%D1%83%D1%80%D0%B0%20047%20%E2%80%94%20%D0%9C%D0%A3%D0%A5%D0%90%D0%9C%D0%9C%D0%90%D0%94%20%28%D0%9C%D1%83%D1%85%D0%B0%D0%BC%D0%BC%D0%B0%D0%B4%29.mp3",
  48: "%D0%A1%D1%83%D1%80%D0%B0%20048%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%90%D0%A2%D0%A5%20%28%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D0%B0%29.mp3",
  49: "%D0%A1%D1%83%D1%80%D0%B0%20049%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%A3%D0%94%D0%96%D0%A3%D0%A0%D0%90%D0%A2%20%28%D0%9A%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%8B%29.mp3",
  50: "%D0%A1%D1%83%D1%80%D0%B0%20050%20%E2%80%94%20%D0%9A%D0%90%D0%A4%20%28%D0%9A%D0%B0%D1%84%29.mp3",
  51: "%D0%A1%D1%83%D1%80%D0%B0%20051%20%E2%80%94%20%D0%90%D0%97-%D0%97%D0%90%D0%A0%D0%98%D0%99%D0%90%D0%A2%20%28%D0%A0%D0%B0%D1%81%D1%81%D0%B5%D0%B8%D0%B2%D0%B0%D1%8E%D1%89%D0%B8%D0%B5%20%D0%9F%D1%80%D0%B0%D1%85%29.mp3",
  52: "%D0%A1%D1%83%D1%80%D0%B0%20052%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%A3%D0%A0%20%28%D0%93%D0%BE%D1%80%D0%B0%29.mp3",
  53: "%D0%A1%D1%83%D1%80%D0%B0%20053%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%94%D0%96%D0%9C%20%28%D0%97%D0%B2%D0%B5%D0%B7%D0%B4%D0%B0%29.mp3",
  54: "%D0%A1%D1%83%D1%80%D0%B0%20054%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%9C%D0%90%D0%A0%20%28%D0%9C%D0%B5%D1%81%D1%8F%D1%86%29.mp3",
  55: "%D0%A1%D1%83%D1%80%D0%B0%20055%20%E2%80%94%20%D0%90%D0%A0-%D0%A0%D0%90%D0%A5%D0%9C%D0%90%D0%9D%20%28%D0%9C%D0%B8%D0%BB%D0%BE%D1%81%D1%82%D0%B8%D0%B2%D1%8B%D0%B9%29.mp3",
  56: "%D0%A1%D1%83%D1%80%D0%B0%20056%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%92%D0%90%D0%9A%D0%98%D0%90%20%28%D0%A1%D0%BE%D0%B1%D1%8B%D1%82%D0%B8%D0%B5%29.mp3",
  57: "%D0%A1%D1%83%D1%80%D0%B0%20057%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%90%D0%94%D0%98%D0%94%20%28%D0%96%D0%B5%D0%BB%D0%B5%D0%B7%D0%BE%29.mp3",
  58: "%D0%A1%D1%83%D1%80%D0%B0%20058%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%94%D0%96%D0%90%D0%94%D0%98%D0%9B%D0%90%20%28%D0%9F%D1%80%D0%B5%D0%BF%D0%B8%D1%80%D0%B0%D1%8E%D1%89%D0%B0%D1%8F%D1%81%D1%8F%29.mp3",
  59: "%D0%A1%D1%83%D1%80%D0%B0%20059%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%90%D0%A8%D0%A0%20%28%D0%A1%D0%B1%D0%BE%D1%80%29.mp3",
  60: "%D0%A1%D1%83%D1%80%D0%B0%20060%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%9C%D0%A2%D0%90%D0%A5%D0%90%D0%9D%D0%90%20%28%D0%98%D1%81%D0%BF%D1%8B%D1%82%D1%83%D0%B5%D0%BC%D0%B0%D1%8F%29.mp3",
  61: "%D0%A1%D1%83%D1%80%D0%B0%20061%20%E2%80%94%20%D0%90%D0%A1-%D0%A1%D0%90%D0%A4%D0%A4%20%28%D0%A0%D1%8F%D0%B4%D1%8B%29.mp3",
  62: "%D0%A1%D1%83%D1%80%D0%B0%20062%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%94%D0%96%D0%A3%D0%9C%D0%A3%D0%90%20%28%D0%A1%D0%BE%D0%B1%D1%80%D0%B0%D0%BD%D0%B8%D0%B5%29.mp3",
  63: "%D0%A1%D1%83%D1%80%D0%B0%20063%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%9D%D0%90%D0%A4%D0%98%D0%9A%D0%A3%D0%9D%20%28%D0%9B%D0%B8%D1%86%D0%B5%D0%BC%D0%B5%D1%80%D1%8B%29.mp3",
  64: "%D0%A1%D1%83%D1%80%D0%B0%20064%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%93%D0%90%D0%91%D0%A3%D0%9D%20%28%D0%92%D0%B7%D0%B0%D0%B8%D0%BC%D0%BD%D0%BE%D0%B5%20%D0%9E%D0%B1%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  65: "%D0%A1%D1%83%D1%80%D0%B0%20065%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%9B%D0%90%D0%9A%20%28%D0%A0%D0%B0%D0%B7%D0%B2%D0%BE%D0%B4%29.mp3",
  66: "%D0%A1%D1%83%D1%80%D0%B0%20066%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%A5%D0%A0%D0%98%D0%9C%20%28%D0%97%D0%B0%D0%BF%D1%80%D0%B5%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  67: "%D0%A1%D1%83%D1%80%D0%B0%20067%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%9B%D0%AC%D0%9A%20%28%D0%92%D0%BB%D0%B0%D1%81%D1%82%D1%8C%29.mp3",
  68: "%D0%A1%D1%83%D1%80%D0%B0%20068%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%9B%D0%90%D0%9C%20%28%D0%9F%D0%B8%D1%81%D1%8C%D0%BC%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F%20%D0%A2%D1%80%D0%BE%D1%81%D1%82%D1%8C%29.mp3",
  69: "%D0%A1%D1%83%D1%80%D0%B0%20069%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%90%D0%9A%D0%9A%D0%90%20%28%D0%9D%D0%B5%D0%BC%D0%B8%D0%BD%D1%83%D0%B5%D0%BC%D0%BE%D0%B5%29.mp3",
  70: "%D0%A1%D1%83%D1%80%D0%B0%20070%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%90%D0%90%D0%A0%D0%98%D0%94%D0%96%20%28%D0%A1%D1%82%D1%83%D0%BF%D0%B5%D0%BD%D0%B8%29.mp3",
  71: "%D0%A1%D1%83%D1%80%D0%B0%20071%20%E2%80%94%20%D0%9D%D0%A3%D0%A5%20%28%D0%9D%D0%BE%D0%B9%29.mp3",
  72: "%D0%A1%D1%83%D1%80%D0%B0%20072%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%94%D0%96%D0%98%D0%9D%D0%9D%20%28%D0%94%D0%B6%D0%B8%D0%BD%D0%BD%D1%8B%29.mp3",
  73: "%D0%A1%D1%83%D1%80%D0%B0%20073%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%97%D0%97%D0%90%D0%9C%D0%9C%D0%98%D0%9B%D0%AC%20%28%D0%97%D0%B0%D0%BA%D1%83%D1%82%D0%B0%D0%B2%D1%88%D0%B8%D0%B9%D1%81%D1%8F%29.mp3",
  74: "%D0%A1%D1%83%D1%80%D0%B0%20074%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%94%D0%94%D0%90%D0%A1%D0%A1%D0%98%D0%A0%20%28%D0%97%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D1%83%D0%B2%D1%88%D0%B8%D0%B9%D1%81%D1%8F%29.mp3",
  75: "%D0%A1%D1%83%D1%80%D0%B0%20075%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%98%D0%99%D0%90%D0%9C%D0%90%20%28%D0%92%D0%BE%D1%81%D0%BA%D1%80%D0%B5%D1%81%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  76: "%D0%A1%D1%83%D1%80%D0%B0%20076%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%9D%D0%A1%D0%90%D0%9D%20%28%D0%A7%D0%B5%D0%BB%D0%BE%D0%B2%D0%B5%D0%BA%29.mp3",
  77: "%D0%A1%D1%83%D1%80%D0%B0%20077%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%A0%D0%A1%D0%90%D0%9B%D0%90%D0%A2%20%28%D0%9F%D0%BE%D1%81%D1%8B%D0%BB%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5%29.mp3",
  78: "%D0%A1%D1%83%D1%80%D0%B0%20078%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%91%D0%90%20%28%D0%92%D0%B5%D1%81%D1%82%D1%8C%29.mp3",
  79: "%D0%A1%D1%83%D1%80%D0%B0%20079%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%97%D0%98%D0%90%D0%A2%20%28%D0%98%D1%81%D1%82%D0%BE%D1%80%D0%B3%D0%B0%D1%8E%D1%89%D0%B8%D0%B5%29.mp3",
  80: "%D0%A1%D1%83%D1%80%D0%B0%20080%20%E2%80%94%20%D0%90%D0%91%D0%90%D0%A1%D0%90%20%28%D0%9D%D0%B0%D1%85%D0%BC%D1%83%D1%80%D0%B8%D0%BB%D1%81%D1%8F%29.mp3",
  81: "%D0%A1%D1%83%D1%80%D0%B0%20081%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%9A%D0%92%D0%98%D0%A0%20%28%D0%A1%D0%BA%D1%80%D1%83%D1%87%D0%B8%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%29.mp3",
  82: "%D0%A1%D1%83%D1%80%D0%B0%20082%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%9D%D0%A4%D0%98%D0%A2%D0%90%D0%A0%20%28%D0%A0%D0%B0%D1%81%D0%BA%D0%B0%D0%BB%D1%8B%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%29.mp3",
  83: "%D0%A1%D1%83%D1%80%D0%B0%20083%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%A3%D0%A2%D0%90%D0%A4%D0%A4%D0%98%D0%A4%D0%98%D0%9D%20%28%D0%9E%D0%B1%D0%B2%D0%B5%D1%88%D0%B8%D0%B2%D0%B0%D1%8E%D1%89%D0%B8%D0%B5%29.mp3",
  84: "%D0%A1%D1%83%D1%80%D0%B0%20084%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%9D%D0%A8%D0%98%D0%9A%D0%90%D0%9A%20%28%D0%A0%D0%B0%D0%B7%D0%B2%D0%B5%D1%80%D0%B7%D0%BD%D0%B5%D1%82%D1%81%D1%8F%29.mp3",
  85: "%D0%A1%D1%83%D1%80%D0%B0%20085%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%91%D0%A3%D0%A0%D0%A3%D0%94%D0%96%20%28%D0%A1%D0%BE%D0%B7%D0%B2%D0%B5%D0%B7%D0%B4%D0%B8%D1%8F%20%D0%97%D0%BE%D0%B4%D0%B8%D0%B0%D0%BA%D0%B0%29.mp3",
  86: "%D0%A1%D1%83%D1%80%D0%B0%20086%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%A0%D0%98%D0%9A%20%28%D0%9D%D0%BE%D1%87%D0%BD%D0%BE%D0%B9%20%D0%9F%D1%83%D1%82%D0%BD%D0%B8%D0%BA%29.mp3",
  87: "%D0%A1%D1%83%D1%80%D0%B0%20087%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9B%D0%AF%20%28%D0%92%D1%81%D0%B5%D0%B2%D1%8B%D1%88%D0%BD%D0%B8%D0%B9%29.mp3",
  88: "%D0%A1%D1%83%D1%80%D0%B0%20088%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%93%D0%90%D0%A8%D0%98%D0%99%D0%90%20%28%D0%9F%D0%BE%D0%BA%D1%80%D1%8B%D0%B2%D0%B0%D1%8E%D1%89%D0%B5%D0%B5%29.mp3",
  89: "%D0%A1%D1%83%D1%80%D0%B0%20089%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%90%D0%94%D0%96%D0%A0%20%28%D0%97%D0%B0%D1%80%D1%8F%29.mp3",
  90: "%D0%A1%D1%83%D1%80%D0%B0%20090%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%91%D0%90%D0%9B%D0%90%D0%94%20%28%D0%93%D0%BE%D1%80%D0%BE%D0%B4%29.mp3",
  91: "%D0%A1%D1%83%D1%80%D0%B0%20091%20%E2%80%94%20%D0%90%D0%A8-%D0%A8%D0%90%D0%9C%D0%A1%20%28%D0%A1%D0%BE%D0%BB%D0%BD%D1%86%D0%B5%29.mp3",
  92: "%D0%A1%D1%83%D1%80%D0%B0%20092%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9B%D0%95%D0%99%D0%9B%20%28%D0%9D%D0%BE%D1%87%D1%8C%29.mp3",
  93: "%D0%A1%D1%83%D1%80%D0%B0%20093%20%E2%80%94%20%D0%90%D0%94-%D0%94%D0%A3%D0%A5%D0%90%20%28%D0%A3%D1%82%D1%80%D0%BE%29.mp3",
  94: "%D0%A1%D1%83%D1%80%D0%B0%20094%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%9D%D0%A8%D0%98%D0%A0%D0%90%D0%A5%20%28%D0%A0%D0%B0%D1%81%D0%BA%D1%80%D1%8B%D1%82%D0%B8%D0%B5%29.mp3",
  95: "%D0%A1%D1%83%D1%80%D0%B0%20095%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%98%D0%9D%20%28%D0%A1%D0%BC%D0%BE%D0%BA%D0%BE%D0%B2%D0%BD%D0%B8%D1%86%D0%B0%29.mp3",
  96: "%D0%A1%D1%83%D1%80%D0%B0%20096%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%9B%D0%90%D0%9A%20%28%D0%A1%D0%B3%D1%83%D1%81%D1%82%D0%BE%D0%BA%20%D0%9A%D1%80%D0%BE%D0%B2%D0%B8%29.mp3",
  97: "%D0%A1%D1%83%D1%80%D0%B0%20097%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%94%D0%A0%20%28%D0%9F%D1%80%D0%B5%D0%B4%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  98: "%D0%A1%D1%83%D1%80%D0%B0%20098%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%91%D0%95%D0%99%D0%99%D0%98%D0%9D%D0%90%20%28%D0%AF%D1%81%D0%BD%D0%BE%D0%B5%20%D0%97%D0%BD%D0%B0%D0%BC%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  99: "%D0%A1%D1%83%D1%80%D0%B0%20099%20%E2%80%94%20%D0%90%D0%97-%D0%97%D0%90%D0%9B%D0%97%D0%90%D0%9B%D0%90%20%28%D0%A1%D0%BE%D1%82%D1%80%D1%8F%D1%81%D0%B5%D0%BD%D0%B8%D0%B5%29.mp3",
  100: "%D0%A1%D1%83%D1%80%D0%B0%20100%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%94%D0%98%D0%99%D0%90%D0%A2%20%28%D0%A1%D0%BA%D0%B0%D1%87%D1%83%D1%89%D0%B8%D0%B5%29.mp3",
  101: "%D0%A1%D1%83%D1%80%D0%B0%20101%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%A0%D0%98%D0%90%20%28%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D0%BE%D0%B5%20%D0%91%D0%B5%D0%B4%D1%81%D1%82%D0%B2%D0%B8%D0%B5%29.mp3",
  102: "%D0%A1%D1%83%D1%80%D0%B0%20102%20%E2%80%94%20%D0%90%D0%A2-%D0%A2%D0%90%D0%9A%D0%90%D0%A1%D0%A3%D0%A0%20%28%D0%A1%D1%82%D1%80%D0%B0%D1%81%D1%82%D1%8C%20%D0%9A%20%D0%9F%D1%80%D0%B8%D1%83%D0%BC%D0%BD%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8E%29.mp3",
  103: "%D0%A1%D1%83%D1%80%D0%B0%20103%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%90%D0%A1%D0%A0%20%28%D0%9F%D1%80%D0%B5%D0%B4%D0%B2%D0%B5%D1%87%D0%B5%D1%80%D0%BD%D0%B5%D0%B5%20%D0%92%D1%80%D0%B5%D0%BC%D1%8F%29.mp3",
  104: "%D0%A1%D1%83%D1%80%D0%B0%20104%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A5%D0%A3%D0%9C%D0%90%D0%97%D0%90%20%28%D0%A5%D1%83%D0%BB%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%29.mp3",
  105: "%D0%A1%D1%83%D1%80%D0%B0%20105%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%98%D0%9B%D0%AC%20%28%D0%A1%D0%BB%D0%BE%D0%BD%29.mp3",
  106: "%D0%A1%D1%83%D1%80%D0%B0%20106%20%E2%80%94%20%D0%9A%D0%A3%D0%A0%D0%95%D0%99%D0%A8%20%28%D0%9A%D1%83%D1%80%D0%B5%D0%B9%D1%88%D0%B8%D1%82%D1%8B%29.mp3",
  107: "%D0%A1%D1%83%D1%80%D0%B0%20107%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%90%D0%A3%D0%9D%20%28%D0%9C%D0%B5%D0%BB%D0%BE%D1%87%D1%8C%29.mp3",
  108: "%D0%A1%D1%83%D1%80%D0%B0%20108%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%A3%D0%A1%D0%90%D0%A0%20%28%D0%98%D0%B7%D0%BE%D0%B1%D0%B8%D0%BB%D0%B8%D0%B5%29.mp3",
  109: "%D0%A1%D1%83%D1%80%D0%B0%20109%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9A%D0%90%D0%A4%D0%98%D0%A0%D0%A3%D0%9D%20%28%D0%9D%D0%B5%D0%B2%D0%B5%D1%80%D1%83%D1%8E%D1%89%D0%B8%D0%B5%29.mp3",
  110: "%D0%A1%D1%83%D1%80%D0%B0%20110%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%A1%D0%A0%20%28%D0%9F%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%29.mp3",
  111: "%D0%A1%D1%83%D1%80%D0%B0%20111%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%9C%D0%90%D0%A1%D0%90%D0%94%20%28%D0%9F%D0%B0%D0%BB%D1%8C%D0%BC%D0%BE%D0%B2%D1%8B%D0%B5%20%D0%92%D0%BE%D0%BB%D0%BE%D0%BA%D0%BD%D0%B0%29.mp3",
  112: "%D0%A1%D1%83%D1%80%D0%B0%20112%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%98%D0%A5%D0%9B%D0%90%D0%A1%20%28%D0%9E%D1%87%D0%B8%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%92%D0%B5%D1%80%D1%8B%29.mp3",
  113: "%D0%A1%D1%83%D1%80%D0%B0%20113%20%E2%80%94%20%D0%90%D0%9B%D0%AC-%D0%A4%D0%90%D0%9B%D0%AF%D0%9A%20%28%D0%A0%D0%B0%D1%81%D1%81%D0%B2%D0%B5%D1%82%29.mp3",
  114: "%D0%A1%D1%83%D1%80%D0%B0%20114%20%E2%80%94%20%D0%90%D0%9D-%D0%9D%D0%90%D0%A1%20%28%D0%9B%D1%8E%D0%B4%D0%B8%29.mp3",
};

const SURAH_AUDIO_SOURCES = {
  bn: { base: "https://archive.org/download/alquranwithbanglaaudio/", files: BANGLA_SURAH_FILES, reciter: "Sayed Ismat Toha" },
  hi: { base: "https://archive.org/download/hindi-translation-of-the-holy-quran-audio/", files: HINDI_SURAH_FILES, reciter: "Abdul Basit / Mohammed Jalandhari" },
  ru: { base: "https://archive.org/download/russian-translation-al-quran-audio/", files: RUSSIAN_SURAH_FILES, reciter: "Elmir Kuliev" },
};

function surahAudioUrl(langCode, surahNum) {
  const src = SURAH_AUDIO_SOURCES[langCode];
  if (!src) return null;
  const fname = src.files[surahNum];
  if (!fname) return null;
  return `${src.base}${fname}`;
}

// True if this language has ANY real recorded human audio (per-verse or per-Surah)
function hasRealVoice(langCode) {
  return !!REAL_AUDIO_TRANSLATIONS[langCode] || !!SURAH_AUDIO_SOURCES[langCode];
}

// Find the best MALE voice for a language — falls back to any available voice
// Common male-voice name hints across Chrome/Edge/Android/iOS voice packs
const MALE_HINTS = ["male", "david", "mark", "daniel", "james", "george", "fred", "alex", "rishi", "arjun", "hemant", "ravi", "puneet", "hamed", "guy", "matthew"];
const FEMALE_HINTS = ["female", "samantha", "victoria", "susan", "zira", "karen", "moira", "tessa", "heera", "lekha", "aditi", "salli", "kalpana"];

function findMaleVoice(langCode) {
  const voices = window.speechSynthesis.getVoices();
  const locale = SPEECH_LOCALE[langCode] || "en-US";
  const localeMatches = voices.filter(v => v.lang === locale || v.lang.startsWith(langCode));
  if (!localeMatches.length) return null;
  // Prefer explicit male hint
  let male = localeMatches.find(v => MALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
  if (male) return male;
  // Exclude anything that looks female, take what's left
  const notFemale = localeMatches.filter(v => !FEMALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
  if (notFemale.length) return notFemale[0];
  // Last resort — any voice for that locale
  return localeMatches[0];
}

// Speak text in the exact language locale using the best male voice found.
// Always cancels any prior speech first so audio can never overlap or mix.
// onEnd fires when this utterance finishes (used to chain verses for continuous playback).
function speakInLang(text, langCode, onEnd) {
  if (!("speechSynthesis" in window) || !text) { if (onEnd) onEnd(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LOCALE[langCode] || "en-US";
  u.rate = 0.85;
  const voice = findMaleVoice(langCode);
  if (voice) u.voice = voice;
  u.onend = () => { if (onEnd) onEnd(); };
  u.onerror = () => { if (onEnd) onEnd(); };
  window.speechSynthesis.speak(u);
  return voice; // null means device has no voice installed for this language
}

// Speak a Kids Corner Arabic letter. A bare isolated glyph (e.g. "أ") has no
// vowel and most TTS engines stay silent on it. The letter's FULL Arabic name
// (e.g. "أَلِف") has real vowel sounds and is correctly pronounceable by any
// installed Arabic voice. Falls back to the English name only if the device
// has no Arabic voice at all — never silently fails either way.
function speakLetter(letterObj) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
  if (arabicVoice) {
    // Many phone Arabic voices spell out a single short isolated word letter
    // by letter — but read the SAME word correctly when it sits inside a
    // short natural sentence. "حرف باء" (letter Baa) instead of just "باء".
    const u = new SpeechSynthesisUtterance(`حرف ${letterObj.full}`);
    u.lang = arabicVoice.lang;
    u.rate = 0.55;
    u.pitch = 1;
    const arMale = voices.find(v => v.lang.startsWith("ar") && MALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
    u.voice = arMale || arabicVoice;
    window.speechSynthesis.speak(u);
  } else {
    // No Arabic voice installed on this device — fall back to English name
    const u = new SpeechSynthesisUtterance(letterObj.n);
    u.lang = "en-US";
    u.rate = 0.8;
    const enMale = voices.find(v => v.lang.startsWith("en") && MALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
    if (enMale) u.voice = enMale;
    window.speechSynthesis.speak(u);
  }
}

// Nursery-style "A for Apple" learning — letter + example word, FEMALE voice.
// Speaks in English so it's clearly understandable to a young child:
// "Alif — for Asad, Lion". Uses a real female voice if the device has one;
// otherwise falls back to whatever voice is available (never silent).
function speakWordNursery(letterObj) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const u = new SpeechSynthesisUtterance(`${letterObj.n}, for ${letterObj.wt}`);
  u.lang = "en-US";
  u.rate = 0.75;
  u.pitch = 1.15; // slightly higher pitch — warmer, more nursery-friendly tone
  const female = voices.find(v => v.lang.startsWith("en") && FEMALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
  if (female) u.voice = female;
  window.speechSynthesis.speak(u);
}

async function aiTranslateChunk(chunk, langName, apiKey) {
  const input = chunk.map(v => `${v.number}: ${v.text}`).join("\n");
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: `You are a Quran translation expert. Translate these Quran verse meanings from English into ${langName}.\nReturn ONLY the numbered translations in the same format, one per line. No extra text.\n\n${input}` }]
      })
    });
    if (!r.ok) return null;
    const d = await r.json();
    const result = {};
    (d.content?.[0]?.text || "").trim().split("\n").forEach(line => {
      const m = line.match(/^(\d+)[:.]\s*(.+)/);
      if (m) result[parseInt(m[1])] = m[2].trim();
    });
    return Object.keys(result).length > 0 ? result : null;
  } catch { return null; }
}

async function fetchVerses(surahNum, langCode, onAIReady) {
  const cacheKey = `${surahNum}-${langCode}`;
  if (verseCache[cacheKey]) return verseCache[cacheKey];

  // ALWAYS fetch English 131 — the only verified translation ID
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=en&words=false&per_page=300&translations=131&fields=text_uthmani`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API ${r.status}`);
  const d = await r.json();

  const verses = d.verses.map(v => ({
    number: v.verse_number,
    arabic: v.text_uthmani,
    translation: langCode === "ar"
      ? v.text_uthmani
      : ((v.translations?.[0]?.text || "").replace(/<[^>]+>/g, "").trim()),
  }));

  verseCache[cacheKey] = verses;

  // Every language except English & Arabic: AI translates from English
  // Chunked (25 verses per call) so even Al-Baqarah (286) translates fully
  if (langCode !== "en" && langCode !== "ar") {
    const langName = LANG_NAMES[langCode] || langCode;
    const apiKey = import.meta.env?.VITE_ANTHROPIC_KEY || "";
    if (apiKey) {
      (async () => {
        const CHUNK = 25;
        const current = [...verses];
        for (let i = 0; i < current.length; i += CHUNK) {
          const chunk = current.slice(i, i + CHUNK).map(v => ({ number: v.number, text: v.translation }));
          const result = await aiTranslateChunk(chunk, langName, apiKey);
          if (result) {
            for (let j = 0; j < current.length; j++) {
              if (result[current[j].number]) {
                current[j] = { ...current[j], translation: result[current[j].number] };
              }
            }
            verseCache[cacheKey] = [...current];
            if (onAIReady) onAIReady([...current]);
          }
        }
      })();
    }
  }

  return verses;
}


// ─── AI — PLAIN TEXT, NO JSON, NEVER FAILS TO PARSE ─────────
async function askAI(prompt, langName) {
  const key = import.meta.env.VITE_ANTHROPIC_KEY || "";
  if (!key) throw new Error("NO_KEY");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 450,
      messages: [{
        role: "user",
        content: `You are a Quranic scholar. ${prompt}\n\nIMPORTANT: Write your COMPLETE response in ${langName} language only. Plain flowing text only. No JSON. No bullet points. No markdown. Under 170 words.`
      }]
    })
  });
  if (r.status === 401) throw new Error("NO_KEY");
  if (!r.ok) throw new Error(`AI ${r.status}`);
  const d = await r.json();
  return (d.content?.[0]?.text || "").trim();
}

// ─── AUDIO — 2 fallback URLs ─────────────────────────────────
// Correct global verse start numbers for each surah (1-indexed)
// Surah 1 starts at verse 1, Surah 2 starts at verse 8, etc.
const SURAH_VERSE_STARTS = {
  1:1, 2:8, 3:294, 4:494, 5:670, 6:790, 7:955, 8:1161, 9:1236, 10:1365,
  11:1474, 12:1597, 13:1708, 14:1751, 15:1804, 16:1902, 17:2030, 18:2141,
  19:2251, 20:2349, 21:2484, 22:2596, 23:2674, 24:2792, 25:2856, 26:2933,
  27:3160, 28:3253, 29:3341, 30:3410, 31:3470, 32:3504, 33:3534, 34:3607,
  35:3661, 36:3706, 37:3789, 38:3971, 39:4059, 40:4134, 41:4219, 42:4273,
  43:4326, 44:4415, 45:4474, 46:4511, 47:4546, 48:4584, 49:4613, 50:4631,
  51:4676, 52:4736, 53:4785, 54:4847, 55:4902, 56:4980, 57:5076, 58:5105,
  59:5127, 60:5151, 61:5164, 62:5178, 63:5189, 64:5200, 65:5218, 66:5230,
  67:5242, 68:5272, 69:5324, 70:5376, 71:5420, 72:5448, 73:5476, 74:5496,
  75:5552, 76:5592, 77:5623, 78:5673, 79:5713, 80:5759, 81:5801, 82:5830,
  83:5849, 84:5885, 85:5910, 86:5932, 87:5949, 88:5968, 89:5994, 90:6024,
  91:6044, 92:6059, 93:6080, 94:6091, 95:6099, 96:6107, 97:6126, 98:6131,
  99:6139, 100:6147, 101:6158, 102:6169, 103:6177, 104:6180, 105:6189,
  106:6194, 107:6198, 108:6205, 109:6208, 110:6214, 111:6217, 112:6222,
  113:6226, 114:6231
};

function getAudioUrls(qariId, surahNum, verseNum) {
  // Calculate correct global verse number
  const startVerse = SURAH_VERSE_STARTS[surahNum] || 1;
  const globalNum = startVerse + verseNum - 1;
  
  // URL 1: Best — global verse number (verified working)
  const url1 = `https://cdn.islamic.network/quran/audio/128/${qariId}/${globalNum}.mp3`;
  // URL 2: Everyayah format
  const url2 = `https://everyayah.com/data/${qariId.replace("ar.","")}/${String(surahNum).padStart(3,"0")}${String(verseNum).padStart(3,"0")}.mp3`;
  // URL 3: mp3quran
  const url3 = `https://server8.mp3quran.net/afs/${String(surahNum).padStart(3,"0")}.mp3`;
  return [url1, url2, url3];
}

// ─── PRAYER TIMES (approximate) ─────────────────────────────
const PRAYER_NAMES = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
const PRAYER_TIMES = ["05:12","06:38","12:15","15:45","18:52","20:18"];
function getNextPrayer() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  for (let i = 0; i < PRAYER_TIMES.length; i++) {
    const [ph, pm] = PRAYER_TIMES[i].split(":").map(Number);
    if (h < ph || (h === ph && m < pm)) return i;
  }
  return 0;
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function QuranLife() {
  const [screen, setScreen] = useState("home"); // home | read | kids | bookmarks
  const [mushafMode, setMushafMode] = useState(false);
  const [surahNum, setSurahNum] = useState(null);
  const [continueDialog, setContinueDialog] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(24); // Arabic font size
  const [lang, setLang] = useState("en");
  const [qari, setQari] = useState("ar.alafasy");
  const [verses, setVerses] = useState([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [navTab, setNavTab] = useState("home");
  const [openPanel, setOpenPanel] = useState(null); // verseNum
  const [activeTab, setActiveTab] = useState("tafsir");
  const [cache, setCache] = useState({}); // AI content cache
  const [playKey, setPlayKey] = useState(null);
  const [showLang, setShowLang] = useState(false);
  const [showQari, setShowQari] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showJuz, setShowJuz] = useState(false);
  const [showGoto, setShowGoto] = useState(false);
  const [showBkSheet, setShowBkSheet] = useState(false);
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [audioLang, setAudioLang] = useState("en");
  const [audioLangCountry, setAudioLangCountry] = useState("all");
  const [audioLangSearch, setAudioLangSearch] = useState("");
  const [audioSurah, setAudioSurah] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentVerse, setAudioCurrentVerse] = useState(0);
  const [audioNoVoice, setAudioNoVoice] = useState(false);
  const audioStopRef = useRef(false);
  const meaningAudioElRef = useRef(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [kidLetter, setKidLetter] = useState(null);
  const [learned, setLearned] = useState([]);
  const [langSearch, setLangSearch] = useState("");
  const [langCountry, setLangCountry] = useState("all");
  const [gotoPage, setGotoPage] = useState("");
  const audioRef = useRef(null);

  const curLang = LANGS.find(l => l.c === lang) || LANGS[0];
  const curQari = QARIS.find(q => q.id === qari) || QARIS[0];
  const curSurah = SURAHS.find(s => s.n === surahNum);
  const nextPrayer = getNextPrayer();

  const countryLangCodes = langCountry === "all" ? null : (COUNTRIES.find(c => c.id === langCountry)?.langs || null);
  const filteredLangs = LANGS.filter(l =>
    (!countryLangCodes || countryLangCodes.includes(l.c)) &&
    (l.n.toLowerCase().includes(langSearch.toLowerCase()) ||
     l.na.toLowerCase().includes(langSearch.toLowerCase()))
  ).sort((a, b) => a.n.localeCompare(b.n));

  const filtered = SURAHS.filter(s => {
    const q = query.toLowerCase();
    const qm = !q || s.name.toLowerCase().includes(q) || s.ar.includes(query) ||
      s.meaning.toLowerCase().includes(q) || String(s.n).includes(q);
    const fm = filter === "all" ||
      (filter === "meccan" && s.type === "Meccan") ||
      (filter === "medinan" && s.type === "Medinan") ||
      (filter === "juz30" && s.juz === 30) ||
      (filter === "short" && s.verses <= 20) ||
      (filter === "long" && s.verses >= 100);
    return qm && fm;
  });

  // ── AUDIO ──────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayKey(null);
    setContinueDialog(null);
  }, []);

  // mode: "single" = play one verse only (inside reader)
  //       "surah"  = play full surah continuously (from home list)
  const playVerse = useCallback((sn, vn, mode = "single", allVerses = null) => {
    stopAudio();
    setContinueDialog(null);
    const key = `${sn}:${vn}`;
    const [url1, url2] = getAudioUrls(qari, sn, vn);
    setPlayKey(key);

    let fallbackTimer = null;
    let finished = false; // prevent double-firing

    function handleFinished() {
      if (finished) return; // already handled
      finished = true;
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      setPlayKey(null);
      audioRef.current = null;

      if (mode === "surah" && allVerses && allVerses.length > 0) {
        const idx = allVerses.findIndex(v => v.number === vn);
        if (idx >= 0 && idx < allVerses.length - 1) {
          playVerse(sn, allVerses[idx + 1].number, "surah", allVerses);
        }
      } else if (mode === "single" && allVerses && allVerses.length > 0) {
          const idx = allVerses.findIndex(v => v.number === vn);
          // Only show dialog if there IS a next verse
          if (idx >= 0 && idx < allVerses.length - 1) {
            const nextVn = allVerses[idx + 1].number;
            const surahName = SURAHS.find(s => s.n === sn)?.name || "";
            const sajdah = isSajdahVerse(sn, vn);
            setContinueDialog({ sn, vn, nextVn, surahName, sajdah });
          }
          // Last verse — just stop quietly
        }
    }

    function tryUrl(url, fallbacks) {
      const audio = new Audio(url);
      audioRef.current = audio;

      // When metadata loads, set a fallback timer based on duration
      // This ensures ended always fires even if audio API misses it
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          // Add 800ms buffer after duration
          fallbackTimer = setTimeout(() => {
            if (audioRef.current === audio) handleFinished();
          }, (audio.duration * 1000) + 800);
        }
      });

      audio.addEventListener("ended", () => {
        if (audioRef.current === audio) handleFinished();
      });

      audio.addEventListener("timeupdate", () => {
        // Extra safety — if within 0.3s of end, trigger finish
        if (audio.duration && isFinite(audio.duration) &&
            audio.currentTime >= audio.duration - 0.3) {
          if (audioRef.current === audio) handleFinished();
        }
      });

      audio.addEventListener("error", () => {
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (fallbacks.length > 0) {
          tryUrl(fallbacks[0], fallbacks.slice(1));
        } else {
          audioRef.current = null;
          setPlayKey(null);
        }
      });

      audio.play().catch(() => {
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (fallbacks.length > 0) {
          tryUrl(fallbacks[0], fallbacks.slice(1));
        } else {
          audioRef.current = null;
          setPlayKey(null);
        }
      });
    }
    // Play Bismillah before verse 1 of any Surah
    // EXCEPT: Al-Fatiha (1) — its verse 1 IS the Bismillah already
    // EXCEPT: At-Tawbah (9) — has no Bismillah
    if (vn === 1 && sn !== 9 && sn !== 1) {
      const bismillahUrl = `https://cdn.islamic.network/quran/audio/128/${qari}/1.mp3`;
      const bismillah = new Audio(bismillahUrl);
      bismillah.addEventListener("ended", () => tryUrl(url1, [url2]));
      bismillah.addEventListener("error", () => tryUrl(url1, [url2]));
      bismillah.play().catch(() => tryUrl(url1, [url2]));
    } else {
      tryUrl(url1, [url2]);
    }
  }, [qari, stopAudio]);

  // ── OPEN SURAH ─────────────────────────────────────────────
  const openSurah = useCallback(async (n, autoPlay = false) => {
    stopAudio();
    setSurahNum(n);
    setScreen("read");
    setNavTab("home");
    setOpenPanel(null);
    setVerses([]);
    setVersesLoading(true);
    setVersesError(null);
    window.scrollTo(0, 0);
    try {
      const onAIReady = (updated) => setVerses([...updated]);
      const v = await fetchVerses(n, lang, onAIReady);
      setVerses(v);
      setLastRead({ surahN: n, surahName: SURAHS.find(s => s.n === n)?.name || "", verse: 1 });
      if (autoPlay && v.length > 0) {
        setTimeout(() => playVerse(n, 1, "surah", v), 500);
      }
    } catch (e) {
      setVersesError("Could not load verses. Please check your connection and tap Retry.");
    } finally {
      setVersesLoading(false);
    }
  }, [lang, stopAudio]);

  // Reload verses when language changes while reading
  useEffect(() => {
    if (screen === "read" && surahNum) {
      setVerses([]);
      setVersesLoading(true);
      setVersesError(null);
      const onAIReady = (updated) => setVerses([...updated]);
      fetchVerses(surahNum, lang, onAIReady)
        .then(v => { setVerses(v); setVersesLoading(false); })
        .catch(() => { setVersesError("Could not load. Tap Retry."); setVersesLoading(false); });
    }
  }, [lang]);

  // ── AI CONTENT ─────────────────────────────────────────────
  const getOrLoad = useCallback(async (key, prompt, force = false) => {
    if (cache[key] && !force) return;
    setCache(p => ({ ...p, [key]: { loading: true, error: null, text: null } }));
    try {
      const text = await askAI(prompt, curLang.n);
      setCache(p => ({ ...p, [key]: { loading: false, error: null, text } }));
    } catch(e) {
      const msg = e.message === "NO_KEY"
        ? "AI Knowledge coming soon. The app is fully functional for reading, audio and translation."
        : "Failed to load. Tap Retry.";
      setCache(p => ({ ...p, [key]: { loading: false, error: msg, text: null } }));
    }
  }, [cache, curLang.n]);

  const loadTabContent = useCallback((verse, tab, force = false) => {
    const sn = curSurah?.name || "";
    const key = `${surahNum}-${verse.number}-${tab}-${lang}`;
    if (cache[key]?.text && !force) return;
    let prompt = "";
    if (tab === "translation")
      prompt = `Translate this Quran verse from Arabic into ${curLang.n} (${curLang.na}). Surah ${sn}, Verse ${verse.number}: "${verse.arabic}"\n\nGive ONLY the accurate, clear meaning translation in ${curLang.n}. No Arabic, no transliteration, no extra notes — just the translated meaning in ${curLang.n}.`;
    else if (tab === "tafsir")
      prompt = `Provide tafsir for Surah ${sn} verse ${verse.number}: "${verse.arabic}" (meaning: "${verse.translation}"). Include: verse meaning, Ibn Kathir explanation, Al-Tabari, contemporary scholar view, simple explanation for any person.`;
    else if (tab === "revelation")
      prompt = `Explain the revelation context (Asbab al-Nuzul) of Surah ${sn} verse ${verse.number}: "${verse.arabic}". Cover: when it was revealed, why, to whom, and the historical event behind it.`;
    else if (tab === "science")
      prompt = `Explain any scientific connection for Surah ${sn} verse ${verse.number}: "${verse.arabic}" (meaning: "${verse.translation}"). Be completely honest — label the connection as Confirmed by science, Claimed but debated, Speculative, or state there is no scientific connection. Include relevant scientific formula if applicable.`;
    else if (tab === "hadith")
      prompt = `Share hadiths related to Surah ${sn} verse ${verse.number}: "${verse.arabic}". For each hadith: give the text, source (book name and number), authenticity grade (Sahih/Hasan/Daif/Mawdu), grader name, and reason for the grade. Clearly warn about any fabricated hadiths and explain why sharing them is dangerous.`;
    getOrLoad(key, prompt, force);
  }, [surahNum, curSurah, lang, cache, getOrLoad]);

  const openDeepPanel = useCallback((verse) => {
    if (openPanel === verse.number) { setOpenPanel(null); return; }
    setOpenPanel(verse.number);
    setActiveTab("tafsir");
  }, [openPanel]);

  const switchTab = useCallback((verse, tab) => {
    setActiveTab(tab);
    if (tab !== "meaning") loadTabContent(verse, tab);
  }, [loadTabContent]);

  // When language changes, clear AI cache for current panel
  const changeLang = useCallback((code) => {
    setLang(code);
    setShowLang(false);
    setLangSearch("");
    // Clear cached AI content so it reloads in new language
    setCache({});
  }, []);

  // ── BOOKMARKS ───────────────────────────────────────────────
  const toggleBk = useCallback((sn, sname, vn, arabic, translation) => {
    setBookmarks(prev => {
      const exists = prev.findIndex(b => b.sn === sn && b.vn === vn);
      if (exists >= 0) return prev.filter((_, i) => i !== exists);
      return [...prev, { sn, sname, vn, arabic, translation: translation.slice(0, 100) }];
    });
  }, []);

  const isBk = useCallback((sn, vn) => bookmarks.some(b => b.sn === sn && b.vn === vn), [bookmarks]);

  // ── STYLES ──────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;max-width:100%}
    html,body{overflow-x:hidden;width:100%;-webkit-text-size-adjust:100%}
    body{font-family:'Inter',sans-serif;background:${darkMode ? "#0f0f0f" : "#f5f3ee"};color:${darkMode ? "#e8e8e8" : "#1a1a1a"}}
    .ar{font-family:'Amiri',serif!important}
    ::-webkit-scrollbar{width:0;height:0}
    .dark-card{background:${darkMode ? "#1a1a1a" : "#fff"};border-color:${darkMode ? "#2a2a2a" : "#e2e8e4"}}
    .dark-text{color:${darkMode ? "#e8e8e8" : "#1a1a1a"}}
    .mushaf-wrap{background:#fdf6e3;border-radius:8px;padding:20px 16px;margin:10px 0;position:relative;box-shadow:0 2px 20px rgba(139,105,20,.15),inset 0 0 60px rgba(139,105,20,.04)}
    .mushaf-wrap::before{content:'';position:absolute;inset:6px;border:1.5px solid rgba(139,105,20,.25);border-radius:4px;pointer-events:none}
    .mushaf-wrap::after{content:'';position:absolute;inset:10px;border:.5px solid rgba(139,105,20,.1);border-radius:2px;pointer-events:none}
    .mushaf-text{font-family:'Amiri',serif;font-size:24px;line-height:3;direction:rtl;text-align:justify;color:#1a0500;word-spacing:4px}
    .mushaf-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#8b6914,#c9943a);color:#fff;font-size:10px;font-weight:700;margin:0 3px;vertical-align:middle;flex-shrink:0;font-family:'Inter',sans-serif;line-height:1}
    .zoom-arabic{touch-action:pan-y pinch-zoom;display:block;width:100%}
    .mode-btn{padding:6px 14px;border-radius:18px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap}
    .mode-btn.active{background:linear-gradient(180deg,#e8b84b 0%,#c9943a 100%);color:#1a0a00;border:.5px solid #a67c2a;box-shadow:0 3px 0 #7a5a1a}
    .mode-btn.active:active{transform:translateY(3px);box-shadow:0 0 0 #7a5a1a}
    .mode-btn:not(.active){background:linear-gradient(180deg,rgba(255,255,255,.25) 0%,rgba(255,255,255,.1) 100%);color:#fff;border:.5px solid rgba(255,255,255,.35);box-shadow:0 3px 0 rgba(0,0,0,.2)}
    .mode-btn:not(.active):active{transform:translateY(3px);box-shadow:0 0 0 rgba(0,0,0,.2)}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes bv{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
    @keyframes pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
    .fade{animation:fadeIn .22s ease}
    .pop{animation:pop .18s ease}
    .bn{width:5px;height:5px;border-radius:50%;background:${G};display:inline-block;animation:bv 1.2s ease-in-out infinite}
    .tab{padding:5px 11px;border-radius:18px;border:.5px solid #ddd;background:transparent;color:#333;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:'Inter',sans-serif}
    .tab.on{background:${G};border-color:${G};color:#fff;font-weight:600}
    .tab:not(.on):hover{background:#f0faf5}
    .srow{display:flex;align-items:center;gap:9px;padding:10px 12px;background:#fff;cursor:pointer;border-bottom:.5px solid #f0f0ec;transition:background .1s}
    .srow:hover{background:#f5fcf7}
    .srow:last-child{border-bottom:none}
    .pbtn{padding:5px 13px;border-radius:18px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;background:linear-gradient(180deg,#f5fcf7 0%,#e0f2e8 100%);color:#0f5132;box-shadow:0 3px 0 #0a3d2644,0 5px 10px rgba(15,81,50,.12);border:.5px solid #0f5132;transition:all .12s}
    .pbtn:hover{transform:translateY(1px);box-shadow:0 2px 0 #0a3d2644}
    .pbtn:active{transform:translateY(3px);box-shadow:0 0 0 #0a3d2644}
    .rbtn{padding:5px 13px;border-radius:18px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;background:linear-gradient(180deg,#1a9a5c 0%,#0f5132 100%);color:#fff;box-shadow:0 3px 0 #072b1a,0 5px 10px rgba(15,81,50,.2);border:none;transition:all .12s}
    .rbtn:hover{transform:translateY(1px);box-shadow:0 2px 0 #072b1a}
    .rbtn:active{transform:translateY(3px);box-shadow:0 0 0 #072b1a}
    .chip{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:16px;border:.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.13);color:#fff;font-size:11px;white-space:nowrap;cursor:pointer;font-family:'Inter',sans-serif}
    .chip:hover{background:rgba(255,255,255,.22)}
    .lo{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;padding:8px 12px;background:transparent;border:none;color:#1a1a1a;transition:background .1s;cursor:pointer;font-family:'Inter',sans-serif}
    .lo:hover,.lo.sel{background:#f0faf5}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center}
    .sheet{background:#fff;border-radius:22px 22px 0 0;width:100%;max-width:520px;max-height:82vh;overflow-y:auto;padding:18px 14px 28px;animation:pop .2s ease}
    .nav{position:fixed;bottom:0;width:100%;max-width:520px;left:50%;transform:translateX(-50%);background:#fff;border-top:.5px solid #e4e8e2;display:flex;padding:6px 0 10px;z-index:60;box-shadow:0 -4px 16px rgba(0,0,0,.08)}
    .ni{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:3px 0}
    .ni-lbl{font-size:10px;color:#9ba5b0;font-weight:500}
    .ni.on .ni-lbl{color:${G};font-weight:700}
    .fc{padding:5px 12px;border-radius:18px;border:.5px solid #ddd;background:linear-gradient(180deg,#fff 0%,#f0f0f0 100%);color:#5a6472;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 2px 0 #ccc;transition:all .12s}
    .fc:hover{transform:translateY(1px);box-shadow:0 1px 0 #ccc}
    .fc.on{background:linear-gradient(180deg,#1a9a5c 0%,#0f5132 100%);border-color:#0f5132;color:#fff;box-shadow:0 2px 0 #072b1a}
    /* 3D BULGE BUTTONS */
    .btn-3d{display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:20px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;position:relative;border:none;outline:none;white-space:nowrap}
    .btn-3d-green{background:linear-gradient(180deg,#1a9a5c 0%,#0f5132 60%,#0a3d26 100%);color:#fff;box-shadow:0 4px 0 #072b1a,0 6px 12px rgba(15,81,50,.35);text-shadow:0 1px 2px rgba(0,0,0,.3)}
    .btn-3d-green:hover{transform:translateY(1px);box-shadow:0 3px 0 #072b1a,0 4px 10px rgba(15,81,50,.3)}
    .btn-3d-green:active{transform:translateY(4px);box-shadow:0 0px 0 #072b1a,0 2px 6px rgba(15,81,50,.2)}
    .btn-3d-gold{background:linear-gradient(180deg,#e8b84b 0%,#c9943a 60%,#a67c2a 100%);color:#1a0a00;box-shadow:0 4px 0 #7a5a1a,0 6px 12px rgba(139,105,20,.35);text-shadow:0 1px 1px rgba(255,255,255,.2)}
    .btn-3d-gold:hover{transform:translateY(1px);box-shadow:0 3px 0 #7a5a1a,0 4px 10px rgba(139,105,20,.3)}
    .btn-3d-gold:active{transform:translateY(4px);box-shadow:0 0px 0 #7a5a1a}
    .btn-3d-white{background:linear-gradient(180deg,#ffffff 0%,#f0f0f0 60%,#e0e0e0 100%);color:#0f5132;box-shadow:0 4px 0 #aaa,0 6px 12px rgba(0,0,0,.15);border:.5px solid #ddd}
    .btn-3d-white:hover{transform:translateY(1px);box-shadow:0 3px 0 #aaa,0 4px 8px rgba(0,0,0,.1)}
    .btn-3d-white:active{transform:translateY(4px);box-shadow:0 0px 0 #aaa}
    .btn-3d-outline{background:linear-gradient(180deg,#f5fcf7 0%,#e8f5ee 100%);color:#0f5132;box-shadow:0 3px 0 #0f5132,0 5px 10px rgba(15,81,50,.2);border:.5px solid #0f5132}
    .btn-3d-outline:hover{transform:translateY(1px);box-shadow:0 2px 0 #0f5132}
    .btn-3d-outline:active{transform:translateY(3px);box-shadow:0 0px 0 #0f5132}
    /* Quick links grid — no overflow */
    .ql-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .qpill{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;background:linear-gradient(180deg,#fff 0%,#f5fcf7 100%);border-radius:12px;border:.5px solid #d4e8da;cursor:pointer;text-align:center;transition:all .12s;box-shadow:0 3px 0 #0f513222,0 5px 10px rgba(15,81,50,.08)}
    .qpill:hover{transform:translateY(1px);box-shadow:0 2px 0 #0f513222,0 3px 7px rgba(15,81,50,.08)}
    .qpill:active{transform:translateY(3px);box-shadow:0 0px 0 #0f513222}
    .aitext{font-size:13px;line-height:1.9;color:#1a1a1a;white-space:pre-wrap;direction:auto}
    .alpha-card{border-radius:13px;padding:12px;cursor:pointer;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:5px;border:2px solid transparent}
    .alpha-card:hover{transform:scale(1.04);box-shadow:0 4px 14px rgba(0,0,0,.12)}
    .retry-btn{padding:5px 13px;border-radius:18px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;background:linear-gradient(180deg,#f5fcf7 0%,#e0f2e8 100%);color:#0f5132;box-shadow:0 3px 0 #0a3d2644;border:.5px solid #0f5132;transition:all .12s;margin-top:8px;display:inline-block}
    .retry-btn:hover{transform:translateY(1px);box-shadow:0 2px 0 #0a3d2644}
    .lbtn{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:18px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;background:linear-gradient(180deg,#f5fcf7 0%,#e0f2e8 100%);color:#0f5132;box-shadow:0 3px 0 #0a3d2644,0 5px 10px rgba(15,81,50,.12);border:.5px solid #0f5132;transition:all .12s}
    .lbtn:hover{transform:translateY(1px);box-shadow:0 2px 0 #0a3d2644}
    .lbtn:active{transform:translateY(3px);box-shadow:0 0 0 #0a3d2644}
    .lbtn.pl{background:linear-gradient(180deg,#1a9a5c 0%,#0f5132 100%);color:#fff;box-shadow:0 3px 0 #072b1a;border-color:#0f5132}
    .dbtn{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:18px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;background:linear-gradient(180deg,#fafafa 0%,#efefef 100%);color:#444;box-shadow:0 3px 0 #bbb,0 5px 10px rgba(0,0,0,.07);border:.5px solid #ddd;transition:all .12s}
    .dbtn:hover{transform:translateY(1px);box-shadow:0 2px 0 #bbb}
    .dbtn:active{transform:translateY(3px);box-shadow:0 0 0 #bbb}
    .dbtn.op{background:linear-gradient(180deg,#1a9a5c 0%,#0f5132 100%);color:#fff;box-shadow:0 3px 0 #072b1a;border-color:#0f5132}
    .bk-btn{font-size:17px;background:none;border:none;cursor:pointer;padding:0 2px;line-height:1;transition:transform .15s}
    .bk-btn:hover{transform:scale(1.2)}
  `;

  // ── SHARED HELPERS ──────────────────────────────────────────
  const Spinner = ({ label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0" }}>
      {[0, .15, .3].map((d, i) => <span key={i} className="bn" style={{ animationDelay: `${d}s` }} />)}
      <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 6 }}>{label}</span>
    </div>
  );

  const RetryRow = ({ msg, onRetry }) => {
    const isNoKey = msg && msg.includes("coming soon");
    return (
      <div style={{ padding: "12px 14px", borderRadius: 10, background: isNoKey ? "#f0faf5" : "#fff5f5", border: `.5px solid ${isNoKey ? "#0f513244" : "#fca5a5"}`, margin: "6px 0" }}>
        <div style={{ fontSize: 13, color: isNoKey ? G : "#dc2626", lineHeight: 1.6 }}>{isNoKey ? "🔐 " : "⚠️ "}{msg}</div>
        {!isNoKey && <button className="retry-btn" style={{ marginTop: 8 }} onClick={onRetry}>↺ Retry</button>}
      </div>
    );
  };

  const AIBlock = ({ cacheKey, onRetry }) => {
    const e = cache[cacheKey] || {};
    if (e.loading) return <Spinner label={`Loading in ${curLang.n}...`} />;
    if (e.error) return <RetryRow msg={e.error} onRetry={onRetry} />;
    if (e.text) return (
      <div className="aitext" style={{ background: "#f8fafb", borderRadius: 9, padding: 12, border: ".5px solid #e2e8e4", fontSize: 13, lineHeight: 1.9 }}>
        {e.text}
      </div>
    );
    return null;
  };

  const Nav = ({ readOn = false }) => (
    <div className="nav">
      {[["🏠","Home","home"],["📖","Read","read"],["🎓","Kids","kids"],["🔖","Saved","bookmarks"],["⚙️","More","more"]].map(([icon, label, id]) => (
        <div key={id} className={`ni${navTab === id ? " on" : ""}`} onClick={() => {
          if (id === "home") { stopAudio(); setScreen("home"); setNavTab("home"); }
          else if (id === "read") { if (surahNum) setScreen("read"); else openSurah(lastRead?.surahN || 1); setNavTab("read"); }
          else if (id === "kids") { setScreen("kids"); setNavTab("kids"); setKidLetter(null); }
          else if (id === "bookmarks") { setScreen("bookmarks"); setNavTab("bookmarks"); }
          else if (id === "more") setShowSettings(true);
        }}>
          <div style={{ fontSize: 18 }}>{icon}</div>
          <div className="ni-lbl">{label}</div>
        </div>
      ))}
    </div>
  );

  const SettingsSheet = () => showSettings ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowSettings(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚙️ Settings</div>

        {/* Language */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🌍 Language</div>
          <button onClick={() => { setShowSettings(false); setShowLang(true); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `.5px solid ${G}`, background: "#f0faf5", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G }}>{curLang.n}</span>
            <span style={{ fontSize: 13, color: "#9ba5b0" }}>{curLang.na} ›</span>
          </button>
        </div>

        {/* Qari */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🎙 Reciter (Qari)</div>
          <button onClick={() => { setShowSettings(false); setShowQari(true); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `.5px solid ${G}`, background: "#f0faf5", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G }}>{curQari.name}</span>
            <span style={{ fontSize: 11, color: "#9ba5b0" }}>{curQari.origin} ›</span>
          </button>
        </div>

        {/* Display */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🎨 Display</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setDarkMode(false)}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: `.5px solid ${!darkMode ? G : "#ddd"}`, background: !darkMode ? "#f0faf5" : "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: !darkMode ? G : "#666" }}>
              ☀️ Light Mode
            </button>
            <button onClick={() => setDarkMode(true)}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: `.5px solid ${darkMode ? G : "#ddd"}`, background: darkMode ? "#1a1a1a" : "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: darkMode ? "#fff" : "#666" }}>
              🌙 Dark Mode
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🔡 Arabic Font Size</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: ".5px solid #e2e8e4", background: "#fafafa" }}>
            <button onClick={() => setFontSize(f => Math.max(16, f - 2))}
              style={{ width: 36, height: 36, borderRadius: "50%", background: G, color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>A-</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="ar" style={{ fontSize: fontSize, color: G, lineHeight: 1.4 }}>بِسْمِ ٱللَّهِ</div>
              <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 4 }}>Size: {fontSize}px</div>
            </div>
            <button onClick={() => setFontSize(f => Math.min(40, f + 2))}
              style={{ width: 36, height: 36, borderRadius: "50%", background: G, color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>A+</button>
          </div>
        </div>

        <button onClick={() => setShowSettings(false)}
          style={{ width: "100%", padding: "12px", borderRadius: 12, background: G, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Done ✓
        </button>
      </div>
    </div>
  ) : null;

  const LangSheet = () => showLang ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowLang(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🌍 Select Language</div>
        {/* Country filter dropdown */}
        <select value={langCountry} onChange={e => { setLangCountry(e.target.value); setLangSearch(""); }}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `.5px solid ${langCountry !== "all" ? G : "#ddd"}`, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 8, background: langCountry !== "all" ? "#f0faf5" : "#fff", color: "#1a1a1a", fontWeight: langCountry !== "all" ? 600 : 400, cursor: "pointer" }}>
          <option value="all">🌐 All Countries — show every language</option>
          {COUNTRIES.map(c => (
            <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
          ))}
        </select>
        {langCountry !== "all" && (
          <div style={{ fontSize: 11, color: G, fontWeight: 600, marginBottom: 8 }}>
            Showing {filteredLangs.length} language{filteredLangs.length !== 1 ? "s" : ""} of {COUNTRIES.find(c => c.id === langCountry)?.name}
          </div>
        )}
        <input placeholder="Search language..." value={langSearch} onChange={e => setLangSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: ".5px solid #ddd", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: "55vh", overflowY: "auto" }}>
          {filteredLangs.map(l => (
            <button key={l.c} className={`lo${lang === l.c ? " sel" : ""}`}
              style={{ borderRadius: 9, border: ".5px solid #e2e8e4", justifyContent: "space-between", padding: "8px 10px", fontWeight: lang === l.c ? 700 : 400 }}
              onClick={() => changeLang(l.c)}>
              <span style={{ fontSize: 12 }}>{l.n}</span>
              <span style={{ fontSize: 11, color: "#9ba5b0" }}>{l.na}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const QariSheet = () => showQari ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowQari(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🎙 Select Qari</div>
        {QARIS.map(q => (
          <div key={q.id} onClick={() => { setQari(q.id); setShowQari(false); stopAudio(); }}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, border: `.5px solid ${qari === q.id ? G : "#e2e8e4"}`, background: qari === q.id ? "#f0faf5" : "#fff", cursor: "pointer", marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: qari === q.id ? G : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🎙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{q.name}</div>
              <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 2 }}>{q.origin}</div>
            </div>
            {qari === q.id && <span style={{ color: G, fontSize: 16 }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const PrayerSheet = () => showPrayer ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowPrayer(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🕌 Prayer Times</div>
        {PRAYER_NAMES.map((p, i) => (
          <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 9, marginBottom: 6, background: i === nextPrayer ? "#f0faf5" : "#fafafa", border: `.5px solid ${i === nextPrayer ? G + "44" : "#f0f0ec"}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: i === nextPrayer ? 700 : 400, color: i === nextPrayer ? G : "#1a1a1a" }}>{p}</div>
              {i === nextPrayer && <div style={{ fontSize: 10, color: G, fontWeight: 600 }}>Next Prayer</div>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: i === nextPrayer ? G : "#555" }}>{PRAYER_TIMES[i]}</div>
          </div>
        ))}
        <div style={{ marginTop: 10, padding: 10, background: "#f8fafb", borderRadius: 9, fontSize: 11, color: "#9ba5b0", textAlign: "center" }}>
          Enable location for accurate local prayer times
        </div>
      </div>
    </div>
  ) : null;

  const JuzSheet = () => showJuz ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowJuz(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📚 Juz Index</div>
        <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 4px", borderBottom: ".5px solid #f0f0ec", cursor: "pointer" }}
              onClick={() => { setShowJuz(false); /* In full app navigate to juz */ }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Juz {i + 1}</div>
                <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 1 }}>Part {i + 1} of 30</div>
              </div>
              <div className="ar" style={{ fontSize: 16, color: G }}>الجزء {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const GotoSheet = () => showGoto ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowGoto(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📄 Go To Page</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input type="number" min="1" max="604" placeholder="Enter page (1–604)" value={gotoPage} onChange={e => setGotoPage(e.target.value)}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: ".5px solid #ddd", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          <button onClick={() => {
            const p = parseInt(gotoPage);
            if (p && p >= 1 && p <= 604) {
              const s = SURAHS.slice().reverse().find(x => x.page <= p) || SURAHS[0];
              openSurah(s.n); setShowGoto(false); setGotoPage("");
            }
          }} style={{ padding: "10px 16px", background: G, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Go</button>
        </div>
        <div style={{ fontSize: 11, color: "#9ba5b0", marginBottom: 10 }}>Or jump directly to a Surah:</div>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {SURAHS.map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: ".5px solid #f0f0ec", cursor: "pointer" }}
              onClick={() => { openSurah(s.n); setShowGoto(false); }}>
              <div style={{ fontSize: 11, color: "#9ba5b0", width: 36 }}>P.{s.page}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.name}</div>
              <div className="ar" style={{ fontSize: 16, color: G }}>{s.ar}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const BkSheet = () => showBkSheet ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowBkSheet(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🔖 Bookmarks</div>
        <div style={{ fontSize: 12, color: "#9ba5b0", marginBottom: 14 }}>{bookmarks.length} saved verses</div>
        {bookmarks.length === 0
          ? <div style={{ padding: "24px 0", textAlign: "center", color: "#9ba5b0", fontSize: 13 }}>No bookmarks yet. Tap 🔖 on any verse while reading.</div>
          : bookmarks.map((b, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "#fdf8ff", border: ".5px solid #d8b4fe", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#8e44ad" }}>{b.sname} · Verse {b.vn}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => { openSurah(b.sn); setShowBkSheet(false); }}
                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 12, background: G, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>Read</button>
                  <button onClick={e => { e.stopPropagation(); toggleBk(b.sn, b.sname, b.vn, b.arabic, b.translation); }}
                    title="Remove this bookmark"
                    style={{ width: 24, height: 24, borderRadius: "50%", background: "#fee2e2", border: ".5px solid #fca5a5", color: "#dc2626", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                </div>
              </div>
              <div className="ar" style={{ fontSize: 16, color: "#1a1a1a", direction: "rtl", textAlign: "right", lineHeight: 1.9 }}>{b.arabic}</div>
            </div>
          ))
        }
      </div>
    </div>
  ) : null;

  // ── MEANING AUDIO — continuous play/stop, male voice, real language ──
  const stopAudioPlayback = useCallback(() => {
    audioStopRef.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (meaningAudioElRef.current) { meaningAudioElRef.current.pause(); meaningAudioElRef.current = null; }
    setAudioPlaying(false);
    setAudioCurrentVerse(0);
  }, []);

  // Play one real MP3 verse, resolving when it finishes — mirrors the
  // proven Arabic-audio continuous-playback pattern (ended + timeupdate +
  // duration-timer safety net, never silently stalls)
  const playRealAudioVerse = useCallback((url) => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      meaningAudioElRef.current = audio;
      let fallbackTimer = null;
      let finished = false;
      const done = (ok) => {
        if (finished) return;
        finished = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        meaningAudioElRef.current = null;
        resolve(ok);
      };
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          fallbackTimer = setTimeout(() => done(true), (audio.duration * 1000) + 500);
        }
      });
      audio.addEventListener("ended", () => done(true));
      audio.addEventListener("error", () => done(false));
      audio.play().catch(() => done(false));
    });
  }, []);

  const playAudioSurah = useCallback(async () => {
    audioStopRef.current = false;
    setAudioPlaying(true);
    setAudioNoVoice(false);

    const surahVerses = await fetchVerses(audioSurah, "en", null);
    const hasRealAudio = !!REAL_AUDIO_TRANSLATIONS[audioLang];
    const hasSurahAudio = !!SURAH_AUDIO_SOURCES[audioLang];

    // ── PATH 1: Real recorded human male voice, per verse (best quality) ──
    if (hasRealAudio) {
      for (let i = 0; i < surahVerses.length; i++) {
        if (audioStopRef.current) break;
        const v = surahVerses[i];
        setAudioCurrentVerse(v.number);
        const url = realAudioUrl(audioLang, audioSurah, v.number);
        const ok = await playRealAudioVerse(url);
        if (!ok && !audioStopRef.current) {
          // A verse file was missing/broken — skip forward rather than stall
          continue;
        }
      }
      if (!audioStopRef.current) { setAudioPlaying(false); setAudioCurrentVerse(0); }
      return;
    }

    // ── PATH 1B: Real recorded human male voice, whole Surah in one file ──
    if (hasSurahAudio) {
      const url = surahAudioUrl(audioLang, audioSurah);
      setAudioCurrentVerse(1);
      if (url) await playRealAudioVerse(url);
      if (!audioStopRef.current) { setAudioPlaying(false); setAudioCurrentVerse(0); }
      return;
    }

    // ── PATH 2: No real recording exists — strict male-voice-only TTS ──
    if (!("speechSynthesis" in window)) { setAudioPlaying(false); return; }
    const voices = window.speechSynthesis.getVoices();
    const locale = SPEECH_LOCALE[audioLang] || "en-US";
    const hasAnyVoice = voices.some(v => v.lang === locale || v.lang.startsWith(audioLang));
    const hasMaleVoice = !!findMaleVoice(audioLang);
    if (!hasAnyVoice || !hasMaleVoice) {
      // Never fall back to a female voice — refuse clearly instead
      setAudioNoVoice(true);
      setAudioPlaying(false);
      return;
    }

    const sName = SURAHS.find(s => s.n === audioSurah)?.name || "";
    for (let i = 0; i < surahVerses.length; i++) {
      if (audioStopRef.current) break;
      const v = surahVerses[i];
      setAudioCurrentVerse(v.number);
      const key = `${audioSurah}-${v.number}-translation-${audioLang}`;
      let text = cache[key]?.text;
      if (!text) {
        const prompt = `Translate this Quran verse from Arabic into ${LANG_NAMES[audioLang] || audioLang}. Surah ${sName}, Verse ${v.number}: "${v.arabic}"\n\nGive ONLY the accurate, clear meaning translation. No Arabic, no transliteration, no extra notes — just the translated meaning.`;
        try {
          text = await askAI(prompt, LANG_NAMES[audioLang] || audioLang);
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text } }));
        } catch { text = null; }
      }
      if (audioStopRef.current) break;
      if (!text) continue;
      await new Promise(resolve => { speakInLang(text, audioLang, resolve); });
    }
    if (!audioStopRef.current) { setAudioPlaying(false); setAudioCurrentVerse(0); }
  }, [audioLang, audioSurah, cache, playRealAudioVerse]);

  const AudioSheet = () => showAudioSheet ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) { stopAudioPlayback(); setShowAudioSheet(false); } }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🔊 Meaning Audio</div>
        <div style={{ fontSize: 12, color: "#9ba5b0", marginBottom: 16 }}>Languages marked 🎙️ use a real recorded human reciter, continuous like the Arabic audio. Others use your device's male voice only — never female.</div>

        {/* Language picker — alphabetical, searchable, country filter */}
        <div style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Language</div>
        <select value={audioLangCountry} onChange={e => { setAudioLangCountry(e.target.value); setAudioLangSearch(""); }} disabled={audioPlaying}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `.5px solid ${audioLangCountry !== "all" ? G : "#ddd"}`, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 8, background: audioPlaying ? "#f4f4f4" : (audioLangCountry !== "all" ? "#f0faf5" : "#fff"), color: "#1a1a1a", fontWeight: audioLangCountry !== "all" ? 600 : 400, cursor: audioPlaying ? "default" : "pointer" }}>
          <option value="all">🌐 All Countries — show every language</option>
          {COUNTRIES.map(c => (
            <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
          ))}
        </select>
        <input placeholder="Search language..." value={audioLangSearch} onChange={e => setAudioLangSearch(e.target.value)} disabled={audioPlaying}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: ".5px solid #ddd", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10, background: audioPlaying ? "#f4f4f4" : "#fff" }} />
        {(() => {
          const countryCodes = audioLangCountry === "all" ? null : (COUNTRIES.find(c => c.id === audioLangCountry)?.langs || null);
          const filtered = [...LANGS]
            .filter(l => (!countryCodes || countryCodes.includes(l.c)) &&
              (l.n.toLowerCase().includes(audioLangSearch.toLowerCase()) || l.na.toLowerCase().includes(audioLangSearch.toLowerCase())))
            .sort((a, b) => a.n.localeCompare(b.n));
          return (
            <div style={{ maxHeight: 220, overflowY: "auto", border: ".5px solid #eee", borderRadius: 9, marginBottom: 14 }}>
              {filtered.length === 0 && (
                <div style={{ padding: 14, textAlign: "center", color: "#9ba5b0", fontSize: 12 }}>No languages found</div>
              )}
              {filtered.map(l => (
                <div key={l.c} onClick={() => {
                  if (audioPlaying) return;
                  setAudioLang(l.c);
                  if (hasRealVoice(l.c)) {
                    setAudioNoVoice(false);
                  } else if ("speechSynthesis" in window) {
                    setAudioNoVoice(!findMaleVoice(l.c));
                  } else {
                    setAudioNoVoice(true);
                  }
                }}
                  style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: audioPlaying ? "default" : "pointer", background: audioLang === l.c ? "#f0faf5" : "#fff", borderBottom: ".5px solid #f4f4f4" }}>
                  <span style={{ fontSize: 13, color: audioLang === l.c ? G : "#1a1a1a", fontWeight: audioLang === l.c ? 700 : 400 }}>
                    {hasRealVoice(l.c) ? "🎙️ " : ""}{l.na} — {l.n}{hasRealVoice(l.c) ? " (Real Voice)" : ""}
                  </span>
                  {audioLang === l.c && <span style={{ color: G, fontSize: 14 }}>✓</span>}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Surah picker */}
        <div style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Surah</div>
        <select value={audioSurah} onChange={e => setAudioSurah(parseInt(e.target.value))} disabled={audioPlaying}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: ".5px solid #ddd", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16, background: audioPlaying ? "#f4f4f4" : "#fff" }}>
          {SURAHS.map(s => <option key={s.n} value={s.n}>{s.n}. {s.name} ({s.verses} verses)</option>)}
        </select>

        {audioNoVoice && (
          <div style={{ padding: "10px 12px", background: "#fff3cd", border: ".5px solid #ffc107", borderRadius: 9, fontSize: 12, color: "#856404", marginBottom: 14 }}>
            ⚠️ No male voice available for this language — no real recording exists, and your device has no male voice installed. We never substitute a female voice. Please select another language (look for 🎙️ Real Voice options — those are always available), or install a male voice pack: Android → Settings → System → Languages → Text-to-speech. iPhone → Settings → Accessibility → Spoken Content → Voices.
          </div>
        )}

        {audioPlaying && (
          <div style={{ padding: "10px 12px", background: "#f0faf5", border: `.5px solid ${G}`, borderRadius: 9, fontSize: 12, color: G, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>
            🔊 Playing Verse {audioCurrentVerse}...
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {!audioPlaying ? (
            <button onClick={playAudioSurah}
              style={{ flex: 1, padding: "12px", borderRadius: 10, background: G, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ▶ Play
            </button>
          ) : (
            <button onClick={stopAudioPlayback}
              style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#c0392b", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ⏹ Stop
            </button>
          )}
          <button onClick={() => { stopAudioPlayback(); setShowAudioSheet(false); }}
            style={{ padding: "12px 20px", borderRadius: 10, background: "#f4f4f4", color: "#333", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;


  const HomeScreen = () => (
    <div className="fade" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(165deg,#051a0e 0%,${G} 50%,#1a7a45 100%)`, padding: "14px 14px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04 }}>
          <svg width="100%" height="100%"><defs><pattern id="p" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><polygon points="25,2 47,14 47,36 25,48 3,36 3,14" fill="none" stroke="#fff" strokeWidth=".6" /></pattern></defs><rect width="100%" height="100%" fill="url(#p)" /></svg>
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${GOLD},#e8b84b)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Quran Life</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", letterSpacing: .4 }}>COMPLETE KNOWLEDGE</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button className="chip" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => setShowPrayer(true)}>🕌 Prayer</button>
              <button className="chip" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => setShowQari(true)}>🎙 {curQari.short}</button>
              <button className="chip" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => setShowLang(true)}>🌍 {curLang.na} ▾</button>
            </div>
          </div>
          {/* Prayer bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,.15)", borderRadius: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Next Prayer</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8b84b" }}>{PRAYER_NAMES[nextPrayer]} · {PRAYER_TIMES[nextPrayer]}</div>
            </div>
          </div>
          {/* Daily verse */}
          <div style={{ textAlign: "center", paddingBottom: 18 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 18, background: "rgba(201,148,58,.18)", border: ".5px solid rgba(201,148,58,.32)", color: "#e8b84b", fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>✨ Daily Verse · Al-Fatiha 5</div>
            <div className="ar" style={{ fontSize: 26, color: "#e8b84b", lineHeight: 1.8, marginBottom: 5 }}>إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontStyle: "italic" }}>"It is You we worship and You we ask for help."</div>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", borderTop: ".5px solid rgba(255,255,255,.1)", background: "rgba(0,0,0,.12)" }}>
            {[["114","Surahs"],["6,236","Verses"],["30","Juz"],["48+","Languages"]].map(([n, l]) => (
              <div key={l} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: ".5px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{n}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 1, textTransform: "uppercase", letterSpacing: .4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search — butter smooth */}
      <div style={{ padding: "12px 13px 8px", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ba5b0", fontSize: 15, pointerEvents: "none" }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Surah name, meaning, number... 🧈"
            style={{ width: "100%", padding: "11px 36px 11px 40px", borderRadius: 12, border: ".5px solid #ddd", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.06)", transition: "border-color .2s" }}
            onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = "#ddd"} />
          {query && <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#9ba5b0", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>}
        </div>
        {/* Live search dropdown */}
        {query && filtered.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% - 4px)", left: 13, right: 13, background: "#fff", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 280, overflowY: "auto", border: ".5px solid #e4e8e2" }}>
            {filtered.slice(0, 8).map(s => (
              <div key={s.n} onClick={() => { openSurah(s.n); setQuery(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: ".5px solid #f0f0ec", transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5fcf7"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ba5b0" }}>{s.meaning} · {s.verses} verses</div>
                </div>
                <div className="ar" style={{ fontSize: 16, color: G }}>{s.ar}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, padding: "4px 13px 10px" }}>
        {/* Resume / Start reading */}
        <div onClick={() => openSurah(lastRead?.surahN || 1)}
          style={{ background: `linear-gradient(135deg,${G},#1a7a45)`, borderRadius: 13, padding: 13, cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 4px 14px rgba(15,81,50,.2)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: .8 }}>{lastRead ? "▶ Resume Reading" : "📖 Start Reading"}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{lastRead ? lastRead.surahName : "Al-Fatiha"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{lastRead ? `Verse ${lastRead.verse}` : "The Opening"}</div>
          {lastRead && <div style={{ height: 3, background: "rgba(255,255,255,.18)", borderRadius: 2, marginTop: 4 }}><div style={{ height: "100%", width: "30%", background: "#e8b84b", borderRadius: 2 }} /></div>}
        </div>
        {/* 5 mini tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          {[
            { icon: "🎓", label: "Kids\nLearn", bg: "linear-gradient(135deg,#e67e22,#f39c12)", shadow: "rgba(230,126,34,.25)", action: () => { setScreen("kids"); setNavTab("kids"); setKidLetter(null); } },
            { icon: "🔖", label: `${bookmarks.length}\nSaved`, bg: "linear-gradient(135deg,#8e44ad,#9b59b6)", shadow: "rgba(142,68,173,.25)", action: () => setShowBkSheet(true) },
            { icon: "🔊", label: "Meaning\nAudio", bg: "linear-gradient(135deg,#c0392b,#e74c3c)", shadow: "rgba(192,57,43,.25)", action: () => setShowAudioSheet(true) },
            { icon: "📚", label: "Juz\nIndex", bg: "linear-gradient(135deg,#2980b9,#3498db)", shadow: "rgba(41,128,185,.25)", action: () => setShowJuz(true) },
            { icon: "📄", label: "Go To\nPage", bg: "linear-gradient(135deg,#16a085,#1abc9c)", shadow: "rgba(22,160,133,.25)", action: () => setShowGoto(true) },
          ].map(({ icon, label, bg, shadow, action }) => (
            <div key={label} onClick={action} style={{ background: bg, borderRadius: 12, padding: "10px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: `0 3px 10px ${shadow}` }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#fff", textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ padding: "2px 13px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .9, marginBottom: 8 }}>⚡ Quick Links</div>
        <div className="ql-grid">
          {QUICK_LINKS.map(q => (
            <div key={q.name} className="qpill" onClick={() => openSurah(q.surah)}>
              <div style={{ fontSize: 20 }}>{q.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{q.name}</div>
              <div className="ar" style={{ fontSize: 12, color: G }}>{q.ar}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, padding: "4px 13px 8px", overflowX: "auto" }}>
        {[["all","All 114"],["meccan","Meccan"],["medinan","Medinan"],["juz30","Juz 30"],["short","Short"],["long","Long"]].map(([v, l]) => (
          <button key={v} className={`fc${filter === v ? " on" : ""}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {/* Surah list */}
      <div style={{ padding: "0 13px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .9 }}>All Surahs</div>
        <div style={{ fontSize: 11, color: "#9ba5b0" }}>{filtered.length} surahs</div>
      </div>
      <div style={{ margin: "0 13px", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
        {filtered.length === 0
          ? <div style={{ padding: "24px 0", textAlign: "center", color: "#9ba5b0", fontSize: 13 }}>No surahs match your search</div>
          : filtered.map((s, i) => (
            <div key={s.n} className="srow" style={{ borderBottom: i < filtered.length - 1 ? ".5px solid #f0f0ec" : "none" }}>
              {/* Number diamond */}
              <div style={{ width: 32, height: 32, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: "absolute" }}><polygon points="16,1.5 30,9 30,23 16,30.5 2,23 2,9" fill="none" stroke={G} strokeWidth="1.1" /></svg>
                <span style={{ position: "relative", zIndex: 1, fontSize: 10, fontWeight: 700, color: G }}>{s.n}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 1 }}>
                  <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 600, background: s.type === "Meccan" ? "#e8f4ee" : "#e8eef8", color: s.type === "Meccan" ? "#1a6b3c" : "#1a4b8c", marginRight: 4 }}>{s.type}</span>
                  {s.verses}v · Juz {s.juz}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
                <div className="ar" style={{ fontSize: 17, color: G, lineHeight: 1.4 }}>{s.ar}</div>
                <div style={{ fontSize: 9, color: "#9ba5b0" }}>{s.meaning}</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <button className="pbtn" onClick={async e => {
                  e.stopPropagation();
                  stopAudio();
                  setContinueDialog(null);
                  // Load verses silently without opening read screen
                  try {
                    const v = await fetchVerses(s.n, lang, null);
                    playVerse(s.n, 1, "surah", v);
                  } catch(e) {}
                }}>▶ Play</button>
                <button className="rbtn" onClick={() => openSurah(s.n)}>Read</button>
              </div>
            </div>
          ))
        }
      </div>
      <div style={{ height: 14 }} />
      <Nav />
      {SettingsSheet()}{LangSheet()}{QariSheet()}{PrayerSheet()}{JuzSheet()}{GotoSheet()}{BkSheet()}{AudioSheet()}
    </div>
  );

  // ── READ SCREEN ─────────────────────────────────────────────
  const ReadScreen = () => {
    const s = curSurah || SURAHS[0];
    return (
      <div className="fade" style={{ paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,#051a0e,${G},#1a7a45)`, padding: "12px 13px 13px", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button onClick={() => { stopAudio(); setScreen("home"); setNavTab("home"); }}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.14)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", flexShrink: 0, cursor: "pointer" }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{s.type} · {s.verses} verses · Juz {s.juz} · Page {s.page}</div>
            </div>
            <div className="ar" style={{ fontSize: 19, color: "#e8b84b", marginRight: 4 }}>{s.ar}</div>
            <button className="chip" onClick={() => setShowQari(true)}>🎙 {curQari.short}</button>
            <button className="chip" onClick={() => setShowLang(true)}>🌍 {curLang.na}</button>
            <button className="chip" onClick={() => setShowBkSheet(true)}>🔖 {bookmarks.length}</button>
          </div>
          {/* Reading mode toggle + controls */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: ".5px solid rgba(255,255,255,.15)" }}>
            {/* Row 1: Mode buttons */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <button className={`mode-btn${!mushafMode ? " active" : ""}`} onClick={() => setMushafMode(false)}>📋 Normal</button>
              <button className={`mode-btn${mushafMode ? " active" : ""}`} onClick={() => setMushafMode(true)}>📖 Mushaf</button>
              <div style={{ flex: 1 }} />
              {/* Dark mode toggle */}
              <button onClick={() => setDarkMode(d => !d)}
                style={{ padding: "5px 12px", borderRadius: 16, background: darkMode ? "#e8b84b" : "rgba(255,255,255,.2)", border: ".5px solid rgba(255,255,255,.3)", color: darkMode ? "#1a0a00" : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {darkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
            {/* Row 2: Font size controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Arabic Size:</span>
              <button onClick={() => setFontSize(f => Math.max(16, f - 2))}
                style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: ".5px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A-</button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", minWidth: 20, textAlign: "center" }}>{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(40, f + 2))}
                style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: ".5px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A+</button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>🔍 Pinch to zoom</span>
            </div>
          </div>
        </div>

        {/* Bismillah */}
        {s.n !== 1 && s.n !== 9 && (
          <div style={{ textAlign: "center", padding: "13px 0 9px", background: mushafMode ? "#fdf6e3" : "#fff", borderBottom: ".5px solid #e4e8e2" }}>
            <div className="ar" style={{ fontSize: 22, color: mushafMode ? "#8b6914" : G }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
          </div>
        )}

        <div style={{ padding: "10px 12px" }}>
          {versesLoading && (
            <div style={{ padding: "44px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                {[0, .15, .3].map((d, i) => <span key={i} className="bn" style={{ animationDelay: `${d}s` }} />)}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading {s.name} in {curLang.n}...</div>
            </div>
          )}
          {versesError && (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{versesError}</div>
              <button onClick={() => openSurah(s.n)} style={{ padding: "8px 20px", background: G, color: "#fff", border: "none", borderRadius: 18, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↺ Retry</button>
            </div>
          )}

          {/* ── MUSHAF STYLE MODE ── */}
          {mushafMode && verses.length > 0 && (
            <div>
              <div className="mushaf-wrap">
                <div className="mushaf-text zoom-arabic">
                  {verses.map(v => (
                    <span key={v.number}>
                      {v.arabic}{" "}
                      <span className="mushaf-num">{v.number}</span>{" "}
                    </span>
                  ))}
                </div>
              </div>
              {/* Translations below Mushaf */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 14, marginTop: 10, border: ".5px solid #e4e8e2" }}>
                <div style={{ fontSize: 11, color: G, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: .5 }}>
                  Translation · {curLang.n}
                </div>
                {verses.map(v => (
                  <div key={v.number} style={{ display: "flex", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: ".5px solid #f4f4f4" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{v.number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.75, marginBottom: 8 }}>{v.translation}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className={`lbtn${playKey === `${s.n}:${v.number}` ? " pl" : ""}`}
                          onClick={() => playKey === `${s.n}:${v.number}` ? stopAudio() : playVerse(s.n, v.number, "single", verses)}
                          style={{ fontSize: 11, padding: "3px 10px" }}>
                          {playKey === `${s.n}:${v.number}` ? "⏸" : "▶"} Play
                        </button>
                        <button onClick={() => toggleBk(s.n, s.name, v.number, v.arabic, v.translation)}
                          style={{ fontSize: 15, background: "none", border: "none", cursor: "pointer", color: isBk(s.n, v.number) ? "#8e44ad" : "#9ba5b0" }}>🔖</button>
                        <button onClick={() => { setMushafMode(false); setOpenPanel(v.number); setActiveTab("tafsir"); }}
                          style={{ padding: "3px 10px", borderRadius: 12, border: `.5px solid ${G}`, background: "transparent", color: G, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>📖 Deep Knowledge</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NORMAL MODE ── */}
          {!mushafMode && verses.map(verse => {
            const pk = `${s.n}:${verse.number}`;
            const isPlaying = playKey === pk;
            const isOpen = openPanel === verse.number;
            const bkd = isBk(s.n, verse.number);
            const sajdah = isSajdahVerse(s.n, verse.number);

            return (
              <div key={verse.number} className="fade" style={{ background: darkMode ? "#1a1a1a" : "#fff", border: `.5px solid ${sajdah ? "#c9943a66" : bkd ? "#8e44ad44" : isOpen ? G : darkMode ? "#2a2a2a" : "#e2e8e4"}`, borderRadius: 13, marginBottom: 9, overflow: "hidden", boxShadow: isOpen ? `0 0 0 2px rgba(15,81,50,.09)` : sajdah ? "0 0 0 2px rgba(201,148,58,.15)" : "none" }}>
                {/* Sajdah Banner */}
                {sajdah && (
                  <div style={{ background: "linear-gradient(135deg,#8b6914,#c9943a)", padding: "7px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🕌</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                        {sajdah.type === "wajib" ? "Sajdah Tilawah — Obligatory" : "Sajdah Tilawah — Recommended"}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)" }}>
                        {sajdah.type === "wajib"
                          ? "Performing Sajdah is obligatory after reading or hearing this verse"
                          : "Performing Sajdah is recommended after reading or hearing this verse"}
                      </div>
                    </div>
                  </div>
                )}
                {/* Verse bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderBottom: ".5px solid #f0f0f0", background: isOpen ? "#f0faf5" : "#fafafa", flexWrap: "wrap" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{verse.number}</div>
                  <div style={{ flex: 1, fontSize: 10, color: "#9ba5b0" }}>Verse {verse.number} of {s.verses} · {s.name}</div>
                  <button className="bk-btn" title={bkd ? "Remove bookmark" : "Add bookmark"}
                    onClick={() => toggleBk(s.n, s.name, verse.number, verse.arabic, verse.translation)}
                    style={{ color: bkd ? "#8e44ad" : "#9ba5b0" }}>🔖</button>
                  <button className={`lbtn${isPlaying ? " pl" : ""}`} onClick={() => isPlaying ? stopAudio() : playVerse(s.n, verse.number, "single", verses)}>
                    {isPlaying ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button className={`dbtn${isOpen ? " op" : ""}`} onClick={() => {
                    if (openPanel === verse.number) { setOpenPanel(null); }
                    else { setOpenPanel(verse.number); setActiveTab("tafsir"); }
                  }}>📖 {isOpen ? "Close" : "Deep Knowledge"}</button>
                </div>

                {/* Arabic + translation shown automatically below it */}
                <div style={{ padding: "14px 14px 12px" }}>
                  <div className="ar zoom-arabic" style={{ fontSize: fontSize, lineHeight: 2.2, direction: "rtl", textAlign: "right", color: darkMode ? "#e8e8e8" : "#1a1a1a", marginBottom: 10, paddingBottom: 10, borderBottom: `.5px solid ${darkMode ? "#2a2a2a" : "#f4f4f4"}` }}>
                    {verse.arabic}
                  </div>
                  {(() => {
                    const tKey = `${surahNum}-${verse.number}-translation-${lang}`;
                    const tEntry = cache[tKey] || {};
                    if (!tEntry.text && !tEntry.loading && !tEntry.error) {
                      loadTabContent(verse, "translation");
                    }
                    return (
                      <div style={{ fontSize: 14, color: darkMode ? "#d0d0d0" : "#2a2a2a", lineHeight: 1.8, marginBottom: 6 }}>
                        {tEntry.loading && <span style={{ color: "#9ba5b0", fontSize: 12, fontStyle: "italic" }}>Translating...</span>}
                        {tEntry.error && <span style={{ color: "#c0392b", fontSize: 12 }}>Translation failed — <span onClick={() => loadTabContent(verse, "translation", true)} style={{ textDecoration: "underline", cursor: "pointer" }}>Retry</span></span>}
                        {tEntry.text && tEntry.text}
                      </div>
                    );
                  })()}
                  {/* Verse info small line */}
                  <div style={{ fontSize: 10, color: "#9ba5b0" }}>
                    {s.name} · Verse {verse.number} · Juz {s.juz} · Page {s.page}
                  </div>
                </div>

                {/* Deep Knowledge panel */}
                {isOpen && (
                  <div style={{ borderTop: ".5px solid rgba(15,81,50,.1)", background: "#fafffe", padding: 13 }}>
                    {/* Tabs — no Meaning tab, translation already shows in verse card above */}
                    <div style={{ display: "flex", gap: 5, marginBottom: 13, flexWrap: "wrap" }}>
                      {[
                        { id: "tafsir", label: "🕌 Tafsir" },
                        { id: "revelation", label: "📜 Revelation" },
                        { id: "science", label: "🔬 Science" },
                        { id: "hadith", label: "📋 Hadith" },
                      ].map(t => (
                        <button key={t.id} className={`tab${activeTab === t.id ? " on" : ""}`}
                          onClick={() => switchTab(verse, t.id)}>{t.label}</button>
                      ))}
                    </div>

                    {/* AI tabs — plain text, retry on fail */}
                    {(() => {
                      const key = `${surahNum}-${verse.number}-${activeTab}-${lang}`;
                      const entry = cache[key] || {};
                      if (!entry.text && !entry.loading && !entry.error) {
                        // Auto-trigger load
                        loadTabContent(verse, activeTab);
                      }
                      return (
                        <div>
                          <div style={{ fontSize: 11, color: G, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
                            {activeTab === "translation" ? "Translation" : activeTab === "tafsir" ? "Tafsir" : activeTab === "revelation" ? "Revelation History" : activeTab === "science" ? "Scientific Connection" : "Hadith & Authenticity"} · {curLang.n}
                          </div>
                          {entry.loading && <Spinner label={`Loading in ${curLang.n}...`} />}
                          {entry.error && <RetryRow msg={entry.error} onRetry={() => loadTabContent(verse, activeTab, true)} />}
                          {entry.text && (
                            <div className="aitext" style={{ background: "#f8fafb", borderRadius: 9, padding: 12, border: ".5px solid #e2e8e4" }}>
                              {entry.text}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Nav readOn />
        {SettingsSheet()}{LangSheet()}{QariSheet()}{BkSheet()}

        {/* Continue Dialog — small toast near bottom, not full screen */}
        {continueDialog && (
          <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 28px)", maxWidth: 490, zIndex: 300, animation: "pop .2s ease" }}>
            {/* Sajdah reminder if applicable */}
            {continueDialog.sajdah && (
              <div style={{ background: "linear-gradient(135deg,#8b6914,#c9943a)", borderRadius: "12px 12px 0 0", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🕌</span>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                  {continueDialog.sajdah.type === "wajib"
                    ? "Sajdah Tilawah is OBLIGATORY for this verse"
                    : "Sajdah Tilawah is recommended for this verse"}
                </div>
              </div>
            )}
            <div style={{ background: "#1a1a1a", borderRadius: continueDialog.sajdah ? "0 0 16px 16px" : 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 28px rgba(0,0,0,.35)" }}>
              <div style={{ fontSize: 18 }}>🎵</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Verse {continueDialog.vn} done</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{continueDialog.surahName} · Next verse {continueDialog.nextVn}</div>
              </div>
              <button onClick={() => { setContinueDialog(null); stopAudio(); }}
                style={{ padding: "7px 12px", borderRadius: 20, border: ".5px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                ⏹ Stop
              </button>
              <button onClick={() => { const d = continueDialog; setContinueDialog(null); playVerse(d.sn, d.nextVn, "single", verses); }}
                style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: "linear-gradient(180deg,#1a9a5c,#0f5132)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 0 #072b1a" }}>
                ▶ Continue
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── KIDS SCREEN ─────────────────────────────────────────────
  const KidsScreen = () => (
    <div className="fade" style={{ paddingBottom: 80, background: "linear-gradient(180deg,#fff9f0,#f0fff4)", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#e67e22,#f39c12)", padding: "16px 14px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .07, fontSize: 48, lineHeight: 1 }}>🌟⭐🌙✨</div>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setScreen("home"); setNavTab("home"); setKidLetter(null); }}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "6px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 12 }}>← Home</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 38, marginBottom: 6 }}>🎓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Kids Arabic Corner</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 4 }}>Learn Arabic Alphabet with Fun! 🎉</div>
            <div style={{ marginTop: 10, padding: "5px 14px", background: "rgba(255,255,255,.2)", borderRadius: 18, display: "inline-block", fontSize: 12, color: "#fff" }}>
              {learned.length} of {ARABIC_ALPHA.length} letters learned ⭐
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "12px 14px 6px" }}>
        <div style={{ height: 8, background: "#e2e8e4", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((learned.length / ARABIC_ALPHA.length) * 100)}%`, background: "linear-gradient(90deg,#e67e22,#f39c12)", borderRadius: 6, transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 4, textAlign: "center" }}>{Math.round((learned.length / ARABIC_ALPHA.length) * 100)}% Complete</div>
      </div>

      {kidLetter !== null ? (
        /* Letter detail */
        <div style={{ margin: "12px 14px", background: "#fff", borderRadius: 18, padding: 20, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} className="pop">
          <div style={{ fontSize: 72, marginBottom: 8 }}>{ARABIC_ALPHA[kidLetter].e}</div>
          <div className="ar" style={{ fontSize: 72, color: ARABIC_ALPHA[kidLetter].color, lineHeight: 1.2, marginBottom: 8 }}>{ARABIC_ALPHA[kidLetter].l}</div>
          <button onClick={() => speakLetter(ARABIC_ALPHA[kidLetter])}
            style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${ARABIC_ALPHA[kidLetter].color}`, background: "#fff", color: ARABIC_ALPHA[kidLetter].color, fontSize: 18, cursor: "pointer", marginBottom: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            🔊
          </button>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{ARABIC_ALPHA[kidLetter].n}</div>
          <div style={{ fontSize: 16, color: "#6b7280", marginBottom: 14 }}>Sound: "{ARABIC_ALPHA[kidLetter].s}"</div>
          <div style={{ background: "#f8f4ee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div className="ar" style={{ fontSize: 32, color: ARABIC_ALPHA[kidLetter].color, marginBottom: 4 }}>{ARABIC_ALPHA[kidLetter].w}</div>
            <div style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>{ARABIC_ALPHA[kidLetter].wm}</div>
            <div style={{ fontSize: 12, color: "#9ba5b0", marginBottom: 10 }}>Example word in Arabic</div>
            <button onClick={() => speakWordNursery(ARABIC_ALPHA[kidLetter])}
              style={{ padding: "8px 16px", borderRadius: 18, border: "1.5px solid #ec4899", background: "#fdf2f8", color: "#db2777", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              🔊 "{ARABIC_ALPHA[kidLetter].n} — for {ARABIC_ALPHA[kidLetter].wt}"
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setKidLetter(null)} style={{ padding: "9px 20px", borderRadius: 20, border: ".5px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer" }}>← All Letters</button>
            <button onClick={() => {
              setLearned(prev => prev.includes(kidLetter) ? prev.filter(i => i !== kidLetter) : [...prev, kidLetter]);
            }} style={{ padding: "9px 20px", borderRadius: 20, background: learned.includes(kidLetter) ? "#27ae60" : "#e67e22", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              {learned.includes(kidLetter) ? "✅ Learned!" : "Mark Learned ⭐"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "8px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .9, marginBottom: 10 }}>🔤 Arabic Letters — Tap to Learn</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            {ARABIC_ALPHA.map((a, i) => (
              <div key={i} className="alpha-card" onClick={() => {
                setKidLetter(i);
                speakLetter(a);
              }}
                style={{ background: `${a.color}18`, borderColor: learned.includes(i) ? G : "transparent" }}>
                <div style={{ fontSize: 22 }}>{a.e}</div>
                <div className="ar" style={{ fontSize: 28, color: a.color, fontWeight: 700, lineHeight: 1.2 }}>{a.l}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#5a6472" }}>{a.n}</div>
                {learned.includes(i) && <div style={{ fontSize: 9, color: G, fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>
          {learned.length === ARABIC_ALPHA.length && (
            <div style={{ marginTop: 16, padding: 16, background: "linear-gradient(135deg,#e67e22,#f39c12)", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Congratulations!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)", marginTop: 4 }}>You learned all {ARABIC_ALPHA.length} Arabic letters!</div>
            </div>
          )}
        </div>
      )}
      <Nav />
    </div>
  );

  // ── BOOKMARKS SCREEN ────────────────────────────────────────
  const BookmarksScreen = () => (
    <div className="fade" style={{ paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg,#8e44ad,#9b59b6)", padding: "14px 14px 16px" }}>
        <button onClick={() => { setScreen("home"); setNavTab("home"); }}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "6px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>← Home</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>🔖 Your Bookmarks</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 3 }}>{bookmarks.length} saved verses</div>
      </div>
      <div style={{ padding: "12px 13px" }}>
        {bookmarks.length === 0 ? (
          <div style={{ padding: "44px 0", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No bookmarks yet</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>While reading any Surah, tap 🔖 on any verse to save it here.</div>
            <button onClick={() => openSurah(1)} style={{ marginTop: 14, padding: "9px 22px", background: G, color: "#fff", border: "none", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Start Reading</button>
          </div>
        ) : bookmarks.map((b, i) => (
          <div key={i} style={{ background: "#fff", border: ".5px solid #d8b4fe", borderRadius: 13, marginBottom: 9, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: ".5px solid #f0f0ec", background: "#fdf8ff" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8e44ad" }}>{b.sname}</span>
                <span style={{ fontSize: 11, color: "#9ba5b0", marginLeft: 6 }}>· Verse {b.vn}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openSurah(b.sn)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: G, color: "#fff", border: "none", cursor: "pointer" }}>Read</button>
                <button onClick={() => toggleBk(b.sn, b.sname, b.vn, b.arabic, b.translation)} style={{ fontSize: 15, background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>×</button>
              </div>
            </div>
            <div style={{ padding: 12 }}>
              <div className="ar" style={{ fontSize: 20, direction: "rtl", textAlign: "right", color: "#1a1a1a", lineHeight: 1.9, marginBottom: 8 }}>{b.arabic}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{b.translation}{b.translation.length >= 100 ? "..." : ""}</div>
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  );

  // ── ROOT RENDER ─────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", fontFamily: "'Inter', sans-serif", background: "#f5f3ee", minHeight: "100vh", overflowX: "hidden", width: "100%" }}>
      <style>{css}</style>
      {screen === "home" && <HomeScreen />}
      {screen === "read" && <ReadScreen />}
      {screen === "kids" && <KidsScreen />}
      {screen === "bookmarks" && <BookmarksScreen />}
    </div>
  );
}
