import React, { useMemo } from 'react';
import { FlipFlopType, HistorySample, SignalValue } from '../types';
import { Play, Pause, Trash2, StepForward, Activity } from 'lucide-react';

interface WaveformDiagramProps {
  type: FlipFlopType;
  history: HistorySample[];
  maxSamples?: number;
  onClearHistory: () => void;
  isAutoClock: boolean;
  onToggleAutoClock: () => void;
  clockSpeed: number;
  onChangeClockSpeed: (speed: number) => void;
  onTriggerClockPulse: () => void;
}

export const WaveformDiagram: React.FC<WaveformDiagramProps> = ({
  type,
  history,
  maxSamples = 20,
  onClearHistory,
  isAutoClock,
  onToggleAutoClock,
  clockSpeed,
  onChangeClockSpeed,
  onTriggerClockPulse,
}) => {
  // Determine which channels to render based on flip flop type
  const channels = useMemo(() => {
    const list = [
      { key: 'clk', label: 'CLK (Clock)' },
      { key: 'in1', label: type === 'SR' ? 'S (Set)' : type === 'JK' ? 'J' : type === 'D' ? 'D (Data)' : 'T (Toggle)' },
    ];

    if (type === 'SR') {
      list.push({ key: 'in2', label: 'R (Reset)' });
    } else if (type === 'JK') {
      list.push({ key: 'in2', label: 'K' });
    }

    list.push(
      { key: 'pr', label: 'PR̅ (Preset)' },
      { key: 'clr', label: 'CLR̅ (Clear)' },
      { key: 'q', label: 'Q (Output)' },
      { key: 'qBar', label: 'Q̅ (Complement)' }
    );

    return list;
  }, [type]);

  // Width and height of SVG canvas
  const width = 800;
  const height = channels.length * 50 + 20;

  // Render square wave paths
  const renderWavePath = (channelKey: string, channelIndex: number) => {
    if (history.length === 0) return null;

    const trackTop = channelIndex * 50 + 20;
    const trackHeight = 30;
    const yHigh = trackTop;
    const yLow = trackTop + trackHeight;
    const yMid = trackTop + trackHeight / 2;

    const stepWidth = width / maxSamples;

    // Build SVG path
    let pathD = '';
    let invalidRegions: React.ReactNode[] = [];

    // To make sure we show at most `maxSamples` scrolling from right to left
    const visibleSamples = history.slice(-maxSamples);
    const startOffset = maxSamples - visibleSamples.length;

    visibleSamples.forEach((sample, i) => {
      const x = (startOffset + i) * stepWidth;
      const nextX = (startOffset + i + 1) * stepWidth;
      
      const rawVal = (sample as any)[channelKey];
      const val: SignalValue = rawVal === undefined ? 0 : rawVal;

      let y = yLow;
      if (val === 1) y = yHigh;
      else if (val === 'X') y = yMid;

      if (i === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        // Step interpolation: draw vertical transition line first, then horizontal
        const prevSample = visibleSamples[i - 1];
        const prevRawVal = (prevSample as any)[channelKey];
        const prevVal: SignalValue = prevRawVal === undefined ? 0 : prevRawVal;

        if (prevVal !== val) {
          let prevY = yLow;
          if (prevVal === 1) prevY = yHigh;
          else if (prevVal === 'X') prevY = yMid;

          // Draw vertical transition line
          pathD += ` L ${x} ${prevY} L ${x} ${y}`;
        } else {
          pathD += ` L ${x} ${y}`;
        }
      }

      // Draw horizontal segment for this step
      pathD += ` L ${nextX} ${y}`;

      // If state is invalid ('X'), draw a hatched/shaded amber block
      if (val === 'X') {
        invalidRegions.push(
          <rect
            key={`invalid-${channelKey}-${i}`}
            x={x}
            y={yHigh}
            width={stepWidth}
            height={trackHeight}
            className="fill-amber-500/10 stroke-amber-500/30 stroke-1 stroke-dasharray-[2,2]"
          />
        );
      }
    });

    const isOutput = channelKey === 'q' || channelKey === 'qBar';
    const strokeColor = isOutput
      ? 'stroke-blue-600'
      : channelKey === 'clk'
      ? 'stroke-sky-500'
      : channelKey === 'pr' || channelKey === 'clr'
      ? 'stroke-amber-600'
      : 'stroke-indigo-500';

    return (
      <g key={channelKey}>
        {/* Track Label */}
        <text
          x={10}
          y={trackTop + 18}
          className="fill-slate-600 font-sans text-xs font-bold select-none"
        >
          {channels[channelIndex].label}
        </text>

        {/* Track Background Guidelines */}
        <line
          x1={0}
          y1={yLow}
          x2={width}
          y2={yLow}
          className="stroke-slate-200 stroke-[0.5]"
        />
        <line
          x1={0}
          y1={yHigh}
          x2={width}
          y2={yHigh}
          className="stroke-slate-100 stroke-[0.5]"
          strokeDasharray="4 4"
        />

        {/* Invalid Shaded Blocks */}
        {invalidRegions}

        {/* Square Wave Line */}
        <path
          d={pathD}
          fill="none"
          className={`${strokeColor} stroke-2`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Draw vertical clock trigger indicator lines (dotted cyan lines)
  const renderClockEdges = () => {
    if (history.length === 0) return null;
    const stepWidth = width / maxSamples;
    const visibleSamples = history.slice(-maxSamples);
    const startOffset = maxSamples - visibleSamples.length;

    return visibleSamples.map((sample, i) => {
      if (!sample.isClockEdge) return null;
      const x = (startOffset + i) * stepWidth;

      return (
        <g key={`edge-${i}`}>
          <line
            x1={x}
            y1={10}
            x2={x}
            y2={height - 10}
            className="stroke-sky-300 stroke-1"
            strokeDasharray="3 3"
          />
          <polygon
            points={`${x},10 ${x-4},4 ${x+4},4`}
            className="fill-sky-500"
          />
          <text
            x={x + 6}
            y={12}
            className="fill-sky-600 font-mono text-[8px] select-none font-bold"
          >
            ↑ CLK
          </text>
        </g>
      );
    });
  };

  return (
    <div id="waveform-diagram-card" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col h-full text-slate-800">
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-slate-900 font-display text-lg font-bold">Logic Analyzer & Waves</h3>
          </div>
          <p className="text-slate-500 text-xs">
            Plots logic levels over time. Shaded regions represent undetermined/invalid states.
          </p>
        </div>

        {/* Instrumentation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clock Frequency Slider */}
          {isAutoClock && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-xs mr-2">
              <span className="text-slate-500 font-mono">CLK Freq:</span>
              <select
                value={clockSpeed}
                onChange={(e) => onChangeClockSpeed(parseFloat(e.target.value))}
                className="bg-transparent text-blue-600 font-mono outline-none cursor-pointer font-bold border-none"
              >
                <option value={2000} className="text-slate-800">0.5 Hz</option>
                <option value={1000} className="text-slate-800">1.0 Hz</option>
                <option value={500} className="text-slate-800">2.0 Hz</option>
              </select>
            </div>
          )}

          {/* Trigger Pulse */}
          <button
            onClick={onTriggerClockPulse}
            disabled={isAutoClock}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition duration-200"
            title="Sends a 0 -> 1 -> 0 Clock Pulse to trigger edge transitions"
          >
            <StepForward className="w-3.5 h-3.5" />
            CLK Pulse
          </button>

          {/* Play / Pause Generator */}
          <button
            onClick={onToggleAutoClock}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition duration-200 ${
              isAutoClock
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            }`}
          >
            {isAutoClock ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Stop Gen
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Gen
              </>
            )}
          </button>

          {/* Trash */}
          <button
            onClick={onClearHistory}
            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition duration-200"
            title="Clear wave log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Waveform Output Screen */}
      <div className="flex-1 overflow-x-auto bg-slate-50/50 border border-slate-200/60 rounded-lg p-2 relative">
        {history.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs font-mono p-4 text-center">
            <span className="text-slate-600 mb-1 font-bold">No timing data captured yet.</span>
            <span>Toggle inputs, click "CLK Pulse" or "Run Gen" to log signals.</span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full min-w-[650px] h-auto"
            style={{ display: 'block' }}
          >
            {/* Grid vertical markings */}
            {Array.from({ length: maxSamples }).map((_, i) => {
              const x = (i + 1) * (width / maxSamples);
              return (
                <line
                  key={`grid-${i}`}
                  x1={x}
                  y1={10}
                  x2={x}
                  y2={height - 10}
                  className="stroke-slate-200/60 stroke-1"
                />
              );
            })}

            {/* Render Vertical Edge Triggers */}
            {renderClockEdges()}

            {/* Render Tracks */}
            {channels.map((ch, idx) => renderWavePath(ch.key, idx))}
          </svg>
        )}
      </div>

      {/* Waveform Footer */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs justify-between text-slate-600 bg-blue-50/50 p-2.5 rounded border border-blue-100 font-mono">
        <span>X-Axis: Time / Logic Steps (Last {maxSamples} increments)</span>
        <span className="text-blue-600 font-semibold">CLK Pulse is a Rising Edge latch trigger!</span>
      </div>
    </div>
  );
};
