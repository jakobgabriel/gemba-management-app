// ============================================================================
// Gemba Management System - Reusable Data Table Component
// ============================================================================

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T = Record<string, unknown>> {
  /** Property key on the data object */
  key: string;
  /** Column header label */
  label: string;
  /** Optional custom render function for cell content */
  render?: (value: unknown, row: T, rowIndex: number) => React.ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  /** Optional callback when a row is clicked */
  onRowClick?: (row: T, rowIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Helper to read a nested key like "user.name" from an object
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        No data available.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
          >
            {columns.map((col) => {
              const rawValue = getNestedValue(row, col.key);
              const cellContent = col.render
                ? col.render(rawValue, row, rowIndex)
                : (rawValue != null ? String(rawValue) : '');

              return <td key={col.key}>{cellContent}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
