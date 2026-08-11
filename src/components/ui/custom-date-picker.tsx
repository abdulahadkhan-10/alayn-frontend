import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
}

export function CustomDatePicker({ value, onChange, minDate }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedDate = value ? new Date(value) : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D3232A] flex items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer active:scale-[0.98]"
      >
        <span>{value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}</span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/10 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Picker Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-10 p-5 bg-white rounded-3xl shadow-2xl border border-gray-200/50 w-[300px]"
            >
              <div className="flex items-center justify-between mb-5">
                <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-600 active:scale-95">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-base font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</span>
                <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-600 active:scale-95">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-3 text-center">
                {dayNames.map(day => (
                  <div key={day} className="text-[11px] font-bold text-gray-400 uppercase">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9 w-9" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                  const formattedDay = String(day).padStart(2, '0');
                  const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

                  const isSelected = value && parseInt(value.split('-')[2], 10) === day && parseInt(value.split('-')[1], 10) === currentMonth + 1 && parseInt(value.split('-')[0], 10) === currentYear;
                  const isDisabled = minDate ? dateStr < minDate : false;

                  return (
                    <button
                      type="button"
                      key={day}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSelectDate(day)}
                      className={`h-9 w-9 rounded-full text-sm font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isDisabled
                          ? 'text-gray-300 cursor-not-allowed opacity-50'
                          : isSelected 
                          ? 'bg-[#D3232A] text-white shadow-md scale-105' 
                          : 'text-gray-700 hover:bg-red-50 hover:text-[#D3232A] active:scale-95'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
