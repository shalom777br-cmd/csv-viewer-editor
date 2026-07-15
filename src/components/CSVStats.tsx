import React, { useState } from 'react';
import { Column, Row } from '../types';
import { BarChart3, ChevronDown, ChevronUp, Calculator, Hash, Tag, AlertCircle } from 'lucide-react';

interface CSVStatsProps {
  headers: Column[];
  rows: Row[];
}

export default function CSVStats({ headers, rows }: CSVStatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (headers.length === 0 || rows.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Trigger Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">カラム統計分析 (簡易アナリティクス)</span>
          <span className="px-2 py-0.5 text-2xs font-medium bg-indigo-50 text-indigo-700 rounded-full font-sans">
            自動検出
          </span>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
        </div>
      </button>

      {/* Expanded view */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {headers.map((col) => {
              // Gather values for this column
              const values = rows.map(r => (r.cells[col.id] || '').trim());
              const totalCount = values.length;
              const emptyCount = values.filter(v => v === '').length;
              const filledCount = totalCount - emptyCount;

              // Unique values count
              const uniqueValues = new Set(values.filter(v => v !== ''));
              const uniqueCount = uniqueValues.size;

              // Try parsing as numbers
              const numValues: number[] = [];
              let isNumeric = false;
              let sum = 0;
              let min = Infinity;
              let max = -Infinity;

              values.forEach(v => {
                if (v === '') return;
                // Strip currency symbol, comma dividers, percent signs, etc.
                const cleanV = v.replace(/[¥$,%円\s]/g, '');
                const num = Number(cleanV);
                if (!isNaN(num) && cleanV !== '') {
                  numValues.push(num);
                }
              });

              // If more than 60% of filled cells are numeric, treat column as numeric
              if (filledCount > 0 && numValues.length / filledCount >= 0.6) {
                isNumeric = true;
                sum = numValues.reduce((acc, curr) => acc + curr, 0);
                numValues.forEach(v => {
                  if (v < min) min = v;
                  if (v > max) max = v;
                });
              }

              return (
                <div
                  key={col.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-800 truncate pr-2" title={col.name}>
                        {col.name}
                      </h4>
                      {isNumeric ? (
                        <span className="flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          <Calculator className="w-3 h-3" />
                          数値型
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          <Tag className="w-3 h-3" />
                          テキスト型
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-sans">
                      <div className="flex justify-between">
                        <span>値が入力されたセル:</span>
                        <span className="font-medium text-slate-800">
                          {filledCount} / {totalCount} ({totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>空のセル:</span>
                        <span className={`font-medium ${emptyCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {emptyCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ユニークな値の数:</span>
                        <span className="font-medium text-slate-800">{uniqueCount}件</span>
                      </div>
                    </div>
                  </div>

                  {/* Numerical analytics */}
                  {isNumeric && numValues.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-2xs font-sans text-slate-500 bg-slate-50/50 p-2 rounded">
                      <div className="flex justify-between">
                        <span>合計 (Sum):</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>平均 (Avg):</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {(sum / numValues.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>最小値 (Min):</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>最大値 (Max):</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
