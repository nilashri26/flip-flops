import React, { useState } from 'react';
import { FlipFlopType, SignalValue } from '../types';

interface TruthTablePanelProps {
  type: FlipFlopType;
  inputs: {
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
}

export const TruthTablePanel: React.FC<TruthTablePanelProps> = ({
  type,
  inputs,
  state,
}) => {
  const [activeTab, setActiveTab] = useState<'truth' | 'excitation' | 'equations'>('truth');
  const { in1, in2, clk, pr, clr } = inputs;
  const { q } = state;

  // Check if current conditions match a row in the truth table
  const isRowActive = (row: any) => {
    // If Preset/Clear are active (0), standard truth table is overridden
    if (pr === 0 || clr === 0) return false;

    if (clk === 0) {
      return row.clk === 0;
    }

    if (clk === 1) {
      if (row.clk === 0) return false;

      if (type === 'SR' || type === 'JK') {
        return row.in1 === in1 && row.in2 === in2;
      } else {
        return row.in1 === in1;
      }
    }

    return false;
  };

  // 1. Truth Table Definitions
  const truthTables = {
    SR: [
      { clk: 0, in1: 'X', in2: 'X', nextQ: 'Q(t)', label: 'Hold', desc: 'Clock is low; latch is disabled.' },
      { clk: 1, in1: 0, in2: 0, nextQ: 'Q(t)', label: 'Hold', desc: 'No input active; outputs unchanged.' },
      { clk: 1, in1: 0, in2: 1, nextQ: '0', label: 'Reset', desc: 'R input resets Q output to low.' },
      { clk: 1, in1: 1, in2: 0, nextQ: '1', label: 'Set', desc: 'S input sets Q output to high.' },
      { clk: 1, in1: 1, in2: 1, nextQ: 'X', label: 'Invalid', desc: 'S & R both 1! Unstable state.' },
    ],
    JK: [
      { clk: 0, in1: 'X', in2: 'X', nextQ: 'Q(t)', label: 'Hold', desc: 'Clock is low; latch is disabled.' },
      { clk: 1, in1: 0, in2: 0, nextQ: 'Q(t)', label: 'Hold', desc: 'No input active; outputs unchanged.' },
      { clk: 1, in1: 0, in2: 1, nextQ: '0', label: 'Reset', desc: 'K input resets Q output to low.' },
      { clk: 1, in1: 1, in2: 0, nextQ: '1', label: 'Set', desc: 'J input sets Q output to high.' },
      { clk: 1, in1: 1, in2: 1, nextQ: 'Q̅(t)', label: 'Toggle', desc: 'J & K both 1; state toggles on edge.' },
    ],
    D: [
      { clk: 0, in1: 'X', nextQ: 'Q(t)', label: 'Hold', desc: 'Clock is low; latch is disabled.' },
      { clk: 1, in1: 0, nextQ: '0', label: 'Reset', desc: 'Outputs D input value on clock edge.' },
      { clk: 1, in1: 1, nextQ: '1', label: 'Set', desc: 'Outputs D input value on clock edge.' },
    ],
    T: [
      { clk: 0, in1: 'X', nextQ: 'Q(t)', label: 'Hold', desc: 'Clock is low; latch is disabled.' },
      { clk: 1, in1: 0, nextQ: 'Q(t)', label: 'Hold', desc: 'T is low; outputs unchanged.' },
      { clk: 1, in1: 1, nextQ: 'Q̅(t)', label: 'Toggle', desc: 'T is high; state toggles on clock edge.' },
    ],
  };

  // 2. Excitation Table Definitions
  const excitationTables = {
    SR: [
      { q: 0, nextQ: 0, s: '0', r: 'X', desc: 'Output stays low. Set must be inactive, Reset is don\'t care.' },
      { q: 0, nextQ: 1, s: '1', r: '0', desc: 'Output rises. Set must be active, Reset inactive.' },
      { q: 1, nextQ: 0, s: '0', r: '1', desc: 'Output falls. Reset must be active, Set inactive.' },
      { q: 1, nextQ: 1, s: 'X', r: '0', desc: 'Output stays high. Reset must be inactive, Set is don\'t care.' },
    ],
    JK: [
      { q: 0, nextQ: 0, j: '0', k: 'X', desc: 'Output stays low. J is 0, K is don\'t care.' },
      { q: 0, nextQ: 1, j: '1', k: 'X', desc: 'Output rises. J is 1, K is don\'t care.' },
      { q: 1, nextQ: 0, j: 'X', k: '1', desc: 'Output falls. K is 1, J is don\'t care.' },
      { q: 1, nextQ: 1, j: 'X', k: '0', desc: 'Output stays high. K is 0, J is don\'t care.' },
    ],
    D: [
      { q: 0, nextQ: 0, d: '0', desc: 'D must load a 0.' },
      { q: 0, nextQ: 1, d: '1', desc: 'D must load a 1.' },
      { q: 1, nextQ: 0, d: '0', desc: 'D must load a 0.' },
      { q: 1, nextQ: 1, d: '1', desc: 'D must load a 1.' },
    ],
    T: [
      { q: 0, nextQ: 0, t: '0', desc: 'No state change; T must be 0.' },
      { q: 0, nextQ: 1, t: '1', desc: 'State toggles; T must be 1.' },
      { q: 1, nextQ: 0, t: '1', desc: 'State toggles; T must be 1.' },
      { q: 1, nextQ: 1, t: '0', desc: 'No state change; T must be 0.' },
    ],
  };

  const getEquationInfo = () => {
    switch (type) {
      case 'SR':
        return {
          equation: 'Q(t+1) = S + R\' Q(t)',
          constraint: 'Constraint: S · R = 0 (forbidden to prevent invalid states)',
          desc: 'The SR latch characteristic equation indicates that the next state becomes High if Set is High, or remains High if Reset is Low and the previous state was already High. If both S and R are 1, the output is unstable, causing an invalid state.',
        };
      case 'JK':
        return {
          equation: 'Q(t+1) = J Q(t)\' + K\' Q(t)',
          constraint: 'Constraint: None (J=K=1 resolves to a stable Toggle)',
          desc: 'The JK flip-flop eliminates the invalid state of the SR latch. When J and K are both 1, the feedback paths from Q and Q\' trigger a dynamic state inversion (toggle) on every active clock edge, acting as a basic frequency divider.',
        };
      case 'D':
        return {
          equation: 'Q(t+1) = D',
          constraint: 'Constraint: None (pure data transfer element)',
          desc: 'The D (Data/Delay) flip-flop transfers the digital level present on the D pin straight to the Q output when the clock triggers. It serves as the primary building block for computer registers, caches, and synchronous memory cells.',
        };
      case 'T':
        return {
          equation: 'Q(t+1) = T ⊕ Q(t) = T Q(t)\' + T\' Q(t)',
          constraint: 'Constraint: None (state controller)',
          desc: 'The T (Toggle) flip-flop changes state on the clock edge only if the T input is High. If T is Low, it holds its previous value. This unique toggle capability makes it perfect for ripple counters and frequency divider networks.',
        };
    }
  };

  const eqInfo = getEquationInfo();

  return (
    <div id="truth-table-card" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full relative text-slate-800">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4 pb-1 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('truth')}
          className={`px-4 py-2 text-sm font-sans font-semibold transition duration-150 border-b-2 -mb-[6px] shrink-0 whitespace-nowrap ${
            activeTab === 'truth'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Truth & State Table
        </button>
        <button
          onClick={() => setActiveTab('excitation')}
          className={`px-4 py-2 text-sm font-sans font-semibold transition duration-150 border-b-2 -mb-[6px] shrink-0 whitespace-nowrap ${
            activeTab === 'excitation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Excitation Table
        </button>
        <button
          onClick={() => setActiveTab('equations')}
          className={`px-4 py-2 text-sm font-sans font-semibold transition duration-150 border-b-2 -mb-[6px] shrink-0 whitespace-nowrap ${
            activeTab === 'equations'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Theory & Equations
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col justify-between">
        {activeTab === 'truth' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-mono text-slate-500">
                    <th className="p-3">CLK</th>
                    {type === 'SR' && (
                      <>
                        <th className="p-3">S</th>
                        <th className="p-3">R</th>
                      </>
                    )}
                    {type === 'JK' && (
                      <>
                        <th className="p-3">J</th>
                        <th className="p-3">K</th>
                      </>
                    )}
                    {type === 'D' && <th className="p-3">D</th>}
                    {type === 'T' && <th className="p-3">T</th>}
                    <th className="p-3">Q(t+1)</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 hidden sm:table-cell">Operation Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {truthTables[type].map((row: any, i: number) => {
                    const active = isRowActive(row);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 transition-all duration-150 ${
                          active
                            ? 'bg-blue-50/70 text-blue-800 border-l-4 border-l-blue-500 font-bold'
                            : 'text-slate-600 hover:bg-slate-50/40'
                        }`}
                      >
                        <td className="p-3">
                          {row.clk === 1 ? (
                            <span className="text-blue-600">↑ (Edge)</span>
                          ) : (
                            <span className="text-slate-400">0 / ↓</span>
                          )}
                        </td>
                        {type === 'SR' || type === 'JK' ? (
                          <>
                            <td className="p-3">{row.in1}</td>
                            <td className="p-3">{row.in2}</td>
                          </>
                        ) : (
                          <td className="p-3">{row.in1}</td>
                        )}
                        <td className={`p-3 font-bold ${row.nextQ === 'X' ? 'text-amber-600' : ''}`}>
                          {row.nextQ}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              row.label === 'Invalid'
                                ? 'bg-amber-100/60 text-amber-800 border border-amber-200/40'
                                : row.label === 'Hold'
                                ? 'bg-slate-100 text-slate-600'
                                : row.label === 'Toggle'
                                ? 'bg-blue-100/60 text-blue-800 border border-blue-200/40'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {row.label}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] font-sans hidden sm:table-cell">
                          {row.desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pr === 0 || clr === 0 ? (
              <div className="bg-blue-50/50 border border-blue-100 text-blue-800 rounded-lg p-3 text-xs flex flex-col gap-1">
                <span className="font-bold">✨ Asynchronous Override Active!</span>
                <span className="font-sans text-slate-600 text-[11px]">
                  Preset/Clear pins take immediate priority. When PR̅ = 0, Q goes 1. When CLR̅ = 0, Q goes 0. Both are 0 results in an unstable/invalid Q=1, Q̅=1 output.
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic font-sans leading-relaxed">
                * The active row is highlighted dynamically in real-time as you modify physical input signals.
              </p>
            )}
          </div>
        )}

        {activeTab === 'excitation' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Excitation tables indicate the required **Inputs** needed to transition from a current state **Q(t)** to a targeted next state **Q(t+1)**. Perfect for design work!
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-mono text-slate-500">
                    <th className="p-3">Q(t)</th>
                    <th className="p-3">Q(t+1)</th>
                    {type === 'SR' && (
                      <>
                        <th className="p-3">S Required</th>
                        <th className="p-3">R Required</th>
                      </>
                    )}
                    {type === 'JK' && (
                      <>
                        <th className="p-3">J Required</th>
                        <th className="p-3">K Required</th>
                      </>
                    )}
                    {type === 'D' && <th className="p-3">D Required</th>}
                    {type === 'T' && <th className="p-3">T Required</th>}
                    <th className="p-3 hidden sm:table-cell">Logic / Design Note</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-600">
                  {excitationTables[type].map((row: any, i: number) => {
                    const isMatchedState = q === row.q;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 hover:bg-slate-50/30 transition duration-150 ${
                          isMatchedState ? 'bg-slate-100/50 text-slate-800 font-medium' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-slate-500">{row.q}</td>
                        <td className="p-3 font-semibold text-blue-600">{row.nextQ}</td>
                        {type === 'SR' && (
                          <>
                            <td className="p-3 font-bold text-blue-600">{row.s}</td>
                            <td className="p-3 font-bold text-slate-500">{row.r}</td>
                          </>
                        ) || type === 'JK' && (
                          <>
                            <td className="p-3 font-bold text-blue-600">{row.j}</td>
                            <td className="p-3 font-bold text-slate-500">{row.k}</td>
                          </>
                        ) || type === 'D' && (
                          <td className="p-3 font-bold text-blue-600">{row.d}</td>
                        ) || type === 'T' && (
                          <td className="p-3 font-bold text-blue-600">{row.t}</td>
                        )}
                        <td className="p-3 text-slate-500 text-[11px] font-sans hidden sm:table-cell">
                          {row.desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'equations' && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 block mb-1">
                Characteristic Equation
              </span>
              <div className="font-mono text-lg font-bold text-slate-800 bg-white px-4 py-2 rounded-lg border border-slate-200 inline-block shadow-sm">
                {eqInfo.equation}
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed font-sans mt-2">
              {eqInfo.desc}
            </p>

            <div className="border-t border-slate-200 pt-3 text-slate-500 text-[11px] font-mono leading-relaxed">
              {eqInfo.constraint}
            </div>

            <div className="mt-2 text-[10px] text-slate-500 bg-white p-2.5 rounded-md border border-slate-200/80 font-sans">
              <strong>Lab Note:</strong> In physical ICs (e.g., 7474 D Flip-Flop, 7476 JK Flip-Flop), Preset (PR) and Clear (CLR) are asynchronous, active-low pins used to force initial register states, completely bypassing the clock trigger network.
            </div>
          </div>
        )}

        {/* Diagnostic Monitor Panel */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <div>
            Active state: <span className="text-blue-600 font-bold">Q = {q}</span>,{' '}
            <span className="text-slate-400">Q̅ = {state.qBar}</span>
          </div>
          <div>
            Type: <span className="text-blue-600 font-bold">{type}-FF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
