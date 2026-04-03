import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PageMeta {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface PageMetaContextValue {
  meta: PageMeta;
  setPageMeta: (meta: PageMeta) => void;
}

const PageMetaContext = createContext<PageMetaContextValue>({
  meta: { title: '' },
  setPageMeta: () => {},
});

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>({ title: '' });

  const setPageMeta = useCallback((m: PageMeta) => {
    setMeta(m);
  }, []);

  return (
    <PageMetaContext.Provider value={{ meta, setPageMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMeta() {
  return useContext(PageMetaContext).meta;
}

export function useSetPageMeta() {
  return useContext(PageMetaContext).setPageMeta;
}
