import React, { useState, useRef } from 'react';
import { Column, Row } from '../types';
import { ArrowLeft, ArrowRight, Trash2, Edit2, Plus, Check, X, GripVertical, CheckSquare, Square } from 'lucide-react';
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
  onDeleteSelectedRows?: (rowIds: string[]) => void;
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
  
  // Selection state for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

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

  // Selection Actions
  const handleToggleSelectAll = () => {
    const isAllSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedRowIds.has(r.id));
    if (isAllSelected) {
      const next = new Set(selectedRowIds);
      filteredRows.forEach((r) => next.delete(r.id));
      setSelectedRowIds(next);
    } else {
      const next = new Set(selectedRowIds);
      filteredRows.forEach((r) => next.add(r.id));
      setSelectedRowIds(next);
    }
  };

  const handleToggleSelectRow = (rowId: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    setSelectedRowIds(next);
  };

  // Bulk Actions
  const handleDeleteSelectedRows = () => {
    if (selectedRowIds.size === 0) return;
    if (confirm(`選択された ${selectedRowIds.size} 件の行を一括削除しますか？`)) {
      const remainingRows = rows.filter((row) => !selectedRowIds.has(row.id));
      onUpdateRows(remainingRows);
      setSelectedRowIds(new Set());
    }
  };

  const handleDeleteAllRows = () => {
    if (rows.length === 0) return;
    if (confirm('すべての行を完全に一括削除しますか？')) {
      onUpdateRows([]);
      setSelectedRowIds(new Set());
    }
  };

  const handleDeleteAllColumns = () => {
    if (headers.length <= 1) {
      alert('これ以上カラムを削除できません。テーブルには最低でも1つのカラムが必要です。');
      return;
    }
    if (confirm('すべてのカラムを削除し、新規の空カラム1列に初期化しますか？')) {
      const initColId = `col-${Math.random().toString(36).substring(2, 9)}`;
      const newHeaders: Column[] = [{ id: initColId, name: '新規カラム' }];
      const newRows: Row[] = rows.map((row) => ({
        id: row.id,
        cells: { [initColId]: '' },
      }));
      onUpdateHeaders(newHeaders);
      onUpdateRows(newRows);
      setSelectedRowIds(new Set());
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 font-sans">
            表示中のデータ: <strong className="text-slate-900 font-semibold">{filteredRows.length}件</strong>
            {searchQuery && `（全${rows.length}件中）`}
          </span>
          {selectedRowIds.size > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg">
              選択中: {selectedRowIds.size}件
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Selection Actions */}
          {selectedRowIds.size > 0 && (
            <button
              onClick={handleDeleteSelectedRows}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors border border-rose-200 cursor-pointer shadow-xs"
              title="選択した行を一括削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
              選択行を一括削除 ({selectedRowIds.size}件)
            </button>
          )}

          {/* Table-wide Bulk deletion shortcuts */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-semibold">
            <button
              onClick={handleDeleteAllRows}
              disabled={rows.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="すべての行を完全に削除します"
            >
              全行一括削除
            </button>
            <button
              onClick={handleDeleteAllColumns}
              disabled={headers.length <= 1}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="カラムを初期状態(1カラム)にリセットします"
            >
              全カラム一括削除
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

          <button
            onClick={onAddRow}
            id="btn-add-row"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            行を追加
          </button>
          <button
            onClick={onAddColumn}
            id="btn-add-col"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
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
              {/* Checkbox Header */}
              <th className="w-12 p-3 bg-slate-100 text-center select-none border-r border-slate-200">
                <input
                  type="checkbox"
                  checked={filteredRows.length > 0 && filteredRows.every((r) => selectedRowIds.has(r.id))}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  title="すべての行を選択 / 解除"
                />
              </th>

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

                        {/* Move & Action Buttons */}
                        <div className="flex items-center gap-1 opacity-75 group-hover/header:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveColumn(idx, 'left')}
                            disabled={idx === 0}
                            className="p-0.5 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 rounded transition-all cursor-pointer"
                            title="左に移動"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveColumn(idx, 'right')}
                            disabled={idx === headers.length - 1}
                            className="p-0.5 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 rounded transition-all cursor-pointer"
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
                            
                            <div className="flex items-center gap-1 opacity-40 group-hover/header:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingHeader(col.id, col.name)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200 cursor-pointer"
                                title="カラム名を編集"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {headers.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (confirm(`このカラム「${col.name}」を完全に削除しますか？\n（各行のこの列のデータも一括で消去されます。変更履歴から「元に戻す」ことが可能です。）`)) {
                                      onDeleteColumn(col.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 cursor-pointer"
                                  title="このカラム（列）を削除"
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
                  const isSelected = selectedRowIds.has(row.id);

                  return (
                    <motion.tr
                      key={row.id}
                      layout="position"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`group/row transition-colors ${
                        isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/75'
                      }`}
                    >
                      {/* Checkbox cell */}
                      <td className="p-3 text-center border-r border-slate-100 relative w-12 select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(row.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                      </td>

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
                    colSpan={headers.length + 3}
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
