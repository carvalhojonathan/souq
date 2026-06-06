import React from "react";
import { FaHistory } from "react-icons/fa";

export default function ActionLog({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-desert-light dark:bg-gray-800 p-4 rounded-xl shadow-inner border border-desert-dark dark:border-gray-700 mt-auto transition-colors">
      <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest border-b border-gray-300 dark:border-gray-600 pb-2 mb-2 flex items-center gap-2 transition-colors">
        <FaHistory /> Histórico
      </h3>
      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 transition-colors">
        {logs.map((log, index) => (
          <li
            key={index}
            className={`flex items-start gap-2 transition-colors ${
              index === 0
                ? "font-bold text-emerald dark:text-green-400"
                : "opacity-70 dark:opacity-60"
            }`}
          >
            <span className="mt-1 text-[10px]">▶</span> {log}
          </li>
        ))}
      </ul>
    </div>
  );
}
