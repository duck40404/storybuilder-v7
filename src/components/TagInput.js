"use client";

import { useState } from "react";

export default function TagInput({ label, tags, onTagsChange, placeholder = "Add tag..." }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3 group">
      <label className="block text-sm font-medium text-zinc-400 transition-colors group-focus-within:text-emerald-400">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 bg-black/40 border border-zinc-700/80 rounded-xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all shadow-inner shadow-black/50 min-h-[56px]">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20 backdrop-blur-md animate-in zoom-in-95 duration-200"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-emerald-500 hover:text-emerald-300 transition-colors focus:outline-none ml-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-zinc-200 outline-none p-1 text-sm placeholder-zinc-600"
        />
      </div>
    </div>
  );
}
