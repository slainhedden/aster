import type { Section } from '../data/guide';
import { ContentRenderer } from './ContentRenderer';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface SectionViewProps {
  section: Section;
  onChecklistToggle: (id: string) => void;
  isChecked: (id: string) => boolean;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  prevTitle: string | null;
  nextTitle: string | null;
  isComplete: boolean;
  onMarkComplete: () => void;
}

export function SectionView({
  section,
  onChecklistToggle,
  isChecked,
  onPrev,
  onNext,
  prevTitle,
  nextTitle,
  isComplete,
  onMarkComplete,
}: SectionViewProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">{section.icon}</span>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
            {section.number === 0 ? 'Overview' : `Step ${section.number} of 7`}
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{section.title}</h2>
        <p className="text-lg text-slate-400">{section.subtitle}</p>
      </div>

      <ContentRenderer
        blocks={section.content}
        onChecklistToggle={onChecklistToggle}
        isChecked={isChecked}
      />

      <div className="mt-12 border-t border-slate-800 pt-6">
        <button
          onClick={onMarkComplete}
          className={`
            w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-6
            ${isComplete
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
            }
          `}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isComplete ? 'Section Complete!' : 'Mark Section Complete'}
        </button>

        <div className="flex justify-between gap-4">
          {onPrev ? (
            <button
              onClick={onPrev}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <div className="text-left">
                <span className="text-xs text-slate-600 block">Previous</span>
                <span>{prevTitle}</span>
              </div>
            </button>
          ) : <div />}
          {onNext ? (
            <button
              onClick={onNext}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group text-right"
            >
              <div>
                <span className="text-xs text-slate-600 block">Next</span>
                <span>{nextTitle}</span>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
