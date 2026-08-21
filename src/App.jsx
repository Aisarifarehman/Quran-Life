// QURAN LIFE — PHASE 2
// Architecture: plain text AI (no JSON), per-tab loading, cached, retry on fail
// Audio: 2 fallback URLs, never silent fail
// Translation: Quran.com API with language codes, not AI
// Search: instant, smooth, no delay

import { useState, useRef, useCallback, useEffect } from "react";

// ─── SUPABASE CACHE ───────────────────────────────────────────
const SUPA_URL = "https://syemtsqbgaupkybtomex.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW10c3FiZ2F1cGt5YnRvbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTU5NTgsImV4cCI6MjEwMjI3MTk1OH0.LPK8kmpPDmOZCzjltRjxutJwmDguiKnXUKHMB28V2YI";

async function cacheGet(id) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/ai_cache?id=eq.${encodeURIComponent(id)}&select=content`, {
      headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.[0]?.content || null;
  } catch { return null; }
}

async function cacheSet(id, content) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/ai_cache`, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates"
      },
      body: JSON.stringify({ id, content })
    });
  } catch { /* silent fail — cache is optional */ }
}

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

// ─── RUKU DATA — 558 Rukus in the Quran ──────────────────────
// Each entry = { surah, verse } where a new Ruku starts
const RUKU_STARTS = [
  {s:1,v:1},{s:2,v:1},{s:2,v:8},{s:2,v:21},{s:2,v:30},{s:2,v:40},{s:2,v:47},{s:2,v:60},{s:2,v:62},{s:2,v:72},{s:2,v:83},{s:2,v:87},{s:2,v:97},{s:2,v:104},{s:2,v:113},{s:2,v:122},{s:2,v:130},{s:2,v:142},{s:2,v:153},{s:2,v:163},{s:2,v:168},{s:2,v:177},{s:2,v:183},{s:2,v:189},{s:2,v:197},{s:2,v:204},{s:2,v:211},{s:2,v:216},{s:2,v:220},{s:2,v:222},{s:2,v:229},{s:2,v:232},{s:2,v:235},{s:2,v:238},{s:2,v:243},{s:2,v:248},{s:2,v:253},{s:2,v:254},{s:2,v:258},{s:2,v:261},{s:2,v:267},{s:2,v:274},{s:2,v:277},{s:2,v:282},{s:3,v:1},{s:3,v:10},{s:3,v:21},{s:3,v:33},{s:3,v:42},{s:3,v:55},{s:3,v:64},{s:3,v:72},{s:3,v:80},{s:3,v:92},{s:3,v:102},{s:3,v:110},{s:3,v:121},{s:3,v:130},{s:3,v:137},{s:3,v:144},{s:3,v:149},{s:3,v:154},{s:3,v:156},{s:3,v:162},{s:3,v:169},{s:3,v:172},{s:3,v:178},{s:3,v:181},{s:3,v:187},{s:3,v:190},{s:4,v:1},{s:4,v:7},{s:4,v:11},{s:4,v:15},{s:4,v:19},{s:4,v:23},{s:4,v:26},{s:4,v:29},{s:4,v:34},{s:4,v:36},{s:4,v:43},{s:4,v:47},{s:4,v:51},{s:4,v:60},{s:4,v:65},{s:4,v:69},{s:4,v:77},{s:4,v:83},{s:4,v:86},{s:4,v:88},{s:4,v:92},{s:4,v:94},{s:4,v:97},{s:4,v:101},{s:4,v:105},{s:4,v:107},{s:4,v:110},{s:4,v:113},{s:4,v:116},{s:4,v:120},{s:4,v:123},{s:4,v:127},{s:4,v:130},{s:4,v:135},{s:4,v:141},{s:4,v:148},{s:4,v:153},{s:4,v:163},{s:4,v:172},{s:5,v:1},{s:5,v:6},{s:5,v:12},{s:5,v:18},{s:5,v:27},{s:5,v:35},{s:5,v:41},{s:5,v:51},{s:5,v:57},{s:5,v:67},{s:5,v:72},{s:5,v:78},{s:5,v:82},{s:5,v:87},{s:5,v:93},{s:5,v:97},{s:5,v:101},{s:5,v:105},{s:5,v:109},{s:5,v:116},{s:6,v:1},{s:6,v:11},{s:6,v:21},{s:6,v:31},{s:6,v:42},{s:6,v:51},{s:6,v:56},{s:6,v:61},{s:6,v:71},{s:6,v:74},{s:6,v:84},{s:6,v:91},{s:6,v:95},{s:6,v:101},{s:6,v:111},{s:6,v:122},{s:6,v:128},{s:6,v:136},{s:6,v:141},{s:6,v:151},{s:6,v:155},{s:7,v:1},{s:7,v:11},{s:7,v:26},{s:7,v:32},{s:7,v:40},{s:7,v:48},{s:7,v:54},{s:7,v:59},{s:7,v:65},{s:7,v:73},{s:7,v:80},{s:7,v:85},{s:7,v:94},{s:7,v:100},{s:7,v:103},{s:7,v:123},{s:7,v:127},{s:7,v:130},{s:7,v:138},{s:7,v:142},{s:7,v:148},{s:7,v:152},{s:7,v:158},{s:7,v:163},{s:7,v:168},{s:7,v:172},{s:7,v:182},{s:7,v:189},{s:7,v:196},{s:8,v:1},{s:8,v:5},{s:8,v:11},{s:8,v:20},{s:8,v:27},{s:8,v:29},{s:8,v:38},{s:8,v:45},{s:8,v:49},{s:8,v:55},{s:8,v:60},{s:8,v:65},{s:8,v:70},{s:9,v:1},{s:9,v:7},{s:9,v:17},{s:9,v:23},{s:9,v:25},{s:9,v:30},{s:9,v:36},{s:9,v:38},{s:9,v:43},{s:9,v:47},{s:9,v:60},{s:9,v:67},{s:9,v:73},{s:9,v:81},{s:9,v:90},{s:9,v:94},{s:9,v:100},{s:9,v:105},{s:9,v:111},{s:9,v:117},{s:9,v:123},{s:10,v:1},{s:10,v:11},{s:10,v:21},{s:10,v:31},{s:10,v:41},{s:10,v:54},{s:10,v:61},{s:10,v:71},{s:10,v:83},{s:10,v:98},{s:11,v:1},{s:11,v:6},{s:11,v:13},{s:11,v:17},{s:11,v:25},{s:11,v:36},{s:11,v:50},{s:11,v:61},{s:11,v:69},{s:11,v:77},{s:11,v:84},{s:11,v:96},{s:11,v:102},{s:11,v:109},{s:11,v:116},{s:12,v:1},{s:12,v:7},{s:12,v:21},{s:12,v:30},{s:12,v:36},{s:12,v:43},{s:12,v:50},{s:12,v:58},{s:12,v:69},{s:12,v:76},{s:12,v:80},{s:12,v:87},{s:12,v:94},{s:12,v:100},{s:13,v:1},{s:13,v:8},{s:13,v:19},{s:13,v:27},{s:13,v:32},{s:13,v:38},{s:14,v:1},{s:14,v:7},{s:14,v:13},{s:14,v:22},{s:14,v:28},{s:14,v:35},{s:14,v:42},{s:15,v:1},{s:15,v:16},{s:15,v:45},{s:15,v:61},{s:15,v:80},{s:16,v:1},{s:16,v:10},{s:16,v:22},{s:16,v:26},{s:16,v:35},{s:16,v:41},{s:16,v:51},{s:16,v:56},{s:16,v:61},{s:16,v:66},{s:16,v:71},{s:16,v:77},{s:16,v:80},{s:16,v:83},{s:16,v:90},{s:16,v:101},{s:16,v:111},{s:16,v:120},{s:17,v:1},{s:17,v:11},{s:17,v:23},{s:17,v:31},{s:17,v:41},{s:17,v:45},{s:17,v:53},{s:17,v:61},{s:17,v:71},{s:17,v:78},{s:17,v:85},{s:17,v:94},{s:17,v:101},{s:18,v:1},{s:18,v:9},{s:18,v:16},{s:18,v:23},{s:18,v:32},{s:18,v:45},{s:18,v:50},{s:18,v:60},{s:18,v:71},{s:18,v:83},{s:18,v:98},{s:18,v:102},{s:19,v:1},{s:19,v:16},{s:19,v:41},{s:19,v:51},{s:19,v:66},{s:19,v:83},{s:20,v:1},{s:20,v:25},{s:20,v:49},{s:20,v:77},{s:20,v:99},{s:20,v:116},{s:20,v:129},{s:21,v:1},{s:21,v:11},{s:21,v:30},{s:21,v:42},{s:21,v:51},{s:21,v:76},{s:21,v:83},{s:21,v:94},{s:22,v:1},{s:22,v:5},{s:22,v:11},{s:22,v:19},{s:22,v:23},{s:22,v:26},{s:22,v:34},{s:22,v:38},{s:22,v:42},{s:22,v:52},{s:22,v:60},{s:22,v:65},{s:22,v:73},{s:23,v:1},{s:23,v:12},{s:23,v:23},{s:23,v:33},{s:23,v:51},{s:23,v:57},{s:23,v:75},{s:23,v:93},{s:24,v:1},{s:24,v:11},{s:24,v:21},{s:24,v:27},{s:24,v:35},{s:24,v:41},{s:24,v:47},{s:24,v:54},{s:24,v:58},{s:24,v:62},{s:25,v:1},{s:25,v:10},{s:25,v:21},{s:25,v:35},{s:25,v:45},{s:25,v:53},{s:25,v:61},{s:26,v:1},{s:26,v:10},{s:26,v:53},{s:26,v:70},{s:26,v:105},{s:26,v:123},{s:26,v:141},{s:26,v:160},{s:26,v:176},{s:26,v:197},{s:26,v:214},{s:27,v:1},{s:27,v:15},{s:27,v:32},{s:27,v:45},{s:27,v:59},{s:27,v:67},{s:27,v:82},{s:28,v:1},{s:28,v:14},{s:28,v:22},{s:28,v:29},{s:28,v:43},{s:28,v:51},{s:28,v:61},{s:28,v:71},{s:28,v:76},{s:28,v:83},{s:29,v:1},{s:29,v:14},{s:29,v:23},{s:29,v:31},{s:29,v:41},{s:29,v:45},{s:29,v:52},{s:29,v:64},{s:30,v:1},{s:30,v:11},{s:30,v:20},{s:30,v:28},{s:30,v:33},{s:30,v:41},{s:30,v:54},{s:31,v:1},{s:31,v:6},{s:31,v:12},{s:31,v:20},{s:31,v:25},{s:32,v:1},{s:32,v:12},{s:32,v:23},{s:33,v:1},{s:33,v:9},{s:33,v:21},{s:33,v:28},{s:33,v:35},{s:33,v:41},{s:33,v:53},{s:33,v:59},{s:33,v:69},{s:34,v:1},{s:34,v:7},{s:34,v:15},{s:34,v:22},{s:34,v:31},{s:34,v:40},{s:34,v:46},{s:35,v:1},{s:35,v:8},{s:35,v:15},{s:35,v:27},{s:35,v:38},{s:36,v:1},{s:36,v:13},{s:36,v:33},{s:36,v:51},{s:36,v:68},{s:37,v:1},{s:37,v:22},{s:37,v:75},{s:37,v:114},{s:37,v:139},{s:37,v:171},{s:38,v:1},{s:38,v:17},{s:38,v:41},{s:38,v:65},{s:39,v:1},{s:39,v:8},{s:39,v:22},{s:39,v:32},{s:39,v:42},{s:39,v:53},{s:39,v:64},{s:40,v:1},{s:40,v:10},{s:40,v:21},{s:40,v:28},{s:40,v:38},{s:40,v:51},{s:40,v:61},{s:40,v:69},{s:40,v:79},{s:41,v:1},{s:41,v:9},{s:41,v:19},{s:41,v:26},{s:41,v:33},{s:41,v:38},{s:41,v:44},{s:41,v:47},{s:42,v:1},{s:42,v:10},{s:42,v:20},{s:42,v:26},{s:42,v:36},{s:42,v:44},{s:42,v:51},{s:43,v:1},{s:43,v:16},{s:43,v:26},{s:43,v:36},{s:43,v:46},{s:43,v:57},{s:43,v:68},{s:43,v:81},{s:44,v:1},{s:44,v:17},{s:44,v:30},{s:44,v:43},{s:45,v:1},{s:45,v:12},{s:45,v:22},{s:45,v:27},{s:46,v:1},{s:46,v:9},{s:46,v:21},{s:46,v:27},{s:47,v:1},{s:47,v:12},{s:47,v:20},{s:47,v:29},{s:48,v:1},{s:48,v:11},{s:48,v:18},{s:48,v:27},{s:49,v:1},{s:49,v:6},{s:49,v:11},{s:50,v:1},{s:50,v:16},{s:50,v:30},{s:51,v:1},{s:51,v:24},{s:51,v:47},{s:52,v:1},{s:52,v:29},{s:53,v:1},{s:53,v:26},{s:54,v:1},{s:54,v:23},{s:54,v:41},{s:55,v:1},{s:55,v:26},{s:55,v:46},{s:56,v:1},{s:56,v:57},{s:56,v:75},{s:57,v:1},{s:57,v:11},{s:57,v:20},{s:57,v:26},{s:58,v:1},{s:58,v:7},{s:58,v:14},{s:58,v:19},{s:59,v:1},{s:59,v:8},{s:59,v:11},{s:59,v:18},{s:60,v:1},{s:60,v:7},{s:60,v:10},{s:61,v:1},{s:61,v:10},{s:62,v:1},{s:62,v:9},{s:63,v:1},{s:63,v:9},{s:64,v:1},{s:64,v:11},{s:65,v:1},{s:65,v:8},{s:66,v:1},{s:66,v:8},{s:67,v:1},{s:67,v:15},{s:67,v:23},{s:68,v:1},{s:68,v:34},{s:69,v:1},{s:69,v:38},{s:70,v:1},{s:70,v:36},{s:71,v:1},{s:71,v:21},{s:72,v:1},{s:72,v:20},{s:73,v:1},{s:73,v:20},{s:74,v:1},{s:74,v:32},{s:75,v:1},{s:75,v:31},{s:76,v:1},{s:76,v:23},{s:77,v:1},{s:77,v:41},{s:78,v:1},{s:78,v:31},{s:79,v:1},{s:79,v:27},{s:80,v:1},{s:80,v:24},{s:81,v:1},{s:82,v:1},{s:83,v:1},{s:83,v:18},{s:84,v:1},{s:84,v:16},{s:85,v:1},{s:85,v:12},{s:86,v:1},{s:87,v:1},{s:88,v:1},{s:89,v:1},{s:89,v:21},{s:90,v:1},{s:91,v:1},{s:92,v:1},{s:93,v:1},{s:94,v:1},{s:95,v:1},{s:96,v:1},{s:96,v:9},{s:97,v:1},{s:98,v:1},{s:99,v:1},{s:100,v:1},{s:101,v:1},{s:102,v:1},{s:103,v:1},{s:104,v:1},{s:105,v:1},{s:106,v:1},{s:107,v:1},{s:108,v:1},{s:109,v:1},{s:110,v:1},{s:111,v:1},{s:112,v:1},{s:113,v:1},{s:114,v:1},
];

function isRukuStart(surahNum, verseNum) {
  return RUKU_STARTS.some(r => r.s === surahNum && r.v === verseNum);
}

function getRukuNumber(surahNum, verseNum) {
  let count = 0;
  for (const r of RUKU_STARTS) {
    if (r.s < surahNum || (r.s === surahNum && r.v <= verseNum)) count++;
    else break;
  }
  return count;
}

const QUICK_LINKS = [
  {name:"Ayatul Kursi",ar:"آية الكرسي",surah:2,verse:255,page:42,icon:"👑"},
  {name:"Ya-Sin",ar:"يس",surah:36,verse:1,page:440,icon:"⭐"},
  {name:"Al-Mulk",ar:"الملك",surah:67,verse:1,page:562,icon:"🌙"},
  {name:"Ar-Rahman",ar:"الرحمن",surah:55,verse:1,page:531,icon:"💚"},
  {name:"Al-Kahf",ar:"الكهف",surah:18,verse:1,page:293,icon:"🕌"},
  {name:"Al-Ikhlas",ar:"الإخلاص",surah:112,verse:1,page:604,icon:"🤲"},
];

// ─── 25 PROPHETS NAMED IN THE QURAN — chronological order ────
// Names/order per standard Islamic tradition. Birth/death dates and exact
// locations are intentionally omitted — the Quran and authentic hadith do
// not specify them, and most claimed dates online come from unverified
// Isra'iliyyat material. Icon = simple faceless symbol, never a face.
const PROPHETS = [
  {ar:"آدَم",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Adam",icon:"🌱",surahRefs:"Al-Baqarah 2:30-39 · Al-A'raf 7:11-25 · Ta-Ha 20:115-123"},
  {ar:"إِدْرِيس",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Idris",icon:"📜",surahRefs:"Maryam 19:56-57 · Al-Anbiya 21:85"},
  {ar:"نُوح",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Nuh",icon:"🚢",surahRefs:"Hud 11:25-49 · Nuh (Surah 71) · Al-Ankabut 29:14"},
  {ar:"هُود",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Hud",icon:"🏜️",surahRefs:"Al-A'raf 7:65-72 · Hud 11:50-60"},
  {ar:"صَالِح",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Salih",icon:"🐫",surahRefs:"Al-A'raf 7:73-79 · Hud 11:61-68"},
  {ar:"إِبْرَاهِيم",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Ibrahim",icon:"🔥",surahRefs:"Al-Baqarah 2:124-141 · As-Saffat 37:83-113 · Al-Anbiya 21:51-73"},
  {ar:"لُوط",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Lut",icon:"🏘️",surahRefs:"Hud 11:77-83 · Ash-Shu'ara 26:160-175"},
  {ar:"إِسْمَاعِيل",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Ismail",icon:"🕋",surahRefs:"As-Saffat 37:100-113 · Al-Baqarah 2:127"},
  {ar:"إِسْحَاق",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Ishaq",icon:"⛺",surahRefs:"As-Saffat 37:112-113 · Hud 11:71"},
  {ar:"يَعْقُوب",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Yaqub",icon:"👨‍👦",surahRefs:"Yusuf 12:4-6, 68 · Al-Baqarah 2:132-133"},
  {ar:"يُوسُف",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Yusuf",icon:"🌙",surahRefs:"Surah Yusuf (Surah 12, entire)"},
  {ar:"أَيُّوب",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Ayyub",icon:"🕊️",surahRefs:"Al-Anbiya 21:83-84 · Sad 38:41-44"},
  {ar:"شُعَيْب",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Shuaib",icon:"⚖️",surahRefs:"Al-A'raf 7:85-93 · Hud 11:84-95"},
  {ar:"مُوسَى",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Musa",icon:"🌊",surahRefs:"Al-Baqarah 2:49-61 · Ta-Ha 20:9-98 · Al-Qasas 28:3-46"},
  {ar:"هَارُون",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Harun",icon:"🗣️",surahRefs:"Ta-Ha 20:29-36, 90-94 · Al-A'raf 7:142-151"},
  {ar:"ذُو الْكِفْل",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Dhul-Kifl",icon:"🤲",surahRefs:"Al-Anbiya 21:85-86 · Sad 38:48"},
  {ar:"دَاوُد",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Dawud",icon:"👑",surahRefs:"Sad 38:17-26 · Al-Anbiya 21:78-80 · Saba 34:10-11"},
  {ar:"سُلَيْمَان",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Sulaiman",icon:"💍",surahRefs:"An-Naml 27:15-44 · Sad 38:30-40"},
  {ar:"إِلْيَاس",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Ilyas",icon:"⛰️",surahRefs:"As-Saffat 37:123-132 · Al-An'am 6:85"},
  {ar:"اَلْيَسَع",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Al-Yasa",icon:"🌾",surahRefs:"Al-An'am 6:86 · Sad 38:48"},
  {ar:"يُونُس",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Yunus",icon:"🐋",surahRefs:"As-Saffat 37:139-148 · Yunus 10:98 · Al-Anbiya 21:87-88"},
  {ar:"زَكَرِيَّا",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Zakariya",icon:"🕌",surahRefs:"Maryam 19:2-11 · Ali Imran 3:37-41"},
  {ar:"يَحْيَى",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Yahya",icon:"💧",surahRefs:"Maryam 19:12-15 · Ali Imran 3:39"},
  {ar:"عِيسَى",salutation:"عَلَيْهِ ٱلسَّلَام",salEn:"Alaihi as-Salam (Peace be upon him)",en:"Isa",icon:"✨",surahRefs:"Maryam 19:16-34 · Ali Imran 3:42-55 · Al-Ma'idah 5:110-120"},
  {ar:"مُحَمَّد",salutation:"ﷺ",salEn:"Sallallahu Alaihi Wasallam (Peace and blessings of Allah be upon him)",en:"Muhammad",icon:"📖",surahRefs:"Al-Ahzab 33:40 · Al-Fath 48:29 · Muhammad (Surah 47)"},
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

// ─── ARABIC VOWELS DATA ──────────────────────────────────────
const VOWELS_SHORT = [
  { ar: "بَ", speak: "فَتْحَة، بَ", name: "Fatha", arabic: "فَتْحَة", sound: '"a" — like apple', desc: "Short A vowel — written above the letter" },
  { ar: "بِ", speak: "كَسْرَة، بِ", name: "Kasra", arabic: "كَسْرَة", sound: '"i" — like sit', desc: "Short I vowel — written below the letter" },
  { ar: "بُ", speak: "ضَمَّة، بُ", name: "Damma", arabic: "ضَمَّة", sound: '"u" — like moon', desc: "Short U vowel — written above the letter" },
  { ar: "بْ", speak: "سُكُون، بْ", name: "Sukun", arabic: "سُكُون", sound: "silent — no vowel", desc: "No vowel — the letter stops here" },
  { ar: "بَّ", speak: "شَدَّة، بَّ", name: "Shadda", arabic: "شَدَّة", sound: "doubles the letter", desc: "Double consonant — hold it twice as long" },
  { ar: "بً", speak: "تَنْوِين فَتْح، بَن", name: "Tanwin Fath", arabic: "تنوين فتح", sound: '"an" ending', desc: 'Tanwin — adds "an" sound at word end' },
];
const VOWELS_LONG = [
  { ar: "بَا", speak: "أَلِف الْمَدّ، بَا", name: "Alif Madd", arabic: "أَلِف الْمَدّ", sound: 'long "aa"', desc: "Long A — hold for 2 counts" },
  { ar: "بِي", speak: "يَاء الْمَدّ، بِي", name: "Yaa Madd", arabic: "يَاء الْمَدّ", sound: 'long "ii"', desc: "Long I — hold for 2 counts" },
  { ar: "بُو", speak: "وَاو الْمَدّ، بُو", name: "Waw Madd", arabic: "وَاو الْمَدّ", sound: 'long "uu"', desc: "Long U — hold for 2 counts" },
];
const VOWEL_WORDS = [
  { ar: "كِتَاب", speak: "كِتَاب", tr: "ki-tāb", meaning: "Book" },
  { ar: "نُور", speak: "نُور", tr: "nūr", meaning: "Light" },
  { ar: "رَحْمَة", speak: "رَحْمَة", tr: "raḥ-ma", meaning: "Mercy" },
  { ar: "قُرْآن", speak: "قُرْآن", tr: "Qur-ān", meaning: "Quran" },
  { ar: "بِسْمِ", speak: "بِسْمِ اللَّه", tr: "bis-mi", meaning: "In the name" },
  { ar: "اللَّه", speak: "اللَّه", tr: "Al-lāh", meaning: "Allah" },
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

// ─── ARABIC LETTER AUDIO — real MP3 files, no TTS ───────────
// Uses everyayah.com which hosts individual Arabic letter audio
// Letter name audio from Islamic Network CDN
const LETTER_AUDIO_MAP = {
  "أ": "https://audio.islamicnetwork.com/arabic/letters/alef.mp3",
  "ب": "https://audio.islamicnetwork.com/arabic/letters/ba.mp3",
  "ت": "https://audio.islamicnetwork.com/arabic/letters/ta.mp3",
  "ث": "https://audio.islamicnetwork.com/arabic/letters/tha.mp3",
  "ج": "https://audio.islamicnetwork.com/arabic/letters/jeem.mp3",
  "ح": "https://audio.islamicnetwork.com/arabic/letters/ha.mp3",
  "خ": "https://audio.islamicnetwork.com/arabic/letters/kha.mp3",
  "د": "https://audio.islamicnetwork.com/arabic/letters/dal.mp3",
  "ذ": "https://audio.islamicnetwork.com/arabic/letters/dhal.mp3",
  "ر": "https://audio.islamicnetwork.com/arabic/letters/ra.mp3",
  "ز": "https://audio.islamicnetwork.com/arabic/letters/zay.mp3",
  "س": "https://audio.islamicnetwork.com/arabic/letters/seen.mp3",
  "ش": "https://audio.islamicnetwork.com/arabic/letters/sheen.mp3",
  "ص": "https://audio.islamicnetwork.com/arabic/letters/sad.mp3",
  "ض": "https://audio.islamicnetwork.com/arabic/letters/dad.mp3",
  "ط": "https://audio.islamicnetwork.com/arabic/letters/ta2.mp3",
  "ظ": "https://audio.islamicnetwork.com/arabic/letters/dha.mp3",
  "ع": "https://audio.islamicnetwork.com/arabic/letters/ain.mp3",
  "غ": "https://audio.islamicnetwork.com/arabic/letters/ghain.mp3",
  "ف": "https://audio.islamicnetwork.com/arabic/letters/fa.mp3",
  "ق": "https://audio.islamicnetwork.com/arabic/letters/qaf.mp3",
  "ك": "https://audio.islamicnetwork.com/arabic/letters/kaf.mp3",
  "ل": "https://audio.islamicnetwork.com/arabic/letters/lam.mp3",
  "م": "https://audio.islamicnetwork.com/arabic/letters/meem.mp3",
  "ن": "https://audio.islamicnetwork.com/arabic/letters/noon.mp3",
  "ه": "https://audio.islamicnetwork.com/arabic/letters/ha2.mp3",
  "و": "https://audio.islamicnetwork.com/arabic/letters/waw.mp3",
  "ي": "https://audio.islamicnetwork.com/arabic/letters/ya.mp3",
};

let currentLetterAudio = null;

function speakLetter(letterObj) {
  // Stop any playing audio
  if (currentLetterAudio) { currentLetterAudio.pause(); currentLetterAudio = null; }

  const url = LETTER_AUDIO_MAP[letterObj.l];
  if (url) {
    // Try real MP3 first
    const audio = new Audio(url);
    currentLetterAudio = audio;
    audio.play().catch(() => {
      // MP3 failed — fall back to Arabic TTS
      speakLetterTTS(letterObj);
    });
  } else {
    speakLetterTTS(letterObj);
  }
}

function speakLetterTTS(letterObj) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
  if (arabicVoice) {
    const u = new SpeechSynthesisUtterance(`حرف ${letterObj.full}`);
    u.lang = arabicVoice.lang;
    u.rate = 0.55;
    const arMale = voices.find(v => v.lang.startsWith("ar") && MALE_HINTS.some(h => v.name.toLowerCase().includes(h)));
    u.voice = arMale || arabicVoice;
    window.speechSynthesis.speak(u);
  } else {
    const u = new SpeechSynthesisUtterance(letterObj.full + " " + letterObj.n);
    u.lang = "en-US";
    u.rate = 0.8;
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

async function aiTranslateChunk(chunk, langName, apiKey, surahNum = null, chunkIndex = null, retries = 3) {
  // Build cache key from surah + chunk index + language
  const ckKey = surahNum !== null && chunkIndex !== null
    ? `trans-${surahNum}-${chunkIndex}-${langName}`
    : null;

  // Check Supabase cache first
  if (ckKey) {
    const cached = await cacheGet(ckKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore parse error */ }
    }
  }

  const input = chunk.map(v => `${v.number}: ${v.text}`).join("\n");
  try {
    // Respect global rate gap
    const now = Date.now();
    const wait = geminiQueue.minGap - (now - geminiQueue.lastCall);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    geminiQueue.lastCall = Date.now();

    const text = await geminiCall(
      `You are a Quran translation expert. Translate these Quran verse meanings from English into ${langName}.\nReturn ONLY the numbered translations in the same format, one per line. No extra text.\n\n${input}`,
      4000, apiKey
    );
    const result = {};
    text.split("\n").forEach(line => {
      const m = line.match(/^(\d+)[:.]\s*(.+)/);
      if (m) result[parseInt(m[1])] = m[2].trim();
    });
    if (Object.keys(result).length > 0) {
      // Save to Supabase cache
      if (ckKey) await cacheSet(ckKey, JSON.stringify(result));
      return result;
    }
    return null;
  } catch (e) {
    // Retry on rate limit instead of silently giving up (was causing verses to stay in English)
    if (e.message === "RATE_LIMIT" && retries > 0) {
      const delay = retries === 3 ? 8000 : retries === 2 ? 15000 : 25000;
      await new Promise(res => setTimeout(res, delay));
      return aiTranslateChunk(chunk, langName, apiKey, surahNum, chunkIndex, retries - 1);
    }
    return null;
  }
}

// Lightweight fetch — Arabic Uthmani text only, no translations.
// Used by the Amiri Style reader to paginate a full surah into custom pages.
async function fetchSurahArabicOnly(surahNum) {
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=en&words=false&per_page=300&fields=text_uthmani&_cb=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const d = await r.json();
  return (d.verses || []).map(v => ({ number: v.verse_number, chapter: parseInt(surahNum), arabic: v.text_uthmani }));
}

async function fetchVerses(surahNum, langCode, onAIReady) {
  const cacheKey = `${surahNum}-${langCode}`;
  if (verseCache[cacheKey]) return verseCache[cacheKey];

  // Check offline-saved data first — works without internet
  // We attempt network anyway to get fresh data, but fall back to offline if network fails.
  let offlineFallback = null;
  try {
    const offlineRaw = localStorage.getItem(`ql_offline_s${surahNum}`);
    if (offlineRaw) {
      const offlineVerses = JSON.parse(offlineRaw);
      if (Array.isArray(offlineVerses) && offlineVerses.length > 0 && offlineVerses[0].arabic) {
        offlineFallback = offlineVerses;
        // If device is clearly offline, return immediately without waiting for network
        if (!navigator.onLine) {
          verseCache[cacheKey] = offlineVerses;
          return offlineVerses;
        }
      }
    }
  } catch (e) { /* localStorage read failed — continue to network */ }

  // Try multiple translation IDs — 131 = Sahih International, 20 = Pickthall, 19 = Yusuf Ali
  const translationIds = [131, 20, 19, 85];
  let verses = null;

  for (const tid of translationIds) {
    try {
      const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=en&words=false&per_page=300&translations=${tid}&fields=text_uthmani&_cb=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const d = await r.json();
      if (!d.verses || d.verses.length === 0) continue;

      const mapped = d.verses.map(v => ({
        number: v.verse_number,
        arabic: v.text_uthmani,
        translation: langCode === "ar"
          ? v.text_uthmani
          : ((v.translations?.[0]?.text || "").replace(/<[^>]+>/g, "").trim()),
      }));

      // Check if we actually got translations
      const hasTranslation = mapped.some(v => v.translation && v.translation.length > 5);
      if (hasTranslation) {
        verses = mapped;
        break;
      }
    } catch(e) { continue; }
  }

  // If all IDs failed, still return Arabic only
  if (!verses) {
    try {
      const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=en&words=false&per_page=300&fields=text_uthmani&_cb=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      verses = d.verses.map(v => ({
        number: v.verse_number,
        arabic: v.text_uthmani,
        translation: "",
      }));
    } catch(e) {
      // Network fully failed — use offline-saved data if we have it, instead of erroring out
      if (offlineFallback) {
        verseCache[cacheKey] = offlineFallback;
        return offlineFallback;
      }
      throw new Error("Could not load surah. Check your connection, or download it for offline use first.");
    }
  }

  verseCache[cacheKey] = verses;

  // Every language except English & Arabic: AI translates from English
  if (langCode !== "en" && langCode !== "ar") {
    const langName = LANG_NAMES[langCode] || langCode;
    const apiKey = import.meta.env?.VITE_GEMINI_KEY || "";
    if (apiKey) {
      (async () => {
        const CHUNK = 25;
        const current = [...verses];
        for (let i = 0; i < current.length; i += CHUNK) {
          const chunk = current.slice(i, i + CHUNK).map(v => ({ number: v.number, text: v.translation }));
          const chunkIndex = Math.floor(i / CHUNK);
          const result = await aiTranslateChunk(chunk, langName, apiKey, surahNum, chunkIndex);
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


// ─── GEMINI FREE AI — replaces Anthropic, free forever ──────
// ─── GEMINI FREE AI — with model fallback + retry ───────────
const geminiQueue = { lastCall: 0, minGap: 3500, workingModel: null };
// Current Gemini models in priority order — app finds the one that works
const GEMINI_MODELS = [
  "gemini-1.5-flash",        // stable, free, confirmed working
  "gemini-1.5-flash-8b",     // stable, free, lightweight fallback
  "gemini-1.5-pro",          // stable, free tier fallback
];

async function geminiCall(bodyText, maxTokens, key) {
  const models = geminiQueue.workingModel
    ? [geminiQueue.workingModel, ...GEMINI_MODELS.filter(m => m !== geminiQueue.workingModel)]
    : GEMINI_MODELS;

  let lastErr = null;
  for (const model of models) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: bodyText }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
        })
      }
    );
    if (r.status === 404) { lastErr = new Error(`Model ${model} not available`); continue; }
    if (r.status === 429) { lastErr = new Error("RATE_LIMIT"); continue; }
    if (!r.ok) {
      let detail = "";
      try { detail = (await r.json())?.error?.message || ""; } catch {}
      lastErr = new Error(`Gemini ${r.status}: ${detail.substring(0, 150)}`);
      continue;
    }
    // Success — remember this model
    geminiQueue.workingModel = model;
    const d = await r.json();
    return (d.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  }
  throw lastErr || new Error("All Gemini models failed");
}

async function askAI(prompt, langName, retries = 3, cacheKey = null) {
  // Check Supabase cache first — zero Gemini calls if cached
  if (cacheKey) {
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
  }

  const key = import.meta.env.VITE_GEMINI_KEY || "";
  if (!key) throw new Error("NO_KEY");

  // Rate limiting — minimum gap between calls
  const now = Date.now();
  const wait = geminiQueue.minGap - (now - geminiQueue.lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  geminiQueue.lastCall = Date.now();

  try {
    const result = await geminiCall(
      `You are a Quranic scholar. ${prompt}\n\nIMPORTANT: Write a COMPLETE response in ${langName} language only. Write at least 5-8 full sentences. Never cut off mid sentence. Plain flowing text only. No JSON. No bullet points. No markdown.`,
      1200, key
    );
    // Save to Supabase cache — next user gets instant result
    if (cacheKey && result) await cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    if (e.message === "RATE_LIMIT" && retries > 0) {
      const delay = retries === 3 ? 8000 : retries === 2 ? 15000 : 25000;
      await new Promise(res => setTimeout(res, delay));
      return askAI(prompt, langName, retries - 1, cacheKey);
    }
    throw e;
  }
}

// Fetch a SHORT storybook version of a prophet's story — 4 short pages,
// grounded only in Quran/authentic hadith, written simply for children.
// Returns an array of short page strings (no full biography, no invented dates).
async function fetchProphetStory(prophet, langName) {
  const prompt = `Tell the story of Prophet ${prophet.en} (${prophet.ar}) as a SHORT children's storybook, using ONLY what is stated in the Quran (references: ${prophet.surahRefs}) and authentic hadith. Do NOT invent dates, ages, or locations not mentioned in these sources. Do NOT include any birth or death dates. Write EXACTLY 4 short story pages, each 2-3 simple sentences a child can understand, moving the story forward like "First... then... then... finally...". Separate the 4 pages with the exact marker "|||PAGE|||" and nothing else between them. Do not number the pages. Do not add a title. Write directly in ${langName}.`;
  const key = import.meta.env.VITE_GEMINI_KEY || "";
  if (!key) throw new Error("NO_KEY");
  const now = Date.now();
  const wait = geminiQueue.minGap - (now - geminiQueue.lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  geminiQueue.lastCall = Date.now();
  const raw = await geminiCall(prompt, 900, key);
  const pages = raw.split("|||PAGE|||").map(p => p.trim()).filter(Boolean);
  return pages.length > 0 ? pages : [raw];
}


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

// Standard Juz (Para) starting points — Surah number and Verse number where
// each of the 30 Juz begins, per the standard Mushaf division
const JUZ_STARTS = {
  1: { surah: 1, verse: 1 },
  2: { surah: 2, verse: 142 },
  3: { surah: 2, verse: 253 },
  4: { surah: 3, verse: 93 },
  5: { surah: 4, verse: 24 },
  6: { surah: 4, verse: 148 },
  7: { surah: 5, verse: 82 },
  8: { surah: 6, verse: 111 },
  9: { surah: 7, verse: 88 },
  10: { surah: 8, verse: 41 },
  11: { surah: 9, verse: 93 },
  12: { surah: 11, verse: 6 },
  13: { surah: 12, verse: 53 },
  14: { surah: 15, verse: 1 },
  15: { surah: 17, verse: 1 },
  16: { surah: 18, verse: 75 },
  17: { surah: 21, verse: 1 },
  18: { surah: 23, verse: 1 },
  19: { surah: 25, verse: 21 },
  20: { surah: 27, verse: 56 },
  21: { surah: 29, verse: 46 },
  22: { surah: 33, verse: 31 },
  23: { surah: 36, verse: 28 },
  24: { surah: 39, verse: 32 },
  25: { surah: 41, verse: 47 },
  26: { surah: 46, verse: 1 },
  27: { surah: 51, verse: 31 },
  28: { surah: 58, verse: 1 },
  29: { surah: 67, verse: 1 },
  30: { surah: 78, verse: 1 },
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

// ─── PRAYER TIMES CALCULATION ────────────────────────────────
function toRad(d){return d*Math.PI/180}
function toDeg(r){return r*180/Math.PI}
function fixAngle(a){return a-360*Math.floor(a/360)}
function fixHour(h){return h-24*Math.floor(h/24)}
function getTimezone(){return -new Date().getTimezoneOffset()/60}

function calcPrayerTimes(date,lat,lng,timezone){
  const fajrAngle=18,ishaAngle=17;
  const d=Math.floor((date-new Date(date.getFullYear(),0,0))/86400000);
  const t=(d+lng/360)/365.25;
  const L=fixAngle(280.46+36000.77*t);
  const M=fixAngle(357.528+35999.05*t);
  const lambda=fixAngle(L+1.915*Math.sin(toRad(M))+0.02*Math.sin(toRad(2*M)));
  const epsilon=23.439-0.0000004*t*365.25*100;
  const RA=toDeg(Math.atan2(Math.cos(toRad(epsilon))*Math.sin(toRad(lambda)),Math.cos(toRad(lambda))))/15;
  const EqT=L/15-fixHour(RA);
  const Dec=toDeg(Math.asin(Math.sin(toRad(epsilon))*Math.sin(toRad(lambda))));
  const Dhuhr=fixHour(12-lng/15-EqT+timezone);
  function pT(angle,after){
    const cv=(-Math.sin(toRad(angle))-Math.sin(toRad(Dec))*Math.sin(toRad(lat)))/(Math.cos(toRad(Dec))*Math.cos(toRad(lat)));
    if(Math.abs(cv)>1)return null;
    const T=toDeg(Math.acos(cv))/15;
    return after?Dhuhr+T:Dhuhr-T;
  }
  function asrT(){
    const angle=toDeg(Math.atan(1/(1+Math.tan(toRad(Math.abs(lat-Dec))))));
    return pT(angle,true);
  }
  function fmt(t){
    if(t===null)return"N/A";
    let h=Math.floor(t),m=Math.round((t-h)*60);
    if(m===60){h++;m=0;}h=h%24;
    const ap=h>=12?"PM":"AM";
    return`${h%12||12}:${m.toString().padStart(2,"0")} ${ap}`;
  }
  return[
    {name:"Fajr",ar:"الفجر",time:fmt(pT(fajrAngle,false)),icon:"🌙",raw:pT(fajrAngle,false)},
    {name:"Sunrise",ar:"الشروق",time:fmt(pT(0.833,false)),icon:"🌅",raw:pT(0.833,false)},
    {name:"Dhuhr",ar:"الظهر",time:fmt(Dhuhr),icon:"☀️",raw:Dhuhr},
    {name:"Asr",ar:"العصر",time:fmt(asrT()),icon:"🌤",raw:asrT()},
    {name:"Maghrib",ar:"المغرب",time:fmt(pT(0.833,true)),icon:"🌇",raw:pT(0.833,true)},
    {name:"Isha",ar:"العشاء",time:fmt(pT(ishaAngle,true)),icon:"🌙",raw:pT(ishaAngle,true)},
  ];
}
function getNextPrayerItem(times){
  if(!times)return null;
  const now=new Date();
  const nowH=now.getHours()+now.getMinutes()/60;
  const five=times.filter(p=>p.name!=="Sunrise"&&p.raw!==null);
  return five.find(p=>p.raw>nowH)||five[0];
}

// ─── HIJRI DATE ───────────────────────────────────────────────
const HIJRI_MONTHS=["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Awwal","Jumada al-Thani","Rajab","Sha'ban","Ramadan","Shawwal","Dhul Qadah","Dhul Hijjah"];
function toHijri(date){
  const jd=Math.floor((14+date.getMonth()+1)/12);
  const y=date.getFullYear()+4800-jd;
  const m=date.getMonth()+1+12*jd-3;
  let jdn=date.getDate()+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  const l=jdn-1948440+10632;
  const n=Math.floor((l-1)/10631);
  const l2=l-10631*n+354;
  const j=Math.floor((10985-l2)/5316)*Math.floor((50*l2)/17719)+Math.floor(l2/5670)*Math.floor((43*l2)/15238);
  const l3=l2-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;
  const month=Math.floor((24*l3)/709);
  const day=l3-Math.floor((709*month)/24);
  const year=30*n+j-30;
  return{day,month,year,monthName:HIJRI_MONTHS[month-1]||""};
}

// ─── 99 NAMES ─────────────────────────────────────────────────
const ALLAH_NAMES=[
  {n:1,ar:"الرَّحْمَنُ",tr:"Ar-Rahman",en:"The Most Gracious",m:"Mercy encompasses all creation"},
  {n:2,ar:"الرَّحِيمُ",tr:"Ar-Rahim",en:"The Most Merciful",m:"Specific mercy for believers"},
  {n:3,ar:"الْمَلِكُ",tr:"Al-Malik",en:"The King",m:"Sovereign ruler of all"},
  {n:4,ar:"الْقُدُّوسُ",tr:"Al-Quddus",en:"The Most Holy",m:"Free from all imperfection"},
  {n:5,ar:"السَّلَامُ",tr:"As-Salam",en:"The Source of Peace",m:"All peace flows from Him"},
  {n:6,ar:"الْمُؤْمِنُ",tr:"Al-Mumin",en:"The Guardian of Faith",m:"Gives security and faith"},
  {n:7,ar:"الْمُهَيْمِنُ",tr:"Al-Muhaymin",en:"The Overseer",m:"Watches over all"},
  {n:8,ar:"الْعَزِيزُ",tr:"Al-Aziz",en:"The Almighty",m:"Perfect power none can overcome"},
  {n:9,ar:"الْجَبَّارُ",tr:"Al-Jabbar",en:"The Compeller",m:"Compels and is never compelled"},
  {n:10,ar:"الْمُتَكَبِّرُ",tr:"Al-Mutakabbir",en:"The Supreme",m:"All greatness and majesty"},
  {n:11,ar:"الْخَالِقُ",tr:"Al-Khaliq",en:"The Creator",m:"Creates from nothing"},
  {n:12,ar:"الْبَارِئُ",tr:"Al-Bari",en:"The Originator",m:"Creates with perfect order"},
  {n:13,ar:"الْمُصَوِّرُ",tr:"Al-Musawwir",en:"The Fashioner",m:"Gives every creation its unique form"},
  {n:14,ar:"الْغَفَّارُ",tr:"Al-Ghaffar",en:"The Ever-Forgiving",m:"Forgives repeatedly"},
  {n:15,ar:"الْقَهَّارُ",tr:"Al-Qahhar",en:"The Subduer",m:"Subdues everything"},
  {n:16,ar:"الْوَهَّابُ",tr:"Al-Wahhab",en:"The Bestower",m:"Gives without expecting return"},
  {n:17,ar:"الرَّزَّاقُ",tr:"Ar-Razzaq",en:"The Provider",m:"Provides all sustenance"},
  {n:18,ar:"الْفَتَّاحُ",tr:"Al-Fattah",en:"The Opener",m:"Opens all doors of mercy"},
  {n:19,ar:"الْعَلِيمُ",tr:"Al-Alim",en:"The All-Knowing",m:"Knowledge encompasses everything"},
  {n:20,ar:"الْقَابِضُ",tr:"Al-Qabid",en:"The Withholder",m:"Withholds and restricts as He wills"},
  {n:21,ar:"الْبَاسِطُ",tr:"Al-Basit",en:"The Extender",m:"Extends and gives in abundance"},
  {n:22,ar:"الْخَافِضُ",tr:"Al-Khafid",en:"The Abaser",m:"Lowers whoever He wills"},
  {n:23,ar:"الرَّافِعُ",tr:"Ar-Rafi",en:"The Exalter",m:"Raises whoever He wills"},
  {n:24,ar:"الْمُعِزُّ",tr:"Al-Muizz",en:"The Bestower of Honor",m:"Gives honor and dignity"},
  {n:25,ar:"المُذِلُّ",tr:"Al-Mudhill",en:"The Humiliator",m:"Humiliates whoever He wills"},
  {n:26,ar:"السَّمِيعُ",tr:"As-Sami",en:"The All-Hearing",m:"Hears every sound and supplication"},
  {n:27,ar:"الْبَصِيرُ",tr:"Al-Basir",en:"The All-Seeing",m:"Sees everything"},
  {n:28,ar:"الْحَكَمُ",tr:"Al-Hakam",en:"The Judge",m:"Judges all with perfect justice"},
  {n:29,ar:"الْعَدْلُ",tr:"Al-Adl",en:"The Just",m:"Perfectly just in all things"},
  {n:30,ar:"اللَّطِيفُ",tr:"Al-Latif",en:"The Subtle",m:"Most gentle and kind"},
  {n:31,ar:"الْخَبِيرُ",tr:"Al-Khabir",en:"The All-Aware",m:"Aware of every detail"},
  {n:32,ar:"الْحَلِيمُ",tr:"Al-Halim",en:"The Forbearing",m:"Does not hasten punishment"},
  {n:33,ar:"الْعَظِيمُ",tr:"Al-Azim",en:"The Magnificent",m:"Tremendous greatness"},
  {n:34,ar:"الْغَفُورُ",tr:"Al-Ghafur",en:"The Forgiving",m:"Forgives all sins"},
  {n:35,ar:"الشَّكُورُ",tr:"Ash-Shakur",en:"The Appreciative",m:"Rewards good deeds abundantly"},
  {n:36,ar:"الْعَلِيُّ",tr:"Al-Ali",en:"The Most High",m:"Above all in essence and status"},
  {n:37,ar:"الْكَبِيرُ",tr:"Al-Kabir",en:"The Most Great",m:"Greater than everything"},
  {n:38,ar:"الْحَفِيظُ",tr:"Al-Hafiz",en:"The Preserver",m:"Preserves and protects everything"},
  {n:39,ar:"المُقِيتُ",tr:"Al-Muqit",en:"The Sustainer",m:"Provides sustenance for all"},
  {n:40,ar:"الْحَسِيبُ",tr:"Al-Hasib",en:"The Reckoner",m:"Takes account of everything"},
  {n:41,ar:"الْجَلِيلُ",tr:"Al-Jalil",en:"The Majestic",m:"Supreme majesty and grandeur"},
  {n:42,ar:"الْكَرِيمُ",tr:"Al-Karim",en:"The Generous",m:"Most generous and noble"},
  {n:43,ar:"الرَّقِيبُ",tr:"Ar-Raqib",en:"The Watchful",m:"Watches over all things always"},
  {n:44,ar:"الْمُجِيبُ",tr:"Al-Mujib",en:"The Responsive",m:"Answers all prayers"},
  {n:45,ar:"الْوَاسِعُ",tr:"Al-Wasi",en:"The All-Encompassing",m:"Capacity and generosity are limitless"},
  {n:46,ar:"الْحَكِيمُ",tr:"Al-Hakim",en:"The All-Wise",m:"Wisdom in all matters is perfect"},
  {n:47,ar:"الْوَدُودُ",tr:"Al-Wadud",en:"The Loving",m:"Loves the righteous believers"},
  {n:48,ar:"الْمَجِيدُ",tr:"Al-Majid",en:"The Glorious",m:"Glorious in essence and attributes"},
  {n:49,ar:"الْبَاعِثُ",tr:"Al-Baith",en:"The Resurrector",m:"Resurrects all on Judgment Day"},
  {n:50,ar:"الشَّهِيدُ",tr:"Ash-Shahid",en:"The Witness",m:"Witnesses everything"},
  {n:51,ar:"الْحَقُّ",tr:"Al-Haqq",en:"The Truth",m:"Absolute truth"},
  {n:52,ar:"الْوَكِيلُ",tr:"Al-Wakil",en:"The Trustee",m:"Relied upon for all matters"},
  {n:53,ar:"الْقَوِيُّ",tr:"Al-Qawi",en:"The Strong",m:"Perfect strength"},
  {n:54,ar:"الْمَتِينُ",tr:"Al-Matin",en:"The Firm",m:"Extreme firmness and power"},
  {n:55,ar:"الْوَلِيُّ",tr:"Al-Wali",en:"The Protecting Friend",m:"Protects and supports believers"},
  {n:56,ar:"الْحَمِيدُ",tr:"Al-Hamid",en:"The Praiseworthy",m:"Worthy of all praise"},
  {n:57,ar:"الْمُحْصِيُ",tr:"Al-Muhsi",en:"The Counter",m:"Counts and records everything"},
  {n:58,ar:"الْمُبْدِئُ",tr:"Al-Mubdi",en:"The Originator",m:"Starts creation from nothing"},
  {n:59,ar:"الْمُعِيدُ",tr:"Al-Muid",en:"The Restorer",m:"Brings back creation after death"},
  {n:60,ar:"الْمُحْيِي",tr:"Al-Muhyi",en:"The Giver of Life",m:"Gives life to everything"},
  {n:61,ar:"الْمُمِيتُ",tr:"Al-Mumit",en:"The Taker of Life",m:"Causes death when He wills"},
  {n:62,ar:"الْحَيُّ",tr:"Al-Hayy",en:"The Ever-Living",m:"Always existed and will always exist"},
  {n:63,ar:"الْقَيُّومُ",tr:"Al-Qayyum",en:"The Self-Subsisting",m:"Sustains and manages all existence"},
  {n:64,ar:"الْوَاجِدُ",tr:"Al-Wajid",en:"The Finder",m:"Finds whatever He wills"},
  {n:65,ar:"الْمَاجِدُ",tr:"Al-Majid",en:"The Noble",m:"Great nobility and honor"},
  {n:66,ar:"الْوَاحِدُ",tr:"Al-Wahid",en:"The One",m:"Uniquely one with no partner"},
  {n:67,ar:"الأَحَدُ",tr:"Al-Ahad",en:"The Unique",m:"Absolutely unique"},
  {n:68,ar:"الصَّمَدُ",tr:"As-Samad",en:"The Eternal",m:"Eternally relied upon"},
  {n:69,ar:"الْقَادِرُ",tr:"Al-Qadir",en:"The Capable",m:"Capable of all things"},
  {n:70,ar:"الْمُقْتَدِرُ",tr:"Al-Muqtadir",en:"The Powerful",m:"Perfect power over all things"},
  {n:71,ar:"الْمُقَدِّمُ",tr:"Al-Muqaddim",en:"The Expediter",m:"Puts things in their right place"},
  {n:72,ar:"الْمُؤَخِّرُ",tr:"Al-Muakhkhir",en:"The Delayer",m:"Delays things according to His wisdom"},
  {n:73,ar:"الأَوَّلُ",tr:"Al-Awwal",en:"The First",m:"Existed before all things"},
  {n:74,ar:"الآخِرُ",tr:"Al-Akhir",en:"The Last",m:"Remains after all things cease"},
  {n:75,ar:"الظَّاهِرُ",tr:"Az-Zahir",en:"The Manifest",m:"Evident through His signs"},
  {n:76,ar:"الْبَاطِنُ",tr:"Al-Batin",en:"The Hidden",m:"Essence cannot be perceived"},
  {n:77,ar:"الْوَالِي",tr:"Al-Wali",en:"The Governor",m:"Governs all of creation"},
  {n:78,ar:"الْمُتَعَالِي",tr:"Al-Mutaali",en:"The Supremely Exalted",m:"Far above all imperfection"},
  {n:79,ar:"الْبَرُّ",tr:"Al-Barr",en:"The Source of Goodness",m:"Source of all goodness"},
  {n:80,ar:"التَّوَّابُ",tr:"At-Tawwab",en:"The Ever-Returning",m:"Accepts repentance repeatedly"},
  {n:81,ar:"الْمُنْتَقِمُ",tr:"Al-Muntaqim",en:"The Avenger",m:"Takes retribution for the oppressed"},
  {n:82,ar:"الْعَفُوُّ",tr:"Al-Afuw",en:"The Pardoner",m:"Erases sins completely"},
  {n:83,ar:"الرَّؤُوفُ",tr:"Ar-Rauf",en:"The Compassionate",m:"Extreme kindness and compassion"},
  {n:84,ar:"مَالِكُ الْمُلْكِ",tr:"Malik Al-Mulk",en:"The Owner of All",m:"Owns all sovereignty"},
  {n:85,ar:"ذُوالْجَلاَلِ وَالإِكْرَامِ",tr:"Dhul-Jalali wal-Ikram",en:"Lord of Majesty",m:"Possesses all majesty and honor"},
  {n:86,ar:"الْمُقْسِطُ",tr:"Al-Muqsit",en:"The Equitable",m:"Fair and equitable in all things"},
  {n:87,ar:"الْجَامِعُ",tr:"Al-Jami",en:"The Gatherer",m:"Gathers all people on Judgment Day"},
  {n:88,ar:"الْغَنِيُّ",tr:"Al-Ghani",en:"The Self-Sufficient",m:"Free of all need"},
  {n:89,ar:"الْمُغْنِي",tr:"Al-Mughni",en:"The Enricher",m:"Enriches whoever He wills"},
  {n:90,ar:"الْمَانِعُ",tr:"Al-Mani",en:"The Preventer",m:"Withholds what is harmful"},
  {n:91,ar:"الضَّارُّ",tr:"Ad-Darr",en:"The Distresser",m:"Allows harm to reach whoever He wills"},
  {n:92,ar:"النَّافِعُ",tr:"An-Nafi",en:"The Benefiter",m:"Benefits whoever He wills"},
  {n:93,ar:"النُّورُ",tr:"An-Nur",en:"The Light",m:"Light of the heavens and earth"},
  {n:94,ar:"الْهَادِي",tr:"Al-Hadi",en:"The Guide",m:"Guides whoever He wills to truth"},
  {n:95,ar:"الْبَدِيعُ",tr:"Al-Badi",en:"The Incomparable",m:"Creates in the most unique way"},
  {n:96,ar:"الْبَاقِي",tr:"Al-Baqi",en:"The Everlasting",m:"Remains forever"},
  {n:97,ar:"الْوَارِثُ",tr:"Al-Warith",en:"The Inheritor",m:"Inherits everything after all perish"},
  {n:98,ar:"الرَّشِيدُ",tr:"Ar-Rashid",en:"The Guide to Right Path",m:"Guides all things to their right end"},
  {n:99,ar:"الصَّبُورُ",tr:"As-Sabur",en:"The Patient",m:"Extremely patient with His creation"},
];

// ─── MORNING/EVENING ADHKAR ───────────────────────────────────
const ADHKAR={
  morning:[
    {ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",en:"We have entered the morning and the whole kingdom belongs to Allah, and all praise is due to Allah.",count:1,source:"Abu Dawud"},
    {ar:"اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",en:"O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.",count:1,source:"Tirmidhi"},
    {ar:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",en:"Glory be to Allah and praise Him.",count:100,source:"Muslim"},
    {ar:"لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",en:"There is no god but Allah alone, no partner. To Him belongs all sovereignty and praise. He has power over all things.",count:10,source:"Bukhari"},
    {ar:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",en:"In the name of Allah with whose name nothing can cause harm on earth or in the heavens. He is All-Hearing, All-Knowing.",count:3,source:"Abu Dawud"},
    {ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ",en:"O Allah, I ask You for well-being in this world and the Hereafter.",count:1,source:"Ibn Majah"},
  ],
  evening:[
    {ar:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",en:"We have entered the evening and the whole kingdom belongs to Allah, and all praise is due to Allah.",count:1,source:"Abu Dawud"},
    {ar:"اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",en:"O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the return.",count:1,source:"Tirmidhi"},
    {ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",en:"I seek refuge in the perfect words of Allah from the evil of what He has created.",count:3,source:"Muslim"},
    {ar:"اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي",en:"O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight.",count:3,source:"Abu Dawud"},
    {ar:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",en:"Allah is sufficient for me. There is no god but He. In Him I put my trust. He is Lord of the Mighty Throne.",count:7,source:"Abu Dawud"},
  ],
};

// ─── DUAS ─────────────────────────────────────────────────────
const DUAS=[
  {cat:"🌙 Before Sleep",ar:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",en:"In Your name, O Allah, I die and I live.",src:"Bukhari"},
  {cat:"🌅 Upon Waking",ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",en:"All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",src:"Bukhari"},
  {cat:"🍽 Before Eating",ar:"بِسْمِ اللَّهِ",en:"In the name of Allah.",src:"Abu Dawud"},
  {cat:"🍽 After Eating",ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",en:"All praise is for Allah who fed us, gave us drink, and made us Muslims.",src:"Abu Dawud"},
  {cat:"🚗 Before Travel",ar:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",en:"Glory be to Him who subjected this to us. We could never have done it ourselves. And indeed to our Lord we will return.",src:"Abu Dawud"},
  {cat:"🕌 Entering Mosque",ar:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",en:"O Allah, open for me the doors of Your mercy.",src:"Muslim"},
  {cat:"🕌 Leaving Mosque",ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",en:"O Allah, I ask You for Your bounty.",src:"Muslim"},
  {cat:"😟 Anxiety",ar:"لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",en:"There is no god but You, glory be to You, indeed I was among the wrongdoers.",src:"Quran 21:87"},
  {cat:"🤲 Forgiveness",ar:"رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",en:"My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of Repentance, the Merciful.",src:"Tirmidhi"},
  {cat:"🌧 Rain",ar:"اللَّهُمَّ صَيِّبًا نَافِعًا",en:"O Allah, make it a beneficial rain.",src:"Bukhari"},
  {cat:"😰 Fear & Distress",ar:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",en:"Allah is sufficient for me. There is no god but He. In Him I put my trust. He is the Lord of the Mighty Throne.",src:"Abu Dawud 5081 — Sahih"},
  {cat:"😰 Fear & Distress",ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",en:"O Allah, I seek refuge in You from anxiety and grief, from weakness and laziness, from miserliness and cowardice, from the burden of debt and the oppression of people.",src:"Bukhari 2893 — Sahih"},
  {cat:"😔 Depression & Sadness",ar:"لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",en:"There is no god but You. Glory be to You. Indeed, I was among the wrongdoers.",src:"Quran 21:87 — Dua of Prophet Yunus (AS). The Prophet ﷺ said whoever recites it will have his supplication answered. (Tirmidhi 3505 — Hasan)"},
  {cat:"😔 Depression & Sadness",ar:"اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ",en:"O Allah, I hope for Your mercy. Do not leave me to myself even for the blink of an eye. Correct all my affairs.",src:"Abu Dawud 5090 — Hasan"},
  {cat:"💸 Financial Difficulty",ar:"اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",en:"O Allah, suffice me with what You have made lawful, sparing me from what You have made unlawful, and make me independent of all others by Your bounty.",src:"Tirmidhi 3563 — Hasan"},
  {cat:"💸 Financial Difficulty",ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْفَقْرِ، وَالْقِلَّةِ، وَالذِّلَّةِ، وَأَعُوذُ بِكَ مِنْ أَنْ أَظْلِمَ أَوْ أُظْلَمَ",en:"O Allah, I seek refuge in You from poverty, scarcity, and humiliation. And I seek refuge in You from wronging others or being wronged.",src:"Abu Dawud 1544 — Sahih"},
  {cat:"🧿 Evil Eye Protection",ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ",en:"I seek refuge in the perfect words of Allah from every devil and every poisonous creature, and from every evil eye.",src:"Bukhari 3371 — Sahih. The Prophet ﷺ used to seek refuge for Hasan and Husayn with these words."},
  {cat:"🧿 Evil Eye Protection",ar:"بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ",en:"In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye. May Allah cure you. In the name of Allah I perform ruqyah for you.",src:"Muslim 2186 — Sahih — Ruqyah of Jibreel (AS) for the Prophet ﷺ"},

  // ── SICKNESS & HEALING ──
  {cat:"🤒 Sickness & Healing",ar:"اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",en:"O Allah, Lord of mankind, remove the affliction and grant healing. You are the Healer — there is no cure except Your cure, a healing that leaves behind no illness.",src:"Bukhari 5675, Muslim 2191 — Sahih — The Prophet ﷺ used to recite this while placing his right hand on the sick person"},
  {cat:"🤒 Sickness & Healing",ar:"أَسْأَلُ اللَّهَ الْعَظِيمَ، رَبَّ الْعَرْشِ الْعَظِيمِ، أَنْ يَشْفِيَكَ",en:"I ask Allah the Magnificent, Lord of the Magnificent Throne, to cure you.",src:"Tirmidhi 2083, Abu Dawud 3106 — Sahih — Recite 7 times when visiting a sick person. The Prophet ﷺ said whoever says this, Allah will cure them if it is their appointed time to recover"},
  {cat:"🤒 Sickness & Healing",ar:"بِسْمِ اللَّهِ — أَعُوذُ بِعِزَّةِ اللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ",en:"In the name of Allah — I seek refuge in Allah and His power from the evil of what I find and fear.",src:"Muslim 2202 — Sahih — The Prophet ﷺ told a companion suffering from pain to place his hand on the painful area and say Bismillah 3 times, then this dua 7 times"},
  {cat:"🤒 Sickness & Healing",ar:"لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ",en:"No harm — it is a purification, if Allah wills.",src:"Bukhari 5656 — Sahih — The Prophet ﷺ used to say this when visiting the sick, giving hope that illness purifies sins"},
  {cat:"🤒 Sickness & Healing",ar:"اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",en:"O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is none worthy of worship but You.",src:"Abu Dawud 5090, Tirmidhi 3480 — Hasan — Recommended to recite morning and evening for health of body, hearing and sight"},
  {cat:"🤒 Sickness & Healing",ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ، وَالْجُنُونِ، وَالْجُذَامِ، وَمِنْ سَيِّئِ الْأَسْقَامِ",en:"O Allah, I seek refuge in You from leprosy, madness, elephantiasis, and from the worst of diseases.",src:"Abu Dawud 1554 — Sahih — A comprehensive protection dua from serious and difficult diseases"},

  // ── DISEASE & LONG ILLNESS ──
  {cat:"🏥 Long Illness & Disease",ar:"بِسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ مِنْ شَرِّ كُلِّ نَفْسٍ وَعَيْنِ كُلِّ حَاسِدٍ، اللَّهُ يَشْفِيكَ",en:"In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul and every envious eye. May Allah cure you.",src:"Muslim 2186 — Sahih — Ruqyah for long or serious illness. Recite while passing hand over the ill person"},
  {cat:"🏥 Long Illness & Disease",ar:"رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ",en:"My Lord, adversity has touched me, and You are the Most Merciful of all who show mercy.",src:"Quran 21:83 — Dua of Prophet Ayyub (AS) when he was struck with severe illness for years. Allah responded and removed his affliction"},
  {cat:"🏥 Long Illness & Disease",ar:"لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",en:"There is no god but You — Glory be to You — Indeed I was among the wrongdoers.",src:"Quran 21:87 — Dua of Prophet Yunus (AS). The Prophet ﷺ said: No Muslim afflicted with distress supplicates with this except that Allah will relieve his distress. (Tirmidhi 3505 — Hasan)"},
  {cat:"🏥 Long Illness & Disease",ar:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",en:"Allah is sufficient for me. There is no god but He. Upon Him I rely, and He is the Lord of the Mighty Throne.",src:"Quran 9:129 — The Prophet ﷺ said whoever recites this morning and evening 7 times, Allah will be sufficient for him in his worries. (Abu Dawud 5081 — Sahih)"},

  // ── DEATHBED & FINAL MOMENTS ──
  {cat:"🕊️ Deathbed & Final Moments",ar:"لَا إِلَهَ إِلَّا اللَّهُ",en:"There is no god but Allah.",src:"Muslim 916 — Sahih — The Prophet ﷺ said: Prompt your dying ones to say La ilaha illa Allah. These should be the last words of a Muslim. Remind the dying person gently — do not repeat forcefully if they have already said it"},
  {cat:"🕊️ Deathbed & Final Moments",ar:"اللَّهُمَّ أَعِنِّي عَلَى غَمَرَاتِ الْمَوْتِ أَوْ سَكَرَاتِ الْمَوْتِ",en:"O Allah, help me through the agonies of death.",src:"Tirmidhi — Authenticated by Al-Albani — Aisha (RA) reported the Prophet ﷺ recited this in his final illness while dipping his hand in water and wiping his face"},
  {cat:"🕊️ Deathbed & Final Moments",ar:"اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَأَلْحِقْنِي بِالرَّفِيقِ الْأَعْلَى",en:"O Allah, forgive me, have mercy on me, and join me with the highest companions.",src:"Bukhari 4435, Muslim 2444 — Sahih — The final words of the Prophet ﷺ before his soul was taken. Al-Rafiq al-A'la refers to the Prophets and the righteous in the highest level of Paradise"},
  {cat:"🕊️ Deathbed & Final Moments",ar:"إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ",en:"Indeed we belong to Allah, and indeed to Him we will return.",src:"Quran 2:156 — Sahih — To be recited by those present when someone passes away, and by anyone who hears news of a death. Allah promises reward and mercy for those who say this"},

  // ── DUA FOR THE DECEASED ──
  {cat:"🤲 Dua for the Deceased",ar:"اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ",en:"O Allah, forgive him, have mercy on him, grant him well-being and pardon him. Honor his reception, widen his entrance, and wash him with water, snow and hail.",src:"Muslim 963 — Sahih — This is the most authentic dua recited by the Prophet ﷺ during Janazah prayer. For a female say: اغفر لها (forgive her) instead of له (forgive him)"},
  {cat:"🤲 Dua for the Deceased",ar:"اللَّهُمَّ اغْفِرْ لَهُ وَارْفَعْ دَرَجَتَهُ فِي الْمَهْدِيِّينَ، وَاخْلُفْهُ فِي عَقِبِهِ فِي الْغَابِرِينَ، وَاغْفِرْ لَنَا وَلَهُ يَا رَبَّ الْعَالَمِينَ، وَافْسَحْ لَهُ فِي قَبْرِهِ وَنَوِّرْ لَهُ فِيهِ",en:"O Allah, forgive him and raise his rank among the rightly guided. Grant him a righteous successor among those he leaves behind. Forgive us and him, O Lord of the worlds. Make his grave spacious and illuminate it for him.",src:"Muslim 920 — Sahih — The Prophet ﷺ made this dua when Abu Salama (RA) passed away"},
  {cat:"🤲 Dua for the Deceased",ar:"اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا، وَذَكَرِنَا وَأُنْثَانَا",en:"O Allah, forgive our living and our dead, those present and those absent, our young and our old, our males and our females.",src:"Tirmidhi 1024, Ibn Majah 1498 — Sahih — A comprehensive dua covering all Muslims, living and dead. Recited at Janazah prayer"},
];

// ─── TASBIH OPTIONS ───────────────────────────────────────────
const TASBIH_OPTS=[
  {ar:"سُبْحَانَ اللَّهِ",en:"SubhanAllah",t:33},
  {ar:"الْحَمْدُ لِلَّهِ",en:"Alhamdulillah",t:33},
  {ar:"اللَّهُ أَكْبَرُ",en:"AllahuAkbar",t:34},
  {ar:"لَا إِلَهَ إِلَّا اللَّهُ",en:"La ilaha illallah",t:100},
  {ar:"أَسْتَغْفِرُ اللَّهَ",en:"AstaghfirAllah",t:100},
];

// ─── VERSE OF THE DAY — 30 curated verses, rotates daily ────
const VOTD_VERSES = [
  {surahNum:2,verseNum:255,surahName:"Al-Baqarah",ar:"ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ",en:"Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence."},
  {surahNum:2,verseNum:286,surahName:"Al-Baqarah",ar:"لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",en:"Allah does not burden a soul beyond that it can bear."},
  {surahNum:3,verseNum:173,surahName:"Ali Imran",ar:"حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",en:"Sufficient for us is Allah, and He is the best Disposer of affairs."},
  {surahNum:94,verseNum:5,surahName:"Ash-Sharh",ar:"فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",en:"For indeed, with hardship will be ease."},
  {surahNum:13,verseNum:28,surahName:"Ar-Rad",ar:"أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",en:"Verily, in the remembrance of Allah do hearts find rest."},
  {surahNum:65,verseNum:3,surahName:"At-Talaq",ar:"وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ",en:"And whoever relies upon Allah — then He is sufficient for him."},
  {surahNum:2,verseNum:152,surahName:"Al-Baqarah",ar:"فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ",en:"So remember Me; I will remember you. And be grateful to Me and do not deny Me."},
  {surahNum:39,verseNum:53,surahName:"Az-Zumar",ar:"لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا",en:"Do not despair of the mercy of Allah. Indeed, Allah forgives all sins."},
  {surahNum:9,verseNum:51,surahName:"At-Tawbah",ar:"قُل لَّن يُصِيبَنَآ إِلَّا مَا كَتَبَ ٱللَّهُ لَنَا هُوَ مَوْلَىٰنَا",en:"Say, Never will we be struck except by what Allah has decreed for us; He is our protector."},
  {surahNum:14,verseNum:7,surahName:"Ibrahim",ar:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",en:"If you are grateful, I will surely increase you in favor."},
  {surahNum:2,verseNum:45,surahName:"Al-Baqarah",ar:"وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ",en:"Seek help through patience and prayer."},
  {surahNum:49,verseNum:13,surahName:"Al-Hujurat",ar:"إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ",en:"Indeed, the most noble of you in the sight of Allah is the most righteous."},
  {surahNum:16,verseNum:97,surahName:"An-Nahl",ar:"مَنْ عَمِلَ صَـٰلِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُۥ حَيَوٰةً طَيِّبَةً",en:"Whoever does righteousness, whether male or female, while a believer — We will surely cause him to live a good life."},
  {surahNum:55,verseNum:13,surahName:"Ar-Rahman",ar:"فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ",en:"So which of the favors of your Lord would you deny?"},
  {surahNum:3,verseNum:139,surahName:"Ali Imran",ar:"وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",en:"Do not weaken and do not grieve, and you will be superior if you are truly believers."},
  {surahNum:20,verseNum:114,surahName:"Ta-Ha",ar:"وَقُل رَّبِّ زِدْنِى عِلْمًا",en:"And say: My Lord, increase me in knowledge."},
  {surahNum:17,verseNum:44,surahName:"Al-Isra",ar:"وَإِن مِّن شَىْءٍ إِلَّا يُسَبِّحُ بِحَمْدِهِۦ وَلَـٰكِن لَّا تَفْقَهُونَ تَسْبِيحَهُمْ",en:"There is not a thing except that it exalts Allah by His praise, but you do not understand their exaltation."},
  {surahNum:57,verseNum:4,surahName:"Al-Hadid",ar:"وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",en:"And He is with you wherever you are."},
  {surahNum:2,verseNum:186,surahName:"Al-Baqarah",ar:"وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ",en:"And when My servants ask you concerning Me — indeed I am near. I respond to the invocation of the supplicant when he calls upon Me."},
  {surahNum:93,verseNum:5,surahName:"Ad-Duha",ar:"وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",en:"And your Lord is going to give you, and you will be satisfied."},
  {surahNum:18,verseNum:10,surahName:"Al-Kahf",ar:"رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",en:"Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance."},
  {surahNum:7,verseNum:23,surahName:"Al-Araf",ar:"رَبَّنَا ظَلَمْنَآ أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ ٱلْخَـٰسِرِينَ",en:"Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers."},
  {surahNum:3,verseNum:8,surahName:"Ali Imran",ar:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً",en:"Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy."},
  {surahNum:25,verseNum:74,surahName:"Al-Furqan",ar:"رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّـٰتِنَا قُرَّةَ أَعْيُنٍ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",en:"Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous."},
  {surahNum:67,verseNum:1,surahName:"Al-Mulk",ar:"تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",en:"Blessed is He in whose hand is dominion, and He is over all things competent."},
  {surahNum:112,verseNum:1,surahName:"Al-Ikhlas",ar:"قُلْ هُوَ ٱللَّهُ أَحَدٌ",en:"Say, He is Allah, the One."},
  {surahNum:24,verseNum:35,surahName:"An-Nur",ar:"ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ",en:"Allah is the Light of the heavens and the earth."},
  {surahNum:59,verseNum:22,surahName:"Al-Hashr",ar:"هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ۖ عَـٰلِمُ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ",en:"He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed."},
  {surahNum:41,verseNum:30,surahName:"Fussilat",ar:"إِنَّ ٱلَّذِينَ قَالُوا۟ رَبُّنَا ٱللَّهُ ثُمَّ ٱسْتَقَـٰمُوا۟ تَتَنَزَّلُ عَلَيْهِمُ ٱلْمَلَـٰٓئِكَةُ",en:"Indeed, those who have said Our Lord is Allah, and then remained steadfast — the angels will descend upon them."},
  {surahNum:76,verseNum:9,surahName:"Al-Insan",ar:"إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ ٱللَّهِ لَا نُرِيدُ مِنكُمْ جَزَآءً وَلَا شُكُورًا",en:"We feed you only for the countenance of Allah. We wish not from you reward or gratitude."},
];

// ─── MAIN APP ────────────────────────────────────────────────
export default function QuranLife() {
  const [screen, setScreen] = useState("home"); // home | read | kids | bookmarks | mushaf | prayer | adhkar | duas | names | tasbih | hifz | extraknowledge | dream | offline
  const [votd, setVotd] = useState(null);
  const [votdLoading, setVotdLoading] = useState(false);
  // Hifz Tracker
  const [hifzData, setHifzData] = useState(() => { try { return JSON.parse(localStorage.getItem("ql_hifz") || "{}"); } catch { return {}; } });
  // Extra Knowledge / Dream Interpretation
  const [dreamInput, setDreamInput] = useState("");
  const [dreamResult, setDreamResult] = useState(null);
  const [dreamLoading, setDreamLoading] = useState(false);
  const [dreamError, setDreamError] = useState(null);
  // Tajweed colors toggle
  const [tajweedColors, setTajweedColors] = useState(() => { try { return localStorage.getItem("ql_tajweed") === "on"; } catch { return false; } });
  // Offline mode
  const [offlineMode, setOfflineMode] = useState(() => { try { return localStorage.getItem("ql_offline") === "on"; } catch { return false; } });
  const [offlineSurahs, setOfflineSurahs] = useState(() => { try { return JSON.parse(localStorage.getItem("ql_offline_surahs") || "[]"); } catch { return []; } });
  const [offlineDownloading, setOfflineDownloading] = useState(false);
  // Mistakes Corrector
  const [showMistakes, setShowMistakes] = useState(false);
  const [mistakesVerseNum, setMistakesVerseNum] = useState(null);
  const [mistakesRecording, setMistakesRecording] = useState(false);
  const [mistakesResult, setMistakesResult] = useState(null);
  const [mistakesLoading, setMistakesLoading] = useState(false);
  const [mistakesError, setMistakesError] = useState(null);
  const mistakesRecorderRef = useRef(null);
  const mistakesChunksRef = useRef([]);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [adhkarTab, setAdhkarTab] = useState("morning");
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);
  const [tasbihLabel, setTasbihLabel] = useState("سُبْحَانَ اللَّهِ");
  const [duaCategory, setDuaCategory] = useState("all");
  const [namesSearch, setNamesSearch] = useState("");
  const [khatamVerses, setKhatamVerses] = useState(() => { try { return parseInt(localStorage.getItem("ql_khatam") || "0"); } catch { return 0; } });
  const [mushafMode, setMushafMode] = useState(false);
  const [surahNum, setSurahNum] = useState(null);
  const [juzMarker, setJuzMarker] = useState(null); // { juzNum, verseNum } — persists until dismissed or navigated away
  const pendingScrollVerseRef = useRef(null);
  const [continueDialog, setContinueDialog] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(24); // Arabic font size
  const [lang, setLang] = useState("en");
  const [qari, setQari] = useState("ar.alafasy");
  const [verses, setVerses] = useState([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
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
  // Mushaf Reader — real page-by-page book view, 604 authentic pages
  const [mushafPage, setMushafPage] = useState(1);
  const [mushafData, setMushafData] = useState(null);
  const [mushafLoading, setMushafLoading] = useState(false);
  const [mushafQuickLink, setMushafQuickLink] = useState(null);
  const [mushafQuickLinkSurah, setMushafQuickLinkSurah] = useState(null); // surah number to isolate on the page
  const [mushafHighlightVerse, setMushafHighlightVerse] = useState(null); // specific verse number to highlight (e.g. Ayatul Kursi)
  const [mushafTranslations, setMushafTranslations] = useState({});
  const [mushafTransLoading, setMushafTransLoading] = useState(false);
  const [mushafSearch, setMushafSearch] = useState("");
  const [mushafSearchType, setMushafSearchType] = useState("surah");
  const [mushafSearchResults, setMushafSearchResults] = useState([]);
  const [showMushafBookmarks, setShowMushafBookmarks] = useState(false);
  const [showMushafStyleSelect, setShowMushafStyleSelect] = useState(false); // choose Amiri vs Mushaf style
  const [mushafFontStyle, setMushafFontStyle] = useState(() => {
    try { return localStorage.getItem("ql_mushaf_font_style") || "amiri"; } catch { return "amiri"; }
  }); // "amiri" (new, bigger, comfortable) | "classic" (original, denser)
  // Amiri Style — custom 10-line-per-page pagination, one surah at a time (never mixes surahs on a page)
  const [amiriPages, setAmiriPages] = useState([]); // [{surah, verses:[{number,arabic}]}]
  const [amiriPageIndex, setAmiriPageIndex] = useState(0);
  const [amiriSurahNum, setAmiriSurahNum] = useState(1);
  const [amiriLoading, setAmiriLoading] = useState(false);
  const [amiriError, setAmiriError] = useState(null);
  const amiriMeasureRef = useRef(null);
  const [mushafError, setMushafError] = useState(null);
  const [mushafDragX, setMushafDragX] = useState(0);
  const [mushafAnimating, setMushafAnimating] = useState(false);
  const mushafDragStartRef = useRef(null);
  const mushafCacheRef = useRef({});
  const [audioLang, setAudioLang] = useState("en");
  const [audioLangCountry, setAudioLangCountry] = useState("all");
  const [audioLangSearch, setAudioLangSearch] = useState("");
  const [audioSurah, setAudioSurah] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentVerse, setAudioCurrentVerse] = useState(0);
  const [audioNoVoice, setAudioNoVoice] = useState(false);
  const audioStopRef = useRef(false);
  const meaningAudioElRef = useRef(null);
  // ── Bilingual audio (Arabic + Translation together) ──
  const [bilingualPlaying, setBilingualPlaying] = useState(null); // null | "ur" | "en"
  const [bilingualSurah, setBilingualSurah] = useState(null);
  const [bilingualPaused, setBilingualPaused] = useState(false);
  const [bilingualVerse, setBilingualVerse] = useState(0);
  const bilingualStopRef = useRef(false);
  const bilingualPauseRef = useRef(false);
  const bilingualAudioRef = useRef(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [kidLetter, setKidLetter] = useState(null);
  const [kidsAudioPlaying, setKidsAudioPlaying] = useState(false);
  const [kidsAudioCurrent, setKidsAudioCurrent] = useState(null);
  const kidsAudioStopRef = useRef(false);
  const [learned, setLearned] = useState([]);
  const [kidsTab, setKidsTab] = useState("letters"); // "letters" | "vowels" | "prophets"
  const [selectedProphet, setSelectedProphet] = useState(null); // index into PROPHETS
  const [prophetStoryPage, setProphetStoryPage] = useState(0);
  const [prophetStoryCache, setProphetStoryCache] = useState({}); // key: "index-lang" → {loading,error,pages:[]}
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContext, setReportContext] = useState("");
  const [vowelPlaying, setVowelPlaying] = useState(null); // key string
  const [langSearch, setLangSearch] = useState("");
  const [langCountry, setLangCountry] = useState("all");
  const [gotoPage, setGotoPage] = useState("");
  const audioRef = useRef(null);
  const audioFinishTimerRef = useRef(null);
  const [showQuranSplash, setShowQuranSplash] = useState(false);
  const [showQuranNav, setShowQuranNav] = useState(false);
  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false); // dedicated surah list screen
  const [surahListTitle, setSurahListTitle] = useState("All 114 Surahs");
  const [scrollToSurahNum, setScrollToSurahNum] = useState(null); // scroll+highlight target when opened from search
  const [audioPaused, setAudioPaused] = useState(false);
  const cameFromQuranNav = useRef(false);

  // Preload speech voices on startup — critical for Android/iOS
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Verse of the Day — rotates daily, picked by day-of-year mod total verses
  useEffect(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const idx = dayOfYear % VOTD_VERSES.length;
    setVotd(VOTD_VERSES[idx]);
  }, []);

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
    if (audioFinishTimerRef.current) {
      clearTimeout(audioFinishTimerRef.current);
      audioFinishTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayKey(null);
    setAudioPaused(false);
    setContinueDialog(null);
  }, []);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    // IMPORTANT: pausing must cancel the end-safety timer.
    // Otherwise the old timer can call handleFinished() while the user is paused.
    if (audioFinishTimerRef.current) {
      clearTimeout(audioFinishTimerRef.current);
      audioFinishTimerRef.current = null;
    }

    audio.pause();
    setAudioPaused(true);
  }, []);

  const resumeAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;

    // Resume ONLY because the user clicked Resume.
    audio.play().then(() => {
      setAudioPaused(false);
    }).catch(() => {});
  }, []);

  // mode: "single" = play one verse only (inside reader)
  //       "surah"  = play full surah continuously (from home list)
  const playVerse = useCallback((sn, vn, mode = "single", allVerses = null) => {
    stopAudio();
    setAudioPaused(false);
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

      // Clear any safety timer belonging to an older audio element.
      if (audioFinishTimerRef.current) {
        clearTimeout(audioFinishTimerRef.current);
        audioFinishTimerRef.current = null;
      }

      // Native "ended" is the primary and safest completion signal.
      audio.addEventListener("ended", () => {
        if (audioRef.current === audio) {
          if (audioFinishTimerRef.current) {
            clearTimeout(audioFinishTimerRef.current);
            audioFinishTimerRef.current = null;
          }
          handleFinished();
        }
      });

      // Safety net only when audio is actually PLAYING and genuinely near the end.
      // This timer is cancelled immediately when Pause is pressed.
      audio.addEventListener("timeupdate", () => {
        if (
          audio.paused ||
          audio.ended ||
          !audio.duration ||
          !isFinite(audio.duration) ||
          audio.currentTime < audio.duration - 0.15
        ) {
          return;
        }

        if (audioFinishTimerRef.current) {
          clearTimeout(audioFinishTimerRef.current);
        }

        audioFinishTimerRef.current = setTimeout(() => {
          audioFinishTimerRef.current = null;

          // Never finish a paused audio element.
          if (
            audioRef.current === audio &&
            !audio.paused &&
            !audio.ended &&
            audio.duration &&
            isFinite(audio.duration) &&
            audio.currentTime >= audio.duration - 0.05
          ) {
            handleFinished();
          }
        }, 200);
      });

      // PAUSE = stay paused. Never advance to the next verse.
      audio.addEventListener("pause", () => {
        if (audioFinishTimerRef.current) {
          clearTimeout(audioFinishTimerRef.current);
          audioFinishTimerRef.current = null;
        }
      });

      audio.addEventListener("error", () => {
        if (audioFinishTimerRef.current) {
          clearTimeout(audioFinishTimerRef.current);
          audioFinishTimerRef.current = null;
        }

        if (audioRef.current !== audio) return;

        if (fallbacks.length > 0) {
          tryUrl(fallbacks[0], fallbacks.slice(1));
        } else {
          audioRef.current = null;
          setPlayKey(null);
          setAudioPaused(false);
        }
      });

      // This play() happens only when playVerse/tryUrl was explicitly started.
      audio.play().catch(() => {
        if (audioFinishTimerRef.current) {
          clearTimeout(audioFinishTimerRef.current);
          audioFinishTimerRef.current = null;
        }

        if (audioRef.current !== audio) return;

        if (fallbacks.length > 0) {
          tryUrl(fallbacks[0], fallbacks.slice(1));
        } else {
          audioRef.current = null;
          setPlayKey(null);
          setAudioPaused(false);
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
  const openSurah = useCallback(async (n, autoPlay = false, targetVerse = null, juzNum = null) => {
    stopAudio();
    setSurahNum(n);
    setScreen("read");
    setNavTab("home");
    setOpenPanel(null);
    setVerses([]);
    setVersesLoading(true);
    setVersesError(null);
    window.scrollTo(0, 0);
    pendingScrollVerseRef.current = targetVerse;
    // Set the persistent Juz marker, or clear it if this navigation isn't from a Juz tap
    setJuzMarker(juzNum ? { juzNum, verseNum: targetVerse } : null);
    try {
      const onAIReady = (updated) => setVerses([...updated]);
      const v = await fetchVerses(n, lang, onAIReady);
      setVerses(v);
      setLastRead({ surahN: n, surahName: SURAHS.find(s => s.n === n)?.name || "", verse: targetVerse || 1 });
      if (autoPlay && v.length > 0) {
        setTimeout(() => playVerse(n, 1, "surah", v), 500);
      }
      // Scroll to the requested verse (e.g. Juz start) once rendered
      if (targetVerse) {
        setTimeout(() => {
          const el = document.getElementById(`verse-${targetVerse}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          pendingScrollVerseRef.current = null;
        }, 300);
      }
    } catch (e) {
      setVersesError("Could not load verses. Please check your connection and tap Retry.");
    } finally {
      setVersesLoading(false);
    }
  }, [lang, stopAudio]);

  // ── MUSHAF READER — authentic page-by-page book, real Quran.com text ──
  const fetchMushafPage = useCallback(async (pageNum) => {
    if (mushafCacheRef.current[pageNum]) {
      setMushafData(mushafCacheRef.current[pageNum]);
      return;
    }
    setMushafLoading(true);
    setMushafError(null);
    try {
      const url = `https://api.quran.com/api/v4/verses/by_page/${pageNum}?language=en&words=false&per_page=50&fields=text_uthmani&_cb=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const d = await r.json();
      const verses = (d.verses || []).map(v => ({
        number: v.verse_number,
        chapter: v.verse_key.split(":")[0],
        arabic: v.text_uthmani,
      }));
      const firstChapter = verses.length ? parseInt(verses[0].chapter) : 1;
      const firstVerseNum = verses.length ? verses[0].number : 1;
      const surahInfo = SURAHS.find(s => s.n === firstChapter);
      const globalPos = (SURAH_VERSE_STARTS[firstChapter] || 0) + firstVerseNum - 1;
      let juzNum = 1;
      for (let j = 1; j <= 30; j++) {
        const js = JUZ_STARTS[j];
        const jsPos = (SURAH_VERSE_STARTS[js.surah] || 0) + js.verse - 1;
        if (jsPos <= globalPos) juzNum = j; else break;
      }
      const pageData = { pageNum, verses, surahName: surahInfo?.name || "", surahAr: surahInfo?.ar || "", juzNum };
      mushafCacheRef.current[pageNum] = pageData;
      setMushafData(pageData);
    } catch (e) {
      setMushafError("Could not load this page. Check your connection and try again.");
    } finally {
      setMushafLoading(false);
    }
  }, []);

  const fetchMushafTranslations = useCallback(async (pageNum) => {
    setMushafTransLoading(true);
    try {
      const url = `https://api.quran.com/api/v4/verses/by_page/${pageNum}?language=en&words=false&per_page=50&translations=131&fields=text_uthmani&_cb=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      const map = {};
      (d.verses || []).forEach(v => {
        const key = v.verse_key; // e.g. "2:255"
        const t = v.translations?.[0]?.text || "";
        // Strip footnote markers like "1" at end
        map[key] = t.replace(/<[^>]+>/g, "").replace(/\d+$/, "").trim();
      });
      setMushafTranslations(map);
    } catch {
      setMushafTranslations({});
    } finally {
      setMushafTransLoading(false);
    }
  }, []);

  // ── PROPHET STORY — short, cached, AI-generated, disclosed ───
  const loadProphetStory = useCallback(async (idx, forceRetry = false) => {
    const prophet = PROPHETS[idx];
    const cacheKey = `${idx}-${lang}`;
    if (!forceRetry && prophetStoryCache[cacheKey]?.pages) return;
    setProphetStoryCache(p => ({ ...p, [cacheKey]: { loading: true, error: null, pages: null } }));
    try {
      const pages = await fetchProphetStory(prophet, curLang.n);
      setProphetStoryCache(p => ({ ...p, [cacheKey]: { loading: false, error: null, pages } }));
    } catch (e) {
      const msg = e.message === "NO_KEY" ? "AI key not configured." : "Could not load the story. Please check your connection.";
      setProphetStoryCache(p => ({ ...p, [cacheKey]: { loading: false, error: msg, pages: null } }));
    }
  }, [lang, curLang, prophetStoryCache]);

  const submitReport = useCallback((context) => {
    // No backend yet — logs locally and confirms to the user.
    // Swap this for a real endpoint (e.g. a Google Form or Firestore write) when available.
    try {
      const existing = JSON.parse(localStorage.getItem("ql_ai_reports") || "[]");
      existing.push({ context, date: new Date().toISOString() });
      localStorage.setItem("ql_ai_reports", JSON.stringify(existing.slice(-50)));
    } catch {}
    alert("Thank you. This content has been flagged for review.");
    setShowReportModal(false);
  }, []);

  // ── AMIRI STYLE PAGINATION — measures real rendered height so each
  // page holds exactly ~10 lines. Never splits a verse across pages,
  // never mixes two surahs on one page. ──────────────────────────
  const AMIRI_FONT_SIZE = 27;
  const AMIRI_LINE_HEIGHT_MULT = 2.5;
  const AMIRI_LINES_PER_PAGE = 10;

  const paginateAmiri = useCallback(async (surahNum, anchorVerse = null, landOnLastPage = false) => {
    setAmiriLoading(true);
    setAmiriError(null);
    try {
      const verses = await fetchSurahArabicOnly(surahNum);
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch {}
      const measureEl = amiriMeasureRef.current;
      const contentWidth = Math.min(window.innerWidth, 520) - 88;
      if (measureEl) measureEl.style.width = contentWidth + "px";
      const targetHeight = AMIRI_LINES_PER_PAGE * (AMIRI_FONT_SIZE * AMIRI_LINE_HEIGHT_MULT);
      const pages = [];
      let current = [];
      for (let i = 0; i < verses.length; i++) {
        const tentative = [...current, verses[i]];
        if (measureEl) {
          measureEl.textContent = tentative.map(v => `${v.arabic} \u06DD${v.number}\u06DE `).join(" ");
          const h = measureEl.scrollHeight;
          if (h > targetHeight && current.length > 0) {
            pages.push({ surah: surahNum, verses: current });
            current = [verses[i]];
            continue;
          }
        }
        current = tentative;
      }
      if (current.length) pages.push({ surah: surahNum, verses: current });
      if (pages.length === 0) pages.push({ surah: surahNum, verses: [] });
      setAmiriPages(pages);
      setAmiriSurahNum(surahNum);
      let idx = 0;
      if (landOnLastPage) idx = pages.length - 1;
      else if (anchorVerse) {
        const found = pages.findIndex(p => p.verses.some(v => v.number === anchorVerse));
        if (found >= 0) idx = found;
      }
      setAmiriPageIndex(idx);
    } catch (e) {
      setAmiriError("Could not load this Surah. Please check your connection.");
    } finally {
      setAmiriLoading(false);
    }
  }, []);

  const openAmiriReader = useCallback((surahNum = 1, anchorVerse = null) => {
    setScreen("mushaf");
    setNavTab("home");
    paginateAmiri(surahNum, anchorVerse);
  }, [paginateAmiri]);

  const openMushafReader = useCallback((startPage = null) => {
    const p = startPage || 1; // Always start page 1 unless explicitly given a page
    setMushafPage(p);
    setScreen("mushaf");
    setNavTab("home");
    fetchMushafPage(p);
  }, [fetchMushafPage]);

  const mushafGoToPage = useCallback((newPage) => {
    if (newPage < 1 || newPage > 604 || mushafAnimating) return;
    setMushafAnimating(true);
    setMushafPage(newPage);
    fetchMushafPage(newPage);
    setTimeout(() => { setMushafAnimating(false); setMushafDragX(0); }, 280);
  }, [mushafAnimating, fetchMushafPage]);

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

  // ── CONTENT — Gemini AI + free APIs ──────────────────────────

  const loadTabContent = useCallback(async (verse, tab, force = false) => {
    const key = `${surahNum}-${verse.number}-${tab}-${lang}`;
    if (cache[key]?.text && !force) return;
    setCache(p => ({ ...p, [key]: { loading: true, error: null, text: null } }));

    const sn = curSurah?.name || "";
    const langName = curLang?.n || "English";
    const geminiKey = import.meta.env?.VITE_GEMINI_KEY || "";

    try {
      if (tab === "tafsir") {
        const r = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNum}:${verse.number}`);
        if (!r.ok) throw new Error("failed");
        const d = await r.json();
        const raw = (d.tafsir?.text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (!raw) throw new Error("empty");
        if (lang === "en" || !geminiKey) {
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: "📖 Ibn Kathir Tafsir\n\n" + raw } }));
        } else {
          const ck = `tafsir-${surahNum}-${verse.number}-${lang}`;
          const translated = await askAI(`Translate this Quran tafsir into ${langName}. Keep Islamic terms like Allah, Prophet, Quran unchanged. Tafsir: "${raw.substring(0, 800)}"`, langName, 3, ck);
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: `📖 Ibn Kathir Tafsir · ${langName}\n\n${translated}` } }));
        }
      }

      else if (tab === "revelation") {
        const surahR = await fetch(`https://api.quran.com/api/v4/chapters/${surahNum}?language=en`);
        if (!surahR.ok) throw new Error("failed");
        const ch = (await surahR.json()).chapter;
        const revEn = `Surah ${ch.name_simple} (${ch.translated_name?.name || ""}) is a ${ch.revelation_place === "makkah" ? "Meccan" : "Medinan"} surah revealed ${ch.revelation_order}th in order. It contains ${ch.verses_count} verses. ${ch.revelation_place === "makkah" ? "Meccan surahs focus on faith, the afterlife, and prophets stories." : "Medinan surahs address community law, social issues, and guidance."} This is verse ${verse.number} of ${ch.verses_count}.`;
        if (lang === "en" || !geminiKey) {
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: "📍 Revelation Information\n\n" + revEn } }));
        } else {
          const ck = `revelation-${surahNum}-${verse.number}-${lang}`;
          const translated = await askAI(`Translate this Quran revelation information into ${langName}: "${revEn}"`, langName, 3, ck);
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: `📍 Revelation Information · ${langName}\n\n${translated}` } }));
        }
      }

      else if (tab === "hadith") {
        if (geminiKey) {
          const ck = `hadith-${surahNum}-${verse.number}-${lang}`;
          const text = await askAI(`Share 2-3 authentic hadiths related to Surah ${sn} verse ${verse.number}: "${verse.translation}". For each: hadith text, source, grade (Sahih/Hasan/Daif), grader. Also warn about fabricated hadiths.`, langName, 3, ck);
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: `📋 Hadith · ${langName}\n\n${text}` } }));
        } else {
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: `📋 Authentic Hadiths\n\n✅ SAHIH — Bukhari\nThe Prophet ﷺ said: "The best of you are those who learn the Quran and teach it."\nSource: Sahih al-Bukhari, Book 66, Hadith 49\n\n✅ SAHIH — Tirmidhi\nThe Prophet ﷺ said: "Whoever recites a letter from the Quran will receive a good deed multiplied by ten."\nSource: Jami at-Tirmidhi, Hadith 2910\n\n⚠️ WARNING: Always verify hadiths before sharing. Millions of fabricated hadiths circulate on social media daily.` } }));
        }
      }

      else if (tab === "science") {
        if (geminiKey) {
          const ck = `science-${surahNum}-${verse.number}-${lang}`;
          const text = await askAI(`Explain any scientific connection for Surah ${sn} verse ${verse.number}: "${verse.translation}". Be completely honest. Label as: Confirmed by science / Claimed but debated / Speculative / No scientific connection. Never make false claims about the Quran.`, langName, 3, ck);
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: `🔬 Science · ${langName}\n\n${text}` } }));
        } else {
          setCache(p => ({ ...p, [key]: { loading: false, error: null, text: "🔬 Scientific Connections\n\nAdd VITE_GEMINI_KEY to Vercel to unlock this feature." } }));
        }
      }

      else if (tab === "translation") {
        setCache(p => ({ ...p, [key]: { loading: false, error: null, text: verse.translation || "" } }));
      }

    } catch(e) {
      const rawMsg = e.message || "Could not load.";
      const friendlyMsg = rawMsg === "RATE_LIMIT"
        ? "Too many requests — please wait a moment and tap Retry."
        : rawMsg === "NO_KEY"
        ? "AI key not configured. Add VITE_GEMINI_KEY in Vercel settings."
        : rawMsg.includes("not available")
        ? "AI model unavailable — tap Retry to try another model."
        : rawMsg + " — Tap Retry.";
      setCache(p => ({ ...p, [key]: { loading: false, error: friendlyMsg, text: null } }));
    }
  }, [surahNum, curSurah, lang, curLang, cache]);

  const openDeepPanel = useCallback((verse) => {
    if (openPanel === verse.number) { setOpenPanel(null); return; }
    setOpenPanel(verse.number);
    setActiveTab("tafsir");
  }, [openPanel]);

  const switchTab = useCallback((verse, tab) => {
    setActiveTab(tab);
    loadTabContent(verse, tab);
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
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Inter:wght@300;400;500;600&display=swap');
    @font-face{font-family:'Amiri';font-display:swap}
    @font-face{font-family:'Amiri Quran';font-display:swap}
    *{box-sizing:border-box;margin:0;padding:0;max-width:100%}
    html,body{overflow-x:hidden;width:100%;-webkit-text-size-adjust:100%}
    body{font-family:'Inter',sans-serif;background:${darkMode ? "#0f0f0f" : "#f5f3ee"};color:${darkMode ? "#e8e8e8" : "#1a1a1a"}}
    .ar{font-family:'Amiri',serif!important;word-break:break-word;overflow-wrap:anywhere;white-space:normal}
    ::-webkit-scrollbar{width:0;height:0}
    .dark-card{background:${darkMode ? "#1a1a1a" : "#fff"};border-color:${darkMode ? "#2a2a2a" : "#e2e8e4"}}
    .dark-text{color:${darkMode ? "#e8e8e8" : "#1a1a1a"}}
    .mushaf-wrap{background:#fdf6e3;border-radius:8px;padding:20px 16px;margin:10px 0;position:relative;box-shadow:0 2px 20px rgba(139,105,20,.15),inset 0 0 60px rgba(139,105,20,.04)}
    .mushaf-wrap::before{content:'';position:absolute;inset:6px;border:1.5px solid rgba(139,105,20,.25);border-radius:4px;pointer-events:none}
    .mushaf-wrap::after{content:'';position:absolute;inset:10px;border:.5px solid rgba(139,105,20,.1);border-radius:2px;pointer-events:none}
    .mushaf-text{font-family:'Amiri Quran','Amiri',serif;font-size:29px;line-height:2.65;direction:rtl;text-align:justify;text-align-last:right;color:#1a0500;word-spacing:2px;width:100%;display:block}
    .mushaf-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#8b6914,#c9943a);color:#fff;font-size:10px;font-weight:700;margin:0 3px;vertical-align:middle;flex-shrink:0;font-family:'Inter',sans-serif;line-height:1}
    .zoom-arabic{touch-action:pan-y pinch-zoom;display:block;width:100%;word-break:break-word;overflow-wrap:anywhere;white-space:normal}
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
    .vowel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
    .vowel-btn{background:#fff;border:1.5px solid #e2e8e4;border-radius:12px;padding:12px 6px;cursor:pointer;text-align:center;transition:all .15s;position:relative;box-shadow:0 2px 0 #ddd}
    .vowel-btn:hover{border-color:#e67e22;background:#fff9f0;transform:scale(1.03)}
    .vowel-btn.vplaying{border-color:#e67e22;background:#fff3cd;box-shadow:0 2px 0 #c9943a}
    .vowel-arabic{font-family:'Amiri',serif;font-size:38px;color:#1a0800;line-height:1.4;display:block}
    .vowel-name{font-size:10px;font-weight:700;color:#e67e22;margin-top:3px;display:block}
    .vowel-sound{font-size:10px;color:#9ba5b0;display:block;margin-top:1px}
    .vowel-play-dot{position:absolute;top:6px;right:6px;width:16px;height:16px;background:#e67e22;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:6px;color:#fff}
    .vplaying .vowel-play-dot{background:#c9943a}
    .prac-word-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px}
    .prac-word-btn{background:#fff;border:1px solid #e2e8e4;border-radius:10px;padding:10px;text-align:center;cursor:pointer;transition:all .15s;box-shadow:0 2px 0 #ddd}
    .prac-word-btn:hover{border-color:#e67e22;background:#fff9f0}
    .prac-word-btn.vplaying{border-color:#e67e22;background:#fff3cd}
    .vowel-section-box{background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:.5px solid #e2e8e4;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .vowel-section-head{font-size:13px;font-weight:700;color:#e67e22;margin-bottom:10px;display:flex;align-items:center;gap:7px}
    .vowel-num-badge{width:21px;height:21px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;font-family:'Amiri',serif}
    /* GOLD BORDER NAV BUTTONS — Home & Quran page */
    .nav-btn{position:relative;width:100%;padding:22px 10px;border:none;border-radius:14px;font-size:16px;font-weight:800;color:#fff;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:.3px;line-height:1.4;text-align:center;white-space:pre-line;transition:all .13s;overflow:hidden}
    .nav-btn::before{content:'';position:absolute;inset:0;border-radius:14px;border:2.5px solid transparent;background:linear-gradient(180deg,rgba(255,215,100,.7),rgba(180,130,30,.5),rgba(255,215,100,.3)) border-box;-webkit-mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0);-webkit-mask-composite:destination-out;mask-composite:exclude;pointer-events:none}
    .nav-btn::after{content:'';position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,.18),transparent);border-radius:14px 14px 50% 50%;pointer-events:none}
    .nav-btn:active{transform:translateY(3px)}
    .nav-btn-quran{width:100%;padding:24px 10px;border:none;border-radius:16px;font-size:22px;font-weight:900;color:#fff;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:3px;transition:all .13s;position:relative;overflow:hidden}
    .nav-btn-quran::before{content:'';position:absolute;inset:0;border-radius:16px;border:3px solid transparent;background:linear-gradient(180deg,rgba(255,215,100,.8),rgba(180,130,30,.4),rgba(255,215,100,.3)) border-box;-webkit-mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0);-webkit-mask-composite:destination-out;mask-composite:exclude;pointer-events:none}
    .nav-btn-quran::after{content:'';position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,.2),transparent);border-radius:16px 16px 50% 50%;pointer-events:none}
    .nav-btn-quran:active{transform:translateY(4px)}
    /* SCROLL BUTTONS */
    .scroll-fab{position:fixed;right:14px;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;z-index:500;box-shadow:0 3px 12px rgba(0,0,0,.25);transition:all .15s}
    .scroll-fab:active{transform:scale(.9)}
    /* SURAH SPLASH */
    .splash-fade{animation:fade .4s ease}
    /* AUDIO CONTROLS — pause/stop bar */
    .audio-bar{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:490px;background:linear-gradient(135deg,#051a0e,#0f5132);border-radius:16px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,.35);z-index:400;animation:pop .2s ease}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
  `;

  // ── TAJWEED COLOR HELPER ─────────────────────────────────────
  // Applies color spans to Arabic letters based on basic tajweed rules.
  // Colors: Red=Qalqalah, Green=Ghunnah, Blue=Madd elongation, Purple=Idgham
  function applyTajweedColors(text) {
    if (!tajweedColors || !text) return <span>{text}</span>;
    const SHADDA = "\u0651";
    const result = [];
    let i = 0;
    const chars = [...text];
    while (i < chars.length) {
      const ch = chars[i];
      const next = chars[i + 1] || "";
      // Ghunnah — nun or mim with shadda
      if ((ch === "ن" || ch === "م") && next === SHADDA) {
        result.push(<span key={i} style={{ color: "#27ae60", fontWeight: 700 }}>{ch}{next}</span>);
        i += 2; continue;
      }
      // Qalqalah letters
      if ("قطبجد".includes(ch)) {
        result.push(<span key={i} style={{ color: "#c0392b" }}>{ch}</span>);
        i++; continue;
      }
      // Madd letters
      if ("اوي".includes(ch)) {
        result.push(<span key={i} style={{ color: "#2980b9" }}>{ch}</span>);
        i++; continue;
      }
      result.push(<span key={i}>{ch}</span>);
      i++;
    }
    return <>{result}</>;
  }

  // ── SHARED HELPERS ──────────────────────────────────────────
  const Spinner = ({ label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0" }}>
      {[0, .15, .3].map((d, i) => <span key={i} className="bn" style={{ animationDelay: `${d}s` }} />)}
      <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 6 }}>{label}</span>
    </div>
  );

  const RetryRow = ({ msg, onRetry }) => {
    const isNoKey = msg && (msg.includes("coming soon") || msg.includes("not configured") || msg.includes("NO_KEY"));
    const isRateLimit = msg && (msg.includes("Too many requests") || msg.includes("RATE_LIMIT") || msg.includes("wait a moment"));
    const isModelGone = msg && msg.includes("unavailable");
    const icon = isNoKey ? "🔐 " : isRateLimit ? "⏳ " : isModelGone ? "🔄 " : "⚠️ ";
    const bg = isNoKey ? "#f0faf5" : isRateLimit ? "#fffbeb" : isModelGone ? "#f0f4ff" : "#fff5f5";
    const border = isNoKey ? "#0f513244" : isRateLimit ? "#f59e0b66" : isModelGone ? "#818cf866" : "#fca5a5";
    const color = isNoKey ? G : isRateLimit ? "#b45309" : isModelGone ? "#3730a3" : "#dc2626";
    return (
      <div style={{ padding: "12px 14px", borderRadius: 10, background: bg, border: `.5px solid ${border}`, margin: "6px 0" }}>
        <div style={{ fontSize: 13, color, lineHeight: 1.6 }}>{icon}{msg}</div>
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

  // ── AI CONTENT DISCLOSURE — required label wherever Gemini output shows ──
  const AIDisclosureNote = () => (
    <div style={{ fontSize: 10, color: "#9ba5b0", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>
      ✦ This content was generated by AI
    </div>
  );

  const ReportButton = ({ context }) => (
    <button onClick={() => { setReportContext(context); setShowReportModal(true); }}
      style={{ fontSize: 10, color: "#c0392b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: "4px 0", display: "block", margin: "2px auto 0" }}>
      🚩 Report this content
    </button>
  );

  const ReportModal = () => showReportModal ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowReportModal(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🚩 Report AI Content</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
          If this AI-generated content seems inaccurate, inappropriate, or incorrect, let us know. We review reports to improve the app.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => submitReport(reportContext)}
            style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#c0392b", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Submit Report
          </button>
          <button onClick={() => setShowReportModal(false)}
            style={{ padding: "12px 20px", borderRadius: 10, background: "#f4f4f4", color: "#333", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const Nav = ({ readOn = false }) => (
    <div className="nav">
      {[["🏠","Home","home"],["📖","Read","read"],["🎓","Kids","kids"],["🔖","Saved","bookmarks"],["⚙️","More","more"]].map(([icon, label, id]) => (
        <div key={id} className={`ni${navTab === id ? " on" : ""}`} onClick={() => {
          if (id === "home") { stopAudio(); setScreen("home"); setNavTab("home"); setJuzMarker(null); }
          else if (id === "read") { if (surahNum) setScreen("read"); else setShowQuranNav(true); setNavTab("read"); }
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

  // ── SCROLL BUTTONS — float on right side of every long screen ─
  const ScrollFab = () => (
    <>
      <button className="scroll-fab" style={{ bottom: 130, background: "linear-gradient(180deg,#1a9a5c,#0f5132)", color: "#fff" }}
        onClick={() => window.scrollBy({ top: -340, behavior: "smooth" })}>▲</button>
      <button className="scroll-fab" style={{ bottom: 80, background: "linear-gradient(180deg,#1a9a5c,#0f5132)", color: "#fff" }}
        onClick={() => window.scrollBy({ top: 340, behavior: "smooth" })}>▼</button>
    </>
  );

  // ── AUDIO CONTROL BAR — shown when a verse/surah is playing ──
  const AudioBar = () => playKey ? (
    <div className="audio-bar">
      <div style={{ fontSize: 17 }}>🎵</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
          {audioPaused ? "⏸ Paused" : "▶ Playing"} · {(() => { const [sn, vn] = playKey.split(":"); const s = SURAHS.find(x => x.n === parseInt(sn)); return `${s?.name || ""} : ${vn}`; })()}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{audioPaused ? "Tap Resume to continue" : "Quran Recitation"}</div>
      </div>
      {!audioPaused ? (
        <button onClick={pauseAudio}
          style={{ padding: "6px 12px", borderRadius: 18, background: "#e8b84b", border: "none", color: "#1a0a00", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          ⏸ Pause
        </button>
      ) : (
        <button onClick={resumeAudio}
          style={{ padding: "6px 12px", borderRadius: 18, background: "linear-gradient(180deg,#1a9a5c,#0f5132)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          ▶ Resume
        </button>
      )}
      <button onClick={stopAudio}
        style={{ padding: "6px 12px", borderRadius: 18, background: "#c0392b", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
        ⏹ Stop
      </button>
    </div>
  ) : null;

  // ── QURAN SPLASH — Islamic wallpaper shown before 114 Surahs ─
  const QuranSplash = () => (
    <div className="fade" style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020e06 0%,#0a2e14 40%,#0f5132 80%,#1a7a45 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "0 0 40px", overflowX: "hidden", position: "relative" }}>
      {/* Geometric pattern bg */}
      <div style={{ position: "absolute", inset: 0, opacity: .07, pointerEvents: "none" }}>
        <svg width="100%" height="100%"><defs><pattern id="sp" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse"><polygon points="30,3 56,18 56,42 30,57 4,42 4,18" fill="none" stroke="#c9943a" strokeWidth=".8"/><circle cx="30" cy="30" r="4" fill="none" stroke="#c9943a" strokeWidth=".5"/></pattern></defs><rect width="100%" height="100%" fill="url(#sp)"/></svg>
      </div>

      {/* Top decorative border */}
      <div style={{ width: "100%", height: 5, background: "linear-gradient(90deg,transparent,#c9943a,#e8b84b,#c9943a,transparent)" }} />

      {/* Central content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 24px", textAlign: "center", position: "relative", zIndex: 2 }}>
        {/* Quran icon frame */}
        <div style={{ width: 100, height: 100, borderRadius: 24, background: "linear-gradient(135deg,#c9943a,#e8b84b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 24, boxShadow: "0 8px 32px rgba(201,148,58,.5), 0 0 0 8px rgba(201,148,58,.12)" }}>📖</div>

        {/* Arabic Bismillah */}
        <div className="ar" style={{ fontSize: 28, color: "#e8b84b", lineHeight: 1.8, marginBottom: 8, textShadow: "0 2px 12px rgba(201,148,58,.4)" }}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 32, letterSpacing: 1 }}>In the name of Allah, the Most Gracious, the Most Merciful</div>

        {/* Title */}
        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>القرآن الكريم</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e8b84b", marginBottom: 6 }}>The Holy Quran</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 40, letterSpacing: 1.5 }}>COMPLETE KNOWLEDGE EDITION</div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.06)", borderRadius: 16, border: ".5px solid rgba(201,148,58,.25)", overflow: "hidden", marginBottom: 48, width: "100%" }}>
          {[["114","Surahs"],["6,236","Verses"],["30","Juz"],["604","Pages"]].map(([n,l],i,arr) => (
            <div key={l} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRight: i < arr.length-1 ? ".5px solid rgba(255,255,255,.08)" : "none" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e8b84b" }}>{n}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 3, textTransform: "uppercase", letterSpacing: .6 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Enter button */}
        <button onClick={() => setShowQuranSplash(false)}
          style={{ width: "100%", padding: "18px 0", background: "linear-gradient(180deg,#e8b84b 0%,#c9943a 60%,#a67c2a 100%)", border: "none", borderRadius: 20, fontSize: 17, fontWeight: 800, color: "#1a0800", cursor: "pointer", boxShadow: "0 6px 0 #7a5a1a,0 10px 24px rgba(201,148,58,.4)", letterSpacing: .5, fontFamily: "inherit", marginBottom: 16 }}
          className="btn-3d">
          ✦ Enter All 114 Surahs ✦
        </button>
        <button onClick={() => { setShowQuranSplash(false); setNavTab("home"); setScreen("home"); }}
          style={{ background: "none", border: ".5px solid rgba(255,255,255,.2)", borderRadius: 16, padding: "10px 24px", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back to Home
        </button>
      </div>

      {/* Bottom decorative border */}
      <div style={{ width: "100%", height: 5, background: "linear-gradient(90deg,transparent,#c9943a,#e8b84b,#c9943a,transparent)" }} />
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

        {/* Tajweed Colors */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🌈 Tajweed Color Coding</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setTajweedColors(true); localStorage.setItem("ql_tajweed","on"); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: `.5px solid ${tajweedColors ? G : "#ddd"}`, background: tajweedColors ? "#f0faf5" : "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: tajweedColors ? G : "#666" }}>
              🌈 Colors On
            </button>
            <button onClick={() => { setTajweedColors(false); localStorage.setItem("ql_tajweed","off"); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: `.5px solid ${!tajweedColors ? G : "#ddd"}`, background: !tajweedColors ? "#f0faf5" : "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: !tajweedColors ? G : "#666" }}>
              Off
            </button>
          </div>
          {tajweedColors && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#fffbea", borderRadius: 9, border: ".5px solid #e8b84b", fontSize: 11, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#7a5a00" }}>Tajweed Color Guide:</div>
              <div><span style={{ color: "#c0392b", fontWeight: 700 }}>■ Red</span> — Qalqalah (echoing letters: ق ط ب ج د)</div>
              <div><span style={{ color: "#27ae60", fontWeight: 700 }}>■ Green</span> — Ghunnah / nasal sound (ن م with shadda)</div>
              <div><span style={{ color: "#2980b9", fontWeight: 700 }}>■ Blue</span> — Madd (elongation letters: ا و ي)</div>
              <div><span style={{ color: "#8e44ad", fontWeight: 700 }}>■ Purple</span> — Idgham / merging sounds</div>
              <div style={{ color: "#9ba5b0", marginTop: 4 }}>Colors appear in the Quran reader. Full tajweed rules require a qualified teacher.</div>
            </div>
          )}
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
              onClick={() => {
                const start = JUZ_STARTS[i + 1];
                setShowJuz(false);
                setShowQuranNav(false);
                cameFromQuranNav.current = true;
                if (start) openSurah(start.surah, false, start.verse, i + 1);
              }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Juz {i + 1}</div>
                <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 1 }}>
                  {JUZ_STARTS[i + 1] ? `Starts at ${SURAHS.find(s => s.n === JUZ_STARTS[i + 1].surah)?.name || ""} ${JUZ_STARTS[i + 1].verse}` : `Part ${i + 1} of 30`}
                </div>
              </div>
              <div className="ar" style={{ fontSize: 16, color: G }}>الجزء {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const MushafStyleSelectSheet = () => showMushafStyleSelect ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowMushafStyleSelect(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>📖 Read Full Quran in Arabic</div>
        <div style={{ fontSize: 12, color: "#9ba5b0", marginBottom: 16, textAlign: "center" }}>Choose your preferred reading style</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => {
              setMushafFontStyle("amiri");
              try { localStorage.setItem("ql_mushaf_font_style", "amiri"); } catch {}
              setShowMushafStyleSelect(false);
              setShowQuranNav(false);
              setMushafQuickLink(null); setMushafQuickLinkSurah(null); setMushafHighlightVerse(null);
              openAmiriReader(1);
            }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 14, background: "linear-gradient(135deg,#f0faf5,#e8f4ee)", border: `1.5px solid ${G}55`, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 30 }}>📖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Amiri Style</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Bigger font, more spacing — comfortable reading</div>
            </div>
          </button>
          <button onClick={() => {
              setMushafFontStyle("classic");
              try { localStorage.setItem("ql_mushaf_font_style", "classic"); } catch {}
              setShowMushafStyleSelect(false);
              setShowQuranNav(false);
              setMushafQuickLink(null); setMushafQuickLinkSurah(null); setMushafHighlightVerse(null);
              openMushafReader();
            }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 14, background: "linear-gradient(135deg,#fdf8ef,#faf1dc)", border: "1.5px solid #c8a84b55", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 30 }}>📜</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Mushaf Style</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Traditional, denser layout — classic look</div>
            </div>
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#c4c4c4", textAlign: "center", marginTop: 14 }}>Same authentic Uthmani text either way — you can switch anytime</div>
      </div>
    </div>
  ) : null;

  const QuickLinksSheet = () => showQuickLinks ? (
    <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) setShowQuickLinks(false); }}>
      <div className="sheet">
        <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚡ Quick Link of Surahs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {QUICK_LINKS.map(q => (
            <div key={q.name}
              onClick={() => {
                setShowQuickLinks(false);
                setShowQuranNav(false);
                setMushafFontStyle("classic");
                setMushafQuickLink(q.name);
                setMushafQuickLinkSurah(q.surah);
                setMushafHighlightVerse(q.verse > 1 ? q.verse : null);
                setMushafTranslations({});
                openMushafReader(q.page);
                fetchMushafTranslations(q.page);
              }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", borderRadius: 12, background: "#f0faf5", border: `.5px solid ${G}33`, cursor: "pointer" }}>
              <div style={{ fontSize: 26 }}>{q.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{q.name}</div>
                <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 2 }}>Opens in Mushaf · Page {q.page}</div>
              </div>
              <div className="ar" style={{ fontSize: 20, color: G }}>{q.ar}</div>
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
              if (screen === "mushaf") {
                mushafGoToPage(p);
              } else {
                const s = SURAHS.slice().reverse().find(x => x.page <= p) || SURAHS[0];
                openSurah(s.n);
              }
              setShowGoto(false); setGotoPage("");
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

  // ── BILINGUAL AUDIO — Arabic verse then Translation verse ──
  const playBilingualAudio = useCallback(async (surahNum, langCode) => {
    // Stop any existing audio first
    audioStopRef.current = true;
    bilingualStopRef.current = true;
    bilingualPauseRef.current = false;
    if (bilingualAudioRef.current) { bilingualAudioRef.current.pause(); bilingualAudioRef.current = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setAudioPlaying(false);
    await new Promise(r => setTimeout(r, 200));

    bilingualStopRef.current = false;
    setBilingualPlaying(langCode);
    setBilingualSurah(surahNum);
    setBilingualPaused(false);
    setBilingualVerse(0);

    const playOne = (url) => new Promise((resolve) => {
      const audio = new Audio(url);
      bilingualAudioRef.current = audio;
      let done = false;
      const finish = () => { if (done) return; done = true; bilingualAudioRef.current = null; resolve(); };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration))
          setTimeout(finish, audio.duration * 1000 + 600);
      });
      audio.play().catch(finish);
    });

    const waitWhilePaused = () => new Promise(resolve => {
      const check = () => {
        if (bilingualStopRef.current) { resolve(); return; }
        if (!bilingualPauseRef.current) { resolve(); return; }
        setTimeout(check, 200);
      };
      check();
    });

    try {
      const verses = await fetchVerses(surahNum, "en", null);
      for (let i = 0; i < verses.length; i++) {
        if (bilingualStopRef.current) break;
        await waitWhilePaused();
        if (bilingualStopRef.current) break;

        const v = verses[i];
        setBilingualVerse(v.number);

        // 1. Play Arabic verse
        const arabicUrl = realAudioUrl("ar", surahNum, v.number) ||
          `https://cdn.islamic.network/quran/audio/128/${qari}/${(SURAH_VERSE_STARTS[surahNum] || 1) + v.number - 1}.mp3`;
        const arUrl = `https://cdn.islamic.network/quran/audio/128/${qari}/${(SURAH_VERSE_STARTS[surahNum] || 1) + v.number - 1}.mp3`;
        await playOne(arUrl);

        if (bilingualStopRef.current) break;
        await waitWhilePaused();

        // 2. Play Translation verse (Urdu or English)
        const transUrl = realAudioUrl(langCode, surahNum, v.number);
        if (transUrl) await playOne(transUrl);

        if (bilingualStopRef.current) break;
        // Small gap between verses
        await new Promise(r => setTimeout(r, 400));
      }
    } catch(e) {}

    if (!bilingualStopRef.current) {
      setBilingualPlaying(null);
      setBilingualSurah(null);
      setBilingualVerse(0);
      setBilingualPaused(false);
    }
  }, [qari]);

  const stopBilingualAudio = useCallback(() => {
    bilingualStopRef.current = true;
    bilingualPauseRef.current = false;
    if (bilingualAudioRef.current) { bilingualAudioRef.current.pause(); bilingualAudioRef.current = null; }
    setBilingualPlaying(null);
    setBilingualSurah(null);
    setBilingualVerse(0);
    setBilingualPaused(false);
  }, []);

  const pauseBilingualAudio = useCallback(() => {
    bilingualPauseRef.current = true;
    if (bilingualAudioRef.current) bilingualAudioRef.current.pause();
    setBilingualPaused(true);
  }, []);

  const resumeBilingualAudio = useCallback(() => {
    bilingualPauseRef.current = false;
    if (bilingualAudioRef.current) bilingualAudioRef.current.play().catch(() => {});
    setBilingualPaused(false);
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


  // ── HOME SCREEN — simple coloured button layout as requested ─
  const HomeScreen = () => (
    <div className="fade" style={{ minHeight: "100vh", background: "#f0f4f8", paddingBottom: 90 }}>

      {/* Welcome banner */}
      <div style={{ background: "linear-gradient(135deg,#1a7ab5,#2196c4)", margin: "16px 14px 0", borderRadius: 16, padding: "18px 20px", textAlign: "center", boxShadow: "0 4px 16px rgba(26,122,181,.3)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", letterSpacing: 1, marginBottom: 3 }}>WELCOME TO</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: .5 }}>QURAN - INLIFE APP</div>
        <div className="ar" style={{ fontSize: 15, color: "rgba(255,255,255,.7)", marginTop: 5 }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
      </div>

      {/* Verse of the Day */}
      {votd && (
        <div style={{ margin: "12px 14px 0", background: "linear-gradient(135deg,#0a3020,#1a6040)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 4px 16px rgba(0,0,0,.18)", cursor: "pointer" }}
          onClick={() => openSurah(votd.surahNum)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#c8a84b", letterSpacing: 1.5, textTransform: "uppercase" }}>✨ Verse of the Day</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>{votd.surahName} {votd.surahNum}:{votd.verseNum}</div>
          </div>
          <div className="ar" style={{ fontSize: 20, color: "#fff", lineHeight: 1.9, textAlign: "right", direction: "rtl", marginBottom: 10, fontWeight: 500 }}>{votd.ar}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", lineHeight: 1.6, fontStyle: "italic" }}>{votd.en}</div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#c8a84b", fontWeight: 600 }}>Tap to read full Surah →</div>
        </div>
      )}

      {/* Search bar — ABOVE the Quran button */}
      <div style={{ padding: "12px 14px 0", position: "relative", zIndex: 50 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ba5b0", fontSize: 16, pointerEvents: "none" }}>🔍</span>
          <input id="ql-search" type="text" placeholder="Search Surah name, number..."
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false"
            style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14, border: "1.5px solid #dde3e8", fontSize: 15, fontFamily: "inherit", outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.07)", WebkitAppearance: "none" }}
            onFocus={e => { e.target.style.borderColor = "#1a7ab5"; }}
            onBlur={e => { e.target.style.borderColor = "#dde3e8"; setTimeout(() => setSearchResults([]), 250); }}
            onInput={e => {
              const q = e.target.value;
              if (!q.trim()) { setSearchResults([]); return; }
              const ql = q.toLowerCase();
              setSearchResults(SURAHS.filter(s =>
                s.name.toLowerCase().includes(ql) || s.ar.includes(q) ||
                s.meaning.toLowerCase().includes(ql) || String(s.n).includes(q)
              ).slice(0, 8));
            }}
          />
        </div>
        {searchResults.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% - 4px)", left: 14, right: 14, background: "#fff", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,.15)", zIndex: 200, maxHeight: 300, overflowY: "auto", border: ".5px solid #e4e8e2" }}>
            {searchResults.map(s => (
              <div key={s.n}
                onMouseDown={e => { e.preventDefault(); openSurah(s.n); setSearchResults([]); const el = document.getElementById("ql-search"); if(el) el.value=""; }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: ".5px solid #f0f0ec" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5fcf7"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ba5b0" }}>{s.meaning} · {s.verses} verses</div>
                </div>
                <div className="ar" style={{ fontSize: 16, color: G }}>{s.ar}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QURAN big green button — BELOW search */}
      <div style={{ padding: "12px 14px 0" }}>
        <button onClick={() => setShowQuranNav(true)}
          className="nav-btn-quran"
          style={{ width: "100%", background: "linear-gradient(180deg,#27ae60,#1a7a3c,#0f5124)", boxShadow: "0 6px 0 #0a3d1c,0 10px 24px rgba(15,81,50,.4)" }}>
          📖  Q U R A N
        </button>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#5a6472", fontWeight: 600, letterSpacing: .3 }}>
          ↑ Press to go inside
        </div>
      </div>

      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px 0" }}>
        {[
          { label: "KIDS\nCORNER",      bg: "linear-gradient(180deg,#e67e22,#a85414)", sh: "#7a3a0a", fn: () => { setScreen("kids"); setNavTab("kids"); setKidLetter(null); } },
          { label: "PRAYER\nTIMES",     bg: "linear-gradient(180deg,#1a5276,#0d2b3e)", sh: "#06141e", fn: () => setScreen("prayer") },
          { label: "QIBLA\nDIRECTION", bg: "linear-gradient(180deg,#1a7ab5,#0e4a6e)", sh: "#08293d", fn: () => setScreen("prayer") },
          { label: "HIJRI\nDATE",       bg: "linear-gradient(180deg,#7d3c98,#4a2060)", sh: "#2a1038", fn: () => { const h = toHijri(new Date()); alert(`Today: ${h.day} ${h.monthName} ${h.year} AH`); } },
        ].map(({ label, bg, sh, fn }) => (
          <button key={label} onClick={fn} className="nav-btn"
            style={{ background: bg, boxShadow: `0 5px 0 ${sh},0 8px 16px rgba(0,0,0,.25)`, fontSize: 17, padding: "24px 10px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px 0" }}>
        {[
          { label: "DUAS",               bg: "linear-gradient(180deg,#1e8449,#0e4224)", sh: "#071a10", fn: () => setScreen("duas") },
          { label: "99 NAMES\nOF ALLAH", bg: "linear-gradient(180deg,#ca6f1e,#7e5109)", sh: "#4a2e04", fn: () => setScreen("names") },
          { label: "TASBIH",             bg: "linear-gradient(180deg,#717d7e,#424949)", sh: "#252c2c", fn: () => setScreen("tasbih") },
          { label: "ADHKAR",             bg: "linear-gradient(180deg,#909497,#5b6062)", sh: "#363a3b", fn: () => setScreen("adhkar") },
        ].map(({ label, bg, sh, fn }) => (
          <button key={label} onClick={fn} className="nav-btn"
            style={{ background: bg, boxShadow: `0 5px 0 ${sh},0 8px 16px rgba(0,0,0,.25)`, fontSize: 17, padding: "24px 10px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px 0" }}>
        {[
          { label: "SETTINGS", bg: "linear-gradient(180deg,#2c3e50,#0a0f14)", sh: "#000", fn: () => setShowSettings(true) },
          { label: "LANGUAGE", bg: "linear-gradient(180deg,#27ae60,#145a32)", sh: "#0a3019", fn: () => setShowLang(true) },
        ].map(({ label, bg, sh, fn }) => (
          <button key={label} onClick={fn} className="nav-btn"
            style={{ background: bg, boxShadow: `0 5px 0 ${sh},0 8px 16px rgba(0,0,0,.25)`, fontSize: 17, padding: "24px 10px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Row 4 — Extra Knowledge + Offline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px 0" }}>
        <button onClick={() => setScreen("extraknowledge")} className="nav-btn"
          style={{ background: "linear-gradient(180deg,#4a235a,#1a0828)", boxShadow: "0 5px 0 #0d0414,0 8px 16px rgba(0,0,0,.25)", fontSize: 17, padding: "22px 10px" }}>
          🔮 EXTRA\nKNOWLEDGE
        </button>
        <button onClick={() => setScreen("offline")} className="nav-btn"
          style={{ background: "linear-gradient(180deg,#1a3a6c,#0d1f3a)", boxShadow: "0 5px 0 #060e1c,0 8px 16px rgba(0,0,0,.25)", fontSize: 17, padding: "22px 10px" }}>
          📥 OFFLINE\nMODE
        </button>
      </div>

      <Nav />
      {SettingsSheet()}{LangSheet()}{QariSheet()}{PrayerSheet()}{JuzSheet()}{GotoSheet()}{BkSheet()}{AudioSheet()}
      {AudioBar()}
    </div>
  );

  // ── SURAH LIST SCREEN — filtered list from Quran Nav ─────────
  const SurahListScreen = () => {
    const listFiltered = SURAHS.filter(s => {
      if (filter === "all") return true;
      if (filter === "meccan") return s.type === "Meccan";
      if (filter === "medinan") return s.type === "Medinan";
      if (filter === "long") return s.verses >= 100;
      if (filter === "short") return s.verses <= 20;
      return true;
    });
    return (
      <div className="fade" style={{ minHeight: "100vh", background: "#f0f4f8", paddingBottom: 90 }}>
        <div style={{ background: `linear-gradient(135deg,#051a0e,${G},#1a7a45)`, padding: "14px 14px 16px", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { setShowSurahList(false); }}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{surahListTitle}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{listFiltered.length} Surahs · Tap Play or Read</div>
            </div>
          </div>
        </div>
        <div style={{ margin: "12px 14px", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          {listFiltered.map((s, i) => (
            <div key={s.n} id={`surah-row-${s.n}`}
              style={{
                borderBottom: i < listFiltered.length - 1 ? ".5px solid #f0f0ec" : "none",
                background: scrollToSurahNum === s.n ? "#fff3c4" : "#fff",
                transition: "background 1.2s ease",
                padding: "10px 12px",
                cursor: "pointer"
              }}
              onClick={() => { cameFromQuranNav.current = true; setShowSurahList(false); setShowQuranNav(false); openSurah(s.n); }}>
              {/* Top row — surah info */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
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
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="ar" style={{ fontSize: 17, color: G, lineHeight: 1.4 }}>{s.ar}</div>
                  <div style={{ fontSize: 9, color: "#9ba5b0" }}>{s.meaning}</div>
                </div>
              </div>
              {/* Bottom row — buttons */}
              {(bilingualPlaying && bilingualSurah === s.n) || (playKey && playKey.startsWith(`${s.n}:`)) ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 11, color: G, fontWeight: 600, flex: 1 }}>
                    {bilingualPlaying && bilingualSurah === s.n
                      ? (bilingualPlaying === "ur" ? "▶ Urdu" : "▶ English") + ` v${bilingualVerse}`
                      : "▶ Arabic"}
                  </div>
                  {bilingualPlaying && bilingualSurah === s.n ? (
                    <>
                      {!bilingualPaused
                        ? <button className="pbtn" style={{ background: "#e8b84b", color: "#1a0800", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); pauseBilingualAudio(); }}>⏸ Pause</button>
                        : <button className="pbtn" style={{ background: "#27ae60", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); resumeBilingualAudio(); }}>▶ Resume</button>}
                      <button className="pbtn" style={{ background: "#c0392b", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); stopBilingualAudio(); }}>⏹ Stop</button>
                    </>
                  ) : (
                    <>
                      {!audioPaused
                        ? <button className="pbtn" style={{ background: "#e8b84b", color: "#1a0800", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); pauseAudio(); }}>⏸ Pause</button>
                        : <button className="pbtn" style={{ background: "#27ae60", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); resumeAudio(); }}>▶ Resume</button>}
                      <button className="pbtn" style={{ background: "#c0392b", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); stopAudio(); }}>⏹ Stop</button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }} onClick={async e => {
                    e.stopPropagation(); stopBilingualAudio(); stopAudio(); setContinueDialog(null);
                    try { const v = await fetchVerses(s.n, lang, null); playVerse(s.n, 1, "surah", v); } catch(err) {}
                  }}>▶ Arabic</button>
                  <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }}
                    onClick={e => { e.stopPropagation(); stopAudio(); stopBilingualAudio(); playBilingualAudio(s.n, "ur"); }}>
                    ▶ Urdu
                  </button>
                  <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }}
                    onClick={e => { e.stopPropagation(); stopAudio(); stopBilingualAudio(); playBilingualAudio(s.n, "en"); }}>
                    ▶ English
                  </button>
                  <button className="rbtn" style={{ flex: 1, textAlign: "center", fontSize: 13, padding: "9px 0", borderRadius: 22 }} onClick={e => { e.stopPropagation(); cameFromQuranNav.current = true; setShowSurahList(false); setShowQuranNav(false); openSurah(s.n); }}>Read</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ height: 14 }} />
        {ScrollFab()}
        {AudioBar()}
      </div>
    );
  };

  // ── QURAN NAV SCREEN — opens when QURAN button tapped ────────
  const QuranNavScreen = () => (
    <div className="fade" style={{ minHeight: "100vh", background: "#f0f4f8", paddingBottom: 90 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,#051a0e,${G},#1a7a45)`, padding: "14px 14px 16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowQuranNav(false)}
            style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>📖 QURAN</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Choose how you want to explore</div>
          </div>
          <div className="ar" style={{ fontSize: 20, color: "#e8b84b" }}>القرآن الكريم</div>
        </div>
      </div>


      {/* 4 main navigation buttons — single row, 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "12px 14px 0" }}>
        {[
          { label: "ALL 114\nSURAH -\nONE BY ONE",      bg: "linear-gradient(180deg,#27ae60,#145a32)", sh: "#0a3019",
            fn: () => { setFilter("all"); setSurahListTitle("All 114 Surahs"); setShowSurahList(true); } },
          { label: "Read Full\nQuran in\nArabic",        bg: "linear-gradient(180deg,#7d3c98,#4a2060)", sh: "#2a1038",
            fn: () => { setShowMushafStyleSelect(true); } },
          { label: "QUICK LINK\nOF SURAHS",              bg: "linear-gradient(180deg,#1a7ab5,#0e4a6e)", sh: "#08293d",
            fn: () => { setShowQuickLinks(true); } },
          { label: "JUZ INDEX",                          bg: "linear-gradient(180deg,#1a5276,#0d2b3e)", sh: "#06141e",
            fn: () => { setShowJuz(true); } },
        ].map(({ label, bg, sh, fn }) => (
          <button key={label} onClick={fn} className="nav-btn"
            style={{ background: bg, boxShadow: `0 5px 0 ${sh},0 8px 18px rgba(0,0,0,.3)`, padding: "22px 4px", fontSize: 11, lineHeight: 1.35 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filter row — 4 equal tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "10px 14px 0" }}>
        {[
          { label: "Meccan",  bg: "linear-gradient(180deg,#e67e22,#a85414)", sh: "#7a3a0a",
            fn: () => { setFilter("meccan"); setSurahListTitle("Meccan Surahs"); setShowSurahList(true); } },
          { label: "Medinan", bg: "linear-gradient(180deg,#27ae60,#145a32)", sh: "#0a3019",
            fn: () => { setFilter("medinan"); setSurahListTitle("Madinan Surahs"); setShowSurahList(true); } },
          { label: "Long",    bg: "linear-gradient(180deg,#717d7e,#424949)", sh: "#252c2c",
            fn: () => { setFilter("long"); setSurahListTitle("Long Surahs (100+ verses)"); setShowSurahList(true); } },
          { label: "Short",   bg: "linear-gradient(180deg,#909497,#5b6062)", sh: "#363a3b",
            fn: () => { setFilter("short"); setSurahListTitle("Short Surahs (up to 20 verses)"); setShowSurahList(true); } },
        ].map(({ label, bg, sh, fn }) => (
          <button key={label} onClick={fn} className="nav-btn"
            style={{ background: bg, boxShadow: `0 5px 0 ${sh},0 8px 18px rgba(0,0,0,.3)`, padding: "22px 4px", fontSize: 13, lineHeight: 1.35 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Reciter + Language + utility chips */}
      <div style={{ display: "flex", gap: 8, padding: "12px 14px 10px", flexWrap: "wrap" }}>
        <button onClick={() => setShowQari(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 16, border: "1px solid #dde3e8", background: "#fff", color: "#1a1a1a", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}><span style={{ fontSize: 16 }}>🎙</span> {curQari.short}</button>
        <button onClick={() => setShowLang(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 16, border: "1px solid #dde3e8", background: "#fff", color: "#1a1a1a", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}><span style={{ fontSize: 16 }}>🌍</span> {curLang.na} ▾</button>
        <button onClick={() => setShowGoto(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 16, border: "1px solid #dde3e8", background: "#fff", color: "#1a1a1a", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}><span style={{ fontSize: 16 }}>📄</span> Go To Page</button>
        <button onClick={() => setShowBkSheet(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 16, border: "1px solid #dde3e8", background: "#fff", color: "#1a1a1a", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}><span style={{ fontSize: 16 }}>🔖</span> Save</button>
        <button onClick={() => { setShowQuranNav(false); setScreen("hifz"); }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 16, border: "1px solid #1a5c2e", background: "#e8f5e9", color: "#1a5c2e", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}><span style={{ fontSize: 16 }}>📗</span> Hifz Tracker</button>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 14px 4px", position: "relative", zIndex: 50 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ba5b0", fontSize: 16, pointerEvents: "none" }}>🔍</span>
          <input id="ql-search-qnav" type="text" placeholder="Search Surah name, number..."
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false"
            style={{ width: "100%", padding: "13px 14px 13px 44px", borderRadius: 14, border: "1.5px solid #dde3e8", fontSize: 15, fontFamily: "inherit", outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.07)", WebkitAppearance: "none" }}
            onFocus={e => { e.target.style.borderColor = G; }}
            onBlur={e => { e.target.style.borderColor = "#dde3e8"; setTimeout(() => setSearchResults([]), 250); }}
            onInput={e => {
              const q = e.target.value;
              if (!q.trim()) { setSearchResults([]); return; }
              const ql = q.toLowerCase();
              setSearchResults(SURAHS.filter(s =>
                s.name.toLowerCase().includes(ql) || s.ar.includes(q) ||
                s.meaning.toLowerCase().includes(ql) || String(s.n).includes(q)
              ).slice(0, 8));
            }}
          />
        </div>
        {searchResults.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% - 4px)", left: 14, right: 14, background: "#fff", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,.15)", zIndex: 200, maxHeight: 280, overflowY: "auto", border: ".5px solid #e4e8e2" }}>
            {searchResults.map(s => (
              <div key={s.n}
                onMouseDown={e => { e.preventDefault(); setShowQuranNav(false); setFilter("all"); setSurahListTitle("All 114 Surahs"); setScrollToSurahNum(s.n); setShowSurahList(true); setSearchResults([]); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: ".5px solid #f0f0ec" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5fcf7"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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

      {/* Surah list — All 114 with Play · Stop · Read */}
      <div style={{ padding: "14px 14px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .9 }}>All 114 Surahs</div>
        <div style={{ fontSize: 11, color: "#9ba5b0" }}>Tap to read</div>
      </div>
      <div style={{ margin: "0 14px", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
        {SURAHS.map((s, i) => (
          <div key={s.n}
            style={{ borderBottom: i < SURAHS.length - 1 ? ".5px solid #f0f0ec" : "none", background: "#fff", padding: "10px 12px", cursor: "pointer" }}
            onClick={() => { cameFromQuranNav.current = true; setShowQuranNav(false); openSurah(s.n); }}>
            {/* Top row — surah info */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
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
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="ar" style={{ fontSize: 17, color: G, lineHeight: 1.4 }}>{s.ar}</div>
                <div style={{ fontSize: 9, color: "#9ba5b0" }}>{s.meaning}</div>
              </div>
            </div>
            {/* Bottom row — buttons */}
            {(bilingualPlaying && bilingualSurah === s.n) || (playKey && playKey.startsWith(`${s.n}:`)) ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 11, color: G, fontWeight: 600, flex: 1 }}>
                  {bilingualPlaying && bilingualSurah === s.n
                    ? (bilingualPlaying === "ur" ? "▶ Urdu" : "▶ English") + ` v${bilingualVerse}`
                    : "▶ Arabic"}
                </div>
                {bilingualPlaying && bilingualSurah === s.n ? (
                  <>
                    {!bilingualPaused
                      ? <button className="pbtn" style={{ background: "#e8b84b", color: "#1a0800", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); pauseBilingualAudio(); }}>⏸ Pause</button>
                      : <button className="pbtn" style={{ background: "#27ae60", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); resumeBilingualAudio(); }}>▶ Resume</button>}
                    <button className="pbtn" style={{ background: "#c0392b", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); stopBilingualAudio(); }}>⏹ Stop</button>
                  </>
                ) : (
                  <>
                    {!audioPaused
                      ? <button className="pbtn" style={{ background: "#e8b84b", color: "#1a0800", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); pauseAudio(); }}>⏸ Pause</button>
                      : <button className="pbtn" style={{ background: "#27ae60", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); resumeAudio(); }}>▶ Resume</button>}
                    <button className="pbtn" style={{ background: "#c0392b", color: "#fff", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); stopAudio(); }}>⏹ Stop</button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 4 }} onClick={e => e.stopPropagation()}>
                <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }} onClick={async e => {
                  e.stopPropagation(); stopBilingualAudio(); stopAudio(); setContinueDialog(null);
                  try { const v = await fetchVerses(s.n, lang, null); playVerse(s.n, 1, "surah", v); } catch(err) {}
                }}>▶ Arabic</button>
                <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }}
                  onClick={e => { e.stopPropagation(); stopAudio(); stopBilingualAudio(); playBilingualAudio(s.n, "ur"); }}>
                  ▶ Urdu
                </button>
                <button className="pbtn" style={{ fontSize: 13, padding: "9px 0", flex: 1, textAlign: "center", borderRadius: 22 }}
                  onClick={e => { e.stopPropagation(); stopAudio(); stopBilingualAudio(); playBilingualAudio(s.n, "en"); }}>
                  ▶ English
                </button>
                <button className="rbtn" style={{ flex: 1, textAlign: "center", fontSize: 13, padding: "9px 0", borderRadius: 22 }} onClick={e => { e.stopPropagation(); cameFromQuranNav.current = true; setShowQuranNav(false); openSurah(s.n); }}>Read</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: 14 }} />
      {JuzSheet()}{QariSheet()}{LangSheet()}{GotoSheet()}{BkSheet()}{AudioSheet()}{QuickLinksSheet()}
      {ScrollFab()}
      {AudioBar()}
    </div>
  );

  // ── DEAD CODE REMOVED ──
  // ── READ SCREEN ─────────────────────────────────────────────
  const ReadScreen = () => {
    const s = curSurah || SURAHS[0];
    return (
      <div className="fade" style={{ paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,#051a0e,${G},#1a7a45)`, padding: "12px 13px 13px", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button onClick={() => { stopAudio(); if (cameFromQuranNav.current) { cameFromQuranNav.current = false; setShowQuranNav(true); setNavTab("read"); } else { setScreen("home"); setNavTab("home"); } setJuzMarker(null); }}
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
              <button className="mode-btn" onClick={() => { setShowMistakes(true); setMistakesVerseNum(null); setMistakesResult(null); setMistakesError(null); }}
                style={{ background: "rgba(231,76,60,.25)", borderColor: "#e74c3c", color: "#fff" }}>🎙 Check</button>
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
                        {playKey === `${s.n}:${v.number}` ? (
                          <>
                            {!audioPaused ? (
                              <button className="lbtn pl" style={{ fontSize: 11, padding: "3px 10px" }} onClick={pauseAudio}>⏸ Pause</button>
                            ) : (
                              <button className="lbtn" style={{ fontSize: 11, padding: "3px 10px", background: "linear-gradient(180deg,#27ae60,#1a7a3c)", color: "#fff", boxShadow: "0 3px 0 #0d5224", borderColor: "#1a7a3c" }} onClick={resumeAudio}>▶ Resume</button>
                            )}
                            <button className="lbtn" style={{ fontSize: 11, padding: "3px 10px", background: "linear-gradient(180deg,#c0392b,#922b21)", color: "#fff", boxShadow: "0 3px 0 #641e16", borderColor: "#c0392b" }} onClick={stopAudio}>⏹</button>
                          </>
                        ) : (
                          <button className="lbtn" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => playVerse(s.n, v.number, "single", verses)}>▶ Play</button>
                        )}
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
              <div key={verse.number} id={`verse-${verse.number}`} className="fade" style={{ background: darkMode ? "#1a1a1a" : "#fff", border: `.5px solid ${sajdah ? "#c9943a66" : bkd ? "#8e44ad44" : isOpen ? G : darkMode ? "#2a2a2a" : "#e2e8e4"}`, borderRadius: 13, marginBottom: 9, overflow: "hidden", boxShadow: isOpen ? `0 0 0 2px rgba(15,81,50,.09)` : sajdah ? "0 0 0 2px rgba(201,148,58,.15)" : "none" }}>
                {/* Juz Start Marker — persists until dismissed or navigated away */}
                {juzMarker && juzMarker.verseNum === verse.number && (
                  <div style={{ background: "linear-gradient(135deg,#0f5132,#1a7a4d)", padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        ⬇ Juz {juzMarker.juzNum} starts here
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)" }}>
                        This is the beginning of Part {juzMarker.juzNum} of 30
                      </div>
                    </div>
                    <button onClick={() => setJuzMarker(null)}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ×
                    </button>
                  </div>
                )}
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
                  {isPlaying ? (
                    <>
                      {!audioPaused ? (
                        <button className="lbtn pl" onClick={pauseAudio}>⏸ Pause</button>
                      ) : (
                        <button className="lbtn" style={{ background: "linear-gradient(180deg,#27ae60,#1a7a3c)", color: "#fff", boxShadow: "0 3px 0 #0d5224", borderColor: "#1a7a3c" }} onClick={resumeAudio}>▶ Resume</button>
                      )}
                      <button className="lbtn" style={{ background: "linear-gradient(180deg,#c0392b,#922b21)", color: "#fff", boxShadow: "0 3px 0 #641e16", borderColor: "#c0392b" }} onClick={stopAudio}>⏹ Stop</button>
                    </>
                  ) : (
                    <button className="lbtn" onClick={() => playVerse(s.n, verse.number, "single", verses)}>▶ Play</button>
                  )}
                  <button className={`dbtn${isOpen ? " op" : ""}`} onClick={() => {
                    if (openPanel === verse.number) { setOpenPanel(null); }
                    else { setOpenPanel(verse.number); setActiveTab("tafsir"); }
                  }}>📖 {isOpen ? "Close" : "Deep Knowledge"}</button>
                </div>

                {/* Arabic + translation shown automatically below it */}
                <div style={{ padding: "14px 14px 12px" }}>
                  <div className="ar zoom-arabic" style={{ fontSize: fontSize, lineHeight: 2.2, direction: "rtl", textAlign: "right", color: darkMode ? "#e8e8e8" : "#1a1a1a", marginBottom: 10, paddingBottom: 10, borderBottom: `.5px solid ${darkMode ? "#2a2a2a" : "#f4f4f4"}` }}>
                    {tajweedColors ? applyTajweedColors(verse.arabic) : verse.arabic}
                  </div>
                  {(() => {
                    const directTranslation = verse.translation || "";
                    return (
                      <div style={{ fontSize: 14, color: darkMode ? "#d0d0d0" : "#2a2a2a", lineHeight: 1.8, marginBottom: 6 }}>
                        {directTranslation
                          ? directTranslation
                          : <span style={{ color: "#9ba5b0", fontSize: 12, fontStyle: "italic" }}>Translation loading... if it does not appear, tap retry on the surah.</span>
                        }
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
                          {entry.text && <AIDisclosureNote />}
                          {entry.text && <ReportButton context={`Deep Knowledge · ${activeTab} · Surah ${surahNum} Verse ${verse.number} · ${lang}`} />}
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
        {MistakesSheet()}
        {ScrollFab()}
        {AudioBar()}

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

  // ── KIDS ALPHABET AUDIO — continuous Alif, Ba, Ta... playthrough ──
  const stopKidsAudio = useCallback(() => {
    kidsAudioStopRef.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setKidsAudioPlaying(false);
    setKidsAudioCurrent(null);
  }, []);

  const playKidsAlphabetAudio = useCallback(async () => {
    kidsAudioStopRef.current = false;
    setKidsAudioPlaying(true);
    for (let i = 0; i < ARABIC_ALPHA.length; i++) {
      if (kidsAudioStopRef.current) break;
      setKidsAudioCurrent(i);
      const letter = ARABIC_ALPHA[i];
      const url = LETTER_AUDIO_MAP[letter.l];
      await new Promise(resolve => {
        if (url) {
          const audio = new Audio(url);
          audio.onended = resolve;
          audio.onerror = () => {
            // fallback to TTS if MP3 fails
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              const voices = window.speechSynthesis.getVoices();
              const arVoice = voices.find(v => v.lang.startsWith("ar"));
              const u = new SpeechSynthesisUtterance(`حرف ${letter.full}`);
              u.lang = arVoice?.lang || "ar-SA";
              if (arVoice) u.voice = arVoice;
              u.rate = 0.6;
              u.onend = resolve;
              u.onerror = resolve;
              window.speechSynthesis.speak(u);
            } else resolve();
          };
          audio.play().catch(() => resolve());
        } else {
          resolve();
        }
      });
      if (!kidsAudioStopRef.current) await new Promise(r => setTimeout(r, 300));
    }
    if (!kidsAudioStopRef.current) { setKidsAudioPlaying(false); setKidsAudioCurrent(null); }
  }, []);

  // ── VOWEL AUDIO ─────────────────────────────────────────────
  const speakVowel = useCallback((speakText, displayKey, englishName) => {
    setVowelPlaying(displayKey);
    const done = () => setVowelPlaying(null);
    if (!("speechSynthesis" in window)) { done(); return; }

    try { window.speechSynthesis.cancel(); } catch {}

    const speak = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ar"));
        let u;
        if (arVoice) {
          u = new SpeechSynthesisUtterance(speakText);
          u.voice = arVoice;
          u.lang = arVoice.lang;
          u.rate = 0.6;
        } else {
          // No Arabic voice on this device — speak English name directly (guaranteed sound)
          u = new SpeechSynthesisUtterance(englishName || speakText);
          u.lang = "en-US";
          u.rate = 0.8;
        }
        u.pitch = 1;
        u.volume = 1;
        u.onend = done;
        u.onerror = done;
        window.speechSynthesis.speak(u);
        setTimeout(done, 6000);
      } catch { done(); }
    };

    // CRITICAL: Chrome bug — speak() right after cancel() = silence. Need delay.
    const startSpeak = () => setTimeout(speak, 150);

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      startSpeak();
    } else {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        startSpeak();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      setTimeout(startSpeak, 800);
    }
  }, []);

  // ── KIDS SCREEN ─────────────────────────────────────────────
  const KidsScreen = () => (
    <div className="fade" style={{ paddingBottom: 80, background: "linear-gradient(180deg,#fff9f0,#f0fff4)", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#e67e22,#f39c12)", padding: "16px 14px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .07, fontSize: 48, lineHeight: 1 }}>🌟⭐🌙✨</div>
        <div style={{ position: "relative" }}>
          <button onClick={() => { stopKidsAudio(); setScreen("home"); setNavTab("home"); setKidLetter(null); }}
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

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, padding: "12px 14px 6px" }}>
        <button onClick={() => setKidsTab("letters")}
          style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", background: kidsTab === "letters" ? "#e67e22" : "#f0f0f0", color: kidsTab === "letters" ? "#fff" : "#5a6472" }}>
          🔤 Letters
        </button>
        <button onClick={() => setKidsTab("vowels")}
          style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", background: kidsTab === "vowels" ? "#e67e22" : "#f0f0f0", color: kidsTab === "vowels" ? "#fff" : "#5a6472" }}>
          🎵 Vowels
        </button>
        <button onClick={() => { setKidsTab("prophets"); setSelectedProphet(null); }}
          style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", background: kidsTab === "prophets" ? "#e67e22" : "#f0f0f0", color: kidsTab === "prophets" ? "#fff" : "#5a6472" }}>
          📖 Prophets
        </button>
      </div>

      {/* Progress — only show on letters tab */}
      {kidsTab === "letters" && <div style={{ padding: "4px 14px 6px" }}>
        <div style={{ height: 8, background: "#e2e8e4", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((learned.length / ARABIC_ALPHA.length) * 100)}%`, background: "linear-gradient(90deg,#e67e22,#f39c12)", borderRadius: 6, transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 4, textAlign: "center" }}>{Math.round((learned.length / ARABIC_ALPHA.length) * 100)}% Complete</div>
      </div>}

      {/* ── VOWELS TAB ── */}
      {kidsTab === "vowels" && (
        <div style={{ padding: "8px 14px 20px" }}>
          <div style={{ fontSize: 12, color: "#9ba5b0", textAlign: "center", marginBottom: 12 }}>Tap any card to hear the sound 🔊</div>

          {/* Short Vowels */}
          <div className="vowel-section-box">
            <div className="vowel-section-head">
              <span className="vowel-num-badge" style={{ background: "#e67e22" }}>١</span>
              Short Vowels — حَرَكَات قَصِيرَة
            </div>
            <div className="vowel-grid">
              {VOWELS_SHORT.map((v, i) => {
                const key = `short-${i}`;
                return (
                  <div key={key} className={`vowel-btn${vowelPlaying === key ? " vplaying" : ""}`} onClick={() => speakVowel(v.speak, key, v.name)}>
                    <div className="vowel-play-dot">▶</div>
                    <span className="vowel-arabic ar">{v.ar}</span>
                    <span className="vowel-name">{v.arabic}</span>
                    <span className="vowel-sound">{v.sound}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long Vowels */}
          <div className="vowel-section-box">
            <div className="vowel-section-head">
              <span className="vowel-num-badge" style={{ background: "#8b6914" }}>٢</span>
              Long Vowels — حُرُوف الْمَدّ
            </div>
            <div className="vowel-grid">
              {VOWELS_LONG.map((v, i) => {
                const key = `long-${i}`;
                return (
                  <div key={key} className={`vowel-btn${vowelPlaying === key ? " vplaying" : ""}`} onClick={() => speakVowel(v.speak, key, v.name)}
                    style={{ border: "1.5px solid #c8a84b55" }}>
                    <div className="vowel-play-dot" style={{ background: "#8b6914" }}>▶</div>
                    <span className="vowel-arabic ar">{v.ar}</span>
                    <span className="vowel-name" style={{ color: "#8b6914" }}>{v.arabic}</span>
                    <span className="vowel-sound">{v.sound}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practice Words */}
          <div className="vowel-section-box">
            <div className="vowel-section-head">
              <span className="vowel-num-badge" style={{ background: "#27ae60" }}>٣</span>
              Practice Words — تَدْرِيب
            </div>
            <div style={{ fontSize: 11, color: "#9ba5b0", marginBottom: 8 }}>Listen and spot the vowels</div>
            <div className="prac-word-grid">
              {VOWEL_WORDS.map((w, i) => {
                const key = `word-${i}`;
                return (
                  <div key={key} className={`prac-word-btn${vowelPlaying === key ? " vplaying" : ""}`} onClick={() => speakVowel(w.speak, key, w.meaning)}>
                    <div className="ar" style={{ fontSize: 28, color: "#1a0800", lineHeight: 1.4 }}>{w.ar}</div>
                    <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 3 }}>{w.tr}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#27ae60", marginTop: 2 }}>{w.meaning}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PROPHETS TAB ── */}
      {kidsTab === "prophets" && selectedProphet === null && (
        <div style={{ padding: "8px 14px 20px" }}>
          <div style={{ fontSize: 12, color: "#9ba5b0", textAlign: "center", marginBottom: 12 }}>25 Prophets named in the Quran — in order 🌟</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PROPHETS.map((p, i) => (
              <div key={i} onClick={() => { setSelectedProphet(i); setProphetStoryPage(0); loadProphetStory(i); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid #f0e4d0", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#e67e22,#f39c12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, color: "#fff" }}>{i + 1}</div>
                <div style={{ fontSize: 22 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{p.en} <span style={{ fontSize: 10, color: "#c9943a", fontWeight: 500 }}>({p.salEn.split(" (")[0]})</span></div>
                  <div style={{ fontSize: 11, color: "#9ba5b0" }}>{curLang.na} · {p.en}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="ar" style={{ fontSize: 18, color: "#e67e22" }}>{p.ar}</div>
                  <div className="ar" style={{ fontSize: 12, color: "#c9943a" }}>{p.salutation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROPHET STORYBOOK DETAIL ── */}
      {kidsTab === "prophets" && selectedProphet !== null && (() => {
        const p = PROPHETS[selectedProphet];
        const cacheKey = `${selectedProphet}-${lang}`;
        const entry = prophetStoryCache[cacheKey] || {};
        const pages = entry.pages || [];
        const totalPages = pages.length;
        return (
          <div style={{ padding: "8px 14px 20px" }}>
            <button onClick={() => { setSelectedProphet(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0f0f0", border: "none", borderRadius: 18, padding: "6px 14px", color: "#5a6472", fontSize: 12, cursor: "pointer", marginBottom: 12, fontWeight: 600 }}>
              ← All Prophets
            </button>

            {/* Name header */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#9ba5b0", marginBottom: 2 }}>Prophet #{selectedProphet + 1}</div>
              <div className="ar" style={{ fontSize: 30, color: "#e67e22", marginBottom: 2 }}>{p.ar} <span style={{ fontSize: 18, color: "#c9943a" }}>{p.salutation}</span></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{p.en}</div>
              <div style={{ fontSize: 11, color: "#c9943a", fontWeight: 600, marginTop: 2 }}>{p.salEn}</div>
              <div style={{ fontSize: 12, color: "#9ba5b0", marginTop: 2 }}>{curLang.na}: {p.en}</div>
            </div>

            {/* Storybook card */}
            <div style={{ background: "linear-gradient(180deg,#fffaf0,#fff)", borderRadius: 20, padding: 20, boxShadow: "0 6px 24px rgba(0,0,0,.1)", border: "1px solid #f0e4d0", minHeight: 320 }}>

              {entry.loading && (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                  <Spinner label={`Writing the story in ${curLang.n}...`} />
                </div>
              )}

              {entry.error && (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 12 }}>{entry.error}</div>
                  <button className="retry-btn" onClick={() => loadProphetStory(selectedProphet, true)}>↺ Retry</button>
                </div>
              )}

              {!entry.loading && !entry.error && totalPages > 0 && (
                <>
                  {/* Faceless, robed illustration — themed per prophet, modest, no anatomy */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    {selectedProphet === 0 ? (
                      // ── ADAM & HAWWA — two robed, faceless figures together ──
                      <svg width="150" height="120" viewBox="0 0 150 120">
                        {/* Adam figure */}
                        <ellipse cx="55" cy="22" rx="15" ry="17" fill="#c9943a" opacity="0.85" />
                        <path d="M 55 33 Q 28 44 24 88 Q 24 108 33 113 L 77 113 Q 86 108 86 88 Q 82 44 55 33 Z" fill="#e67e22" opacity="0.85" />
                        <path d="M 55 33 Q 42 53 42 88 L 42 113 M 55 33 Q 68 53 68 88 L 68 113" stroke="#a85414" strokeWidth="1.3" fill="none" opacity="0.5" />
                        {/* Hawwa figure — modest robe with headscarf drape, no anatomical distinction, fully covered */}
                        <ellipse cx="98" cy="24" rx="14" ry="16" fill="#b0729a" opacity="0.85" />
                        <path d="M 98 12 Q 84 14 82 34 Q 82 40 88 42" fill="none" stroke="#8a4f76" strokeWidth="0" />
                        <path d="M 84 16 Q 98 8 112 16 Q 116 26 112 38 Q 105 44 98 44 Q 91 44 84 38 Q 80 26 84 16 Z" fill="#c98cb3" opacity="0.9" />
                        <path d="M 98 35 Q 74 46 71 88 Q 71 108 79 113 L 117 113 Q 125 108 125 88 Q 122 46 98 35 Z" fill="#b0729a" opacity="0.85" />
                        <path d="M 98 35 Q 87 55 87 88 L 87 113 M 98 35 Q 109 55 109 88 L 109 113" stroke="#8a4f76" strokeWidth="1.3" fill="none" opacity="0.5" />
                      </svg>
                    ) : (
                      // ── SINGLE ROBED FIGURE — tinted + themed icon badge per prophet ──
                      (() => {
                        const palette = ["#c9943a","#2e8b6e","#4a6fa5","#a5504a","#6b5b95","#3a8a8a","#a5754a","#5a7d8c"];
                        const main = palette[selectedProphet % palette.length];
                        return (
                          <svg width="110" height="130" viewBox="0 0 110 130">
                            <ellipse cx="55" cy="24" rx="17" ry="19" fill={main} opacity="0.85" />
                            <path d="M 55 37 Q 23 49 18 96 Q 18 118 29 123 L 81 123 Q 92 118 92 96 Q 87 49 55 37 Z" fill={main} opacity="0.72" />
                            <path d="M 55 37 Q 39 59 39 96 L 39 123 M 55 37 Q 71 59 71 96 L 71 123" stroke={main} strokeWidth="1.4" fill="none" opacity="0.4" />
                            {/* Themed accent badge — subtle, symbolic, not a face */}
                            <circle cx="88" cy="20" r="14" fill="#fffaf0" stroke={main} strokeWidth="1.5" opacity="0.95" />
                            <text x="88" y="26" fontSize="15" textAnchor="middle">{p.icon}</text>
                          </svg>
                        );
                      })()
                    )}
                  </div>
                  {selectedProphet === 0 && (
                    <div style={{ textAlign: "center", fontSize: 10, color: "#c9943a", marginTop: -10, marginBottom: 10, fontStyle: "italic" }}>
                      Adam and Hawwa (Eve) — shown modestly, fully robed
                    </div>
                  )}

                  {/* Page counter */}
                  <div style={{ textAlign: "center", fontSize: 11, color: "#9ba5b0", marginBottom: 10 }}>
                    Page {prophetStoryPage + 1} of {totalPages}
                  </div>

                  {/* Story text */}
                  <div style={{ fontSize: 15, color: "#2a1a00", lineHeight: 1.9, textAlign: "center", padding: "0 8px", minHeight: 90 }}>
                    {pages[prophetStoryPage]}
                  </div>

                  <AIDisclosureNote />
                  <ReportButton context={`Prophet Story · ${p.en} · Page ${prophetStoryPage + 1} · ${lang}`} />

                  {/* Page navigation */}
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button onClick={() => setProphetStoryPage(pg => Math.max(0, pg - 1))} disabled={prophetStoryPage === 0}
                      style={{ flex: 1, padding: "11px", borderRadius: 12, background: prophetStoryPage === 0 ? "#f0f0f0" : "#fdf0dc", color: prophetStoryPage === 0 ? "#c4c4c4" : "#a85414", border: "none", fontSize: 13, fontWeight: 700, cursor: prophetStoryPage === 0 ? "default" : "pointer" }}>
                      ← Previous
                    </button>
                    <button onClick={() => setProphetStoryPage(pg => Math.min(totalPages - 1, pg + 1))} disabled={prophetStoryPage >= totalPages - 1}
                      style={{ flex: 1, padding: "11px", borderRadius: 12, background: prophetStoryPage >= totalPages - 1 ? "#f0f0f0" : "linear-gradient(180deg,#e67e22,#a85414)", color: prophetStoryPage >= totalPages - 1 ? "#c4c4c4" : "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: prophetStoryPage >= totalPages - 1 ? "default" : "pointer" }}>
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quran references */}
            <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "#9ba5b0" }}>
              📍 Mentioned in: {p.surahRefs}
            </div>
          </div>
        );
      })()}

      {/* ── LETTERS TAB ── */}
      {kidsTab === "letters" && kidLetter !== null ? (
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
      ) : kidsTab === "letters" ? (
        <div style={{ padding: "8px 14px" }}>
          {/* Two mode buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: "#e67e22", color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
              🔤 Tap to Learn
            </div>
            <button onClick={() => { if (kidsAudioPlaying) { stopKidsAudio(); } else { playKidsAlphabetAudio(); } }}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: kidsAudioPlaying ? "#c0392b" : "#f4f4f4", color: kidsAudioPlaying ? "#fff" : "#5a6472", fontSize: 12, fontWeight: 700, textAlign: "center", border: "none", cursor: "pointer" }}>
              {kidsAudioPlaying ? "⏹ Stop" : "🔊 Audio A–Z"}
            </button>
          </div>

          {kidsAudioPlaying && (
            <div style={{ padding: "10px 12px", background: "#fff3cd", border: ".5px solid #f39c12", borderRadius: 10, marginBottom: 14, textAlign: "center" }}>
              <div className="ar" style={{ fontSize: 24, color: "#e67e22", marginBottom: 2 }}>
                {kidsAudioCurrent !== null ? ARABIC_ALPHA[kidsAudioCurrent].l : ""}
              </div>
              <div style={{ fontSize: 12, color: "#856404", fontWeight: 600 }}>
                {kidsAudioCurrent !== null ? `${kidsAudioCurrent + 1} of ${ARABIC_ALPHA.length} — ${ARABIC_ALPHA[kidsAudioCurrent].n}` : ""}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .9, marginBottom: 10 }}>🔤 Arabic Letters — Tap to Learn</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, direction: "rtl" }}>
            {ARABIC_ALPHA.map((a, i) => (
              <div key={i} className="alpha-card" onClick={() => {
                if (kidsAudioPlaying) stopKidsAudio();
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
      ) : null}
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

  // ── MUSHAF READER SCREEN ────────────────────────────────────
  const getMushafBookmarks = () => {
    try { return JSON.parse(localStorage.getItem("ql_mushaf_bookmarks") || "[]"); } catch { return []; }
  };

  const saveMushafBookmark = useCallback(() => {
    try {
      const existing = getMushafBookmarks();
      if (mushafFontStyle === "amiri") {
        const surahInfo = SURAHS.find(s => s.n === amiriSurahNum);
        const anchorVerse = amiriPages[amiriPageIndex]?.verses?.[0]?.number || 1;
        const entry = { mode: "amiri", surah: amiriSurahNum, surahName: surahInfo?.name || "", verseAnchor: anchorVerse, date: new Date().toLocaleDateString(), time: Date.now() };
        const updated = [entry, ...existing.filter(b => !(b.mode === "amiri" && b.surah === amiriSurahNum && b.verseAnchor === anchorVerse))].slice(0, 20);
        localStorage.setItem("ql_mushaf_bookmarks", JSON.stringify(updated));
        alert(`✅ ${surahInfo?.name || "Page"} saved! Tap 📋 to return here.`);
      } else {
        const entry = { mode: "classic", page: mushafPage, surah: mushafData?.surahName || "", juz: mushafData?.juzNum || 1, date: new Date().toLocaleDateString(), time: Date.now() };
        const updated = [entry, ...existing.filter(b => !(b.mode !== "amiri" && b.page === mushafPage))].slice(0, 20);
        localStorage.setItem("ql_mushaf_bookmarks", JSON.stringify(updated));
        alert(`✅ Page ${mushafPage} saved! Tap 📋 to return here.`);
      }
    } catch { alert("Could not save."); }
  }, [mushafPage, mushafData, mushafFontStyle, amiriSurahNum, amiriPageIndex, amiriPages]);

  const handleMushafSearch = useCallback((val) => {
    setMushafSearch(val);
    if (!val.trim()) { setMushafSearchResults([]); return; }
    const ql = val.toLowerCase();
    if (mushafSearchType === "surah") {
      setMushafSearchResults(SURAHS.filter(s =>
        s.name.toLowerCase().includes(ql) || s.ar.includes(val) || String(s.n).includes(val)
      ).slice(0, 6).map(s => ({ label: `${s.name} — Page ${s.page}`, page: s.page, sub: s.ar })));
    } else if (mushafSearchType === "page") {
      const p = parseInt(val);
      if (p >= 1 && p <= 604) setMushafSearchResults([{ label: `Go to Page ${p}`, page: p, sub: "" }]);
      else setMushafSearchResults([]);
    } else if (mushafSearchType === "juz") {
      const j = parseInt(val);
      if (j >= 1 && j <= 30) {
        const js = JUZ_STARTS[j];
        const s = js ? SURAHS.find(x => x.n === js.surah) : null;
        if (s) setMushafSearchResults([{ label: `Juz ${j} — ${s.name} — Page ${s.page}`, page: s.page, sub: `الجزء ${j}` }]);
      } else setMushafSearchResults([]);
    }
  }, [mushafSearchType]);

  // Scroll to the highlighted Quick Link verse (e.g. Ayatul Kursi) once its page renders
  useEffect(() => {
    if (mushafHighlightVerse && mushafData && screen === "mushaf") {
      setTimeout(() => {
        const el = document.getElementById("mushaf-highlight-verse");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [mushafHighlightVerse, mushafData, screen]);

  // Scroll to a searched Surah in the Surah List and briefly highlight it
  useEffect(() => {
    if (scrollToSurahNum && showSurahList) {
      const t1 = setTimeout(() => {
        const el = document.getElementById(`surah-row-${scrollToSurahNum}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      const t2 = setTimeout(() => setScrollToSurahNum(null), 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [scrollToSurahNum, showSurahList]);

  const MushafReaderScreen = () => {
    const amiriGoNext = () => {
      if (amiriPageIndex < amiriPages.length - 1) setAmiriPageIndex(i => i + 1);
      else if (amiriSurahNum < 114) paginateAmiri(amiriSurahNum + 1);
    };
    const amiriGoPrev = () => {
      if (amiriPageIndex > 0) setAmiriPageIndex(i => i - 1);
      else if (amiriSurahNum > 1) paginateAmiri(amiriSurahNum - 1, null, true);
    };

    const handleDragStart = (clientX) => { if (mushafAnimating) return; mushafDragStartRef.current = clientX; };
    const handleDragMove = (clientX) => { if (mushafDragStartRef.current === null || mushafAnimating) return; setMushafDragX(clientX - mushafDragStartRef.current); };
    const handleDragEnd = () => {
      if (mushafDragStartRef.current === null) return;
      if (mushafDragX < -70) { mushafFontStyle === "amiri" ? amiriGoNext() : mushafGoToPage(mushafPage + 1); }
      else if (mushafDragX > 70) { mushafFontStyle === "amiri" ? amiriGoPrev() : mushafGoToPage(mushafPage - 1); }
      else setMushafDragX(0);
      mushafDragStartRef.current = null;
    };

    // Group verses by surah to show bismillah banners
    let versesBySurah = [];
    if (mushafData?.verses) {
      let currentSurah = null;
      let group = [];
      for (const v of mushafData.verses) {
        if (v.chapter !== currentSurah) {
          if (group.length) versesBySurah.push({ surah: currentSurah, verses: group });
          currentSurah = v.chapter;
          group = [v];
        } else {
          group.push(v);
        }
      }
      if (group.length) versesBySurah.push({ surah: currentSurah, verses: group });
    }
    // In Quick Link mode: hide any OTHER surah's verses that happen to share this physical page
    // (e.g. tail end of the previous surah), so only the target surah is shown — like other Quran apps.
    if (mushafQuickLinkSurah) {
      versesBySurah = versesBySurah.filter(g => parseInt(g.surah) === mushafQuickLinkSurah);
    }

    const mushafBookmarks = getMushafBookmarks();


    return (
      <div className="fade" style={{ paddingBottom: 80, background: "linear-gradient(180deg,#1a0e04,#0d0802)", minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ padding: "10px 14px 8px", position: "sticky", top: 0, zIndex: 40, background: "linear-gradient(135deg,#2a1505,#1a0e04)", borderBottom: "1px solid #3d2410" }}>
          {/* Row 1: back, title, bookmark, goto */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <button onClick={() => { setShowQuranNav(true); setScreen("home"); setMushafQuickLink(null); setMushafQuickLinkSurah(null); setMushafHighlightVerse(null); setMushafTranslations({}); }}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.1)", border: "none", fontSize: 16, color: "#e8d5a8", cursor: "pointer", flexShrink: 0 }}>←</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              {mushafFontStyle === "amiri" ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e8d5a8", fontFamily: "'Amiri',serif" }}>{SURAHS.find(s => s.n === amiriSurahNum)?.name || "Complete Quran"}</div>
                  <div style={{ fontSize: 10, color: "#a8916a" }}>Page {amiriPageIndex + 1} of {amiriPages.length || 1} · Amiri Style</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e8d5a8", fontFamily: "'Amiri',serif" }}>{mushafData?.surahName || "Complete Quran"}</div>
                  <div style={{ fontSize: 10, color: "#a8916a" }}>Page {mushafPage} of 604{mushafData ? ` · Juz ${mushafData.juzNum}` : ""}</div>
                </>
              )}
            </div>
            <button onClick={saveMushafBookmark}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(200,168,75,.3)", border: "1px solid #c8a84b", fontSize: 16, color: "#c8a84b", cursor: "pointer", flexShrink: 0 }} title="Save this page">🔖</button>
            <button onClick={() => setShowMushafBookmarks(b => !b)}
              style={{ width: 32, height: 32, borderRadius: 8, background: showMushafBookmarks ? "#c8a84b" : "rgba(200,168,75,.15)", border: "1px solid #c8a84b55", fontSize: 11, color: showMushafBookmarks ? "#1a0e04" : "#c8a84b", cursor: "pointer", fontWeight: 700, flexShrink: 0 }} title="My saved pages">📋</button>
            <button onClick={() => {
                if (mushafFontStyle === "amiri") {
                  const surahInfo = SURAHS.find(s => s.n === amiriSurahNum);
                  setMushafFontStyle("classic");
                  try { localStorage.setItem("ql_mushaf_font_style", "classic"); } catch {}
                  openMushafReader(surahInfo ? surahInfo.page : 1);
                } else {
                  const anchorSurah = mushafData?.verses?.[0]?.chapter ? parseInt(mushafData.verses[0].chapter) : 1;
                  const anchorVerseNum = mushafData?.verses?.[0]?.number || null;
                  setMushafFontStyle("amiri");
                  try { localStorage.setItem("ql_mushaf_font_style", "amiri"); } catch {}
                  openAmiriReader(anchorSurah, anchorVerseNum);
                }
              }}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(200,168,75,.15)", border: "1px solid #c8a84b55", fontSize: 13, color: "#c8a84b", cursor: "pointer", flexShrink: 0 }}
              title={mushafFontStyle === "amiri" ? "Switch to Mushaf Style" : "Switch to Amiri Style"}>
              {mushafFontStyle === "amiri" ? "📜" : "📖"}
            </button>
          </div>

          {/* Saved bookmarks panel */}
          {showMushafBookmarks && (
            <div style={{ background: "#1a0e04", border: "1px solid #c8a84b44", borderRadius: 10, padding: "8px 0", marginBottom: 8, maxHeight: 180, overflowY: "auto" }}>
              {mushafBookmarks.length === 0
                ? <div style={{ padding: "12px 14px", color: "#a8916a", fontSize: 12, textAlign: "center" }}>No saved pages yet. Tap 🔖 to save a page.</div>
                : mushafBookmarks.map((b, i) => (
                  <div key={i} onClick={() => {
                      setShowMushafBookmarks(false);
                      if (b.mode === "amiri") {
                        setMushafFontStyle("amiri");
                        try { localStorage.setItem("ql_mushaf_font_style", "amiri"); } catch {}
                        openAmiriReader(b.surah, b.verseAnchor);
                      } else {
                        setMushafFontStyle("classic");
                        try { localStorage.setItem("ql_mushaf_font_style", "classic"); } catch {}
                        mushafGoToPage(b.page);
                      }
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", borderBottom: i < mushafBookmarks.length - 1 ? "1px solid #3d241044" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2a1505"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#8b6914,#c9943a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{b.mode === "amiri" ? "📖" : `P${b.page}`}</div>
                    <div style={{ flex: 1 }}>
                      {b.mode === "amiri" ? (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8d5a8" }}>{b.surahName} — Verse {b.verseAnchor}</div>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8d5a8" }}>Page {b.page} — {b.surah}</div>
                      )}
                      <div style={{ fontSize: 10, color: "#a8916a" }}>{b.mode === "amiri" ? "Amiri Style" : `Juz ${b.juz}`} · Saved {b.date}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#c8a84b", fontWeight: 700 }}>Go →</div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Row 2: Search bar with type selector */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select value={mushafSearchType} onChange={e => { setMushafSearchType(e.target.value); setMushafSearch(""); setMushafSearchResults([]); }}
              style={{ padding: "7px 8px", borderRadius: 8, border: "1px solid #c8a84b44", background: "#2a1505", color: "#e8d5a8", fontSize: 11, fontFamily: "inherit", outline: "none", flexShrink: 0, cursor: "pointer" }}>
              <option value="surah">Surah</option>
              <option value="page">Page</option>
              <option value="juz">Juz</option>
            </select>
            <div style={{ flex: 1, position: "relative" }}>
              <input value={mushafSearch} onChange={e => handleMushafSearch(e.target.value)}
                placeholder={mushafSearchType === "surah" ? "Search surah name..." : mushafSearchType === "page" ? "Enter page (1-604)" : "Enter juz (1-30)"}
                type={mushafSearchType === "surah" ? "text" : "number"}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #c8a84b44", background: "#2a1505", color: "#e8d5a8", fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
              {mushafSearchResults.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a0e04", border: "1px solid #c8a84b44", borderRadius: 8, zIndex: 100, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
                  {mushafSearchResults.map((r, i) => (
                    <div key={i} onClick={() => { setMushafFontStyle("classic"); try { localStorage.setItem("ql_mushaf_font_style", "classic"); } catch {}; mushafGoToPage(r.page); setMushafSearch(""); setMushafSearchResults([]); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderBottom: i < mushafSearchResults.length - 1 ? "1px solid #3d241044" : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2a1505"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8d5a8" }}>{r.label}</div>
                      </div>
                      {r.sub && <div className="ar" style={{ fontSize: 14, color: "#c8a84b" }}>{r.sub}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page card */}
        <div style={{ margin: "12px 10px", touchAction: "pan-y" }}
          onTouchStart={e => handleDragStart(e.touches[0].clientX)}
          onTouchMove={e => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
          onMouseDown={e => handleDragStart(e.clientX)}
          onMouseMove={e => { if (mushafDragStartRef.current !== null) handleDragMove(e.clientX); }}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => { if (mushafDragStartRef.current !== null) handleDragEnd(); }}>

          <div style={{
            background: "#f5f0e8",
            borderRadius: 4,
            boxShadow: "0 12px 40px rgba(0,0,0,.6), inset 0 0 0 6px #e8dcc8, inset 0 0 0 8px #c8a84b, inset 0 0 0 10px #e8dcc8",
            transform: `translateX(${mushafDragX}px) rotate(${mushafDragX / 50}deg)`,
            transition: mushafDragStartRef.current === null ? "transform .28s ease" : "none",
            cursor: "grab", userSelect: "none",
            position: "relative",
            minHeight: "75vh",
          }}>

            {/* Inner double border */}
            <div style={{ position: "absolute", inset: 14, border: "1px solid #c8a84b", pointerEvents: "none", zIndex: 1 }} />
            <div style={{ position: "absolute", inset: 17, border: "0.5px solid #e8d5a0", pointerEvents: "none", zIndex: 1 }} />

            <div style={{ padding: "22px 20px 16px", position: "relative", zIndex: 2 }}>

              {mushafFontStyle === "amiri" ? (
                <>
                  {/* ── AMIRI STYLE BODY — custom ~10-line pagination ── */}
                  {amiriLoading && amiriPages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#8b6914", fontFamily: "'Amiri',serif", fontSize: 18 }}>جاري التحميل...</div>
                  )}
                  {amiriError && (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{amiriError}</div>
                      <button onClick={() => paginateAmiri(amiriSurahNum)} style={{ padding: "8px 18px", borderRadius: 8, background: "#8b6914", color: "#fff", border: "none", fontSize: 12, cursor: "pointer" }}>Retry</button>
                    </div>
                  )}
                  {!amiriError && amiriPages.length > 0 && (() => {
                    const page = amiriPages[amiriPageIndex] || { verses: [] };
                    const surahInfo = SURAHS.find(s => s.n === amiriSurahNum);
                    const showSurahHeader = page.verses[0]?.number === 1;
                    const showBismillah = showSurahHeader && amiriSurahNum !== 1 && amiriSurahNum !== 9;
                    return (
                      <div>
                        {showSurahHeader && (
                          <div style={{ textAlign: "center", margin: "8px 0 6px", background: "linear-gradient(135deg,#1a4a2e,#0f5132)", borderRadius: 6, padding: "8px 12px", border: "1px solid #c8a84b" }}>
                            <div style={{ fontSize: 9, color: "#c8a84b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>سورة</div>
                            <div style={{ fontFamily: "'Amiri',serif", fontSize: 20, color: "#fff", fontWeight: 700 }}>{surahInfo?.ar}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{surahInfo?.name} · {surahInfo?.verses} verses · {surahInfo?.type}</div>
                          </div>
                        )}
                        {showBismillah && (
                          <div style={{ textAlign: "center", margin: "6px 0", background: "#fdf8ef", border: "1px solid #c8a84b", borderRadius: 4, padding: "6px 10px" }}>
                            <div style={{ fontFamily: "'Amiri',serif", fontSize: 20, color: "#1a0800", fontWeight: 700, direction: "rtl" }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                          </div>
                        )}
                        <div style={{ fontFamily: "'Amiri Quran','Amiri',serif", fontSize: 27, lineHeight: 2.5, textAlign: "justify", textAlignLast: "center", direction: "rtl", color: "#1a0800", fontWeight: 700 }}>
                          {page.verses.map((v, i) => (
                            <span key={i}>
                              {v.arabic}
                              <span style={{ fontSize: 15, color: "#8b6914", margin: "0 3px", fontFamily: "'Amiri',serif" }}>﴿{v.number}﴾</span>
                              {" "}
                            </span>
                          ))}
                        </div>
                        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 10, borderTop: "1px solid #c8a84b55", fontFamily: "'Amiri',serif", fontSize: 14, color: "#8b6914", fontWeight: 700 }}>
                          {amiriPageIndex + 1} / {amiriPages.length}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* ── CLASSIC / OFFICIAL 604-PAGE BODY ── */}
                  {mushafLoading && !mushafData && (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#8b6914", fontFamily: "'Amiri',serif", fontSize: 18 }}>جاري التحميل...</div>
                  )}
                  {mushafError && (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{mushafError}</div>
                      <button onClick={() => fetchMushafPage(mushafPage)} style={{ padding: "8px 18px", borderRadius: 8, background: "#8b6914", color: "#fff", border: "none", fontSize: 12, cursor: "pointer" }}>Retry</button>
                    </div>
                  )}

                  {mushafData && !mushafError && (
                    <div style={{ display: "flex", gap: 4 }}>

                      {/* RIGHT SIDE MARGIN — Ruku & Sajdah markers */}
                      <div style={{ width: 20, flexShrink: 0, direction: "rtl" }}>
                        {mushafData.verses.map((v, i) => {
                          const sajdah = isSajdahVerse(parseInt(v.chapter), v.number);
                          const ruku = isRukuStart(parseInt(v.chapter), v.number);
                          return (
                            <div key={i} style={{ minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 6 }}>
                              {ruku && <div style={{ fontSize: 14, color: "#0f5132", fontFamily: "'Amiri',serif", fontWeight: 700, lineHeight: 1 }} title="Ruku start">ع</div>}
                              {sajdah && <div style={{ fontSize: 13, color: "#8b6914", lineHeight: 1, marginTop: ruku ? 2 : 0 }} title="Sajdah">۩</div>}
                            </div>
                          );
                        })}
                      </div>

                      {/* MAIN TEXT AREA */}
                      <div style={{ flex: 1 }}>
                        {versesBySurah.map((group, gi) => {
                          const surahInfo = SURAHS.find(s => s.n === parseInt(group.surah));
                          const isFirstVerse = group.verses[0]?.number === 1;
                          const showBismillah = isFirstVerse && parseInt(group.surah) !== 1 && parseInt(group.surah) !== 9;
                          return (
                            <div key={gi}>
                              {/* Surah header banner */}
                              {isFirstVerse && (
                                <div style={{ textAlign: "center", margin: "8px 0 6px", background: "linear-gradient(135deg,#1a4a2e,#0f5132)", borderRadius: 6, padding: "8px 12px", border: "1px solid #c8a84b" }}>
                                  <div style={{ fontSize: 9, color: "#c8a84b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>سورة</div>
                                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 20, color: "#fff", fontWeight: 700 }}>{surahInfo?.ar || group.surah}</div>
                                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{surahInfo?.name} · {surahInfo?.verses} verses · {surahInfo?.type}</div>
                                </div>
                              )}
                              {/* Bismillah box */}
                              {showBismillah && (
                                <div style={{ textAlign: "center", margin: "6px 0", background: "#fdf8ef", border: "1px solid #c8a84b", borderRadius: 4, padding: "6px 10px" }}>
                                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 20, color: "#1a0800", fontWeight: 700, direction: "rtl" }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                </div>
                              )}
                              {/* Verses — Arabic */}
                              <div style={{ fontFamily: "'Amiri',serif", fontSize: 22, lineHeight: 2.2, textAlign: "justify", textAlignLast: "center", direction: "rtl", color: "#1a0800", fontWeight: 700 }}>
                                {group.verses.map((v, i) => {
                                  const isHighlighted = mushafHighlightVerse && v.number === mushafHighlightVerse && parseInt(v.chapter) === mushafQuickLinkSurah;
                                  return (
                                    <span key={i} id={isHighlighted ? "mushaf-highlight-verse" : undefined}
                                      style={isHighlighted ? { background: "linear-gradient(180deg,#fff3c4,#ffe08a)", borderRadius: 4, padding: "2px 4px", boxShadow: "0 0 0 2px #c9943a" } : undefined}>
                                      {v.arabic}
                                      <span style={{ fontSize: 15, color: "#8b6914", margin: "0 3px", fontFamily: "'Amiri',serif" }}>﴿{v.number}﴾</span>
                                      {" "}
                                    </span>
                                  );
                                })}
                              </div>
                              {/* Translations — shown only in Quick Link mode */}
                              {mushafQuickLink && (
                                <div style={{ marginTop: 10, marginBottom: 8 }}>
                                  {mushafTransLoading && Object.keys(mushafTranslations).length === 0 && (
                                    <div style={{ textAlign: "center", fontSize: 12, color: "#8b6914", padding: "8px 0" }}>Loading translation...</div>
                                  )}
                                  {group.verses.map((v) => {
                                    const key = `${v.chapter}:${v.number}`;
                                    const tr = mushafTranslations[key];
                                    if (!tr) return null;
                                    return (
                                      <div key={key} style={{ padding: "8px 10px", marginBottom: 6, background: "#fdf8ef", borderLeft: "3px solid #c8a84b", borderRadius: "0 6px 6px 0" }}>
                                        <div style={{ fontSize: 10, color: "#8b6914", fontWeight: 700, marginBottom: 3 }}>Verse {v.number}</div>
                                        <div style={{ fontSize: 13, color: "#2a1a00", lineHeight: 1.7 }}>{tr}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Page number */}
                        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 10, borderTop: "1px solid #c8a84b55", fontFamily: "'Amiri',serif", fontSize: 14, color: "#8b6914", fontWeight: 700 }}>
                          {mushafPage}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, padding: "0 14px", marginTop: 8 }}>
          {mushafFontStyle === "amiri" ? (
            <>
              <button onClick={amiriGoPrev} disabled={amiriPageIndex <= 0 && amiriSurahNum <= 1}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: (amiriPageIndex <= 0 && amiriSurahNum <= 1) ? "rgba(255,255,255,.05)" : "rgba(201,148,58,.2)", color: (amiriPageIndex <= 0 && amiriSurahNum <= 1) ? "#5a4a30" : "#e8d5a8", border: (amiriPageIndex <= 0 && amiriSurahNum <= 1) ? "none" : "1px solid #c8a84b44", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                → Previous
              </button>
              <button onClick={amiriGoNext} disabled={amiriPageIndex >= amiriPages.length - 1 && amiriSurahNum >= 114}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: (amiriPageIndex >= amiriPages.length - 1 && amiriSurahNum >= 114) ? "rgba(255,255,255,.05)" : "rgba(201,148,58,.2)", color: (amiriPageIndex >= amiriPages.length - 1 && amiriSurahNum >= 114) ? "#5a4a30" : "#e8d5a8", border: (amiriPageIndex >= amiriPages.length - 1 && amiriSurahNum >= 114) ? "none" : "1px solid #c8a84b44", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Next ←
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { mushafGoToPage(mushafPage - 1); if (mushafQuickLink) fetchMushafTranslations(mushafPage - 1); }} disabled={mushafPage <= 1}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: mushafPage <= 1 ? "rgba(255,255,255,.05)" : "rgba(201,148,58,.2)", color: mushafPage <= 1 ? "#5a4a30" : "#e8d5a8", border: mushafPage <= 1 ? "none" : "1px solid #c8a84b44", fontSize: 13, fontWeight: 600, cursor: mushafPage <= 1 ? "default" : "pointer" }}>
                → Previous
              </button>
              <button onClick={() => { mushafGoToPage(mushafPage + 1); if (mushafQuickLink) fetchMushafTranslations(mushafPage + 1); }} disabled={mushafPage >= 604}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: mushafPage >= 604 ? "rgba(255,255,255,.05)" : "rgba(201,148,58,.2)", color: mushafPage >= 604 ? "#5a4a30" : "#e8d5a8", border: mushafPage >= 604 ? "none" : "1px solid #c8a84b44", fontSize: 13, fontWeight: 600, cursor: mushafPage >= 604 ? "default" : "pointer" }}>
                Next ←
              </button>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#7a6a4a", marginTop: 8 }}>
          {mushafFontStyle === "amiri" ? "Swipe or drag to turn · 10 lines per page · Amiri Style" : "Swipe or drag the page to turn · Uthmani script from Quran.com"}
        </div>
        {/* Hidden measuring element for Amiri pagination — never visible */}
        <div ref={amiriMeasureRef} style={{ position: "fixed", top: -9999, left: -9999, visibility: "hidden", pointerEvents: "none", fontFamily: "'Amiri Quran','Amiri',serif", fontSize: AMIRI_FONT_SIZE, lineHeight: AMIRI_LINE_HEIGHT_MULT, direction: "rtl", textAlign: "justify" }} />
      </div>
    );
  };

  // ── PRAYER SCREEN ───────────────────────────────────────────
  const PrayerScreen = () => {
    const hijri = toHijri(new Date());
    const nextP = getNextPrayerItem(prayerTimes);
    const loadPrayers = () => {
      setLocationLoading(true);
      if (!navigator.geolocation) { alert("Geolocation not supported."); setLocationLoading(false); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        const {latitude:lat,longitude:lng} = pos.coords;
        const times = calcPrayerTimes(new Date(), lat, lng, getTimezone());
        setPrayerTimes(times);
        const dLng = toRad(39.8262 - lng);
        const lat1=toRad(lat), lat2=toRad(21.4225);
        const y=Math.sin(dLng)*Math.cos(lat2);
        const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);
        setQiblaAngle(Math.round((toDeg(Math.atan2(y,x))+360)%360));
        setLocationLoading(false);
      }, () => { setLocationLoading(false); alert("Please enable location access."); });
    };
    return (
      <div className="fade" style={{paddingBottom:80,minHeight:"100vh",background:"#f5f3ee"}}>
        <div style={{background:"linear-gradient(135deg,#0f5132,#1a7a4a)",padding:"14px 14px 20px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer",marginBottom:10}}>← Home</button>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>🕌 Prayer Times</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:3}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
          <div style={{fontSize:12,color:"#c8a84b",marginTop:2}}>{hijri.day} {hijri.monthName} {hijri.year} AH</div>
        </div>
        <div style={{padding:14}}>
          {!prayerTimes ? (
            <div style={{textAlign:"center",padding:"50px 20px"}}>
              <div style={{fontSize:56,marginBottom:16}}>🕌</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Get Accurate Prayer Times</div>
              <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Based on your exact GPS location</div>
              <button onClick={loadPrayers} disabled={locationLoading} style={{padding:"12px 28px",background:G,color:"#fff",border:"none",borderRadius:24,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {locationLoading?"Getting location...":"📍 Use My Location"}
              </button>
            </div>
          ) : (
            <>
              {nextP && <div style={{background:"linear-gradient(135deg,#0f5132,#1a7a4a)",borderRadius:16,padding:16,marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginBottom:4}}>NEXT PRAYER</div>
                <div style={{fontSize:24,color:"#fff",fontWeight:700}}>{nextP.icon} {nextP.name}</div>
                <div className="ar" style={{fontSize:20,color:"#c8a84b",marginTop:2}}>{nextP.ar}</div>
                <div style={{fontSize:28,color:"#fff",fontWeight:700,marginTop:6}}>{nextP.time}</div>
              </div>}
              <div style={{background:"#fff",borderRadius:14,overflow:"hidden",border:".5px solid #e2e8e4",marginBottom:12}}>
                {prayerTimes.map((p,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<prayerTimes.length-1?".5px solid #f0f0ec":"none",background:nextP?.name===p.name?"#f0faf5":"transparent"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontSize:20}}>{p.icon}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:nextP?.name===p.name?700:500,color:nextP?.name===p.name?G:"#1a1a1a"}}>{p.name}</div>
                        <div className="ar" style={{fontSize:13,color:"#9ba5b0"}}>{p.ar}</div>
                      </div>
                    </div>
                    <div style={{fontSize:16,fontWeight:700,color:nextP?.name===p.name?G:"#1a1a1a"}}>{p.time}</div>
                  </div>
                ))}
              </div>
              {qiblaAngle!==null && <div style={{background:"#fff",borderRadius:14,padding:16,textAlign:"center",border:".5px solid #e2e8e4",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:G,marginBottom:8}}>🧭 Qibla Direction</div>
                <div style={{width:100,height:100,margin:"0 auto 8px",borderRadius:"50%",border:`3px solid ${G}`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{position:"absolute",width:4,height:40,background:G,borderRadius:2,transformOrigin:"bottom center",bottom:"50%",left:"calc(50% - 2px)",transform:`rotate(${qiblaAngle}deg)`}}/>
                  <div style={{fontSize:20}}>🕋</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:G}}>{qiblaAngle}° from North</div>
                <div style={{fontSize:12,color:"#9ba5b0"}}>Face this direction to pray</div>
              </div>}
              <button onClick={loadPrayers} style={{width:"100%",padding:10,background:"transparent",color:G,border:`1px solid ${G}`,borderRadius:12,fontSize:13,cursor:"pointer"}}>🔄 Refresh Location</button>
            </>
          )}
        </div>
        <Nav/>
      </div>
    );
  };

  // ── ADHKAR SCREEN ───────────────────────────────────────────
  const AdhkarScreen = () => (
    <div className="fade" style={{paddingBottom:80,minHeight:"100vh",background:"#f5f3ee"}}>
      <div style={{background:"linear-gradient(135deg,#1a3a5c,#2563a8)",padding:"14px 14px 16px"}}>
        <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer",marginBottom:10}}>← Home</button>
        <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>📿 Morning & Evening Adhkar</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:3}}>Authentic dhikr from Quran & Sunnah</div>
      </div>
      <div style={{display:"flex",gap:8,padding:"12px 14px 4px"}}>
        {["morning","evening"].map(t=>(
          <button key={t} onClick={()=>setAdhkarTab(t)} style={{flex:1,padding:9,borderRadius:10,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",background:adhkarTab===t?"#1a3a5c":"#f0f0f0",color:adhkarTab===t?"#fff":"#5a6472"}}>
            {t==="morning"?"🌅 Morning":"🌙 Evening"}
          </button>
        ))}
      </div>
      <div style={{padding:"8px 14px"}}>
        {ADHKAR[adhkarTab].map((d,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:10,border:".5px solid #e2e8e4"}}>
            <div className="ar" style={{fontSize:22,direction:"rtl",textAlign:"right",lineHeight:1.8,color:"#1a0800",marginBottom:8}}>{d.ar}</div>
            <div style={{fontSize:13,color:"#1a1a1a",lineHeight:1.6,marginBottom:6}}>{d.en}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#9ba5b0"}}>Source: {d.source}</span>
              <span style={{background:G,color:"#fff",borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:700}}>×{d.count}</span>
            </div>
          </div>
        ))}
      </div>
      <Nav/>
      {ScrollFab()}
    </div>
  );

  // ── DUAS SCREEN ─────────────────────────────────────────────
  const DuasScreen = () => {
    const cats = ["all",...new Set(DUAS.map(d=>d.cat))];
    const list = duaCategory==="all" ? DUAS : DUAS.filter(d=>d.cat===duaCategory);
    return (
      <div className="fade" style={{paddingBottom:80,minHeight:"100vh",background:"#f5f3ee"}}>
        <div style={{background:"linear-gradient(135deg,#5c1a3a,#a82563)",padding:"14px 14px 16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer",marginBottom:10}}>← Home</button>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>🤲 Duas Collection</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:3}}>Authentic duas for every occasion</div>
        </div>
        <div style={{display:"flex",gap:6,padding:"12px 14px 4px",overflowX:"auto"}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setDuaCategory(c)} style={{padding:"6px 12px",borderRadius:16,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",background:duaCategory===c?"#5c1a3a":"#f0f0f0",color:duaCategory===c?"#fff":"#5a6472"}}>
              {c==="all"?"All Duas":c}
            </button>
          ))}
        </div>
        <div style={{padding:"8px 14px"}}>
          {list.map((d,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:10,border:".5px solid #e2e8e4"}}>
              <div style={{fontSize:11,color:"#a82563",fontWeight:700,marginBottom:8}}>{d.cat}</div>
              <div className="ar" style={{fontSize:22,direction:"rtl",textAlign:"right",lineHeight:1.8,color:"#1a0800",marginBottom:8}}>{d.ar}</div>
              <div style={{fontSize:13,color:"#1a1a1a",lineHeight:1.6,marginBottom:6}}>{d.en}</div>
              <div style={{fontSize:11,color:"#9ba5b0"}}>Source: {d.src}</div>
            </div>
          ))}
        </div>
        <Nav/>
        {ScrollFab()}
      </div>
    );
  };

  // ── 99 NAMES SCREEN ─────────────────────────────────────────
  const NamesScreen = () => {
    const list = ALLAH_NAMES.filter(n=>
      n.en.toLowerCase().includes(namesSearch.toLowerCase())||
      n.tr.toLowerCase().includes(namesSearch.toLowerCase())||
      n.ar.includes(namesSearch)
    );
    return (
      <div className="fade" style={{paddingBottom:80,minHeight:"100vh",background:"#f5f3ee"}}>
        <div style={{background:"linear-gradient(135deg,#1a4a5c,#1a7a8a)",padding:"14px 14px 16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer",marginBottom:10}}>← Home</button>
          <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>✨ 99 Names of Allah</div>
          <div className="ar" style={{fontSize:14,color:"#c8a84b",marginTop:3}}>أَسْمَاءُ اللَّهِ الْحُسْنَى</div>
        </div>
        <div style={{padding:"12px 14px 4px"}}>
          <input value={namesSearch} onChange={e=>setNamesSearch(e.target.value)} placeholder="Search names..." style={{width:"100%",padding:"10px 14px",borderRadius:12,border:".5px solid #ddd",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
        </div>
        <div style={{padding:"8px 14px"}}>
          {list.map((name,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:14,padding:14,marginBottom:8,border:".5px solid #e2e8e4",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1a4a5c,#1a7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{name.n}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{name.tr}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{name.en}</div>
                  </div>
                  <div className="ar" style={{fontSize:20,color:"#1a4a5c",fontWeight:700}}>{name.ar}</div>
                </div>
                <div style={{fontSize:12,color:"#9ba5b0",lineHeight:1.5}}>{name.m}</div>
              </div>
            </div>
          ))}
        </div>
        <Nav/>
        {ScrollFab()}
      </div>
    );
  };

  // ── TASBIH SCREEN ───────────────────────────────────────────
  const TasbihScreen = () => (
    <div className="fade" style={{paddingBottom:80,minHeight:"100vh",background:"linear-gradient(180deg,#0f5132,#1a1a2e)"}}>
      <div style={{padding:"14px 14px 8px"}}>
        <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>← Home</button>
      </div>
      <div style={{textAlign:"center",padding:"10px 20px 20px"}}>
        <div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:6,letterSpacing:2}}>DIGITAL TASBIH — مِسْبَحَة</div>
        <div className="ar" style={{fontSize:28,color:"#c8a84b",fontWeight:700,marginBottom:4}}>{tasbihLabel}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:24}}>{TASBIH_OPTS.find(t=>t.ar===tasbihLabel)?.en}</div>
        <div onClick={()=>setTasbihCount(c=>{const n=c+1;if(n>=tasbihTarget){setTimeout(()=>setTasbihCount(0),400);}return n;})}
          style={{width:180,height:180,borderRadius:"50%",background:"linear-gradient(135deg,#c8a84b,#8b6914)",margin:"0 auto 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 8px 30px rgba(200,168,75,.4)",userSelect:"none",WebkitUserSelect:"none"}}>
          <div style={{fontSize:64,fontWeight:700,color:"#fff",lineHeight:1}}>{tasbihCount}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:4}}>of {tasbihTarget}</div>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,.1)",borderRadius:3,margin:"0 30px 16px"}}>
          <div style={{height:"100%",width:`${Math.min((tasbihCount/tasbihTarget)*100,100)}%`,background:"#c8a84b",borderRadius:3,transition:"width .2s"}}/>
        </div>
        <button onClick={()=>setTasbihCount(0)} style={{padding:"8px 20px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:20,color:"#fff",fontSize:13,cursor:"pointer",marginBottom:20}}>Reset</button>
        <div style={{display:"flex",flexDirection:"column",gap:8,padding:"0 10px"}}>
          {TASBIH_OPTS.map((opt,i)=>(
            <button key={i} onClick={()=>{setTasbihLabel(opt.ar);setTasbihTarget(opt.t);setTasbihCount(0);}}
              style={{padding:"10px 16px",borderRadius:12,border:"none",background:tasbihLabel===opt.ar?"rgba(200,168,75,.3)":"rgba(255,255,255,.08)",color:"#fff",fontSize:13,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span className="ar" style={{fontSize:16}}>{opt.ar}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>×{opt.t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── HIFZ TRACKER SCREEN ─────────────────────────────────────
  const HifzScreen = () => {
    const memorized = Object.keys(hifzData).filter(k => hifzData[k] === "memorized").map(Number);
    const inProgress = Object.keys(hifzData).filter(k => hifzData[k] === "progress").map(Number);
    const totalVerses = memorized.reduce((sum, sn) => { const s = SURAHS.find(x => x.n === sn); return sum + (s ? s.verses : 0); }, 0);
    const pct = Math.round((memorized.length / 114) * 100);

    function setStatus(surahNum, status) {
      const updated = { ...hifzData };
      if (updated[surahNum] === status) { delete updated[surahNum]; }
      else { updated[surahNum] = status; }
      setHifzData(updated);
      try { localStorage.setItem("ql_hifz", JSON.stringify(updated)); } catch {}
    }

    return (
      <div className="fade" style={{ paddingBottom: 90, minHeight: "100vh", background: "#f5f3ee" }}>
        <div style={{ background: "linear-gradient(135deg,#0f5132,#1a7a4a)", padding: "14px 14px 16px" }}>
          <button onClick={() => { setShowQuranNav(true); }} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>← Quran</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>📗 Hifz Tracker</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Track your Quran memorization progress</div>
        </div>

        {/* Progress summary */}
        <div style={{ margin: "12px 14px 0", background: "#fff", borderRadius: 14, padding: 16, border: ".5px solid #e2e8e4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G }}>📖 {memorized.length} / 114 Surahs Memorized</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{pct}%</div>
          </div>
          <div style={{ height: 8, background: "#e8f5ee", borderRadius: 4, marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#27ae60,#1a7a4a)", borderRadius: 4, transition: "width .4s" }} />
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280" }}>
            <span>✅ {memorized.length} Memorized</span>
            <span>🔄 {inProgress.length} In Progress</span>
            <span>📝 {totalVerses} Verses Done</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 8, padding: "10px 14px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#27ae60" }} /> Memorized
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#e8b84b" }} /> In Progress
          </div>
          <div style={{ fontSize: 11, color: "#9ba5b0", marginLeft: 4 }}>Tap to toggle status</div>
        </div>

        {/* Surah list */}
        <div style={{ padding: "6px 14px" }}>
          {SURAHS.map(s => {
            const status = hifzData[s.n];
            return (
              <div key={s.n} style={{ background: status === "memorized" ? "#f0faf5" : status === "progress" ? "#fffbea" : "#fff", borderRadius: 12, padding: "10px 14px", marginBottom: 6, border: `.5px solid ${status === "memorized" ? "#27ae60" : status === "progress" ? "#e8b84b" : "#e2e8e4"}`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: status === "memorized" ? "#27ae60" : status === "progress" ? "#e8b84b" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: status ? "#fff" : "#9ba5b0", flexShrink: 0 }}>
                  {status === "memorized" ? "✓" : status === "progress" ? "~" : s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ba5b0" }}>{s.verses} verses · Juz {s.juz}</div>
                </div>
                <div className="ar" style={{ fontSize: 15, color: G, marginRight: 8 }}>{s.ar}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button onClick={() => setStatus(s.n, "memorized")}
                    style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: status === "memorized" ? "#27ae60" : "#e8f5ee", color: status === "memorized" ? "#fff" : "#27ae60", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                    ✓ Done
                  </button>
                  <button onClick={() => setStatus(s.n, "progress")}
                    style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: status === "progress" ? "#e8b84b" : "#fffbea", color: status === "progress" ? "#fff" : "#c9943a", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                    ~ WIP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <Nav />
        {ScrollFab()}
      </div>
    );
  };

  // ── EXTRA KNOWLEDGE SCREEN — menu for future features ────────
  const ExtraKnowledgeScreen = () => (
    <div className="fade" style={{ paddingBottom: 90, minHeight: "100vh", background: "#f5f3ee" }}>
      <div style={{ background: "linear-gradient(135deg,#2e0050,#4a235a)", padding: "14px 14px 16px" }}>
        <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>← Home</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🔮 Extra Knowledge</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Advanced Islamic knowledge tools</div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {/* Dream Interpretation */}
        <div onClick={() => setScreen("dream")}
          style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, border: ".5px solid #e2e8e4", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#2e0050,#4a235a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🌙</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 3 }}>Dream Interpretation</div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>Understand dreams through Islamic knowledge. Based on Quran, Hadith and classical scholars.</div>
          </div>
          <div style={{ fontSize: 18, color: "#9ba5b0" }}>›</div>
        </div>

        {/* Coming Soon placeholders */}
        {[
          { icon: "📜", title: "Isnad Checker", desc: "Verify Hadith chain of narrators — coming soon" },
          { icon: "🌍", title: "Prophets Map", desc: "Interactive map of prophet journeys — coming soon" },
          { icon: "📊", title: "Quran Statistics", desc: "Word counts, letter frequencies, patterns — coming soon" },
        ].map((item, i) => (
          <div key={i} style={{ background: "#f8f8f8", borderRadius: 16, padding: 18, marginBottom: 12, border: ".5px solid #e8e8e8", display: "flex", alignItems: "center", gap: 14, opacity: 0.6 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#666", marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#9ba5b0", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
            <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>Soon</div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  );

  // ── DREAM INTERPRETATION SCREEN ──────────────────────────────
  const DreamScreen = () => {
    async function interpretDream() {
      if (!dreamInput.trim()) return;
      setDreamLoading(true);
      setDreamResult(null);
      setDreamError(null);
      try {
        const langName = LANG_NAMES[lang] || "English";
        const prompt = `You are an Islamic dream interpreter. A person has described this dream: "${dreamInput}". 

Interpret this dream according to Islamic tradition. Use knowledge from:
1. The Quran where relevant
2. Authentic Hadith — especially the interpretations of Prophet Muhammad ﷺ and Ibn Sirin (the famous Islamic dream scholar)
3. Classical Islamic dream interpretation principles

Structure your answer clearly:
- What this dream may symbolize in Islamic tradition
- Any relevant Quranic verses or authentic Hadith related to the symbols
- General guidance

Be honest: if the dream has no specific Islamic interpretation, say so clearly. Never invent Hadith or fabricate Islamic rulings. Write in ${langName}.

IMPORTANT DISCLAIMER to include at the end: Remind the reader that dream interpretation is not a religious ruling (fatwa), that only scholars can give authoritative interpretations, and that good dreams are from Allah while bad dreams should be ignored and one should seek refuge in Allah.`;

        const result = await askAI(prompt, langName);
        setDreamResult(result);
      } catch (e) {
        setDreamError("Could not interpret dream. Please check your connection and try again.");
      }
      setDreamLoading(false);
    }

    return (
      <div className="fade" style={{ paddingBottom: 90, minHeight: "100vh", background: "#f5f3ee" }}>
        <div style={{ background: "linear-gradient(135deg,#2e0050,#4a235a)", padding: "14px 14px 16px" }}>
          <button onClick={() => setScreen("extraknowledge")} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>← Extra Knowledge</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🌙 Dream Interpretation</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Based on Quran, Hadith & Islamic scholarship</div>
        </div>

        <div style={{ padding: "14px 14px 0" }}>
          {/* Important note */}
          <div style={{ background: "#fffbea", borderRadius: 12, padding: 14, marginBottom: 14, border: ".5px solid #e8b84b" }}>
            <div style={{ fontSize: 12, color: "#7a5a00", lineHeight: 1.7 }}>
              <strong>📌 Islamic Guidance on Dreams:</strong><br />
              The Prophet ﷺ said: <em>"A good dream is from Allah, and a bad dream is from Satan."</em> (Bukhari 3292)<br />
              Good dreams: praise Allah. Bad dreams: seek refuge in Allah, do not share them.
            </div>
          </div>

          {/* Input */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5a6472", marginBottom: 8, textTransform: "uppercase", letterSpacing: .8 }}>Describe Your Dream</div>
          <textarea
            value={dreamInput}
            onChange={e => setDreamInput(e.target.value)}
            placeholder="Describe your dream in as much detail as you remember..."
            style={{ width: "100%", minHeight: 120, padding: 14, borderRadius: 12, border: ".5px solid #dde3e8", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", background: "#fff", lineHeight: 1.6 }}
          />

          <button onClick={interpretDream} disabled={dreamLoading || !dreamInput.trim()}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: dreamLoading || !dreamInput.trim() ? "#ccc" : "linear-gradient(135deg,#2e0050,#4a235a)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: dreamLoading || !dreamInput.trim() ? "default" : "pointer", marginTop: 10, fontFamily: "inherit" }}>
            {dreamLoading ? "Interpreting..." : "🔮 Interpret Dream"}
          </button>

          {dreamError && (
            <div style={{ marginTop: 14, padding: 14, background: "#fff5f5", borderRadius: 12, border: ".5px solid #fca5a5", fontSize: 13, color: "#dc2626" }}>
              ⚠️ {dreamError}
            </div>
          )}

          {dreamResult && (
            <div style={{ marginTop: 14 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: ".5px solid #e2e8e4", lineHeight: 1.8, fontSize: 13, color: "#1a1a1a" }}>
                {dreamResult}
              </div>
              <AIDisclosureNote />
              <ReportButton context={`Dream interpretation: ${dreamInput.substring(0, 80)}`} />
            </div>
          )}
        </div>
        <Nav />
        {ScrollFab()}
      </div>
    );
  };

  // ── MISTAKES CORRECTOR SHEET ─────────────────────────────────
  // User selects a verse, records their recitation, AI compares to correct text
  const MistakesSheet = () => {
    if (!showMistakes) return null;

    const s = curSurah || SURAHS[0];
    const selectedVerse = verses.find(v => v.number === mistakesVerseNum);

    async function startRecording() {
      setMistakesResult(null);
      setMistakesError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mistakesChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mistakesRecorderRef.current = recorder;
        recorder.ondataavailable = e => { if (e.data.size > 0) mistakesChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          await analyzeRecitation();
        };
        recorder.start();
        setMistakesRecording(true);
      } catch (e) {
        setMistakesError("Microphone access denied. Please allow microphone in your browser settings.");
      }
    }

    function stopRecording() {
      if (mistakesRecorderRef.current && mistakesRecording) {
        mistakesRecorderRef.current.stop();
        setMistakesRecording(false);
      }
    }

    async function analyzeRecitation() {
      if (!selectedVerse) return;
      setMistakesLoading(true);
      setMistakesError(null);
      try {
        // Convert audio blob to base64
        const blob = new Blob(mistakesChunksRef.current, { type: "audio/webm" });
        const base64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });

        // Send to Gemini with the correct Arabic verse text for comparison
        const key = import.meta.env.VITE_GEMINI_KEY || "";
        if (!key) throw new Error("NO_KEY");

        const body = JSON.stringify({
          contents: [{
            parts: [
              { text: `You are an expert Quran recitation teacher. The student just recited this Quranic verse: "${selectedVerse.arabic}" (${s.name}, Verse ${selectedVerse.number}).\n\nListen carefully to their audio recording and:\n1. Identify any pronunciation mistakes\n2. Point out specific letters or words that were wrong\n3. Explain the correct pronunciation clearly\n4. Give an overall assessment (Excellent / Good / Needs Practice)\n\nBe encouraging but honest. If you cannot clearly hear the audio, say so. Write in English.` },
              { inline_data: { mime_type: "audio/webm", data: base64 } }
            ]
          }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.4 }
        });

        // Try models that support audio
        const audioModels = ["gemini-2.5-flash-lite", "gemini-3-flash-preview", "gemini-3.1-flash-lite"];
        let result = null;
        for (const model of audioModels) {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body }
          );
          if (r.ok) {
            const d = await r.json();
            result = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (result) break;
          }
        }

        if (!result) throw new Error("Could not analyze audio. Please try again.");
        setMistakesResult(result);
      } catch (e) {
        if (e.message === "NO_KEY") {
          setMistakesError("AI key not configured. Please add your Gemini key in Vercel settings.");
        } else {
          setMistakesError(e.message || "Analysis failed. Please try again.");
        }
      }
      setMistakesLoading(false);
    }

    return (
      <div className="overlay" onClick={e => { if (e.target.classList.contains("overlay")) { if (mistakesRecording) stopRecording(); setShowMistakes(false); } }}>
        <div className="sheet" style={{ maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ width: 38, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 14px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🎙 Recitation Checker</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
            Select a verse, record yourself reciting it, and get feedback on your pronunciation.
          </div>

          {/* Important note */}
          <div style={{ background: "#fffbea", borderRadius: 10, padding: 12, marginBottom: 14, border: ".5px solid #e8b84b", fontSize: 11, color: "#7a5a00", lineHeight: 1.6 }}>
            ⚠️ <strong>Note:</strong> This tool uses AI to give general feedback. It is NOT a substitute for learning from a qualified Quran teacher (Ustadh/Ustadha). Always learn Tajweed from a human teacher.
          </div>

          {/* Verse selector */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Select Verse to Recite</div>
          {verses.length === 0 ? (
            <div style={{ padding: "12px 14px", background: "#fffbea", borderRadius: 10, border: ".5px solid #e8b84b", fontSize: 12, color: "#7a5a00", marginBottom: 12 }}>
              ⚠️ Please open a Surah first, then tap 🎙 Check to use this feature.
            </div>
          ) : (
            <select value={mistakesVerseNum || ""} onChange={e => { setMistakesVerseNum(parseInt(e.target.value)); setMistakesResult(null); setMistakesError(null); }}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `.5px solid ${mistakesVerseNum ? G : "#ddd"}`, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 12, background: "#fff", cursor: "pointer" }}>
              <option value="">— Choose a verse —</option>
              {verses.map(v => <option key={v.number} value={v.number}>Verse {v.number}</option>)}
            </select>
          )}

          {/* Show selected verse Arabic */}
          {selectedVerse && (
            <div style={{ background: "#f0faf5", borderRadius: 12, padding: 14, marginBottom: 14, border: `.5px solid ${G}` }}>
              <div style={{ fontSize: 11, color: G, fontWeight: 700, marginBottom: 6 }}>Verse {selectedVerse.number} — Recite this:</div>
              <div className="ar" style={{ fontSize: 22, direction: "rtl", textAlign: "right", lineHeight: 2, color: "#1a0800" }}>{selectedVerse.arabic}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>{selectedVerse.translation}</div>
            </div>
          )}

          {/* Recording controls */}
          {selectedVerse && (
            <div style={{ marginBottom: 14 }}>
              {!mistakesRecording ? (
                <button onClick={startRecording} disabled={mistakesLoading}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: mistakesLoading ? "#ccc" : "linear-gradient(135deg,#c0392b,#922b21)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: mistakesLoading ? "default" : "pointer", fontFamily: "inherit" }}>
                  🎙 Start Recording
                </button>
              ) : (
                <button onClick={stopRecording}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", animation: "pulse 1s infinite" }}>
                  ⏹ Stop & Analyze
                </button>
              )}
              {mistakesRecording && (
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "#c0392b", fontWeight: 600 }}>
                  🔴 Recording... Recite the verse now, then tap Stop
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {mistakesLoading && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                {[0,.15,.3].map((d,i) => <span key={i} className="bn" style={{ animationDelay: `${d}s` }} />)}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Analyzing your recitation...</div>
            </div>
          )}

          {/* Error */}
          {mistakesError && (
            <div style={{ padding: 14, background: "#fff5f5", borderRadius: 12, border: ".5px solid #fca5a5", fontSize: 13, color: "#dc2626", marginBottom: 14, lineHeight: 1.6 }}>
              ⚠️ {mistakesError}
            </div>
          )}

          {/* Result */}
          {mistakesResult && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>📋 Feedback</div>
              <div style={{ background: "#f8fafb", borderRadius: 12, padding: 14, border: ".5px solid #e2e8e4", fontSize: 13, lineHeight: 1.9, color: "#1a1a1a", whiteSpace: "pre-wrap" }}>
                {mistakesResult}
              </div>
              <AIDisclosureNote />
              <ReportButton context={`Recitation check: ${s.name} verse ${mistakesVerseNum}`} />
              <button onClick={() => { setMistakesResult(null); setMistakesError(null); }}
                style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 10, background: "#f0f0f0", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#333", fontFamily: "inherit" }}>
                🔄 Try Again
              </button>
            </div>
          )}

          <button onClick={() => { if (mistakesRecording) stopRecording(); setShowMistakes(false); }}
            style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#f4f4f4", color: "#333", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Close
          </button>
        </div>
      </div>
    );
  };

  // ── OFFLINE SCREEN ───────────────────────────────────────────
  const OfflineScreen = () => (
    <div className="fade" style={{ paddingBottom: 90, minHeight: "100vh", background: "#f5f3ee" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3a6c,#0d1f3a)", padding: "14px 14px 16px" }}>
        <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#fff", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>← Home</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>📥 Offline Mode</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Save Surahs to read without internet</div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {/* Status card */}
        <div style={{ background: offlineMode ? "#f0faf5" : "#fff", borderRadius: 14, padding: 16, marginBottom: 14, border: `.5px solid ${offlineMode ? "#27ae60" : "#e2e8e4"}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: offlineMode ? "#27ae60" : "#1a1a1a", marginBottom: 4 }}>
            {offlineMode ? "✅ Offline Data Saved" : "📡 No Offline Data Yet"}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
            {offlineMode
              ? `${offlineSurahs.length} Surahs saved to your browser. They will load without internet.`
              : "Download short Surahs so they load instantly even without internet connection."}
          </div>
          {offlineMode && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {offlineSurahs.map(sn => {
                const s = SURAHS.find(x => x.n === sn);
                return s ? (
                  <span key={sn} style={{ background: "#e8f5ee", color: "#1a5c2e", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                    {s.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{ background: "#fffbea", borderRadius: 12, padding: 14, marginBottom: 14, border: ".5px solid #e8b84b" }}>
          <div style={{ fontSize: 12, color: "#7a5a00", lineHeight: 1.7 }}>
            <strong>📌 Important to know:</strong><br />
            • Data is saved in your browser memory<br />
            • Always use <strong>normal browser</strong> — not incognito<br />
            • If you clear browser cache, data will be deleted<br />
            • Full offline support comes when app is on Play Store
          </div>
        </div>

        {/* Surahs that will be saved */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>Surahs Included in Download</div>
        {[1,103,104,105,106,107,108,109,110,111,112,113,114].map(sn => {
          const s = SURAHS.find(x => x.n === sn);
          const saved = offlineSurahs.includes(sn);
          return s ? (
            <div key={sn} style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 6, border: `.5px solid ${saved ? "#27ae60" : "#e2e8e4"}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: saved ? "#27ae60" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: saved ? "#fff" : "#9ba5b0", flexShrink: 0 }}>
                {saved ? "✓" : sn}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#9ba5b0" }}>{s.verses} verses</div>
              </div>
              <div className="ar" style={{ fontSize: 15, color: saved ? "#27ae60" : G }}>{s.ar}</div>
            </div>
          ) : null;
        })}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={async () => {
            setOfflineDownloading(true);
            const shortSurahs = [1,108,109,110,111,112,113,114,103,104,105,106,107];
            const saved = [];
            for (const sn of shortSurahs) {
              try {
                const url = `https://api.quran.com/api/v4/verses/by_chapter/${sn}?language=en&words=false&per_page=300&translations=131&fields=text_uthmani&_cb=${Date.now()}`;
                const r = await fetch(url, { cache: "no-store" });
                if (r.ok) {
                  const d = await r.json();
                  // Save in the MAPPED format that fetchVerses expects: {number, arabic, translation}
                  const mapped = (d.verses || []).map(v => ({
                    number: v.verse_number,
                    arabic: v.text_uthmani,
                    translation: (v.translations?.[0]?.text || "").replace(/<[^>]+>/g, "").trim(),
                  }));
                  localStorage.setItem(`ql_offline_s${sn}`, JSON.stringify(mapped));
                  saved.push(sn);
                }
              } catch {}
            }
            setOfflineSurahs(saved);
            localStorage.setItem("ql_offline_surahs", JSON.stringify(saved));
            localStorage.setItem("ql_offline", "on");
            setOfflineMode(true);
            setOfflineDownloading(false);
            alert(`✅ ${saved.length} Surahs saved for offline use!`);
          }} disabled={offlineDownloading}
            style={{ flex: 1, padding: "14px", borderRadius: 12, background: offlineDownloading ? "#ccc" : "linear-gradient(135deg,#1a3a6c,#0d1f3a)", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: offlineDownloading ? "default" : "pointer", fontFamily: "inherit" }}>
            {offlineDownloading ? "⏳ Downloading..." : "📥 Download Now"}
          </button>
          {offlineMode && (
            <button onClick={() => {
              offlineSurahs.forEach(sn => localStorage.removeItem(`ql_offline_s${sn}`));
              localStorage.removeItem("ql_offline");
              localStorage.removeItem("ql_offline_surahs");
              setOfflineMode(false);
              setOfflineSurahs([]);
              alert("Offline data cleared.");
            }}
              style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #c0392b", color: "#c0392b", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              🗑 Clear
            </button>
          )}
        </div>
      </div>
      <Nav />
      {ScrollFab()}
    </div>
  );

  // ── ROOT RENDER ─────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "100%", width: "100%", margin: "0 auto", fontFamily: "'Inter', sans-serif", background: "#f5f3ee", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{css}</style>
      {showSurahList && SurahListScreen()}
      {MushafStyleSelectSheet()}
      {!showSurahList && showQuranNav && QuranNavScreen()}
      {!showSurahList && !showQuranNav && screen === "home" && HomeScreen()}
      {!showSurahList && !showQuranNav && screen === "read" && ReadScreen()}
      {!showSurahList && !showQuranNav && screen === "kids" && KidsScreen()}
      {!showSurahList && !showQuranNav && screen === "bookmarks" && BookmarksScreen()}
      {!showSurahList && !showQuranNav && screen === "mushaf" && MushafReaderScreen()}
      {!showSurahList && !showQuranNav && screen === "prayer" && PrayerScreen()}
      {!showSurahList && !showQuranNav && screen === "adhkar" && AdhkarScreen()}
      {!showSurahList && !showQuranNav && screen === "duas" && DuasScreen()}
      {!showSurahList && !showQuranNav && screen === "names" && NamesScreen()}
      {!showSurahList && !showQuranNav && screen === "tasbih" && TasbihScreen()}
      {!showSurahList && !showQuranNav && screen === "hifz" && HifzScreen()}
      {!showSurahList && !showQuranNav && screen === "extraknowledge" && ExtraKnowledgeScreen()}
      {!showSurahList && !showQuranNav && screen === "dream" && DreamScreen()}
      {!showSurahList && !showQuranNav && screen === "offline" && OfflineScreen()}
      {ReportModal()}
    </div>
  );
}
