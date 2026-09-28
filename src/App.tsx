import { useEffect, useState } from 'react';
import { getTutorial } from './data';
import Home from './components/Home';
import TutorialPage from './components/TutorialPage';

/** 常见别名 → 正式教程 ID（保持旧链接与直觉拼写可用） */
const ALIASES: Record<string, string> = {
  bunny: 'bunny2',
  frog: 'frog2',
  bat: 'bat2',
};

function parseHash(): { id: string | null; unknown?: string } {
  const m = window.location.hash.match(/^#\/t\/([\w-]+)$/);
  if (!m) return { id: null };
  const raw = m[1];
  const id = getTutorial(ALIASES[raw] ?? raw) ? (ALIASES[raw] ?? raw) : null;
  return { id, unknown: id ? undefined : raw };
}

export default function App() {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const tutorial = route.id ? getTutorial(route.id) : undefined;
  if (tutorial) return <TutorialPage key={tutorial.id} tutorial={tutorial} />;
  return (
    <>
      {route.unknown && (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
          <div className="flex items-center gap-3 rounded-full bg-stone-800/90 px-5 py-2 text-sm font-bold text-white shadow-lg">
            <span>
              没有找到教程「{route.unknown}」，先看看首页吧～
            </span>
            <a href="#/" className="rounded-full bg-orange-500 px-3 py-1 text-xs hover:bg-orange-600">
              去首页
            </a>
          </div>
        </div>
      )}
      <Home />
    </>
  );
}
