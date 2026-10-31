import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
}

interface CustomDropdownProps {
  options: (string | DropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  placeholder?: string;
  dropUp?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  placeholder = 'Select option...',
  dropUp = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-mono-meta text-stone-400 uppercase tracking-wider mb-1.5 font-bold">
          {label}
        </label>
      )}

      {/* Custom Built-in Trigger Button */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 bg-[#202020] hover:bg-[#262626] border border-[#333333] hover:border-[#E50914] focus:border-[#E50914] text-stone-200 text-xs font-mono-meta rounded-xs transition-colors shadow-sm cursor-pointer ${
          isOpen ? 'border-[#E50914] ring-1 ring-[#E50914]/40' : ''
        } ${buttonClassName}`}
      >
        <span className="truncate font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#E50914]' : ''
          }`}
        />
      </button>

      {/* Custom Built-in Floating Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            dropUp ? 'bottom-full mb-1.5' : 'mt-1.5'
          } w-full min-w-[200px] max-h-64 overflow-y-auto bg-[#181818] border border-[#2F2F2F] rounded-xs shadow-2xl z-50 py-1 divide-y divide-[#242424] ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-mono-meta flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50914]/15 text-[#E50914] font-bold'
                    : 'text-stone-300 hover:bg-[#252525] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#282828] text-stone-400 rounded-xs">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#E50914] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
