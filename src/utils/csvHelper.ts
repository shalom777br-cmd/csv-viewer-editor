import { Column, Row, CSVData } from '../types';

/**
 * Parses raw CSV/TSV/Semicolon-separated text into a structured Column and Row object.
 */
export function parseCSVToData(text: string): CSVData {
  if (!text || text.trim() === '') {
    return { headers: [], rows: [] };
  }

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  // Auto-detect delimiter by looking at the first non-empty line
  const lines = text.split(/\r?\n/);
  const firstLine = lines.find(line => line.trim() !== '') || '';
  let delimiter = ',';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  
  for (const char of firstLine) {
    if (char === ',') counts[',']++;
    else if (char === ';') counts[';']++;
    else if (char === '\t') counts['\t']++;
  }
  
  if (counts[';'] > counts[','] && counts[';'] > counts['\t']) delimiter = ';';
  if (counts['\t'] > counts[','] && counts['t'] > counts[';']) delimiter = '\t';

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        currentVal += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        currentRow.push(currentVal);
        currentVal = '';
        i++;
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentVal);
        currentVal = '';
        // Only push rows that have content or are not entirely empty
        if (currentRow.length > 0) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
      } else {
        currentVal += char;
        i++;
      }
    }
  }

  // Push remaining data
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal);
    rawRows.push(currentRow);
  }

  // Filter out any blank trailing rows
  const cleanRows = rawRows.filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));

  if (cleanRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Generate unique Column structures
  const rawHeaders = cleanRows[0];
  const headers: Column[] = rawHeaders.map((headerText, colIndex) => {
    const name = headerText.trim() === '' ? `Column ${colIndex + 1}` : headerText.trim();
    return {
      id: `col-${Math.random().toString(36).substring(2, 9)}`,
      name,
    };
  });

  // Generate Row objects mapped to Column IDs
  const rows: Row[] = cleanRows.slice(1).map((rowCells, rowIndex) => {
    const cells: Record<string, string> = {};
    headers.forEach((col, colIndex) => {
      cells[col.id] = rowCells[colIndex] !== undefined ? rowCells[colIndex] : '';
    });
    return {
      id: `row-${Math.random().toString(36).substring(2, 9)}-${rowIndex}`,
      cells,
    };
  });

  return { headers, rows };
}

/**
 * Stringifies CSVData structure back to a raw string format.
 */
export function stringifyDataToCSV(data: CSVData, delimiter = ','): string {
  const { headers, rows } = data;
  if (headers.length === 0) return '';

  const escapeField = (val: string): string => {
    const str = String(val ?? '');
    const needsQuotes = str.includes(delimiter) || 
                        str.includes('"') || 
                        str.includes('\n') || 
                        str.includes('\r');
    if (needsQuotes) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create header row
  const headerLine = headers.map(h => escapeField(h.name)).join(delimiter);

  // Create data rows
  const dataLines = rows.map(row => {
    return headers.map(h => escapeField(row.cells[h.id] || '')).join(delimiter);
  });

  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Generates default sample CSV data to showcase immediately.
 */
export function getSampleCSVText(): string {
  return `商品ID,商品名,カテゴリー,価格(円),在庫数,評価
P1001,プレミアム有機珈琲豆,飲料,1480,45,4.8
P1002,極厚今治フェイスタオル,日用品,2200,120,4.6
P1003,無垢材ミニウッドスピーカー,家電,5980,18,4.9
P1004,耐熱ガラス製マグカップ,食器,1250,85,4.3
P1005,100%国産はちみつ 250g,食品,2800,32,4.7
P1006,コードレス充電スタンド,モバイル,3400,50,4.5
P1007,オーガニックアロマキャンドル,インテリア,1900,64,4.4`;
}
