import { useCallback, useEffect, useState } from 'react';
import { demoInspections, isDemo } from './data/demo';
import { loadInspections, saveInspections } from './engine/storage';
import type { Inspection } from './engine/types';
import { ComparePage } from './pages/ComparePage';
import { CarFormPage } from './pages/CarFormPage';
import { HomePage } from './pages/HomePage';
import { InspectPage } from './pages/InspectPage';
import { ReportPage } from './pages/ReportPage';
import { go, useRoute } from './router';

export function App() {
  const route = useRoute();
  const [inspections, setInspections] = useState<Inspection[]>(() => loadInspections());
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveInspections(inspections));
  }, [inspections]);

  const upsert = useCallback((next: Inspection) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setInspections((list) => {
      const i = list.findIndex((x) => x.id === stamped.id);
      return i === -1 ? [stamped, ...list] : list.map((x) => (x.id === stamped.id ? stamped : x));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setInspections((list) => list.filter((x) => x.id !== id));
  }, []);

  /** Add the sample cars, replacing earlier copies so they're always fresh. */
  const loadDemo = useCallback(() => {
    setInspections((list) => [...demoInspections(), ...list.filter((x) => !isDemo(x))]);
  }, []);

  const clearDemo = useCallback(() => {
    setInspections((list) => list.filter((x) => !isDemo(x)));
  }, []);

  const find = (id: string) => inspections.find((x) => x.id === id);

  let page;
  switch (route.name) {
    case 'home':
      page = <HomePage inspections={inspections} onDelete={remove} onLoadDemo={loadDemo} onClearDemo={clearDemo} />;
      break;
    case 'new':
      page = (
        <CarFormPage
          onSave={(i) => {
            upsert(i);
            go({ name: 'inspect', id: i.id });
          }}
        />
      );
      break;
    case 'compare':
      page = <ComparePage inspections={inspections} />;
      break;
    default: {
      const found = find(route.id);
      if (!found) {
        page = <NotFound />;
      } else if (route.name === 'edit') {
        page = (
          <CarFormPage
            existing={found}
            onSave={(i) => {
              upsert(i);
              go({ name: 'inspect', id: i.id });
            }}
          />
        );
      } else if (route.name === 'report') {
        page = <ReportPage inspection={found} />;
      } else {
        page = <InspectPage inspection={found} onChange={upsert} />;
      }
    }
  }

  return (
    <div className="app">
      {saveFailed && (
        <div className="banner banner-warn" role="status">
          This browser isn't saving your inspections (storage is full or blocked). They will be lost when you close the page.
        </div>
      )}
      {page}
    </div>
  );
}

function NotFound() {
  return (
    <main className="page">
      <h1>Inspection not found</h1>
      <p className="muted">It may have been deleted, or it was saved in another browser.</p>
      <a className="btn" href="#/">
        Back to your inspections
      </a>
    </main>
  );
}
