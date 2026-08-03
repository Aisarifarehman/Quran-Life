import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Search, Play, Pause, Bookmark, Heart, 
  Volume2, Globe, Sparkles, Moon, Sun, Award,
  CheckCircle, Clock, ChevronRight, Menu, X, Share2,
  Compass, MapPin, Radio, GraduationCap, Layers, Grid
} from 'lucide-react';

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

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', lat: 21.4225, lng: 39.8262 },
  { code: 'UAE', name: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { code: 'IN', name: 'India', lat: 20.5937, lng: 78.9629 },
  { code: 'PK', name: 'Pakistan', lat: 30.3753, lng: 69.3451 },
  { code: 'BD', name: 'Bangladesh', lat: 23.6850, lng: 90.3563 },
  { code: 'US', name: 'United States', lat: 37.0902, lng: -95.7129 },
  { code: 'UK', name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
  { code: 'CA', name: 'Canada', lat: 56.1304, lng: -106.3468 }
];

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

export default function App() {
  // State definitions
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
  const [selectedCountry, setSelectedCountry] = useState('UAE');
  const [prayerTimes, setPrayerTimes] = useState(null);

  const audioRef = useRef(null);

  // Fetch initial Surah list
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          setSurahs(data.data);
        }
      })
      .catch((err) => console.error("Error fetching surahs:", err));
  }, []);

  // Fetch Ayahs with selected language translation
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

        if (arabicData.code === 200 && transData.code === 200) {
          const combinedAyahs = arabicData.data.ayahs.map((ayah, index) => ({
            ...ayah,
            translation: transData.data.ayahs[index]?.text || ''
          }));
          setAyahs(combinedAyahs);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching ayahs:", err);
        setLoading(false);
      });
  }, [selectedSurah, language, reciter]);

  // Handle Audio Playback
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

  // Bookmark Toggle
  const toggleBookmark = (surahNum, ayahNum) => {
    const key = `${surahNum}:${ayahNum}`;
    setBookmarks((prev) => 
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  // Favorite Toggle
  const toggleFavorite = (surahNum) => {
    setFavorites((prev) =>
      prev.includes(surahNum) ? prev.filter((id) => id !== surahNum) : [...prev, surahNum]
    );
  };

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery) ||
    s.number.toString().includes(searchQuery)
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-800 border-r border-slate-700 flex flex-col z-20 relative`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-400 w-6 h-6" />
            <h1 className="font-bold text-lg text-emerald-400 tracking-wide">Quran Life</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50 p-1 gap-1">
          <button 
            onClick={() => setActiveTab('quran')}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${activeTab === 'quran' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Quran
          </button>
          <button 
            onClick={() => setActiveTab('sajdah')}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${activeTab === 'sajdah' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sajdah
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${activeTab === 'learn' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Learn
          </button>
        </div>

        {/* Search */}
        {activeTab === 'quran' && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
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

        {/* Sidebar Content List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
          {activeTab === 'quran' && (
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
                    className="text-slate-500 hover:text-amber-400"
                  >
                    <Heart size={14} fill={favorites.includes(surah.number) ? "#fbbf24" : "none"} className={favorites.includes(surah.number) ? "text-amber-400" : ""} />
                  </button>
                  <span className="text-right text-base font-serif text-emerald-400">{surah.name}</span>
                </div>
              </button>
            ))
          )}

          {activeTab === 'sajdah' && (
            <div className="p-3 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sajdah Index</h3>
              {SAJDAH_AYAHS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedSurah(item.surah); setActiveTab('quran'); }}
                  className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/50 text-left flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200">Surah {item.surah}, Ayah {item.ayah}</div>
                    <div className="text-xs text-emerald-400">{item.type}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
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
        
        {/* TOP TOOLBAR */}
        <header className="h-16 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 hover:text-white">
                <Menu size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {surahs.find(s => s.number === selectedSurah)?.englishName || 'Loading...'}
              </h2>
              <p className="text-xs text-slate-400">
                {surahs.find(s => s.number === selectedSurah)?.revelationType} • {surahs.find(s => s.number === selectedSurah)?.numberOfAyahs} Ayahs
              </p>
            </div>
          </div>

          {/* Controls: Reciter & Translation Language Selection */}
          <div className="flex items-center gap-3">
            
            {/* Reciter Selector */}
            <select
              value={reciter}
              onChange={(e) => setReciter(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ar.alafasy">Mishary Rashid Alafasy</option>
              <option value="ar.abdulbasitmurattal">Abdul Basit</option>
              <option value="ar.ghamadi">Saad Al-Ghamdi</option>
            </select>

            {/* Dynamic Multi-Language Selector */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
              <Globe size={16} className="text-emerald-400" />
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

        {/* AYAH READING PANEL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Bismillah Header */}
          {selectedSurah !== 1 && selectedSurah !== 9 && (
            <div className="text-center py-4 text-2xl font-serif text-emerald-400/90 dir-rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
              <Sparkles className="animate-spin text-emerald-500" /> Loading Ayahs & Translation...
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
                        {isPlayingThis ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      
                      <button 
                        onClick={() => toggleBookmark(selectedSurah, ayah.numberInSurah)}
                        className={`p-2 rounded-lg border transition ${
                          isBookmarked 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="text-right font-serif text-2xl md:text-3xl leading-loose text-slate-100 mb-4 dir-rtl">
                    {ayah.text}
                  </div>

                  {/* Translation Text (Updates Dynamically per Selected Language) */}
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
