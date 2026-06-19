import React, { useState, useEffect, useRef } from 'react';
import { Search, Building, GraduationCap, Check, Sparkles } from 'lucide-react';
import { INITIAL_COLLEGES, COLLEGE_CATEGORIES } from '../data/colleges';

interface CollegeSelectorProps {
  value: string;
  onChange: (collegeName: string) => void;
  darkMode: boolean;
  label?: string;
  id?: string;
}

export default function CollegeSelector({
  value,
  onChange,
  darkMode,
  label = "University / College Seat",
  id = "college-select"
}: CollegeSelectorProps) {
  // Try to determine the initial category of the current value
  const getInitialCategory = () => {
    if (!value) return 'Engineering'; // default
    const found = INITIAL_COLLEGES.find(c => c.name.toLowerCase() === value.toLowerCase());
    return found ? found.category : 'Other';
  };

  const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLocalChange = useRef(false);

  // Sync state if value changes externally
  useEffect(() => {
    if (isLocalChange.current) {
      setSearchQuery(value);
      isLocalChange.current = false;
      return;
    }

    setSearchQuery(value);
    const found = INITIAL_COLLEGES.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (found) {
      setSelectedCategory(found.category);
    } else if (value) {
      setSelectedCategory('Other');
    }
  }, [value]);

  // Filter colleges based on selected category and query
  const filteredColleges = INITIAL_COLLEGES.filter(college => {
    const matchesCategory = college.category === selectedCategory;
    const matchesSearch = college.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCollege = (name: string) => {
    isLocalChange.current = true;
    setSearchQuery(name);
    onChange(name);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    isLocalChange.current = true;
    setSearchQuery(text);
    onChange(text); // update value
    setShowSuggestions(true);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setShowSuggestions(true);
    // If we click a category, search within that category
    if (cat === 'Other') {
      // Clear or leave custom
    } else {
      // Find matches in the selected category
    }
  };

  // Predefined category emoji flags for modern visual design
  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'Engineering': return '🛠️';
      case 'Medical': return '🩺';
      case 'Management': return '📊';
      case 'Law': return '⚖️';
      case 'Design': return '🎨';
      case 'Science': return '🔬';
      default: return '🎓';
    }
  };

  return (
    <div className="space-y-2 text-left w-full" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
          {label}
        </label>
      )}

      {/* Category selector chips */}
      <div className="flex flex-wrap gap-1">
        {COLLEGE_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold tracking-tight transition-all border cursor-pointer border-solid flex items-center gap-1 shrink-0 ${
                isSelected
                  ? 'bg-indigo-500 text-white border-transparent shadow-xs'
                  : darkMode
                    ? 'text-slate-400 border-white/5 bg-[#09090C] hover:bg-white/5 hover:text-white'
                    : 'text-slate-600 border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:text-slate-900'
              }`}
            >
              <span>{getCategoryEmoji(cat)}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Search selection input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
          {selectedCategory === 'Other' ? <Building size={14} /> : <Search size={14} />}
        </span>
        <input
          id={id}
          type="text"
          required
          autoComplete="off"
          placeholder={
            selectedCategory === 'Other'
              ? "Type customized college/academy name..."
              : `Search in ${selectedCategory} (e.g., IIT, AIIMS, IIM)...`
          }
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className={`w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
            darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'
          }`}
        />

        {searchQuery && (
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[8px] font-mono text-indigo-500 font-bold uppercase tracking-wide">
            {selectedCategory}
          </span>
        )}

        {/* Suggestion popover list */}
        {showSuggestions && selectedCategory !== 'Other' && (
          <div className={`absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-xl border border-neutral-200/80 dark:border-white/10 shadow-xl no-scrollbar ${
            darkMode ? 'bg-[#121217] text-slate-100' : 'bg-white text-slate-800'
          }`}>
            <div className={`p-2 border-b border-neutral-100 dark:border-white/5 text-[9px] font-mono text-slate-400 flex items-center justify-between`}>
              <span>Catalog list matching "{searchQuery || 'All'}"</span>
              <span className="flex items-center gap-0.5"><Sparkles size={10} className="text-amber-500 animate-pulse" /> database MVP suggestions</span>
            </div>

            {filteredColleges.length > 0 ? (
              <div className="p-1 space-y-0.5">
                {filteredColleges.map((college) => {
                  const isCurrent = value.toLowerCase() === college.name.toLowerCase();
                  return (
                    <button
                      key={college.name}
                      type="button"
                      onClick={() => handleSelectCollege(college.name)}
                      className={`w-full text-left font-sans text-xs px-3 py-1.5 rounded-lg border-0 cursor-pointer flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-indigo-505/10 text-indigo-500 dark:text-indigo-400 font-bold'
                          : darkMode
                            ? 'hover:bg-white/5 text-slate-300'
                            : 'hover:bg-neutral-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GraduationCap size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{college.name}</span>
                      </div>
                      {isCurrent && <Check size={12} className="text-indigo-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                <p>No listed {selectedCategory} college matches.</p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Other')}
                  className="mt-1 text-indigo-500 hover:underline font-bold text-[10px] uppercase cursor-pointer border-0 bg-transparent"
                >
                  Type Completely Custom College 📝
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
