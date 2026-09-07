import React from "react";
import { Calendar, Sparkles, Bookmark, Settings } from "./icons";

export type Tab = "home" | "ask" | "saved";

export default function TabBar({
  tab, setTab, onSettings,
}: { tab: Tab; setTab: (t: Tab) => void; onSettings: () => void }) {
  const Item = ({ id, icon: I, label }: { id: Tab; icon: any; label: string }) => (
    <button onClick={() => setTab(id)} className={`flex flex-col items-center gap-0.5 flex-1 py-2.5 ${tab === id ? "text-amber-400" : "text-neutral-500"}`}>
      <I className="h-5 w-5" /><span className="text-[11px]">{label}</span>
    </button>
  );
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur border-t border-white/10 flex max-w-md mx-auto">
      <Item id="home" icon={Calendar} label="Home" />
      <Item id="ask" icon={Sparkles} label="Ask" />
      <Item id="saved" icon={Bookmark} label="Saved" />
      <button onClick={onSettings} className="flex flex-col items-center gap-0.5 flex-1 py-2.5 text-neutral-500">
        <Settings className="h-5 w-5" /><span className="text-[11px]">Settings</span>
      </button>
    </div>
  );
}
