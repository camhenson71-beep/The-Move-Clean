import React from "react";

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col justify-between px-6 py-12">
      <div />
      <div className="space-y-4">
        <p className="text-amber-400 text-sm font-medium tracking-tight">THE MOVE</p>
        <h1 className="font-serif text-4xl leading-tight">Stop searching.<br />Know the move.</h1>
        <p className="text-neutral-400 text-base max-w-xs">See what's worth doing in Tampa, ranked for you.</p>
      </div>
      <div className="space-y-3">
        <button onClick={onStart} className="w-full rounded-full bg-amber-400 text-neutral-950 py-4 font-medium text-base">
          Find My Move
        </button>
        <p className="text-center text-[11px] text-neutral-600">Prototype experience. Event inventory is currently demo data.</p>
      </div>
    </div>
  );
}
