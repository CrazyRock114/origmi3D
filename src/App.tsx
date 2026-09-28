import { useEffect, useState } from 'react';
import { getTutorial } from './data';
import Home from './components/Home';
import TutorialPage from './components/TutorialPage';

function parseHash(): string | null {
  const m = window.location.hash.match(/^#\/t\/([\w-]+)$/);
  return m ? m[1] : null;
}

export default function App() {
  const [id, setId] = useState<string | null>(parseHash());

  useEffect(() => {
    const onHash = () => {
      setId(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const tutorial = id ? getTutorial(id) : undefined;
  return tutorial ? <TutorialPage key={tutorial.id} tutorial={tutorial} /> : <Home />;
}
