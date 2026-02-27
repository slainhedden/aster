import { guide } from '../data/guide';
import type { Section } from '../data/guide';
import { CheckCircle2, Circle, RotateCcw } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  completedSections: Set<string>;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeSection, onNavigate, completedSections, onReset, isOpen, onClose }: SidebarProps) {
  const totalSections = guide.length;
  const completedCount = completedSections.size;
  const progressPercent = Math.round((completedCount / totalSections) * 100);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
      `}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h1 className="text-lg font-bold text-white">Aster Playbook</h1>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">{completedCount} of {totalSections} sections</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {guide.map((section: Section) => {
            const isActive = activeSection === section.id;
            const isComplete = completedSections.has(section.id);

            return (
              <button
                key={section.id}
                onClick={() => { onNavigate(section.id); onClose(); }}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-3
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs text-slate-500 block">
                    {section.number === 0 ? 'Start' : `Step ${section.number}`}
                  </span>
                  <span className="text-sm font-medium truncate block">{section.title}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full justify-center"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Progress
          </button>
        </div>
      </aside>
    </>
  );
}
