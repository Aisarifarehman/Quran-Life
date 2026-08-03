import React, { useState, useEffect, useRef } from 'react';

// --- CONSTANTS & MAPPINGS ---
const TRANSLATIONS = {
  en: { id: 'en.sahih', name: 'English (Sahih International)' },
  ur: { id: 'ur.jalandhry', name: 'Urdu (Jalandhry)' },
  hi: { id: 'hi.farooq', name: 'Hindi (Farooq Khan)' },
  fr: { id: 'fr.hamidullah', name: 'French (Hamidullah)' },
  es: { id: 'es.cortes', name: 'Spanish (Cortes)' },
  bn: { id: 'bn.bengali', name: 'Bengali (Muhiuddin Khan)' },
  id: { id: 'id.indonesian', name: 'Indonesian (Bahasa)' },
  tr: { id: 'tr.ates', name: 'Turkish (Suleyman Artes)' },
  ru: { id: 'ru.kuliev', name: 'Russian (Kuliev)' },
  zh: { id: 'zh.jian', name: 'Chinese (Ma Jian)' }
};

const SAJDAH_AYAHS = [
  { surah: 7, ayah: 206, type: 'Recommended' },
  { surah: 13, ayah: 15, type: 'Recommended' },
  { surah: 16, ayah: 50, type: 'Recommended' },
  { surah: 17, ayah: 109, type: 'Recommended' },
  { surah: 19, ayah: 58, type: 'Recommended' },
  { surah: 22, ayah: 18, type: 'Recommended' },
  { surah: 22, ayah: 77, type: 'Obligatory (Shafi)' },
  { surah: 25, ayah: 60, type: 'Recommended' },
  { surah: 27, ayah: 26, type: 'Recommended' },
  { surah: 32, ayah: 15, type: 'Obligatory' },
  { surah: 38, ayah: 24, type: 'Recommended' },
  { surah: 41, ayah: 38, type: 'Obligatory' },
  { surah: 53, ayah: 62, type: 'Obligatory' },
  { surah: 84, ayah: 21, type: 'Recommended' },
  { surah: 96, ayah: 19, type: 'Obligatory' }
];

const ARABIC_LESSONS = [
  { id: 1, title: 'Alphabet Foundations', level: 'Beginner', count: 28 },
  { id: 2, title: 'Short Vowels (Harakat)', level: 'Beginner', count: 12 },
  { id: 3, title: 'Tanween & Sukoon', level: 'Intermediate', count: 15 },
  { id: 4, title: 'Shaddah & Madd', level: 'Intermediate', count: 18 },
  { id: 5, title: 'Basic Quranic Words', level: 'Advanced', count: 50 }
];

// --- INLINE SVG ICONS (NO EXTERNAL PACKAGE DEPENDENCIES) ---
const IconBook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
);
const IconPause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);
const IconBookmark = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
);
const IconHeart = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const IconSparkles = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('quran');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahAudio, setCurrentAyahAudio] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reciter, setReciter] = useState('ar.alafasy');

  const audioRef = useRef(null);

  // Fetch Surah list
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.code === 200 && Array.isArray(data.data)) {
          setSurahs(data.data);
        }
      })
      .catch((err) => console.error('Error fetching surahs:', err));
  }, []);

  // Fetch Ayahs & Translation
  useEffect(() => {
    setLoading(true);
    const translationId = TRANSLATIONS[language]?.id || 'en.sahih';

    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah}/${reciter}`),
      fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah}/${translationId}`)
    ])
      .then(async ([arabicRes, transRes]) => {
        const arabicData = await arabicRes.json();
        const transData = await transRes.json();

        if (arabicData?.code === 200 && transData?.code === 200) {
          const combinedAyahs = arabicData.data.ayahs.map((ayah, index) => ({
            ...ayah,
            translation: transData.data?.ayahs?.[index]?.text || ''
          }));
          setAyahs(combinedAyahs);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching ayahs:', err);
        setLoading(false);
      });
  }, [selectedSurah, language, reciter]);

  // Audio Handler
  const toggleAudio = (ayah) => {
    if (currentAyahAudio === ayah.number && isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setCurrentAyahAudio(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(ayah.audio);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      setCurrentAyahAudio(ayah.number);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAyahAudio(null);
      };
    }
  };

  const toggleBookmark = (surahNum, ayahNum) => {
    const key = `${surahNum}:${ayahNum}`;
    setBookmarks((prev) => 
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleFavorite = (surahNum) => {
    setFavorites((prev) =>
      prev.includes(surahNum) ? prev.filter((id) => id !== surahNum) : [...prev, surahNum]
    );
  };

  const filteredSurahs = surahs.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.englishName && s.englishName.toLowerCase().includes(q)) ||
      (s.name && s.name.includes(q)) ||
      (s.number && s.number.toString().includes(q))
    );
  });

  const activeSurahData = surahs.find((s) => s.number === selectedSurah);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-800 border-r border-slate-700 flex flex-col z-20 relative overflow-hidden`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <IconBook />
            <h1 className="font-bold text-lg tracking-wide">Quran Life</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <IconX />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-700 bg-slate-800/50 p-1 gap-1">
          <button 
            onClick={() => setActiveTab('quran')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition ${activeTab === 'quran' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Quran
          </button>
          <button 
            onClick={() => setActiveTab('sajdah')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition ${activeTab === 'sajdah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sajdah
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition ${activeTab === 'learn' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Learn
          </button>
        </div>

        {/* Search Input */}
        {activeTab === 'quran' && (
          <div className="p-3">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <IconSearch />
              </span>
              <input 
                type="text"
                placeholder="Search Surah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
          {activeTab === 'quran' &&
            filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => setSelectedSurah(surah.number)}
                className={`w-full p-3 text-left flex items-center justify-between transition ${
                  selectedSurah === surah.number ? 'bg-emerald-600/20 border-l-4 border-emerald-500' : 'hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-emerald-400">
                    {surah.number}
                  </span>
                  <div>
                    <div className="font-medium text-sm text-slate-200">{surah.englishName}</div>
                    <div className="text-xs text-slate-400">{surah.englishNameTranslation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(surah.number); }}
                    className="text-slate-500 hover:text-amber-400 p-1"
                  >
                    <IconHeart active={favorites.includes(surah.number)} />
                  </button>
                  <span className="text-right text-base font-serif text-emerald-400">{surah.name}</span>
                </div>
              </button>
            ))}

          {activeTab === 'sajdah' && (
            <div className="p-3 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sajdah Index</h3>
              {SAJDAH_AYAHS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedSurah(item.surah); setActiveTab('quran'); }}
                  className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/50 text-left flex justify-between items-center transition"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200">Surah {item.surah}, Ayah {item.ayah}</div>
                    <div className="text-xs text-emerald-400">{item.type}</div>
                  </div>
                  <IconChevronRight />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'learn' && (
            <div className="p-3 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Arabic Modules</h3>
              {ARABIC_LESSONS.map((lesson) => (
                <div key={lesson.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-slate-200">{lesson.title}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{lesson.level}</span>
                  </div>
                  <div className="text-xs text-slate-400">{lesson.count} Exercises</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 hover:text-white">
                <IconMenu />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {activeSurahData ? activeSurahData.englishName : 'Loading...'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeSurahData ? `${activeSurahData.revelationType} • ${activeSurahData.numberOfAyahs} Ayahs` : ''}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <select
              value={reciter}
              onChange={(e) => setReciter(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ar.alafasy">Mishary Rashid Alafasy</option>
              <option value="ar.abdulbasitmurattal">Abdul Basit</option>
              <option value="ar.ghamadi">Saad Al-Ghamdi</option>
            </select>

            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
              <span className="text-emerald-400"><IconGlobe /></span>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                {Object.entries(TRANSLATIONS).map(([key, item]) => (
                  <option key={key} value={key} className="bg-slate-800 text-slate-200">
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* AYAH CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedSurah !== 1 && selectedSurah !== 9 && (
            <div dir="rtl" className="text-center py-4 text-2xl font-serif text-emerald-400/90">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
              <span className="animate-spin text-emerald-500"><IconSparkles /></span> Loading Ayahs & Translations...
            </div>
          ) : (
            ayahs.map((ayah) => {
              const isBookmarked = bookmarks.includes(`${selectedSurah}:${ayah.numberInSurah}`);
              const isPlayingThis = currentAyahAudio === ayah.number && isPlaying;

              return (
                <div 
                  key={ayah.number} 
                  className={`bg-slate-800/40 border rounded-xl p-5 transition ${
                    isPlayingThis ? 'border-emerald-500/80 bg-emerald-950/10' : 'border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-700/50 text-emerald-400 border border-slate-600">
                      {selectedSurah}:{ayah.numberInSurah}
                    </span>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleAudio(ayah)}
                        className={`p-2 rounded-lg border transition ${
                          isPlayingThis 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isPlayingThis ? <IconPause /> : <IconPlay />}
                      </button>
                      
                      <button 
                        onClick={() => toggleBookmark(selectedSurah, ayah.numberInSurah)}
                        className={`p-2 rounded-lg border transition ${
                          isBookmarked 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <IconBookmark active={isBookmarked} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div dir="rtl" className="text-right font-serif text-2xl md:text-3xl leading-loose text-slate-100 mb-4">
                    {ayah.text}
                  </div>

                  {/* Translation */}
                  <div className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
                    {ayah.translation}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
