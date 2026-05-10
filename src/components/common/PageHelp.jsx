import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function PageHelp({ text, align = 'start' }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="About this page"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-64 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-lg text-[13px] font-medium leading-relaxed text-slate-600"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}
