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
const LANG_TRANSLATIONS = { en: 131, ar: null };

// Preferred author keywords per language for picking best translation
const PREF = {
  ur:["maududi","jalandhry","ahmed ali"],hi:["omari","hindi"],fr:["hamidullah"],
  de:["bubenheim"],es:["garcia"],tr:["diyanet","ozturk"],id:["indonesian"],
  ms:["basmeih","malay"],bn:["bengali"],fa:["makarem","ansarian"],
  ru:["kuliev","osmanov"],zh:["makin","chinese"],pt:["nasr"],it:["piccardo"],
  nl:["keyzer"],pl:["bielawski"],ko:["korean"],ja:["japanese"],
  sw:["swahili"],bs:["korkut"],uk:["ukrainian"],ne:["nepali"]
};

async function loadTranslationIDs() {
  try {
    const r = await fetch("https://api.quran.com/api/v4/resources/translations");
    if (!r.ok) return;
    const d = await r.json();
    const byLang = {};
    for (const t of (d.translations || [])) {
      const lc = (t.language_name || "").toLowerCase();
      if (!byLang[lc]) byLang[lc] = [];
      byLang[lc].push(t);
    }
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
  } catch (e) { /* silently fail */ }
}
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
  {id:"uz",flag:"🇺ℤ",name:"Uzbekistan",langs:["uz","ru"]},
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
  {l:"أ",n:"Alif",s:"A",color:"#e74c3c",e:"🦁",w:"أسد",wm:"Lion"},
  {l:"ب",n:"Ba",s:"B",color:"#e67e22",e:"🦆",w:"بطة",wm:"Duck"},
  {l:"ت",n:"Ta",s:"T",color:"#f39c12",e:"🍎",w:"تفاحة",wm:"Apple"},
  {l:"ث",n:"Tha",s:"Th",color:"#27ae60",e:"🐍",w:"ثعبان",wm:"Snake"},
  {l:"ج",n:"Jim",s:"J",color:"#16a085",e:"🐪",w:"جمل",wm:"Camel"},
  {l:"ح",n:"Ha",s:"H",color:"#2980b9",e:"🐎",w:"حصان",wm:"Horse"},
  {l:"خ",n:"Kha",s:"Kh",color:"#8e44ad",e:"🐑",w:"خروف",wm:"Sheep"},
  {l:"د",n:"Dal",s:"D",color:"#c0392b",e:"🐻",w:"دب",wm:"Bear"},
  {l:"ذ",n:"Dhal",s:"Dh",color:"#d35400",e:"🐺",w:"ذئب",wm:"Wolf"},
  {l:"ر",n:"Ra",s:"R",color:"#7f8c8d",e:"🍇",w:"رمان",wm:"Pomegranate"},
  {l:"ز",n:"Zay",s:"Z",color:"#2ecc71",e:"🌺",w:"زهرة",wm:"Flower"},
  {l:"س",n:"Sin",s:"S",color:"#1abc9c",e:"🐟",w:"سمكة",wm:"Fish"},
  {l:"ش",n:"Shin",s:"Sh",color:"#3498db",e:"☀️",w:"شمس",wm:"Sun"},
  {l:"ص",n:"Sad",s:"S",color:"#9b59b6",e:"🦅",w:"صقر",wm:"Falcon"},
  {l:"ض",n:"Dad",s:"D",color:"#e91e63",e:"🐸",w:"ضفدع",wm:"Frog"},
  {l:"ط",n:"Ta",s:"T",color:"#ff5722",e:"🥁",w:"طبل",wm:"Drum"},
  {l:"ظ",n:"Dha",s:"Dh",color:"#795548",e:"🦌",w:"ظبي",wm:"Deer"},
  {l:"ع",n:"Ain",s:"'A",color:"#607d8b",e:"🍇",w:"عنب",wm:"Grapes"},
  {l:"غ",n:"Ghain",s:"Gh",color:"#e74c3c",e:"🐦",w:"غراب",wm:"Crow"},
  {l:"ف",n:"Fa",s:"F",color:"#e67e22",e:"🦋",w:"فراشة",wm:"Butterfly"},
  {l:"ق",n:"Qaf",s:"Q",color:"#f39c12",e:"🐱",w:"قطة",wm:"Cat"},
  {l:"ك",n:"Kaf",s:"K",color:"#27ae60",e:"🐶",w:"كلب",wm:"Dog"},
  {l:"ل",n:"Lam",s:"L",color:"#16a085",e:"🎮",w:"لعبة",wm:"Game"},
  {l:"م",n:"Mim",s:"M",color:"#2980b9",e:"💧",w:"ماء",wm:"Water"},
  {l:"ن",n:"Nun",s:"N",color:"#8e44ad",e:"🌟",w:"نجمة",wm:"Star"},
  {l:"ه",n:"Ha",s:"H",color:"#c0392b",e:"🌙",w:"هلال",wm:"Crescent"},
  {l:"و",n:"Waw",s:"W",color:"#d35400",e:"🌹",w:"وردة",wm:"Rose"},
  {l:"ي",n:"Ya",s:"Y",color:"#7f8c8d",e:"🕊️",w:"يمامة",wm:"Dove"},
];

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

  const transId = LANG_TRANSLATIONS[langCode] || 131;
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=${langCode}&words=false&per_page=300&translations=${transId}&fields=text_uthmani`;
  
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

  if (!LANG_TRANSLATIONS[langCode] && langCode !== "en" && langCode !== "ar") {
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

// ─── AUDIO ───────────────────────────────────────────────────
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
  const startVerse = SURAH_VERSE_STARTS[surahNum] || 1;
  const globalNum = startVerse + verseNum - 1;
  
  const url1 = `https://cdn.islamic.network/quran/audio/128/${qariId}/${globalNum}.mp3`;
  const url2 = `https://everyayah.com/data/${qariId.replace("ar.","")}/${String(surahNum).padStart(3,"0")}${String(verseNum).padStart(3,"0")}.mp3`;
  const url3 = `https://server8.mp3quran.net/afs/${String(surahNum).padStart(3,"0")}.mp3`;
  return [url1, url2, url3];
}

// ─── PRAYER TIMES ─────────────────────────────────────────────
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
  const [screen, setScreen] = useState("home"); 
  const [mushafMode, setMushafMode] = useState(false);
  const [surahNum, setSurahNum] = useState(null);
  const [continueDialog, setContinueDialog] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(24); 
  const [lang, setLang] = useState("en");
  const [qari, setQari] = useState("ar.alafasy");
  const [verses, setVerses] = useState([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [navTab, setNavTab] = useState("home");
  const [openPanel, setOpenPanel] = useState(null); 
  const [activeTab, setActiveTab] = useState("meaning");
  const [cache, setCache] = useState({}); 
  const [playKey, setPlayKey] = useState(null);
  const [showLang, setShowLang] = useState(false);
  const [showQari, setShowQari] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showJuz, setShowJuz] = useState(false);
  const [showGoto, setShowGoto] = useState(false);
  const [showBkSheet, setShowBkSheet] = useState(false);
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
  );

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

  const playVerse = useCallback((sn, vn, mode = "single", allVerses = null) => {
    stopAudio();
    setContinueDialog(null);
    const key = `${sn}:${vn}`;
    const [url1, url2] = getAudioUrls(qari, sn, vn);
    setPlayKey(key);

    let fallbackTimer = null;
    let finished = false;

    function handleFinished() {
      if (finished) return; 
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
          if (idx >= 0 && idx < allVerses.length - 1) {
            const nextVn = allVerses[idx + 1].number;
            const surahName = SURAHS.find(s => s.n === sn)?.name || "";
            const sajdah = isSajdahVerse(sn, vn);
            setContinueDialog({ sn, vn, nextVn, surahName, sajdah });
          }
        }
    }

    function tryUrl(url, fallbacks) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          fallbackTimer = setTimeout(() => {
            if (audioRef.current === audio) handleFinished();
          }, (audio.duration * 1000) + 800);
        }
      });

      audio.addEventListener("ended", () => {
        if (audioRef.current === audio) handleFinished();
      });

      audio.addEventListener("timeupdate", () => {
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
    if (tab === "tafsir")
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
    setActiveTab("meaning");
  }, [openPanel]);

  const switchTab = useCallback((verse, tab) => {
    setActiveTab(tab);
    if (tab !== "meaning") loadTabContent(verse, tab);
  }, [loadTabContent]);

  const changeLang = useCallback((code) => {
    setLang(code);
    setShowLang(false);
    setLangSearch("");
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

  const Nav = () => (
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

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🌍 Language</div>
          <button onClick={() => { setShowSettings(false); setShowLang(true); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `.5px solid ${G}`, background: "#f0faf5", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G }}>{curLang.n}</span>
            <span style={{ fontSize: 13, color: "#9ba5b0" }}>{curLang.na} ›</span>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6472", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>🎙 Reciter (Qari)</div>
          <button onClick={() => { setShowSettings(false); setShowQari(true); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `.5px solid ${G}`, background: "#f0faf5", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: G }}>{curQari.name}</span>
            <span style={{ fontSize: 11, color: "#9ba5b0" }}>{curQari.origin} ›</span>
          </button>
        </div>

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
              onClick={() => { setShowJuz(false); }}>
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

  // ── HOME SCREEN ─────────────────────────────────────────────
  const HomeScreen = () => (
    <div className="fade" style={{ paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(165deg,#051a0e 0%,${G} 50%,#1a7a45 100%)`, padding: "14px 14px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04 }}>
          <svg width="100%" height="100%"><defs><pattern id="p" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><polygon points="25,2 47,14 47,36 25,48 3,36 3,14" fill="none" stroke="#fff" strokeWidth=".6" /></pattern></defs><rect width="100%" height="100%" fill="url(#p)" /></svg>
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,.15)", borderRadius: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Next Prayer</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8b84b" }}>{PRAYER_NAMES[nextPrayer]} · {PRAYER_TIMES[nextPrayer]}</div>
            </div>
          </div>
          <div style={{ textAlign: "center", paddingBottom: 18 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 18, background: "rgba(201,148,58,.18)", border: ".5px solid rgba(201,148,58,.32)", color: "#e8b84b", fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>✨ Daily Verse · Al-Fatiha 5</div>
            <div className="ar" style={{ fontSize: 26, color: "#e8b84b", lineHeight: 1.8, marginBottom: 5 }}>إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontStyle: "italic" }}>"It is You we worship and You we ask for help."</div>
          </div>
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

      <div style={{ padding: "12px 13px 8px", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ba5b0", fontSize: 15, pointerEvents: "none" }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Surah name, meaning, number..."
            style={{ width: "100%", padding: "11px 36px 11px 40px", borderRadius: 12, border: ".5px solid #ddd", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }} />
          {query && <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#9ba5b0", fontSize: 16, cursor: "pointer" }}>✕</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "0 13px 10px", overflowX: "auto" }}>
        {[["all","All 114"],["meccan","Meccan"],["medinan","Medinan"],["juz30","Juz 30"],["short","Short ≤20"],["long","Long ≥100"]].map(([id, lbl]) => (
          <button key={id} className={`fc${filter === id ? " on" : ""}`} onClick={() => setFilter(id)}>{lbl}</button>
        ))}
      </div>

      <div style={{ padding: "0 13px 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ba5b0", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>⚡ Quick Links</div>
        <div className="ql-grid">
          {QUICK_LINKS.map(q => (
            <div key={q.name} className="qpill" onClick={() => openSurah(q.surah)}>
              <span style={{ fontSize: 18 }}>{q.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: G }}>{q.name}</span>
              <span className="ar" style={{ fontSize: 12, color: GOLD }}>{q.ar}</span>
            </div>
          ))}
        </div>
      </div>

      {lastRead && (
        <div style={{ margin: "0 13px 12px", padding: "10px 14px", borderRadius: 12, background: "linear-gradient(135deg,#f0faf5,#e6f7ee)", border: `.5px solid ${G}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: G, fontWeight: 700, textTransform: "uppercase" }}>📌 Continue Reading</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{lastRead.surahName} · Verse {lastRead.verse}</div>
          </div>
          <button className="btn-3d btn-3d-green" style={{ padding: "6px 14px", fontSize: 11 }} onClick={() => openSurah(lastRead.surahN)}>Resume ›</button>
        </div>
      )}

      <div style={{ padding: "0 13px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ba5b0", textTransform: "uppercase", letterSpacing: .8 }}>Surahs ({filtered.length})</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowJuz(true)} style={{ fontSize: 11, color: G, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>📚 Juz</button>
          <button onClick={() => setShowGoto(true)} style={{ fontSize: 11, color: G, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>📄 Page</button>
        </div>
      </div>

      <div style={{ margin: "0 13px", borderRadius: 14, overflow: "hidden", border: ".5px solid #e2e8e4", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.03)" }}>
        {filtered.map(s => (
          <div key={s.n} className="srow" onClick={() => openSurah(s.n)}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0faf5", border: `.5px solid ${G}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: G, flexShrink: 0 }}>{s.n}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{s.name}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 8, background: s.type === "Meccan" ? "#fef3c7" : "#dcfce7", color: s.type === "Meccan" ? "#d97706" : "#15803d", fontWeight: 600 }}>{s.type}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9ba5b0", marginTop: 2 }}>{s.meaning} · {s.verses} v</div>
            </div>
            <div className="ar" style={{ fontSize: 18, color: G, flexShrink: 0, marginLeft: 8 }}>{s.ar}</div>
            <button className="pbtn" style={{ marginLeft: 6 }} onClick={e => { e.stopPropagation(); openSurah(s.n, true); }}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── READ SCREEN ─────────────────────────────────────────────
  const ReadScreen = () => (
    <div className="fade" style={{ paddingBottom: 90 }}>
      <div style={{ background: `linear-gradient(165deg,#051a0e 0%,${G} 50%,#1a7a45 100%)`, padding: "12px 14px", sticky: "top", top: 0, zIndex: 50, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => { stopAudio(); setScreen("home"); setNavTab("home"); }} style={{ border: "none", background: "rgba(255,255,255,.15)", color: "#fff", width: 30, height: 30, borderRadius: "50%", fontSize: 14, cursor: "pointer" }}>←</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{curSurah?.name} <span className="ar" style={{ fontSize: 17, color: GOLD }}>{curSurah?.ar}</span></div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{curSurah?.meaning} · {curSurah?.verses} Verses · {curSurah?.type}</div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ border: "none", background: "rgba(255,255,255,.15)", color: "#fff", width: 30, height: 30, borderRadius: "50%", fontSize: 14, cursor: "pointer" }}>⚙️</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "6px 0 2px" }}>
          <button className={`mode-btn${!mushafMode ? " active" : ""}`} onClick={() => setMushafMode(false)}>📖 Verse View</button>
          <button className={`mode-btn${mushafMode ? " active" : ""}`} onClick={() => setMushafMode(true)}>📜 Mushaf Page</button>
        </div>
      </div>

      <div style={{ padding: "10px 13px" }}>
        {versesLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Spinner label={`Loading ${curSurah?.name} in ${curLang.n}...`} />
          </div>
        ) : versesError ? (
          <RetryRow msg={versesError} onRetry={() => openSurah(surahNum)} />
        ) : mushafMode ? (
          <div className="mushaf-wrap">
            <div className="mushaf-text">
              {verses.map(v => (
                <span key={v.number}>
                  {v.arabic} <span className="mushaf-num">{v.number}</span>{" "}
                </span>
              ))}
            </div>
          </div>
        ) : (
          verses.map(v => {
            const isPlaying = playKey === `${surahNum}:${v.number}`;
            const isOpen = openPanel === v.number;
            const sajdah = isSajdahVerse(surahNum, v.number);
            const bookmarked = isBk(surahNum, v.number);

            return (
              <div key={v.number} style={{ background: darkMode ? "#1a1a1a" : "#fff", borderRadius: 12, padding: "14px 14px 10px", marginBottom: 10, border: `.5px solid ${isPlaying ? G : (darkMode ? "#2a2a2a" : "#e2e8e4")}`, boxShadow: isPlaying ? `0 0 0 1px ${G}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: G, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{v.number}</div>
                    {sajdah && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "#fef3c7", color: "#d97706", fontWeight: 700 }}>۩ SAJDAH</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button className="bk-btn" onClick={() => toggleBk(surahNum, curSurah?.name, v.number, v.arabic, v.translation)} title="Bookmark">{bookmarked ? "🔖" : "📑"}</button>
                    <button className={`lbtn${isPlaying ? " pl" : ""}`} onClick={() => isPlaying ? stopAudio() : playVerse(surahNum, v.number, "single", verses)}>
                      {isPlaying ? "⏸ Stop" : "🔊 Listen"}
                    </button>
                  </div>
                </div>

                <div className="zoom-arabic">
                  <div className="ar" style={{ fontSize: fontSize, color: darkMode ? "#fff" : "#1a1a1a", direction: "rtl", textAlign: "right", lineHeight: 2, marginBottom: 8 }}>
                    {v.arabic}
                  </div>
                </div>

                {curLang.c !== "ar" && (
                  <div style={{ fontSize: 13, color: darkMode ? "#ccc" : "#4a5568", lineHeight: 1.6, marginBottom: 10 }}>
                    {v.translation}
                  </div>
                )}

                <div style={{ borderTop: `.5px solid ${darkMode ? "#2a2a2a" : "#f0f0ec"}`, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button className={`dbtn${isOpen ? " op" : ""}`} onClick={() => openDeepPanel(v)}>
                    💡 Deep Knowledge {isOpen ? "▲" : "▼"}
                  </button>
                  <span style={{ fontSize: 10, color: "#9ba5b0" }}>{curLang.n}</span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: darkMode ? "#111" : "#f8fafb", border: `.5px solid ${darkMode ? "#333" : "#e2e8e4"}` }}>
                    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, marginBottom: 8, borderBottom: `.5px solid ${darkMode ? "#333" : "#e2e8e4"}` }}>
                      {[["meaning","Meaning"],["tafsir","Tafsir"],["revelation","Context"],["science","Science"],["hadith","Hadith"]].map(([t, lbl]) => (
                        <button key={t} className={`tab${activeTab === t ? " on" : ""}`} onClick={() => switchTab(v, t)}>{lbl}</button>
                      ))}
                    </div>

                    {activeTab === "meaning" && (
                      <div style={{ fontSize: 13, lineHeight: 1.7, color: darkMode ? "#ddd" : "#2d3748" }}>
                        <div style={{ fontWeight: 600, color: G, marginBottom: 4 }}>Verse Meaning ({curLang.n}):</div>
                        {v.translation}
                      </div>
                    )}

                    {activeTab !== "meaning" && (
                      <AIBlock 
                        cacheKey={`${surahNum}-${v.number}-${activeTab}-${lang}`} 
                        onRetry={() => loadTabContent(v, activeTab, true)} 
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {continueDialog && (
        <div style={{ position: "fixed", bottom: 65, left: "50%", transform: "translateX(-50%)", width: "92%", maxWidth: 480, background: "#1a1a1a", color: "#fff", padding: "12px 16px", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,.3)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>AUDIO FINISHED</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Play Verse {continueDialog.nextVn}?</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setContinueDialog(null)} style={{ padding: "6px 12px", borderRadius: 12, background: "#333", color: "#fff", border: "none", fontSize: 12, cursor: "pointer" }}>Dismiss</button>
            <button onClick={() => playVerse(continueDialog.sn, continueDialog.nextVn, "single", verses)} style={{ padding: "6px 14px", borderRadius: 12, background: G, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Play Next ▶</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── KIDS SCREEN ─────────────────────────────────────────────
  const KidsScreen = () => (
    <div className="fade" style={{ paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg,#ff7e5f,#feb47b)", padding: "16px 14px", color: "#fff", borderRadius: "0 0 20px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>🎈 Kids Quran Academy</div>
        <div style={{ fontSize: 12, opacity: .9 }}>Learn Arabic Alphabets with fun words and pictures!</div>
      </div>

      <div style={{ padding: "0 13px" }}>
        {!kidLetter ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ba5b0", textTransform: "uppercase", marginBottom: 10 }}>Tap a letter to learn:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {ARABIC_ALPHA.map(a => {
                const isDone = learned.includes(a.l);
                return (
                  <div key={a.l} className="alpha-card" style={{ background: "#fff", border: `.5px solid ${a.color}44` }} onClick={() => setKidLetter(a)}>
                    <div className="ar" style={{ fontSize: 28, color: a.color, fontWeight: 700 }}>{a.l}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{a.n}</div>
                    {isDone && <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>✓ Done</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, textStyle: "center", border: `.5px solid ${kidLetter.color}`, boxShadow: "0 4px 15px rgba(0,0,0,.05)" }}>
            <button onClick={() => setKidLetter(null)} style={{ border: "none", background: "#f0f0f0", padding: "4px 12px", borderRadius: 12, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>← Back to All Letters</button>
            <div style={{ textAlign: "center" }}>
              <div className="ar" style={{ fontSize: 72, color: kidLetter.color, fontWeight: 700, lineHeight: 1 }}>{kidLetter.l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{kidLetter.n} ({kidLetter.s})</div>
              
              <div style={{ margin: "20px 0", padding: 16, background: "#fdf8f5", borderRadius: 14 }}>
                <div style={{ fontSize: 48 }}>{kidLetter.e}</div>
                <div className="ar" style={{ fontSize: 32, color: kidLetter.color, fontWeight: 700 }}>{kidLetter.w}</div>
                <div style={{ fontSize: 16, color: "#555", fontWeight: 600 }}>{kidLetter.wm}</div>
              </div>

              <button className="btn-3d btn-3d-green" style={{ width: "100%", padding: 12, fontSize: 14 }} onClick={() => {
                if (!learned.includes(kidLetter.l)) setLearned([...learned, kidLetter.l]);
                setKidLetter(null);
              }}>
                I Learned This Letter! 🎉
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── BOOKMARKS SCREEN ────────────────────────────────────────
  const BookmarksScreen = () => (
    <div className="fade" style={{ padding: "14px 13px 80px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔖 Saved Verses ({bookmarks.length})</div>
      {bookmarks.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#9ba5b0", fontSize: 13 }}>
          No saved verses yet. Tap 📑 on any verse while reading to bookmark it.
        </div>
      ) : (
        bookmarks.map((b, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, border: ".5px solid #e2e8e4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: G }}>{b.sname} · Verse {b.vn}</span>
              <button onClick={() => toggleBk(b.sn, b.sname, b.vn, b.arabic, b.translation)} style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>Remove ✕</button>
            </div>
            <div className="ar" style={{ fontSize: 18, direction: "rtl", textAlign: "right", color: "#1a1a1a", marginBottom: 6 }}>{b.arabic}</div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{b.translation}</div>
            <button className="rbtn" onClick={() => openSurah(b.sn)}>Read Surah ›</button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", background: darkMode ? "#0f0f0f" : "#f5f3ee", minHeight: "100vh", position: "relative" }}>
      <style>{css}</style>
      
      {screen === "home" && <HomeScreen />}
      {screen === "read" && <ReadScreen />}
      {screen === "kids" && <KidsScreen />}
      {screen === "bookmarks" && <BookmarksScreen />}

      <Nav />

      <SettingsSheet />
      <LangSheet />
      <QariSheet />
      <PrayerSheet />
      <JuzSheet />
      <GotoSheet />
      <BkSheet />
    </div>
  );
}
