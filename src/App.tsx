import React, { useState, useEffect } from 'react';
import { Column, Row, CSVData } from './types';
import { 
  parseCSVToData, 
  stringifyDataToCSV, 
  getSampleCSVText 
} from './utils/csvHelper';
import CSVTable from './components/CSVTable';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Search, 
  Undo2, 
  Redo2, 
  Trash2, 
  Plus, 
  Sparkles, 
  Info, 
  RefreshCw,
  FileText,
  SlidersHorizontal,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Core State
  const [data, setData] = useState<CSVData>({ headers: [], rows: [] });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export Settings State
  const [exportFileName, setExportFileName] = useState('edited_data');
  const [exportDelimiter, setExportDelimiter] = useState(',');
  
  // History State (Undo/Redo)
  const [history, setHistory] = useState<CSVData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drag over state for whole page file upload
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize with empty sheet layout
  useEffect(() => {
    const initColId1 = `col-${Math.random().toString(36).substring(2, 9)}`;
    const initColId2 = `col-${Math.random().toString(36).substring(2, 9)}`;
    const initColId3 = `col-${Math.random().toString(36).substring(2, 9)}`;
    
    const initialBlankData: CSVData = {
      headers: [
        { id: initColId1, name: 'カラム1' },
        { id: initColId2, name: 'カラム2' },
        { id: initColId3, name: 'カラム3' }
      ],
      rows: [
        { id: `row-${Math.random().toString(36).substring(2, 9)}-0`, cells: { [initColId1]: '', [initColId2]: '', [initColId3]: '' } },
        { id: `row-${Math.random().toString(36).substring(2, 9)}-1`, cells: { [initColId1]: '', [initColId2]: '', [initColId3]: '' } },
        { id: `row-${Math.random().toString(36).substring(2, 9)}-2`, cells: { [initColId1]: '', [initColId2]: '', [initColId3]: '' } }
      ]
    };
    setHistory([initialBlankData]);
    setHistoryIndex(0);
    setData(initialBlankData);
  }, []);

  // Set alert feedback helper
  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // State update wrapper with Undo/Redo recording
  const updateData = (newData: CSVData) => {
    const cleanHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...cleanHistory, newData];
    
    // Cap history length at 30 to avoid excessive memory consumption
    if (updatedHistory.length > 30) {
      updatedHistory.shift();
    }
    
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setData(newData);
  };

  // Preset loaders
  const loadPreset = (csvText: string, name: string) => {
    const parsed = parseCSVToData(csvText);
    if (parsed.headers.length > 0) {
      // Clear history when loading preset/new file
      setHistory([parsed]);
      setHistoryIndex(0);
      setData(parsed);
      showFeedback(`${name}をロードしました。`, 'success');
    } else {
      showFeedback('サンプルの解析に失敗しました。', 'error');
    }
  };

  const loadSamplePreset1 = () => {
    loadPreset(getSampleCSVText(), '商品カタログデータ');
  };

  const loadSamplePreset2 = () => {
    const csv = `ID,氏名,部署,役職,入社年,ステータス
E101,佐藤 健一,システム開発部,シニアエンジニア,2018,現職
E102,鈴木 美咲,マーケティング部,プランナー,2021,現職
E103,高橋 翔太,営業本部,マネージャー,2015,現職
E104,田中 明美,人事部,アシスタント,2023,現職
E105,渡辺 直樹,財務経理部,主任,2019,現職
E106,伊藤 さくら,カスタマーサポート,リーダー,2022,休職中`;
    loadPreset(csv, '社員名簿データ');
  };

  const loadSamplePreset3 = () => {
    const csv = `年月,売上高(万円),経費(万円),純利益(万円),新規顧客数(人),達成率(%)
2026-01,1200,850,350,45,102%
2026-02,1450,900,550,52,111%
2026-03,1100,800,300,38,92%
2026-04,1300,870,430,48,100%
2026-05,1600,980,620,60,118%
2026-06,1750,1050,700,65,121%`;
    loadPreset(csv, '売上・財務実績データ');
  };

  // Undo/Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setData(history[prevIdx]);
      showFeedback('操作を取り消しました。', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setData(history[nextIdx]);
      showFeedback('操作をやり直しました。', 'info');
    }
  };

  // Read File Helper
  const processUploadedFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      showFeedback('CSV、TSV、またはテキストファイルを選択してください。', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSVToData(text);
      if (parsed.headers.length > 0) {
        // Clear history & apply new dataset
        setHistory([parsed]);
        setHistoryIndex(0);
        setData(parsed);
        
        // Auto extract file name
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || 'exported_data';
        setExportFileName(cleanName);
        
        // Auto detect file extension for output delimiter
        if (file.name.endsWith('.tsv')) {
          setExportDelimiter('\t');
        } else {
          setExportDelimiter(',');
        }
        
        showFeedback(`「${file.name}」を正常に読み込みました。`, 'success');
      } else {
        showFeedback('CSVファイルの解析に失敗しました。正しいフォーマットか確認してください。', 'error');
      }
    };
    reader.onerror = () => {
      showFeedback('ファイルの読み込み中にエラーが発生しました。', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Global Drag & Drop Page handlers for file import
  const handleDragOverPage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeavePage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDropPage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Edit Handlers (Passed to Child CSVTable)
  const handleUpdateHeaders = (newHeaders: Column[]) => {
    updateData({
      ...data,
      headers: newHeaders,
    });
  };

  const handleCellEdit = (rowId: string, columnId: string, newValue: string) => {
    const updatedRows = data.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [columnId]: newValue,
          },
        };
      }
      return row;
    });

    updateData({
      ...data,
      rows: updatedRows,
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    // Keep at least one column
    if (data.headers.length <= 1) {
      showFeedback('これ以上カラムを削除できません。', 'error');
      return;
    }

    const filteredHeaders = data.headers.filter((col) => col.id !== columnId);
    // Optional clean up row cells
    const updatedRows = data.rows.map((row) => {
      const nextCells = { ...row.cells };
      delete nextCells[columnId];
      return {
        ...row,
        cells: nextCells,
      };
    });

    updateData({
      headers: filteredHeaders,
      rows: updatedRows,
    });
    showFeedback('カラムを削除しました。', 'info');
  };

  const handleDeleteRow = (rowId: string) => {
    const filteredRows = data.rows.filter((row) => row.id !== rowId);
    updateData({
      ...data,
      rows: filteredRows,
    });
    showFeedback('行を削除しました。', 'info');
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    const updatedHeaders = data.headers.map((col) => {
      if (col.id === columnId) {
        return { ...col, name: newName };
      }
      return col;
    });

    updateData({
      ...data,
      headers: updatedHeaders,
    });
    showFeedback('カラム名を変更しました。', 'success');
  };

  const handleAddColumn = () => {
    const nextColIndex = data.headers.length + 1;
    const newColId = `col-${Math.random().toString(36).substring(2, 9)}`;
    const newCol: Column = {
      id: newColId,
      name: `新カラム ${nextColIndex}`,
    };

    const updatedHeaders = [...data.headers, newCol];
    const updatedRows = data.rows.map((row) => ({
      ...row,
      cells: {
        ...row.cells,
        [newColId]: '',
      },
    }));

    updateData({
      headers: updatedHeaders,
      rows: updatedRows,
    });
    showFeedback('新しいカラムを追加しました。ダブルクリックで名前を変更できます。', 'success');
  };

  const handleAddRow = () => {
    const newRowId = `row-${Math.random().toString(36).substring(2, 9)}-${data.rows.length}`;
    const emptyCells: Record<string, string> = {};
    data.headers.forEach((col) => {
      emptyCells[col.id] = '';
    });

    const newRow: Row = {
      id: newRowId,
      cells: emptyCells,
    };

    updateData({
      ...data,
      rows: [...data.rows, newRow],
    });
    showFeedback('新しい行を追加しました。', 'success');
  };

  // Clear/Reset current project
  const handleClearAll = () => {
    if (confirm('現在のデータをすべてクリアして、完全に新しいCSVを作成しますか？')) {
      const initColId = `col-${Math.random().toString(36).substring(2, 9)}`;
      const emptyData: CSVData = {
        headers: [{ id: initColId, name: '新規カラム1' }],
        rows: [{ id: `row-${Math.random().toString(36).substring(2, 9)}-0`, cells: { [initColId]: '' } }],
      };
      
      setHistory([emptyData]);
      setHistoryIndex(0);
      setData(emptyData);
      showFeedback('ワークスペースをクリアしました。', 'info');
    }
  };

  // Export & Download handler
  const handleExportCSV = () => {
    if (data.headers.length === 0) {
      showFeedback('エクスポートするデータがありません。', 'error');
      return;
    }

    const csvText = stringifyDataToCSV(data, exportDelimiter);
    
    // Determine extension
    let extension = '.csv';
    if (exportDelimiter === '\t') extension = '.tsv';
    else if (exportDelimiter === ';') extension = '_semicolon.csv';

    const cleanFileName = exportFileName.trim() === '' ? 'exported_data' : exportFileName.trim();
    const finalFileName = `${cleanFileName}${extension}`;

    // Create blobs & download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', finalFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showFeedback(`「${finalFileName}」をダウンロードしました！`, 'success');
  };

  return (
    <div 
      onDragOver={handleDragOverPage}
      onDragLeave={handleDragLeavePage}
      onDrop={handleDropPage}
      className="min-h-screen bg-slate-50 text-slate-800 pb-20 relative font-sans"
    >
      {/* Absolute Drag & Drop overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-900/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md mx-4 border-2 border-dashed border-indigo-400">
              <Upload className="w-16 h-16 text-indigo-600 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans">
                ファイルをドロップして読み込み
              </h3>
              <p className="text-sm text-slate-500 font-sans">
                CSV / TSV / TXT 形式のファイルをここにドロップすると、即座にグリッドエディタに展開されます。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
                CSVファイルヴューワー ＆ エディター
              </h1>
              <p className="text-xs text-slate-500 font-medium font-sans">
                文字が大きく見やすい極シンプル設計・カラム移動が自由自在な編集ツール
              </p>
            </div>
          </div>

          {/* Clear workspace */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              id="btn-clear-all"
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="すべてクリアして新規作成"
            >
              <Trash2 className="w-4 h-4" />
              <span>テーブルを初期化</span>
            </button>
          </div>
        </div>
      </header>

      {/* Application Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Dynamic Interactive Feedback Toast Notification */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 shadow-xs text-xs font-semibold font-sans
                ${feedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
                ${feedbackMsg.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : ''}
                ${feedbackMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              `}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Main Table */}
        <CSVTable
          headers={data.headers}
          rows={data.rows}
          onUpdateHeaders={handleUpdateHeaders}
          onUpdateRows={(updatedRows) => updateData({ ...data, rows: updatedRows })}
          searchQuery={searchQuery}
          onCellEdit={handleCellEdit}
          onDeleteColumn={handleDeleteColumn}
          onDeleteRow={handleDeleteRow}
          onRenameColumn={handleRenameColumn}
          onAddColumn={handleAddColumn}
          onAddRow={handleAddRow}
        />

        {/* Footer section replacing top tools panel and containing everything else requested */}
        <footer className="space-y-6 pt-6 border-t border-slate-200">
          
          {/* Global Action Tools Panel in Footer */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* 1. File Upload Selector */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  ファイルの読み込み
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl transition-all border border-indigo-200 border-dashed text-sm font-semibold text-center select-none">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>PCからファイルを選択</span>
                  </div>
                </div>
              </div>

              {/* 2. Text Search Filter */}
              <div className="lg:col-span-4 space-y-2">
                <label htmlFor="search-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  表内リアルタイム検索
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="任意の文字・数字で検索フィルタリング..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-sans"
                  />
                </div>
              </div>

              {/* 3. Undo/Redo Engine */}
              <div className="lg:col-span-4 flex flex-col justify-end space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  履歴・変更の取り消し
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all font-sans text-sm font-semibold cursor-pointer"
                    title="元に戻す (Undo)"
                  >
                    <Undo2 className="w-4.5 h-4.5" />
                    <span>元に戻す</span>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all font-sans text-sm font-semibold cursor-pointer"
                    title="やり直す (Redo)"
                  >
                    <Redo2 className="w-4.5 h-4.5" />
                    <span>やり直す</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Export Settings Row */}
            <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 font-sans">
                    エクスポート設定:
                  </span>
                </div>
                
                {/* Filename Input */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <span className="px-2 py-1 text-xs text-slate-400 font-mono bg-slate-100 border-r border-slate-200">
                    ファイル名
                  </span>
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="px-2.5 py-1 text-xs text-slate-700 bg-transparent focus:outline-none w-36 font-sans font-medium"
                  />
                </div>

                {/* Delimiter Selector */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <span className="px-2 py-1 text-xs text-slate-400 font-mono bg-slate-100 border-r border-slate-200">
                    区切り文字
                  </span>
                  <select
                    value={exportDelimiter}
                    onChange={(e) => setExportDelimiter(e.target.value)}
                    className="px-2.5 py-1 text-xs text-slate-700 bg-transparent focus:outline-none cursor-pointer font-sans font-medium"
                  >
                    <option value=",">カンマ ( , ) - 標準CSV</option>
                    <option value=";">セミコロン ( ; ) - 欧州</option>
                    <option value="&#9;">タブ ( \\t ) - TSV形式</option>
                  </select>
                </div>
              </div>

              {/* Export Download Button */}
              <button
                onClick={handleExportCSV}
                id="btn-export-csv"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-md shadow-indigo-100 transition-all font-sans text-sm font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>編集したCSVを保存</span>
              </button>
            </div>
          </div>

          {/* Help banner / Quick Guide inside Footer */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1 font-sans">
              <p className="font-semibold text-slate-800">💡 便利な操作ガイド</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                <p>・<strong>カラム移動:</strong> 上部のハンドル <span className="inline-flex bg-white px-1 border rounded">☰</span> をドラッグ、または矢印で左右に並び替え可能！</p>
                <p>・<strong>セルの編集:</strong> セルまたはカラム名を<strong>ダブルクリック</strong>して、値を直接編集可能！</p>
                <p>・<strong>ファイル読込:</strong> パソコンからこの画面にファイルを直接<strong>ドラッグ＆ドロップ</strong>で読み込めます！</p>
              </div>
            </div>
          </div>

        </footer>

      </main>
    </div>
  );
}
