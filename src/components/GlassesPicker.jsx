// src/components/GlassesPicker.jsx
import React from "react";

export default function GlassesPicker({ suggestions, selectedId, onSelect, faceShape, onOverrideShape }) {
  const shapes = ["round", "square", "oval", "oblong", "heart", "diamond"]; 
  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Adjust face shape:</label>
        <select
          value={faceShape || ""}
          onChange={(e) => onOverrideShape?.(e.target.value)}
          className="select"
        >
          <option value="">Auto</option>
          {shapes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {suggestions.map((g) => {
          const isSelected = selectedId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              className={`text-left w-full group h-full`}
              title={g.name}
            >
              <div
                className={`rounded-xl border bg-white shadow-sm transition hover:shadow-md p-3 border-gray-200 h-full flex flex-col ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
              >
                <div className="relative w-full h-40 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={g.src}
                    alt={g.name}
                    className="absolute inset-0 w-full h-full object-contain p-2"
                  />
                </div>
                <div className="mt-2 h-16 overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 truncate" title={g.name}>{g.name}</div>
                  {Array.isArray(g.styles) && g.styles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.styles.slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{s}</span>
                      ))}
                      {g.styles.length > 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">+{g.styles.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 