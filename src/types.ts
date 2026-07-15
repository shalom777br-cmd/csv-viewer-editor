export interface Column {
  id: string;
  name: string;
}

export interface Row {
  id: string; // Unique row ID (e.g., UUID or incrementing)
  cells: Record<string, string>; // Maps Column.id -> string value
}

export interface CSVData {
  headers: Column[];
  rows: Row[];
}

export interface HistoryState {
  headers: Column[];
  rows: Row[];
}
