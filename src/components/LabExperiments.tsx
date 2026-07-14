import React from 'react';
import { FlipFlopType, LabExperiment, SignalValue } from '../types';
import { CheckCircle2, Circle, GraduationCap, RefreshCw, HelpCircle } from 'lucide-react';

interface LabExperimentsProps {
  activeExperimentId: number;
  onSelectExperiment: (id: number) => void;
  experiments: LabExperiment[];
  currentInputs: {
    in1: number;
    in2: number;
    pr: number;
    clr: number;
    clk: number;
  };
  state: {
    q: SignalValue;
    qBar: SignalValue;
  };
  transitionCount: number;
  toggledCount: number;
  invalidHit: boolean;
  onResetExperimentState: () => void;
  completedIds: number[];
}

export const LabExperiments: React.FC<LabExperimentsProps> = ({
  activeExperimentId,
  onSelectExperiment,
  experiments,
  currentInputs,
  state,
  transitionCount,
  toggledCount,
  invalidHit,
  onResetExperimentState,
  completedIds,
}) => {
  const activeExp = experiments.find((e) => e.id === activeExperimentId) || experiments[0];

  // Evaluate individual checklist steps for the active experiment dynamically
  const getProgressChecklist = () => {
    const { in1, in2, clk, pr, clr } = currentInputs;
    const { q, qBar } = state;

    switch (activeExp.id) {
      case 1: // SR Latch Set & Reset
        return [
          {
            text: 'Set inputs to S = 1, R = 0',
            done: in1 === 1 && in2 === 0,
          },
          {
            text: 'Pulse clock (CLK = 1) to set Q = 1',
            done: in1 === 1 && in2 === 0 && q === 1,
          },
          {
            text: 'Now set inputs to S = 0, R = 1',
            done: q === 1 && in1 === 0 && in2 === 1,
          },
          {
            text: 'Pulse clock to reset Q = 0',
            done: q === 0 && in1 === 0 && in2 === 1,
          },
        ];
      case 2: // SR Invalid State
        return [
          {
            text: 'Set inputs to S = 1, R = 1',
            done: in1 === 1 && in2 === 1,
          },
          {
            text: 'Trigger clock pulse (CLK = 1)',
            done: in1 === 1 && in2 === 1 && clk === 1,
          },
          {
            text: 'Observe invalid state (Q = 1 and Q̅ = 1, violating complement laws!)',
            done: q === 1 && qBar === 1,
          },
        ];
      case 3: // JK Toggle
        return [
          {
            text: 'Select JK Flip-Flop & set J = 1, K = 1',
            done: activeExp.targetFlipFlop === 'JK' && in1 === 1 && in2 === 1,
          },
          {
            text: 'Ensure asynchronous inputs are inactive (PR̅ = 1, CLR̅ = 1)',
            done: pr === 1 && clr === 1,
          },
          {
            text: 'Pulse clock repeatedly (Trigger at least 3 toggles)',
            done: toggledCount >= 3,
          },
        ];
      case 4: // D Register Memory
        return [
          {
            text: 'Set D = 1',
            done: in1 === 1,
          },
          {
            text: 'Pulse clock to load data bit (Q becomes 1)',
            done: q === 1 && in1 === 1,
          },
          {
            text: 'Now change D back to 0',
            done: q === 1 && in1 === 0,
          },
          {
            text: 'Notice that Q remains 1 as long as clock is idle (Data Stored!)',
            done: q === 1 && in1 === 0 && clk === 0,
          },
        ];
      case 5: // T Flip-Flop Frequency Divider
        return [
          {
            text: 'Select T Flip-Flop and set T = 1',
            done: activeExp.targetFlipFlop === 'T' && in1 === 1,
          },
          {
            text: 'Turn on the "Run Gen" auto clock generator',
            done: toggledCount > 0, // indicates clock transitions are active
          },
          {
            text: 'Observe that Q cycles at exactly half the frequency of the CLK line',
            done: toggledCount >= 4,
          },
        ];
      default:
        return [];
    }
  };

  const checklist = getProgressChecklist();

  return (
    <div id="lab-experiments-card" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 h-full relative overflow-hidden text-slate-800">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />

      {/* Experiment List (Left Sidebar inside card) */}
      <div className="w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-display text-base font-bold">Guided Experiments</h3>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] lg:max-h-none pr-1">
          {experiments.map((exp) => {
            const isActive = exp.id === activeExperimentId;
            const isCompleted = completedIds.includes(exp.id);

            return (
              <button
                key={exp.id}
                onClick={() => onSelectExperiment(exp.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-start gap-2.5 ${
                  isActive
                    ? 'bg-blue-50/50 border-blue-200 text-slate-900 ring-1 ring-blue-500/20'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                )}
                <div className="leading-tight">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-0.5">
                    Exp {exp.id} • {exp.targetFlipFlop}
                  </div>
                  <div className="font-sans font-semibold text-xs text-slate-700">{exp.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Experiment Workbench */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 font-mono">
                Active Lab Work
              </span>
              <h4 className="text-slate-900 font-display text-lg font-bold leading-tight mt-0.5">
                {activeExp.title}
              </h4>
            </div>

            <button
              onClick={onResetExperimentState}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200 hover:border-slate-300 transition duration-150"
              title="Reset inputs and state for this experiment"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Lab
            </button>
          </div>

          {/* Objective Box */}
          <div className="bg-blue-50/30 border border-blue-100/50 rounded-lg p-3.5 mb-4 text-xs">
            <span className="font-semibold text-blue-600 font-mono uppercase text-[9px] tracking-wide block mb-1">
              🔬 LAB OBJECTIVE
            </span>
            <p className="text-slate-600 leading-relaxed font-sans">{activeExp.objective}</p>
          </div>

          {/* Instructions and Steps */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2 font-mono">
                📋 GUIDED STEPS
              </span>
              <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 font-sans leading-relaxed">
                {activeExp.instructions.map((step, idx) => (
                  <li key={idx} className="marker:text-slate-300">
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Checklist (Live Feedback) */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2 font-mono">
                ⚡ LIVE TEST BENCH STATE
              </span>
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition duration-150 ${
                      item.done
                        ? 'bg-blue-50 border-blue-200/80 text-blue-800 font-medium'
                        : 'bg-slate-50/50 border-slate-100 text-slate-500'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-300 rounded-full shrink-0 flex items-center justify-center text-[8px] text-slate-400 font-mono font-bold">
                        {idx + 1}
                      </div>
                    )}
                    <span className="font-sans">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hints and Completion Success Banner */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          {completedIds.includes(activeExp.id) ? (
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 font-sans flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600" />
              <div>
                <strong className="block text-slate-900 text-xs">Experiment Completed successfully!</strong>
                <span className="text-[11px] text-slate-600">
                  Great job! You have fully verified the theory on the physical workbench. Feel free to try the next experiment.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <HelpCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
              <div className="font-sans leading-relaxed text-[11px]">
                <strong className="text-slate-700">Lab Assistant Hint:</strong> {activeExp.hint}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
