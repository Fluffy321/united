import { toast } from 'sonner';
import MemberAvatarStack from './MemberAvatarStack';

export default function CommunityPresenceStrip({ community, members, engagementKit, roomModel, typeConfig, onPrompt }) {
  const activeCount = Math.max(
    members.length || 0,
    community?.activeNow || community?.active_now || community?.active_members || 0,
    1
  );
  const trending = engagementKit?.starterThreads?.[0]?.title || roomModel?.emptyWin || 'Start the next useful thread';
  const prompt = engagementKit?.starterThreads?.[0]?.prompt || roomModel?.prompts?.[0] || 'What should people here know today?';

  return (
    <section className="rounded-[26px] border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatarStack members={members} limit={5} typeConfig={typeConfig} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-slate-950">{activeCount} active in this room</p>
            <p className="truncate text-[11px] font-bold text-slate-500">Trending: {trending}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPrompt(prompt)}
          className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white active:scale-95"
        >
          Jump in
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onPrompt(prompt)}
          className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-blue-500">Prompt</p>
          <p className="mt-1 line-clamp-2 text-[12px] font-black leading-snug text-blue-900">{prompt}</p>
        </button>
        <button
          type="button"
          onClick={() => toast.success('Thanks. Reports help keep this room safe.')}
          className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-rose-500">Safety</p>
          <p className="mt-1 text-[12px] font-black text-rose-900">Report a post</p>
        </button>
        <button
          type="button"
          onClick={() => toast.success('Blocked content controls are ready for this room.')}
          className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left active:scale-[0.98]"
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Control</p>
          <p className="mt-1 text-[12px] font-black text-slate-900">Block / hide</p>
        </button>
      </div>
    </section>
  );
}
