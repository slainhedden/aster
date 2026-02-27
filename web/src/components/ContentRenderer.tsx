import type { ContentBlock, ChecklistItem, EmailTemplate, PricingTier, TimelineItem } from '../data/guide';
import { Check, Copy, Info, Lightbulb, AlertTriangle, DollarSign, Mail, Clock } from 'lucide-react';
import { useState } from 'react';

interface ContentRendererProps {
  blocks: ContentBlock[];
  onChecklistToggle: (id: string) => void;
  isChecked: (id: string) => boolean;
}

export function ContentRenderer({ blocks, onChecklistToggle, isChecked }: ContentRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} onChecklistToggle={onChecklistToggle} isChecked={isChecked} />
      ))}
    </div>
  );
}

function BlockRenderer({
  block,
  onChecklistToggle,
  isChecked,
}: {
  block: ContentBlock;
  onChecklistToggle: (id: string) => void;
  isChecked: (id: string) => boolean;
}) {
  switch (block.type) {
    case 'text':
      return <p className="text-slate-300 leading-relaxed">{block.value}</p>;
    case 'heading':
      return <h3 className="text-xl font-bold text-white mt-8 mb-2 first:mt-0">{block.value}</h3>;
    case 'subheading':
      return <h4 className="text-base font-semibold text-slate-200 mt-4 mb-1">{block.value}</h4>;
    case 'bullets':
      return (
        <ul className="space-y-2 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-slate-300">
              <span className="text-violet-400 mt-1.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'numbered':
      return (
        <ol className="space-y-2 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-300">
              <span className="bg-violet-600/20 text-violet-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'callout':
      return <CalloutBlock title={block.title} value={block.value} variant={block.variant} />;
    case 'checklist':
      return <ChecklistBlock items={block.items} onToggle={onChecklistToggle} isChecked={isChecked} />;
    case 'email':
      return <EmailBlock template={block.template} />;
    case 'pricing-table':
      return <PricingTableBlock tiers={block.tiers} />;
    case 'timeline':
      return <TimelineBlock items={block.items} />;
    case 'metric':
      return <MetricBlock label={block.label} value={block.value} detail={block.detail} />;
    default:
      return null;
  }
}

function CalloutBlock({ title, value, variant }: { title: string; value: string; variant: string }) {
  const styles: Record<string, { bg: string; border: string; icon: React.ReactNode; titleColor: string }> = {
    info: { bg: 'bg-blue-950/40', border: 'border-blue-500/30', icon: <Info className="w-5 h-5 text-blue-400" />, titleColor: 'text-blue-300' },
    tip: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', icon: <Lightbulb className="w-5 h-5 text-emerald-400" />, titleColor: 'text-emerald-300' },
    warning: { bg: 'bg-amber-950/40', border: 'border-amber-500/30', icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, titleColor: 'text-amber-300' },
    money: { bg: 'bg-violet-950/40', border: 'border-violet-500/30', icon: <DollarSign className="w-5 h-5 text-violet-400" />, titleColor: 'text-violet-300' },
  };
  const s = styles[variant] || styles.info;

  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-2">
        {s.icon}
        <span className={`font-semibold ${s.titleColor}`}>{title}</span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function ChecklistBlock({
  items,
  onToggle,
  isChecked,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  isChecked: (id: string) => boolean;
}) {
  const completed = items.filter((it) => isChecked(it.id)).length;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-300">Checklist</span>
        <span className="text-xs text-slate-500">{completed}/{items.length} complete</span>
      </div>
      <div className="p-3">
        {items.map((item) => {
          const checked = isChecked(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`
                w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all
                ${checked ? 'bg-emerald-950/20' : 'hover:bg-slate-700/30'}
              `}
            >
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                ${checked
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-600 hover:border-slate-400'
                }
              `}>
                {checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm transition-all ${checked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmailBlock({ template }: { template: EmailTemplate }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-slate-300">Email Template</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 px-2.5 py-1 rounded-md"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Subject</span>
          <p className="text-sm text-white font-medium mt-0.5">{template.subject}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Body</span>
          <pre className="text-sm text-slate-300 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
            {template.body}
          </pre>
        </div>
        <div className="bg-slate-900/50 rounded-lg px-4 py-2.5 border border-slate-700/30">
          <span className="text-xs text-slate-500 uppercase tracking-wide">When to use</span>
          <p className="text-xs text-slate-400 mt-0.5">{template.context}</p>
        </div>
      </div>
    </div>
  );
}

function PricingTableBlock({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`
            rounded-xl border p-5 flex flex-col
            ${tier.recommended
              ? 'bg-violet-950/40 border-violet-500/40 ring-1 ring-violet-500/20'
              : 'bg-slate-800/50 border-slate-700/50'
            }
          `}
        >
          {tier.recommended && (
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
              Most Popular
            </span>
          )}
          <h4 className="text-lg font-bold text-white">{tier.name}</h4>
          <div className="flex items-baseline gap-1 mt-2 mb-4">
            <span className="text-3xl font-bold text-white">{tier.price}</span>
            {tier.period && <span className="text-slate-400 text-sm">{tier.period}</span>}
          </div>
          <ul className="space-y-2 flex-1 mb-5">
            {tier.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button className={`
            w-full py-2.5 rounded-lg text-sm font-semibold transition-all
            ${tier.recommended
              ? 'bg-violet-600 hover:bg-violet-500 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }
          `}>
            {tier.cta}
          </button>
        </div>
      ))}
    </div>
  );
}

function TimelineBlock({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative ml-4 space-y-6 my-4">
      <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-violet-500 via-indigo-500 to-slate-700" />
      {items.map((item, i) => (
        <div key={i} className="relative pl-8">
          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-slate-950 -translate-x-1" />
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">{item.phase}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{item.duration}</span>
            </div>
            <ul className="space-y-1.5">
              {item.tasks.map((task, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-slate-600 mt-1">▸</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 flex items-center gap-4 inline-flex w-auto mr-4">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
