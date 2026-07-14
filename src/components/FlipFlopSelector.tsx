import React from 'react';
import { FlipFlopType } from '../types';
import { ToggleLeft, ShieldAlert, Cpu, Binary, Layers } from 'lucide-react';

interface FlipFlopSelectorProps {
  selectedType: FlipFlopType;
  onSelectType: (type: FlipFlopType) => void;
}

export const FlipFlopSelector: React.FC<FlipFlopSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  const flipFlops = [
    {
      id: 'SR' as FlipFlopType,
      name: 'SR Flip-Flop',
      tag: 'Set-Reset Latch',
      icon: Layers,
      desc: 'The fundamental building block of sequential logic. Has two inputs: Set (S) and Reset (R). Storing a single state bit, it is used in switch debouncers and basic control logic.',
      warning: '🚨 Unsafe State: S=1, R=1 produces unstable outputs where Q=Q̅, which is logically forbidden!',
    },
    {
      id: 'JK' as FlipFlopType,
      name: 'JK Flip-Flop',
      tag: 'Universal Flip-Flop',
      icon: Cpu,
      desc: 'A universal flip-flop that overcomes the SR invalid state hazard. When both inputs J and K are High, the output state toggles. Ideal for digital clocks, counters, and registers.',
      warning: '✅ Race-Free Latching: J=1, K=1 toggles safely on clock edges without oscillations.',
    },
    {
      id: 'D' as FlipFlopType,
      name: 'D Flip-Flop',
      tag: 'Data / Delay Latch',
      icon: Binary,
      desc: 'Transfers its data input (D) directly to the output on the active clock edge. It acts as a 1-bit memory element, serving as the core storage component in CPU registers and RAM.',
      warning: '🔒 Edge-Triggered Store: Q locks and holds the state of D only at the precise rising edge of CLK.',
    },
    {
      id: 'T' as FlipFlopType,
      name: 'T Flip-Flop',
      tag: 'Toggle Flip-Flop',
      icon: ToggleLeft,
      desc: 'Toggles its output state on every clock edge if the T input is High; holds state if Low. It is constructed by tying the J and K inputs of a JK flip-flop together.',
      warning: '📈 Frequency Divider: Perfect for dividing a clock signal’s frequency by exactly 2.',
    },
  ];

  return (
    <div id="flipflop-selector-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {flipFlops.map((ff) => {
        const isSelected = ff.id === selectedType;
        const Icon = ff.icon;

        return (
          <button
            key={ff.id}
            onClick={() => onSelectType(ff.id)}
            className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
              isSelected
                ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {/* Background Accent */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-125`}
            />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div
                className={`p-2 rounded-lg border transition duration-300 ${
                  isSelected
                    ? 'bg-blue-100 border-blue-200 text-blue-600'
                    : 'bg-slate-50 border-slate-200/80 text-slate-500 group-hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {isSelected && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100 border border-blue-200 rounded text-blue-700 font-mono">
                  Active
                </span>
              )}
            </div>

            <div className="relative z-10">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                {ff.tag}
              </div>
              <h3 className={`font-display font-bold text-sm mt-0.5 mb-1.5 transition duration-200 ${
                isSelected ? 'text-slate-900' : 'text-slate-800'
              }`}>
                {ff.name}
              </h3>
              <p className={`text-xs leading-relaxed font-sans line-clamp-3 ${
                isSelected ? 'text-slate-700' : 'text-slate-500'
              }`}>
                {ff.desc}
              </p>

              {/* Status / Alert Indicator */}
              <div
                className={`mt-4 pt-3 border-t text-[10px] font-sans ${
                  isSelected
                    ? 'border-blue-200/40'
                    : 'border-slate-100 text-slate-400 group-hover:text-slate-500'
                }`}
              >
                {isSelected ? (
                  ff.id === 'SR' ? (
                    <span className="bg-amber-50 border border-amber-200/60 text-amber-800 px-2.5 py-1 rounded-md block">
                      {ff.warning}
                    </span>
                  ) : (
                    <span className="bg-blue-50/70 border border-blue-200/40 text-blue-800 px-2.5 py-1 rounded-md block">
                      {ff.warning}
                    </span>
                  )
                ) : (
                  <span className="px-1 block">
                    {ff.warning}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
