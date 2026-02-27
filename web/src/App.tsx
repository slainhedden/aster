import { useState, useCallback, useEffect } from 'react';
import { guide } from './data/guide';
import { Sidebar } from './components/Sidebar';
import { SectionView } from './components/SectionView';
import { useProgress } from './hooks/useProgress';
import { Menu } from 'lucide-react';

const SECTION_COMPLETE_KEY = 'aster-guide-sections';

function useSectionProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(SECTION_COMPLETE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(SECTION_COMPLETE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setCompleted(new Set()), []);

  return { completed, toggle, reset };
}

export default function App() {
  const [activeSection, setActiveSection] = useState(guide[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toggle: toggleChecklist, isChecked, reset: resetChecklists } = useProgress();
  const { completed: completedSections, toggle: toggleSection, reset: resetSections } = useSectionProgress();

  const currentIndex = guide.findIndex((s) => s.id === activeSection);
  const currentSection = guide[currentIndex];

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePrev = currentIndex > 0 ? () => handleNavigate(guide[currentIndex - 1].id) : null;
  const handleNext = currentIndex < guide.length - 1 ? () => handleNavigate(guide[currentIndex + 1].id) : null;

  const handleReset = () => {
    resetChecklists();
    resetSections();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        completedSections={completedSections}
        onReset={handleReset}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-h-screen">
        <div className="lg:hidden sticky top-0 z-30 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-medium">{currentSection.title}</span>
          </button>
        </div>

        <SectionView
          section={currentSection}
          onChecklistToggle={toggleChecklist}
          isChecked={isChecked}
          onPrev={handlePrev}
          onNext={handleNext}
          prevTitle={currentIndex > 0 ? guide[currentIndex - 1].title : null}
          nextTitle={currentIndex < guide.length - 1 ? guide[currentIndex + 1].title : null}
          isComplete={completedSections.has(currentSection.id)}
          onMarkComplete={() => toggleSection(currentSection.id)}
        />
      </main>
    </div>
  );
}
