/**
 * GridOverlays — Loading, Empty, No Results states
 */

import { Loader2, SearchX, Inbox } from 'lucide-react';

interface GridOverlaysProps {
  loading?: boolean;
  empty?: boolean;
  noResults?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  columnCount: number;
}

export function GridOverlays({
  loading,
  empty,
  noResults,
  emptyMessage = 'Inga rader.',
  noResultsMessage = 'Inga träffar.',
  columnCount,
}: GridOverlaysProps) {
  if (loading) {
    return (
      <tr>
        <td colSpan={columnCount} className="text-center" style={{ padding: '64px 0' }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
            <span className="text-[13px] text-muted-foreground/60">Laddar...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (empty) {
    return (
      <tr>
        <td colSpan={columnCount} className="text-center" style={{ padding: '64px 0' }}>
          <div className="flex flex-col items-center gap-3">
            <Inbox className="w-8 h-8 text-muted-foreground/20" />
            <span className="text-[14px] text-muted-foreground/60">{emptyMessage}</span>
          </div>
        </td>
      </tr>
    );
  }

  if (noResults) {
    return (
      <tr>
        <td colSpan={columnCount} className="text-center" style={{ padding: '64px 0' }}>
          <div className="flex flex-col items-center gap-3">
            <SearchX className="w-8 h-8 text-muted-foreground/20" />
            <span className="text-[14px] text-muted-foreground/60">{noResultsMessage}</span>
          </div>
        </td>
      </tr>
    );
  }

  return null;
}
