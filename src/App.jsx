import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Volume2, Pause, BookOpen, 
  Sun, Moon, Type, ChevronDown, Check, X, Ticket, Play, Square
} from 'lucide-react';

export default function QuranVerseDetail({ 
  surahName = "Al-Fatiha",
  surahArabic = "الفاتحة",
  totalVerses = 7,
  juz = 1,
  page = 1,
  ticketCount = 0,
  versesData = [
    {
      id: 1,
      arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      audioUrl: "https://server8.mp3quran.net/afs/001001.mp3",
      translations: {
        english: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
        hindi: "अल्लाह के नाम से, जो अत्यंत दयावान्, असीम दया वाला है।",
        urdu: "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے۔"
      }
    },
    {
      id: 2,
      arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
      audioUrl: "https://server8.mp3quran.net/afs/001002.mp3",
      translations: {
        english: "[All] praise is [due] to Allah, Lord of the worlds.",
        hindi: "सब तारीख़ अल्लाह ही के लिए है जो तमाम जहानों का परवरदिगार है।",
        urdu: "سب تعریفیں اللہ ہی کے لیے ہیں جو تمام جہانوں کا پروردگار ہے۔"
      }
    }
  ],
  onBack
}) {
  // State variables
  const [selectedLang, setSelectedLang] = useState('urdu');
  const [selectedReciter, setSelectedReciter] = useState('Mishary');
  const [fontSize, setFontSize] = useState(24);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'mushaf'

  // Audio Playback State
  const [activeVerseIndex, setActiveVerseIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const audioRef = useRef(null);

  // Trigger prompt when current verse audio finishes
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (activeVerseIndex !== null && activeVerseIndex < versesData.length - 1) {
      setShowNextPrompt(true); // Show stop/continue prompt
    } else {
      setActiveVerseIndex(null);
    }
  };

  const handleContinueNext = () => {
    setShowNextPrompt(false);
    const nextIndex = activeVerseIndex + 1;
    setActiveVerseIndex(nextIndex);
    setIsPlaying(true);
  };

  const handleStopPlayback = () => {
    setShowNextPrompt(false);
    setIsPlaying(false);
    setActiveVerseIndex(null);
    if (audioRef.current) audioRef.current.pause();
  };

  const handlePlayPauseVerse = (index) => {
    setShowNextPrompt(false);
    if (activeVerseIndex === index && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setActiveVerseIndex(index);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying && activeVerseIndex !== null && audioRef.current) {
      audioRef.current.src = versesData[activeVerseIndex].audioUrl;
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
    }
  }, [activeVerseIndex, isPlaying]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-emerald-950/5 text-gray-800'}`}>
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={handleAudioEnded} 
      />

      {/* FULL HEADER (Restored All Top Bar Elements) */}
      <header className={`sticky top-0 z-30 shadow-md ${isDarkMode ? 'bg-emerald-950 text-white' : 'bg-emerald-900 text-white'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Title & Navigation */}
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-100" />
              </button>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg leading-none">{surahName}</h1>
                  <span className="font-serif text-xl text-emerald-300 dir-rtl">{surahArabic}</span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Meccan • {totalVerses} verses • Juz {juz} • Page {page}
                </p>
              </div>
            </div>

            {/* Header Right Badges & Selectors */}
            <div className="flex items-center gap-2">
              
              {/* Reciter Badge */}
              <div className="flex items-center gap-1 bg-emerald-800/80 text-emerald-100 px-3 py-1 rounded-full text-xs font-medium border border-emerald-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <select 
                  value={selectedReciter} 
                  onChange={(e) => setSelectedReciter(e.target.value)}
                  className="bg-transparent text-emerald-100 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="Mishary" className="text-gray-900">Mishary</option>
                  <option value="Sudais" className="text-gray-900">Sudais</option>
                  <option value="Ghamadi" className="text-gray-900">Ghamadi</option>
                </select>
              </div>

              {/* Language Selector */}
              <div className="bg-emerald-800/80 text-emerald-100 px-3 py-1 rounded-full text-xs font-medium border border-emerald-700/60">
                <select 
                  value={selectedLang} 
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-emerald-100 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="urdu" className="text-gray-900">اردو</option>
                  <option value="hindi" className="text-gray-900">हिंदी</option>
                  <option value="english" className="text-gray-900">English</option>
                </select>
              </div>

              {/* Ticket Counter Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-950/60 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-700/60">
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span>{ticketCount}</span>
              </div>

            </div>
          </div>

          {/* Bottom Row: View Modes & Text Controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-emerald-800/60 text-xs">
            
            {/* View Switcher */}
            <div className="flex items-center bg-emerald-950/60 p-1 rounded-full border border-emerald-800">
              <button 
                onClick={() => setViewMode('normal')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-colors ${viewMode === 'normal' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-200'}`}
              >
                <span>Normal</span>
              </button>
              <button 
                onClick={() => setViewMode('mushaf')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-colors ${viewMode === 'mushaf' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-200'}`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Mushaf</span>
              </button>
            </div>

            {/* Font Sizing & Dark Toggle */}
            <div className="flex items-center gap-3">
              
              {/* Arabic Font Sizer */}
              <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                <span className="text-emerald-300 text-[11px]">Arabic Size:</span>
                <button 
                  onClick={() => setFontSize(prev => Math.max(18, prev - 2))}
                  className="w-5 h-5 flex items-center justify-center rounded bg-emerald-800 text-white font-bold hover:bg-emerald-700"
                >
                  A-
                </button>
                <span className="text-emerald-100 font-mono text-xs w-4 text-center">{fontSize}</span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
                  className="w-5 h-5 flex items-center justify-center rounded bg-emerald-800 text-white font-bold hover:bg-emerald-700"
                >
                  A+
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-1.5 bg-emerald-800/80 text-emerald-100 px-3 py-1 rounded-full border border-emerald-700/60 hover:bg-emerald-800"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* VERSE LIST */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {versesData.map((verse, index) => {
          const isThisPlaying = activeVerseIndex === index && isPlaying;

          return (
            <div 
              key={verse.id} 
              className={`rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-800 text-gray-100' 
                  : 'bg-white border-emerald-100 text-gray-800 shadow-sm'
              } ${isThisPlaying ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                    {verse.id}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    Verse {verse.id} of {totalVerses} • {surahName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePlayPauseVerse(index)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isThisPlaying 
                        ? 'bg-amber-500 text-emerald-950 hover:bg-amber-400' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isThisPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Arabic Text */}
              <div className="px-6 py-6 text-right">
                <p 
                  className="font-serif leading-loose dir-rtl text-gray-900 dark:text-gray-50"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {verse.arabic}
                </p>
              </div>

              {/* Translation */}
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {verse.translations[selectedLang] || verse.translations.english}
                </p>
              </div>

            </div>
          );
        })}
      </main>

      {/* STOP / CONTINUE POPUP MODAL */}
      {showNextPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Verse Completed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Do you want to play the next verse or stop playback?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStopPlayback}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors"
              >
                <Square className="w-4 h-4 fill-current text-red-500" />
                <span>Stop</span>
              </button>
              <button
                onClick={handleContinueNext}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Next</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
