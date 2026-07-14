import React from 'react';
import { FlipFlopType, SignalValue } from '../types';

interface GateLevelVisualizerProps {
  type: FlipFlopType;
  inputs: {
    in1: number; // S, J, D, T
    in2: number; // R, K (or 0)
    pr: number;  // Preset (active low, 1 is inactive, 0 is active)
    clr: number; // Clear (active low, 1 is inactive, 0 is active)
    clk: number;
  };
  state: {
    q: SignalValue;
    qBar: SignalValue;
  };
  onToggleInput: (inputName: 'in1' | 'in2' | 'pr' | 'clr' | 'clk') => void;
}

export const GateLevelVisualizer: React.FC<GateLevelVisualizerProps> = ({
  type,
  inputs,
  state,
  onToggleInput,
}) => {
  const { in1, in2, pr, clr, clk } = inputs;
  const { q, qBar } = state;

  // Helper to convert signal value (0, 1, 'X') to line color class/style
  const getSignalColor = (val: SignalValue) => {
    if (val === 1) return 'stroke-blue-500 shadow-blue-500';
    if (val === 0) return 'stroke-slate-300';
    return 'stroke-amber-500 shadow-amber-500';
  };

  const getSignalFillColor = (val: SignalValue) => {
    if (val === 1) return 'fill-blue-500';
    if (val === 0) return 'fill-slate-400';
    return 'fill-amber-500';
  };

  const getSignalTextClass = (val: SignalValue) => {
    if (val === 1) return 'text-blue-600 font-bold';
    if (val === 0) return 'text-slate-400';
    return 'text-amber-500 font-bold';
  };

  // Intermediate wire state calculations for rendering
  const getSRWires = () => {
    // Clocked SR with Active-Low Preset and Clear
    const s_in: any = in1;
    const r_in: any = in2;
    const clk_in: any = clk;
    const pr_in: any = pr;
    const clr_in: any = clr;

    let s_gated: SignalValue = 1;
    let r_gated: SignalValue = 1;

    if (clk_in === 1) {
      if (s_in === 1) s_gated = 0;
      if (r_in === 1) r_gated = 0;
      if (s_in === 'X' || clk_in === 'X') s_gated = 'X';
      if (r_in === 'X' || clk_in === 'X') r_gated = 'X';
    } else if (clk_in === 'X') {
      s_gated = 'X';
      r_gated = 'X';
    }

    return {
      s_in,
      r_in,
      clk_in,
      pr_in,
      clr_in,
      s_gated,
      r_gated,
      q_out: q,
      q_bar_out: qBar,
    };
  };

  const getJKWires = () => {
    const j_in: SignalValue = in1 as any;
    const k_in: SignalValue = in2 as any;
    const clk_in: SignalValue = clk as any;
    const pr_in: SignalValue = pr as any;
    const clr_in: SignalValue = clr as any;

    // Feedback dependencies: J_gated takes J, CLK, Q_bar
    // K_gated takes K, CLK, Q
    let j_gated: SignalValue = 1;
    let k_gated: SignalValue = 1;

    if (clk_in === 1) {
      if (j_in === 1 && qBar === 1) j_gated = 0;
      else if (j_in === 0 || qBar === 0) j_gated = 1;
      else j_gated = 'X';

      if (k_in === 1 && q === 1) k_gated = 0;
      else if (k_in === 0 || q === 0) k_gated = 1;
      else k_gated = 'X';
    } else if (clk_in === 'X') {
      j_gated = 'X';
      k_gated = 'X';
    }

    return {
      j_in,
      k_in,
      clk_in,
      pr_in,
      clr_in,
      j_gated,
      k_gated,
      q_out: q,
      q_bar_out: qBar,
    };
  };

  const getDWires = () => {
    const d_in: any = in1;
    const clk_in: any = clk;
    const pr_in: any = pr;
    const clr_in: any = clr;

    const d_not: SignalValue = d_in === 'X' ? 'X' : d_in === 1 ? 0 : 1;

    let d_gated_top: SignalValue = 1;
    let d_gated_bottom: SignalValue = 1;

    if (clk_in === 1) {
      if (d_in === 1) d_gated_top = 0;
      if (d_not === 1) d_gated_bottom = 0;
      if (d_in === 'X' || clk_in === 'X') d_gated_top = 'X';
      if (d_not === 'X' || clk_in === 'X') d_gated_bottom = 'X';
    } else if (clk_in === 'X') {
      d_gated_top = 'X';
      d_gated_bottom = 'X';
    }

    return {
      d_in,
      d_not,
      clk_in,
      pr_in,
      clr_in,
      d_gated_top,
      d_gated_bottom,
      q_out: q,
      q_bar_out: qBar,
    };
  };

  const getTWires = () => {
    const t_in: SignalValue = in1 as any;
    const clk_in: SignalValue = clk as any;
    const pr_in: SignalValue = pr as any;
    const clr_in: SignalValue = clr as any;

    let t_gated_top: SignalValue = 1;
    let t_gated_bottom: SignalValue = 1;

    if (clk_in === 1) {
      if (t_in === 1 && qBar === 1) t_gated_top = 0;
      else if (t_in === 0 || qBar === 0) t_gated_top = 1;
      else t_gated_top = 'X';

      if (t_in === 1 && q === 1) t_gated_bottom = 0;
      else if (t_in === 0 || q === 0) t_gated_bottom = 1;
      else t_gated_bottom = 'X';
    } else if (clk_in === 'X') {
      t_gated_top = 'X';
      t_gated_bottom = 'X';
    }

    return {
      t_in,
      clk_in,
      pr_in,
      clr_in,
      t_gated_top,
      t_gated_bottom,
      q_out: q,
      q_bar_out: qBar,
    };
  };

  // Render SVG Gates
  const renderNandGate = (x: number, y: number, id: string, label: string) => (
    <g id={id} className="transition-all duration-300">
      {/* Body */}
      <path
        d={`M ${x} ${y - 25} L ${x + 25} ${y - 25} A 25 25 0 0 1 ${x + 25} ${y + 25} L ${x} ${y + 25} Z`}
        className="fill-white stroke-slate-800 stroke-2"
      />
      {/* Bubble */}
      <circle
        cx={x + 55}
        cy={y}
        r={5}
        className="fill-white stroke-slate-800 stroke-2"
      />
      <text
        x={x + 12}
        y={y + 5}
        className="fill-slate-800 text-[9px] font-mono font-bold text-center select-none"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );

  const renderNotGate = (x: number, y: number, id: string) => (
    <g id={id}>
      <path
        d={`M ${x} ${y - 15} L ${x + 30} ${y} L ${x} ${y + 15} Z`}
        className="fill-white stroke-slate-800 stroke-2"
      />
      <circle
        cx={x + 35}
        cy={y}
        r={5}
        className="fill-white stroke-slate-800 stroke-2"
      />
    </g>
  );

  const renderPort = (
    x: number,
    y: number,
    label: string,
    val: SignalValue,
    onClick: () => void,
    tooltip: string,
    isInteractive: boolean = true
  ) => (
    <g
      className={`group ${isInteractive ? 'cursor-pointer' : ''}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <circle
        cx={x}
        cy={y}
        r={14}
        className={`stroke-2 transition-all duration-200 ${
          val === 1
            ? 'stroke-blue-600 fill-blue-50 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
            : val === 0
            ? 'stroke-slate-400 fill-white hover:stroke-slate-600'
            : 'stroke-amber-500 fill-amber-50 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
        }`}
      />
      <text
        x={x}
        y={y + 4}
        className={`font-mono font-bold text-xs select-none ${
          val === 1 ? 'fill-blue-600' : val === 0 ? 'fill-slate-600' : 'fill-amber-600'
        }`}
        textAnchor="middle"
      >
        {val === 'X' ? 'X' : val}
      </text>
      <text
        x={x - 22}
        y={y + 4}
        className="fill-slate-700 font-sans font-semibold text-xs select-none"
        textAnchor="end"
      >
        {label}
      </text>
      <title>{tooltip}</title>
    </g>
  );

  const renderActiveLowPort = (
    x: number,
    y: number,
    label: string,
    val: SignalValue,
    onClick: () => void,
    tooltip: string
  ) => (
    <g className="group cursor-pointer" onClick={onClick}>
      <circle
        cx={x}
        cy={y}
        r={12}
        className={`stroke-2 transition-all duration-200 ${
          val === 1
            ? 'stroke-slate-400 fill-white hover:stroke-slate-600'
            : val === 0
            ? 'stroke-blue-600 fill-blue-50 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
            : 'stroke-amber-500 fill-amber-50'
        }`}
      />
      <text
        x={x}
        y={y + 4}
        className={`font-mono font-bold text-[10px] select-none ${
          val === 1 ? 'fill-slate-600' : val === 0 ? 'fill-blue-600' : 'fill-amber-600'
        }`}
        textAnchor="middle"
      >
        {val === 'X' ? 'X' : val}
      </text>
      {/* Overbar for active low */}
      <text
        x={x}
        y={y - 18}
        className="fill-slate-700 font-sans font-semibold text-xs select-none"
        textAnchor="middle"
      >
        {label}
      </text>
      <line
        x1={x - 12}
        y1={y - 24}
        x2={x + 12}
        y2={y - 24}
        className="stroke-slate-400 stroke-1"
      />
      <title>{tooltip}</title>
    </g>
  );

  const renderLED = (x: number, y: number, label: string, val: SignalValue) => (
    <g>
      <circle
        cx={x}
        cy={y}
        r={16}
        className={`stroke-2 transition-all duration-300 ${
          val === 1
            ? 'stroke-blue-600 fill-blue-50 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
            : val === 0
            ? 'stroke-slate-300 fill-slate-50'
            : 'stroke-amber-500 fill-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
        }`}
      />
      <text
        x={x}
        y={y + 4}
        className={`font-mono font-bold text-sm select-none ${
          val === 1 ? 'fill-blue-600' : val === 0 ? 'fill-slate-400' : 'fill-amber-600'
        }`}
        textAnchor="middle"
      >
        {val === 'X' ? 'X' : val}
      </text>
      <text
        x={x + 28}
        y={y + 5}
        className="fill-slate-800 font-sans font-bold text-sm select-none"
        textAnchor="start"
      >
        {label}
      </text>
    </g>
  );

  return (
    <div id="gate-level-visualizer-card" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col h-full text-slate-800">
      {/* Decorative subtle blue background gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-slate-900 font-display text-lg font-bold">Interactive Schematic</h3>
          <p className="text-slate-500 text-xs">
            Click inputs below or circles inside to toggle. Real-time gate state logic.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_4px_rgba(37,99,235,0.8)]" />
            <span className="text-slate-600 font-mono text-[10px]">HIGH (1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
            <span className="text-slate-500 font-mono text-[10px]">LOW (0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
            <span className="text-slate-600 font-mono text-[10px]">INVALID (X)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-[360px] bg-slate-50/50 rounded-lg p-2 border border-slate-100 relative">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-auto max-h-[420px]"
          id="flipflop-svg-schematic"
        >
          {/* SVG Glow Filter for Live Wires */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. SR FLIP FLOP SCHEMATIC */}
          {type === 'SR' && (() => {
            const w = getSRWires();
            return (
              <g>
                {/* Connections & Wires */}
                {/* S wire to NAND1 top input */}
                <path d="M 80 100 L 170 100" className={`stroke-2 fill-none ${getSignalColor(w.s_in)}`} />
                {/* R wire to NAND2 bottom input */}
                <path d="M 80 350 L 170 350" className={`stroke-2 fill-none ${getSignalColor(w.r_in)}`} />
                {/* CLK wire to NAND1 & NAND2 */}
                <path d="M 80 225 L 140 225 L 140 125 L 170 125" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <path d="M 140 225 L 140 325 L 170 325" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <circle cx={140} cy={225} r={3} className={getSignalFillColor(w.clk_in)} />

                {/* S_gated wire to NAND3 top input */}
                <path d={`M 225 112.5 L 360 112.5 L 360 155 L 430 155`} className={`stroke-2 fill-none ${getSignalColor(w.s_gated)}`} />
                {/* R_gated wire to NAND4 bottom input */}
                <path d={`M 225 337.5 L 360 337.5 L 360 295 L 430 295`} className={`stroke-2 fill-none ${getSignalColor(w.r_gated)}`} />

                {/* Preset wire to NAND3 */}
                <path d="M 455 60 L 455 135" className={`stroke-2 fill-none ${getSignalColor(w.pr_in)}`} />
                {/* Clear wire to NAND4 */}
                <path d="M 455 390 L 455 315" className={`stroke-2 fill-none ${getSignalColor(w.clr_in)}`} />

                {/* Cross-coupled Q feedback to NAND4 top input */}
                {/* Q is at x=505, y=175. We take it forward, down, back, into NAND4 at x=430, y=255 */}
                <path d="M 485 175 L 530 175 L 530 220 L 390 220 L 390 255 L 430 255" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                <circle cx={530} cy={175} r={3} className={getSignalFillColor(w.q_out)} />

                {/* Cross-coupled Q_bar feedback to NAND3 bottom input */}
                {/* Q_bar is at x=505, y=275. We take it forward, up, back, into NAND3 at x=430, y=195 */}
                <path d="M 485 275 L 550 275 L 550 235 L 380 235 L 380 195 L 430 195" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />
                <circle cx={550} cy={275} r={3} className={getSignalFillColor(w.q_bar_out)} />

                {/* Q Output wire */}
                <path d="M 530 175 L 680 175" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                {/* Q_bar Output wire */}
                <path d="M 550 275 L 680 275" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* NAND Gates */}
                {renderNandGate(170, 112.5, 'gate-nand1', 'NAND 1')}
                {renderNandGate(170, 337.5, 'gate-nand2', 'NAND 2')}
                {renderNandGate(430, 175, 'gate-nand3', 'NAND 3')}
                {renderNandGate(430, 275, 'gate-nand4', 'NAND 4')}

                {/* Inputs & Outputs */}
                {renderPort(80, 100, 'S (Set)', w.s_in, () => onToggleInput('in1'), 'Set Input')}
                {renderPort(80, 225, 'CLK', w.clk_in, () => onToggleInput('clk'), 'Clock Trigger')}
                {renderPort(80, 350, 'R (Reset)', w.r_in, () => onToggleInput('in2'), 'Reset Input')}

                {renderActiveLowPort(455, 60, 'PR', w.pr_in, () => onToggleInput('pr'), 'Preset (Active Low)')}
                {renderActiveLowPort(455, 390, 'CLR', w.clr_in, () => onToggleInput('clr'), 'Clear (Active Low)')}

                {renderLED(680, 175, 'Q', w.q_out)}
                {renderLED(680, 275, 'Q̅', w.q_bar_out)}
              </g>
            );
          })()}

          {/* 2. JK FLIP FLOP SCHEMATIC */}
          {type === 'JK' && (() => {
            const w = getJKWires();
            return (
              <g>
                {/* Connections & Wires */}
                {/* J wire to NAND1 middle input */}
                <path d="M 80 110 L 170 110" className={`stroke-2 fill-none ${getSignalColor(w.j_in)}`} />
                {/* K wire to NAND2 middle input */}
                <path d="M 80 340 L 170 340" className={`stroke-2 fill-none ${getSignalColor(w.k_in)}`} />
                {/* CLK wire to NAND1 & NAND2 */}
                <path d="M 80 225 L 130 225 L 130 125 L 170 125" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <path d="M 130 225 L 130 325 L 170 325" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <circle cx={130} cy={225} r={3} className={getSignalFillColor(w.clk_in)} />

                {/* J_gated wire to NAND3 top input */}
                <path d={`M 225 112.5 L 360 112.5 L 360 155 L 430 155`} className={`stroke-2 fill-none ${getSignalColor(w.j_gated)}`} />
                {/* K_gated wire to NAND4 bottom input */}
                <path d={`M 225 337.5 L 360 337.5 L 360 295 L 430 295`} className={`stroke-2 fill-none ${getSignalColor(w.k_gated)}`} />

                {/* Preset wire to NAND3 */}
                <path d="M 455 60 L 455 135" className={`stroke-2 fill-none ${getSignalColor(w.pr_in)}`} />
                {/* Clear wire to NAND4 */}
                <path d="M 455 390 L 455 315" className={`stroke-2 fill-none ${getSignalColor(w.clr_in)}`} />

                {/* Cross-coupled Q feedback */}
                <path d="M 485 175 L 530 175 L 530 220 L 390 220 L 390 255 L 430 255" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                <circle cx={530} cy={175} r={3} className={getSignalFillColor(w.q_out)} />

                {/* Cross-coupled Q_bar feedback */}
                <path d="M 485 275 L 550 275 L 550 235 L 380 235 L 380 195 L 430 195" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />
                <circle cx={550} cy={275} r={3} className={getSignalFillColor(w.q_bar_out)} />

                {/* Q feedback to NAND2 (K) bottom input (x=170, y=350) */}
                <path d="M 530 175 L 530 220 L 535 220 L 535 420 L 150 420 L 150 350 L 170 350" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                
                {/* Q_bar feedback to NAND1 (J) top input (x=170, y=100) */}
                <path d="M 550 275 L 550 235 L 565 235 L 565 30 L 150 30 L 150 100 L 170 100" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* Q Output wire */}
                <path d="M 530 175 L 680 175" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                {/* Q_bar Output wire */}
                <path d="M 550 275 L 680 275" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* NAND Gates */}
                {renderNandGate(170, 112.5, 'gate-jk-nand1', 'NAND 1')}
                {renderNandGate(170, 337.5, 'gate-jk-nand2', 'NAND 2')}
                {renderNandGate(430, 175, 'gate-jk-nand3', 'NAND 3')}
                {renderNandGate(430, 275, 'gate-jk-nand4', 'NAND 4')}

                {/* Inputs & Outputs */}
                {renderPort(80, 110, 'J', w.j_in, () => onToggleInput('in1'), 'J (Set-like)')}
                {renderPort(80, 225, 'CLK', w.clk_in, () => onToggleInput('clk'), 'Clock Trigger')}
                {renderPort(80, 340, 'K', w.k_in, () => onToggleInput('in2'), 'K (Reset-like)')}

                {renderActiveLowPort(455, 60, 'PR', w.pr_in, () => onToggleInput('pr'), 'Preset (Active Low)')}
                {renderActiveLowPort(455, 390, 'CLR', w.clr_in, () => onToggleInput('clr'), 'Clear (Active Low)')}

                {renderLED(680, 175, 'Q', w.q_out)}
                {renderLED(680, 275, 'Q̅', w.q_bar_out)}
              </g>
            );
          })()}

          {/* 3. D FLIP FLOP SCHEMATIC */}
          {type === 'D' && (() => {
            const w = getDWires();
            return (
              <g>
                {/* D Input splits to NAND1 directly and through a NOT gate to NAND2 */}
                <path d="M 80 100 L 220 100" className={`stroke-2 fill-none ${getSignalColor(w.d_in)}`} />
                <path d="M 120 100 L 120 350 L 140 350" className={`stroke-2 fill-none ${getSignalColor(w.d_in)}`} />
                <circle cx={120} cy={100} r={3} className={getSignalFillColor(w.d_in)} />

                {/* NOT Gate */}
                {renderNotGate(140, 350, 'gate-not')}
                {/* Wire out of NOT gate */}
                <path d="M 180 350 L 220 350" className={`stroke-2 fill-none ${getSignalColor(w.d_not)}`} />

                {/* CLK wire to NAND1 and NAND2 */}
                <path d="M 80 225 L 180 225 L 180 125 L 220 125" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <path d="M 180 225 L 180 325 L 220 325" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <circle cx={180} cy={225} r={3} className={getSignalFillColor(w.clk_in)} />

                {/* Gated outputs to Latch */}
                <path d={`M 275 112.5 L 360 112.5 L 360 155 L 430 155`} className={`stroke-2 fill-none ${getSignalColor(w.d_gated_top)}`} />
                <path d={`M 275 337.5 L 360 337.5 L 360 295 L 430 295`} className={`stroke-2 fill-none ${getSignalColor(w.d_gated_bottom)}`} />

                {/* Preset & Clear */}
                <path d="M 455 60 L 455 135" className={`stroke-2 fill-none ${getSignalColor(w.pr_in)}`} />
                {/* Clear wire to NAND4 */}
                <path d="M 455 390 L 455 315" className={`stroke-2 fill-none ${getSignalColor(w.clr_in)}`} />

                {/* Cross-coupled Q feedback */}
                <path d="M 485 175 L 530 175 L 530 220 L 390 220 L 390 255 L 430 255" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                <circle cx={530} cy={175} r={3} className={getSignalFillColor(w.q_out)} />

                {/* Cross-coupled Q_bar feedback */}
                <path d="M 485 275 L 550 275 L 550 235 L 380 235 L 380 195 L 430 195" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />
                <circle cx={550} cy={275} r={3} className={getSignalFillColor(w.q_bar_out)} />

                {/* Q Output wire */}
                <path d="M 530 175 L 680 175" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                {/* Q_bar Output wire */}
                <path d="M 550 275 L 680 275" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* NAND Gates */}
                {renderNandGate(220, 112.5, 'gate-d-nand1', 'NAND 1')}
                {renderNandGate(220, 337.5, 'gate-d-nand2', 'NAND 2')}
                {renderNandGate(430, 175, 'gate-d-nand3', 'NAND 3')}
                {renderNandGate(430, 275, 'gate-d-nand4', 'NAND 4')}

                {/* Inputs & Outputs */}
                {renderPort(80, 100, 'D (Data)', w.d_in, () => onToggleInput('in1'), 'D Input')}
                {renderPort(80, 225, 'CLK', w.clk_in, () => onToggleInput('clk'), 'Clock Trigger')}

                {renderActiveLowPort(455, 60, 'PR', w.pr_in, () => onToggleInput('pr'), 'Preset (Active Low)')}
                {renderActiveLowPort(455, 390, 'CLR', w.clr_in, () => onToggleInput('clr'), 'Clear (Active Low)')}

                {renderLED(680, 175, 'Q', w.q_out)}
                {renderLED(680, 275, 'Q̅', w.q_bar_out)}
              </g>
            );
          })()}

          {/* 4. T FLIP FLOP SCHEMATIC */}
          {type === 'T' && (() => {
            const w = getTWires();
            return (
              <g>
                {/* Connections & Wires */}
                {/* T splits to both J-side (NAND1) and K-side (NAND2) middle inputs */}
                <path d="M 80 280 L 110 280 L 110 110 L 170 110" className={`stroke-2 fill-none ${getSignalColor(w.t_in)}`} />
                <path d="M 110 280 L 110 340 L 170 340" className={`stroke-2 fill-none ${getSignalColor(w.t_in)}`} />
                <circle cx={110} cy={280} r={3} className={getSignalFillColor(w.t_in)} />

                {/* CLK wire to NAND1 & NAND2 */}
                <path d="M 80 195 L 130 195 L 130 125 L 170 125" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <path d="M 130 195 L 130 325 L 170 325" className={`stroke-2 fill-none ${getSignalColor(w.clk_in)}`} />
                <circle cx={130} cy={195} r={3} className={getSignalFillColor(w.clk_in)} />

                {/* S_gated/R_gated equivalent */}
                <path d={`M 225 112.5 L 360 112.5 L 360 155 L 430 155`} className={`stroke-2 fill-none ${getSignalColor(w.t_gated_top)}`} />
                <path d={`M 225 337.5 L 360 337.5 L 360 295 L 430 295`} className={`stroke-2 fill-none ${getSignalColor(w.t_gated_bottom)}`} />

                {/* Preset & Clear */}
                <path d="M 455 60 L 455 135" className={`stroke-2 fill-none ${getSignalColor(w.pr_in)}`} />
                {/* Clear wire to NAND4 */}
                <path d="M 455 390 L 455 315" className={`stroke-2 fill-none ${getSignalColor(w.clr_in)}`} />

                {/* Cross-coupled Q feedback */}
                <path d="M 485 175 L 530 175 L 530 220 L 390 220 L 390 255 L 430 255" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                <circle cx={530} cy={175} r={3} className={getSignalFillColor(w.q_out)} />

                {/* Cross-coupled Q_bar feedback */}
                <path d="M 485 275 L 550 275 L 550 235 L 380 235 L 380 195 L 430 195" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />
                <circle cx={550} cy={275} r={3} className={getSignalFillColor(w.q_bar_out)} />

                {/* Q feedback back to bottom NAND input */}
                <path d="M 530 175 L 530 220 L 535 220 L 535 420 L 150 420 L 150 350 L 170 350" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                {/* Q_bar feedback back to top NAND input */}
                <path d="M 550 275 L 550 235 L 565 235 L 565 30 L 150 30 L 150 100 L 170 100" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* Outputs */}
                <path d="M 530 175 L 680 175" className={`stroke-2 fill-none ${getSignalColor(w.q_out)}`} />
                <path d="M 550 275 L 680 275" className={`stroke-2 fill-none ${getSignalColor(w.q_bar_out)}`} />

                {/* NAND Gates */}
                {renderNandGate(170, 112.5, 'gate-t-nand1', 'NAND 1')}
                {renderNandGate(170, 337.5, 'gate-t-nand2', 'NAND 2')}
                {renderNandGate(430, 175, 'gate-t-nand3', 'NAND 3')}
                {renderNandGate(430, 275, 'gate-t-nand4', 'NAND 4')}

                {/* Inputs & Outputs */}
                {renderPort(80, 280, 'T (Toggle)', w.t_in, () => onToggleInput('in1'), 'T Input')}
                {renderPort(80, 195, 'CLK', w.clk_in, () => onToggleInput('clk'), 'Clock Trigger')}

                {renderActiveLowPort(455, 60, 'PR', w.pr_in, () => onToggleInput('pr'), 'Preset (Active Low)')}
                {renderActiveLowPort(455, 390, 'CLR', w.clr_in, () => onToggleInput('clr'), 'Clear (Active Low)')}

                {renderLED(680, 175, 'Q', w.q_out)}
                {renderLED(680, 275, 'Q̅', w.q_bar_out)}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs justify-between text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
        <span className="font-mono">
          Interactive nodes: Click S/R/J/K/D/T, CLK, PR, or CLR to change states dynamically.
        </span>
        <span className="text-blue-600 font-semibold">
          💡 Pro-tip: Asynchronous inputs (PR/CLR) override all other signals!
        </span>
      </div>
    </div>
  );
};
