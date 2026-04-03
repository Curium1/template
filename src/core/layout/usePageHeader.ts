import { useEffect, useRef, type ReactNode } from 'react';
import { useSetPageMeta } from './PageMetaContext';

/**
 * Hook for pages to declare their title, subtitle, and action buttons.
 * 
 * Actions are stored in a ref to prevent infinite re-render loops —
 * JSX creates a new reference on every render, which would otherwise
 * trigger useEffect → setState → re-render → useEffect → ...
 */
export function usePageHeader(meta: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const setPageMeta = useSetPageMeta();
  const actionsRef = useRef<ReactNode>(meta.actions);
  actionsRef.current = meta.actions;

  // Set page meta on mount and when title/subtitle change
  useEffect(() => {
    setPageMeta({
      title: meta.title,
      subtitle: meta.subtitle,
      actions: actionsRef.current,
    });
    return () => setPageMeta({ title: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.subtitle, setPageMeta]);
}
