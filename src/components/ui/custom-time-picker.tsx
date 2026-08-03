import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CustomTimePickerProps {
  value: string; // HH:MM
  onChange: (time: string) => void;
  placeholder?: string;
}

export function CustomTimePicker({ value, onChange, placeholder = 'Select time' }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // internal state
  const [tempTime, setTempTime] = useState(value || '09:00');
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [isPM, setIsPM] = useState(parseInt(tempTime.split(':')[0]) >= 12);

  useEffect(() => {
    if (value) {
      setTempTime(value);
      setIsPM(parseInt(value.split(':')[0]) >= 12);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // reset on close
        setMode('hours');
        if (value) setTempTime(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const hStr = tempTime.split(':')[0];
  const mStr = tempTime.split(':')[1];
  let currentHour = parseInt(hStr, 10);
  let currentMinute = parseInt(mStr, 10);
  
  let displayHour12 = currentHour % 12;
  if (displayHour12 === 0) displayHour12 = 12;

  const R = 90; // outer radius
  const r = 70; // inner radius for the numbers

  const handleHourSelect = (h: number) => {
    let finalHour = h;
    if (isPM && h !== 12) finalHour += 12;
    if (!isPM && h === 12) finalHour = 0;
    
    const newTime = `${String(finalHour).padStart(2, '0')}:${mStr}`;
    setTempTime(newTime);
    setMode('minutes');
  };

  const handleMinuteSelect = (m: number) => {
    const newTime = `${hStr}:${String(m).padStart(2, '0')}`;
    setTempTime(newTime);
    onChange(newTime);
    // Auto-close after picking minute
    setTimeout(() => {
      setIsOpen(false);
      setTimeout(() => setMode('hours'), 300);
    }, 400);
  };

  const setAMPM = (pm: boolean) => {
    setIsPM(pm);
    let finalHour = displayHour12;
    if (pm && finalHour !== 12) finalHour += 12;
    if (!pm && finalHour === 12) finalHour = 0;
    const newTime = `${String(finalHour).padStart(2, '0')}:${mStr}`;
    setTempTime(newTime);
  };
  
  const generatePositions = (items: number[], isMinutes = false) => {
    return items.map((val, idx) => {
      const angle = (idx * 360) / items.length;
      const rad = (angle - 90) * (Math.PI / 180);
      const x = R + r * Math.cos(rad);
      const y = R + r * Math.sin(rad);
      return { val, x, y };
    });
  };

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const hourPositions = useMemo(() => generatePositions(hoursList), []);
  const minutePositions = useMemo(() => generatePositions(minutesList, true), []);

  const getHandRotation = () => {
    if (mode === 'hours') {
      return (displayHour12 * 30); // 360 / 12 = 30
    } else {
      return (currentMinute * 6); // 360 / 60 = 6
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setMode('hours');
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D3232A] flex items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer active:scale-[0.98]"
      >
        <span>{value || placeholder}</span>
        <Clock className="h-4 w-4 text-gray-400" />
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
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-10 p-5 bg-white rounded-[2rem] shadow-2xl border border-gray-200 w-[260px] flex flex-col items-center gap-5"
            >
              {/* Header / Digital Readout */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex text-4xl font-bold text-gray-800 tracking-tighter">
                  <button
                    type="button"
                    onClick={() => setMode('hours')}
                    className={`transition-colors cursor-pointer rounded-lg px-1 ${mode === 'hours' ? 'text-[#D3232A] bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    {String(displayHour12).padStart(2, '0')}
                  </button>
                  <span className="mx-0.5 text-gray-400 flex items-center pb-1">:</span>
                  <button
                    type="button"
                    onClick={() => setMode('minutes')}
                    className={`transition-colors cursor-pointer rounded-lg px-1 ${mode === 'minutes' ? 'text-[#D3232A] bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    {mStr}
                  </button>
                </div>
                <div className="flex flex-col text-[10px] font-bold border border-gray-200 rounded-lg overflow-hidden shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setAMPM(false)}
                    className={`px-2.5 py-1.5 cursor-pointer transition-colors ${!isPM ? 'bg-[#D3232A] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAMPM(true)}
                    className={`px-2.5 py-1.5 cursor-pointer transition-colors ${isPM ? 'bg-[#D3232A] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-t border-gray-200'}`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock Face */}
              <div className="relative bg-gray-50 rounded-full flex items-center justify-center shadow-inner" style={{ width: R * 2, height: R * 2 }}>
                {/* Center Dot */}
                <div className="absolute w-2 h-2 bg-[#D3232A] rounded-full z-30" />
                
                {/* Animated Hand */}
                <motion.div
                  className="absolute z-10 flex items-center justify-center origin-center pointer-events-none"
                  style={{ width: R * 2, height: R * 2 }}
                  animate={{ rotate: getHandRotation() }}
                  transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                >
                  <div className="absolute w-[3px] bg-[#D3232A] rounded-full" style={{ height: r, bottom: '50%', transformOrigin: 'bottom' }}>
                    <div className="absolute -top-3 -left-[14.5px] w-8 h-8 bg-[#D3232A] rounded-full opacity-20" />
                  </div>
                </motion.div>

                {/* Numbers */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(2px)' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    {(mode === 'hours' ? hourPositions : minutePositions).map(({ val, x, y }) => {
                      const isSelected = mode === 'hours' ? displayHour12 === val : currentMinute === val;
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => mode === 'hours' ? handleHourSelect(val) : handleMinuteSelect(val)}
                          className={`absolute flex items-center justify-center w-8 h-8 -ml-4 -mt-4 rounded-full text-[13px] font-bold transition-colors cursor-pointer z-20 ${
                            isSelected ? 'text-white' : 'text-gray-700 hover:bg-gray-200/60 hover:text-gray-900'
                          }`}
                          style={{ left: x, top: y }}
                        >
                          {mode === 'minutes' ? String(val).padStart(2, '0') : val}
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Quick Actions */}
              <div className="w-full flex justify-between items-center px-1">
                <button 
                    type="button" 
                    onClick={() => onChange(tempTime) || setIsOpen(false)} 
                    className="text-xs font-bold text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    onClick={() => onChange(tempTime) || setIsOpen(false)} 
                    className="text-xs font-bold text-white bg-[#D3232A] px-4 py-1.5 hover:bg-[#b01e23] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                    OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
