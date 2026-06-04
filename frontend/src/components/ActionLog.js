import React from "react";
import { FaHistory } from "react-icons/fa";

export default function ActionLog({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-desert-light p-4 rounded-xl shadow-inner border border-desert-dark mt-auto">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest border-b border-gray-300 pb-2 mb-2 flex items-center gap-2">
        <FaHistory /> Histórico
      </h3>
      <ul className="text-sm text-gray-700 space-y-1">
        {logs.map((log, index) => (
          <li
            key={index}
            className={`flex items-start gap-2 ${index === 0 ? "font-bold text-emerald" : "opacity-70"}`}
          >
            <span className="mt-1 text-[10px]">▶</span> {log}
          </li>
        ))}
      </ul>
    </div>
  );
}
