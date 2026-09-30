import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "../../hooks/useDebounce";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (debouncedValue: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  debounceDelay?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  defaultValue = "",
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
  size = "md",
  debounceDelay = 300,
  disabled = false,
  autoFocus = false,
  id,
  name,
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    value !== undefined ? value : defaultValue
  );

  // Sync internal state when controlled value prop changes from outside
  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  // Debounce the search term using useDebounce hook
  const debouncedValue = useDebounce(internalValue, debounceDelay);

  // Track initial mount to prevent unnecessary initial onSearch call
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setInternalValue(nextVal);
    onChange?.(nextVal);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
    onSearch?.("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.(internalValue);
    }
  };

  const sizeClasses = {
    sm: "py-2 pl-9 pr-8 text-xs",
    md: "py-2.5 pl-10 pr-9 text-xs sm:text-sm",
    lg: "py-3.5 pl-12 pr-10 text-sm sm:text-base",
  };

  const iconClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const paddingLeftWrapper = {
    sm: "pl-3",
    md: "pl-3.5",
    lg: "pl-4",
  };

  const currentDisplayValue = value !== undefined ? value : internalValue;

  return (
    <div className={`relative flex-1 ${className}`}>
      {/* Search Icon */}
      <div
        className={`absolute inset-y-0 left-0 ${paddingLeftWrapper[size]} flex items-center pointer-events-none text-slate-400`}
      >
        <svg
          className={`${iconClasses[size]} text-slate-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        id={id}
        name={name}
        type="text"
        disabled={disabled}
        autoFocus={autoFocus}
        value={currentDisplayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${sizeClasses[size]}`}
      />

      {/* Clear Button */}
      {currentDisplayValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 text-xs transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchInput;
