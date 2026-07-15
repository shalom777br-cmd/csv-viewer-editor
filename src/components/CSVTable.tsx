import React, { useState, useRef } from 'react';
import { Column, Row } from '../types';
import { ArrowLeft, ArrowRight, Trash2, Edit2, Plus, Check, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CSVTableProps {
  headers: Column[];
  rows: Row[];
  onUpdateHeaders: (headers: Column[]) => void;
  onUpdateRows: (rows: Row[]) => void;
  searchQuery: string;
  onCellEdit: (rowId: string, columnId: string, newValue: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteRow: (rowId: string) => void;
  onRenameColumn: (columnId: string, newName: string) => void;
  onAddColumn: () => void;
  onAddRow: () => void;
}

export default function CSVTable({
  headers,
  rows,
  onUpdateHeaders,
  onUpdateRows,
  searchQuery,
  onCellEdit,
  onDeleteColumn,
  onDeleteRow,
  onRenameColumn,
  onAddColumn,
  onAddRow,
}: CSVTableProps) {
  // Editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingHeader, setEditingHeader] = useState<string | null>(null); // columnId
  const [editValue, setEditValue] = useState('');
  
  // Drag and Drop Column state
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // References
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter rows based on search query
  const filteredRows = rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return headers.some((header) => {
      const cellValue = String(row.cells[header.id] || '').toLowerCase();
      return cellValue.includes(query);
    });
  });

  // Cell Edit Actions
  const startEditingCell = (rowId: string, colId: string, currentValue: string) => {
    setEditingCell({ rowId, colId });
    setEditValue(currentValue);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const saveEditingCell = () => {
    if (editingCell) {
      onCellEdit(editingCell.rowId, editingCell.colId, editValue);
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditingCell();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Header Edit Actions
  const startEditingHeader = (colId: string, currentValue: string) => {
    setEditingHeader(colId);
    setEditValue(currentValue);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const saveEditingHeader = () => {
    if (editingHeader && editValue.trim() !== '') {
      onRenameColumn(editingHeader, editValue.trim());
      setEditingHeader(null);
    } else {
      setEditingHeader(null);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditingHeader();
    } else if (e.key === 'Escape') {
      setEditingHeader(null);
    }
  };

  // Move Column Left/Right via Buttons
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= headers.length) return;

    const newHeaders = [...headers];
    const temp = newHeaders[index];
    newHeaders[index] = newHeaders[targetIndex];
    newHeaders[targetIndex] = temp;
    onUpdateHeaders(newHeaders);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    // Set a ghost image style or transparency if supported
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedColId && draggedColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetId) {
      setDraggedColId(null);
      setDragOverColId(null);
      return;
    }

    const sourceIndex = headers.findIndex((h) => h.id === draggedColId);
    const targetIndex = headers.findIndex((h) => h.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newHeaders = [...headers];
      const [removed] = newHeaders.splice(sourceIndex, 1);
      newHeaders.splice(targetIndex, 0, removed);
      onUpdateHeaders(newHeaders);
    }

    setDraggedColId(null);
    setDragOverColId(null);
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
    setDragOverColId(null);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Actions Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 font-sans">
            表示中のデータ: <strong className="text-slate-900 font-semibold">{filteredRows.length}件</strong>
            {searchQuery && `（全${rows.length}件中）`}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onAddRow}
            id="btn-add-row"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
          >
            <Plus className="w-3.5 h-3.5" />
            行を追加
          </button>
          <button
            onClick={onAddColumn}
            id="btn-add-col"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200"
          >
            <Plus className="w-3.5 h-3.5" />
            カラムを追加
          </button>
        </div>
      </div>

      {/* Grid container with double scrollbars */}
      <div className="overflow-auto max-h-[60vh] min-h-[300px] w-full" style={{ scrollbarGutter: 'stable' }}>
        <table className="w-full border-collapse text-left relative">
          <thead className="sticky top-0 z-20 bg-slate-100 shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              {/* Row index or control header */}
              <th className="w-14 p-3 bg-slate-100 text-center text-xs font-semibold text-slate-500 font-mono select-none border-r border-slate-200">
                #
              </th>
              
              {/* Column Headers */}
              {headers.map((col, idx) => {
                const isDragging = draggedColId === col.id;
                const isDragOver = dragOverColId === col.id;

                return (
                  <th
                    key={col.id}
                    className={`min-w-[180px] p-0 font-sans border-r border-slate-200 transition-all relative group/header
                      ${isDragging ? 'opacity-40 bg-slate-200' : ''}
                      ${isDragOver ? 'border-l-4 border-l-blue-500 bg-blue-50/40' : ''}
                    `}
                    draggable={editingHeader !== col.id}
                    onDragStart={(e) => handleDragStart(e, col.id)}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex flex-col h-full justify-between">
                      {/* Top Drag/Order Control Strip */}
                      <div className="flex items-center justify-between px-3 pt-2 pb-1 bg-slate-100/80 text-slate-400 select-none border-b border-slate-200/50">
                        {/* Drag Handle */}
                        <div 
                          className="cursor-grab active:cursor-grabbing hover:text-slate-600 p-0.5 rounded transition-colors"
                          title="ドラッグしてカラムを移動"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center gap-0.5 opacity-60 group-hover/header:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveColumn(idx, 'left')}
                            disabled={idx === 0}
                            className="p-0.5 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 rounded transition-all"
                            title="左に移動"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveColumn(idx, 'right')}
                            disabled={idx === headers.length - 1}
                            className="p-0.5 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 rounded transition-all"
                            title="右に移動"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Header Title Area */}
                      <div className="p-3 flex items-center justify-between gap-2 min-h-[50px] bg-slate-100">
                        {editingHeader === col.id ? (
                          <div className="flex items-center w-full gap-1">
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEditingHeader}
                              onKeyDown={handleHeaderKeyDown}
                              className="w-full px-2 py-1 text-sm font-medium border border-blue-500 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button 
                              onMouseDown={saveEditingHeader}
                              className="p-1 hover:bg-slate-200 text-emerald-600 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span
                              className="text-sm font-semibold text-slate-700 cursor-pointer select-all truncate max-w-[130px]"
                              onDoubleClick={() => startEditingHeader(col.id, col.name)}
                              title="ダブルクリックでカラム名を編集"
                            >
                              {col.name}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingHeader(col.id, col.name)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200"
                                title="カラム名を編集"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {headers.length > 1 && (
                                <button
                                  onClick={() => onDeleteColumn(col.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200"
                                  title="カラムを削除"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
              {/* Sticky Spacer column */}
              <th className="bg-slate-100 w-12 border-b border-slate-200"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rowIndex) => {
                  return (
                    <motion.tr
                      key={row.id}
                      layout="position"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="group/row hover:bg-slate-50/75 transition-colors"
                    >
                      {/* Row index indicator with hover delete button */}
                      <td className="p-3 text-center text-xs font-mono font-medium text-slate-400 select-none border-r border-slate-100 bg-slate-50/30 relative">
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="group-hover/row:opacity-0 transition-opacity">
                            {rowIndex + 1}
                          </span>
                          <button
                            onClick={() => onDeleteRow(row.id)}
                            className="absolute inset-0 m-auto w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg opacity-0 group-hover/row:opacity-100 transition-all shadow-sm cursor-pointer"
                            title="この行を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Data Cells */}
                      {headers.map((col) => {
                        const cellVal = row.cells[col.id] || '';
                        const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                        return (
                          <td
                            key={col.id}
                            className={`p-0 border-r border-slate-100 transition-all min-w-[180px]
                              ${isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-100/40'}
                            `}
                          >
                            {isEditing ? (
                              <div className="flex items-center p-1.5 w-full h-full">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveEditingCell}
                                  onKeyDown={handleCellKeyDown}
                                  className="w-full px-2 py-1 text-sm border border-blue-500 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 font-sans"
                                />
                                <button 
                                  onMouseDown={saveEditingCell}
                                  className="ml-1 p-1 hover:bg-blue-100 text-emerald-600 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onDoubleClick={() => startEditingCell(row.id, col.id, cellVal)}
                                className="px-4 py-3 text-sm text-slate-700 font-sans cursor-pointer whitespace-pre-wrap break-all min-h-[44px] flex items-center justify-start select-all"
                                title="ダブルクリックしてセルを編集"
                              >
                                {cellVal === '' ? (
                                  <span className="text-slate-300 italic font-light text-xs">空</span>
                                ) : (
                                  cellVal
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      
                      {/* End space td */}
                      <td className="w-12"></td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={headers.length + 2}
                    className="p-12 text-center text-sm text-slate-400 font-sans bg-slate-50/30"
                  >
                    {searchQuery ? '検索条件に一致する行が見つかりません。' : 'データが存在しません。上のボタンから追加してください。'}
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
