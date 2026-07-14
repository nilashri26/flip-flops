import { useState, useEffect, useRef, useCallback } from 'react';
import { FlipFlopType, HistorySample, SignalValue } from './types';
import { FlipFlopSelector } from './components/FlipFlopSelector';
import { GateLevelVisualizer } from './components/GateLevelVisualizer';
import { TruthTablePanel } from './components/TruthTablePanel';
import { WaveformDiagram } from './components/WaveformDiagram';
import { LabExperiments } from './components/LabExperiments';
import { LAB_EXPERIMENTS } from './experiments';
import { Play, Pause, RotateCcw, Wrench, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function App() {
  // 1. Core Latch / Flip-Flop States
  const [selectedType, setSelectedType] = useState<FlipFlopType>('SR');

  const [inputs, setInputs] = useState({
    in1: 0, // S (SR), J (JK), D (D), T (T)
    in2: 0, // R (SR), K (JK), ignored for D/T
    pr: 1,  // Preset (active low, 1 is inactive, 0 is active)
    clr: 1, // Clear (active low, 1 is inactive, 0 is active)
    clk: 0, // Clock line
  });

  const [state, setState] = useState<{ q: SignalValue; qBar: SignalValue }>({
    q: 0,
    qBar: 1,
  });

  const [history, setHistory] = useState<HistorySample[]>([]);

  // 2. Clock Generator Configuration
  const [isAutoClock, setIsAutoClock] = useState(false);
  const [clockSpeed, setClockSpeed] = useState(1000); // in ms (1.0 Hz)
  const autoClockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Lab Experiments Progression Metrics
  const [activeExperimentId, setActiveExperimentId] = useState(1);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [transitionCount, setTransitionCount] = useState(0);
  const [toggledCount, setToggledCount] = useState(0);
  const [invalidHit, setInvalidHit] = useState(false);

  // Keep a ref to inputs and state to bypass dependency cycles in interval callbacks
  const stateRef = useRef({ inputs, state, transitionCount, toggledCount, invalidHit });
  useEffect(() => {
    stateRef.current = { inputs, state, transitionCount, toggledCount, invalidHit };
  }, [inputs, state, transitionCount, toggledCount, invalidHit]);

  // Evaluate final state of Q and Q̅ based on inputs and previous Q state
  const computeState = useCallback((
    currentInputs: typeof inputs,
    prevQ: SignalValue,
    prevQBar: SignalValue,
    isRisingEdge: boolean
  ): { q: SignalValue; qBar: SignalValue } => {
    const { in1, in2, pr, clr, clk } = currentInputs;

    // Asynchronous overrides (PR̅ and CLR̅ are Active-Low, highest priority)
    if (pr === 0 && clr === 1) {
      return { q: 1, qBar: 0 };
    }
    if (clr === 0 && pr === 1) {
      return { q: 0, qBar: 1 };
    }
    if (pr === 0 && clr === 0) {
      return { q: 1, qBar: 1 }; // unstable/invalid
    }

    // Level-sensitive S=1, R=1 override when CLK=1 in SR latch
    if (selectedType === 'SR' && in1 === 1 && in2 === 1 && clk === 1) {
      return { q: 1, qBar: 1 }; // invalid active state
    }

    // If edge-triggered logic fires (on clock rising edge)
    if (isRisingEdge) {
      switch (selectedType) {
        case 'SR': {
          const s = in1;
          const r = in2;
          if (s === 0 && r === 0) return { q: prevQ, qBar: prevQBar }; // Hold
          if (s === 1 && r === 0) return { q: 1, qBar: 0 }; // Set
          if (s === 0 && r === 1) return { q: 0, qBar: 1 }; // Reset
          if (s === 1 && r === 1) return { q: 1, qBar: 1 }; // Invalid
          break;
        }
        case 'JK': {
          const j = in1;
          const k = in2;
          if (j === 0 && k === 0) return { q: prevQ, qBar: prevQBar }; // Hold
          if (j === 1 && k === 0) return { q: 1, qBar: 0 }; // Set
          if (j === 0 && k === 1) return { q: 0, qBar: 1 }; // Reset
          if (j === 1 && k === 1) {
            // Toggle
            if (prevQ === 'X') return { q: 'X', qBar: 'X' };
            const nextQ = prevQ === 1 ? 0 : 1;
            return { q: nextQ, qBar: nextQ === 1 ? 0 : 1 };
          }
          break;
        }
        case 'D': {
          const d = in1;
          return { q: d as SignalValue, qBar: d === 1 ? 0 : 1 };
        }
        case 'T': {
          const t = in1;
          if (t === 0) return { q: prevQ, qBar: prevQBar }; // Hold
          if (t === 1) {
            // Toggle
            if (prevQ === 'X') return { q: 'X', qBar: 'X' };
            const nextQ = prevQ === 1 ? 0 : 1;
            return { q: nextQ, qBar: nextQ === 1 ? 0 : 1 };
          }
          break;
        }
      }
    }

    // Default: maintain current state
    return { q: prevQ, qBar: prevQBar };
  }, [selectedType]);

  // Log state and input values into waveform logs
  const logToHistory = useCallback((
    currentInputs: typeof inputs,
    currentState: { q: SignalValue; qBar: SignalValue },
    isClockEdge: boolean
  ) => {
    setHistory((prev) => {
      const sample: HistorySample = {
        time: prev.length > 0 ? prev[prev.length - 1].time + 1 : 0,
        clk: currentInputs.clk as SignalValue,
        in1: currentInputs.in1 as SignalValue,
        in2: currentInputs.in2 as SignalValue,
        q: currentState.q,
        qBar: currentState.qBar,
        pr: currentInputs.pr as SignalValue,
        clr: currentInputs.clr as SignalValue,
        isClockEdge,
      };
      return [...prev, sample].slice(-40); // keep a decent buffer of last 40 ticks
    });
  }, []);

  // Update logic triggers whenever physical inputs are modified
  const updateSystemState = useCallback((
    nextInputs: typeof inputs,
    isClockEdge: boolean = false
  ) => {
    const prevState = stateRef.current.state;
    const nextState = computeState(nextInputs, prevState.q, prevState.qBar, isClockEdge);

    // Update state variables
    setState(nextState);

    // Update telemetry counts for lab objectives
    if (isClockEdge) {
      setTransitionCount((prev) => prev + 1);
    }
    if (nextState.q !== prevState.q) {
      setToggledCount((prev) => prev + 1);
    }
    if (selectedType === 'SR' && nextInputs.in1 === 1 && nextInputs.in2 === 1) {
      setInvalidHit(true);
    }

    // Send data to timing diagram logs
    logToHistory(nextInputs, nextState, isClockEdge);
  }, [computeState, logToHistory, selectedType]);

  // Handle direct click toggling on inputs
  const handleToggleInput = (inputName: 'in1' | 'in2' | 'pr' | 'clr' | 'clk') => {
    const prevInputs = stateRef.current.inputs;
    const nextInputs = { ...prevInputs };

    if (inputName === 'clk') {
      const nextClk = prevInputs.clk === 1 ? 0 : 1;
      nextInputs.clk = nextClk;
      const isRisingEdge = prevInputs.clk === 0 && nextClk === 1;
      
      setInputs(nextInputs);
      updateSystemState(nextInputs, isRisingEdge);
    } else {
      nextInputs[inputName] = prevInputs[inputName] === 1 ? 0 : 1;
      
      setInputs(nextInputs);
      updateSystemState(nextInputs, false);
    }
  };

  // Perform a full Clock transition (0 -> 1 -> 0)
  const handleTriggerClockPulse = () => {
    if (isAutoClock) return;

    const current = stateRef.current.inputs;

    // 1. Rising Edge (0 -> 1)
    const riseInputs = { ...current, clk: 1 };
    setInputs(riseInputs);
    updateSystemState(riseInputs, true);

    // 2. Falling Edge (1 -> 0) after a brief delay so users can see the wave
    setTimeout(() => {
      const fallInputs = { ...riseInputs, clk: 0 };
      setInputs(fallInputs);
      updateSystemState(fallInputs, false);
    }, 150);
  };

  // Auto clock wave generator hook
  useEffect(() => {
    if (isAutoClock) {
      autoClockIntervalRef.current = setInterval(() => {
        const current = stateRef.current.inputs;
        const nextClk = current.clk === 1 ? 0 : 1;
        const nextInputs = { ...current, clk: nextClk };
        const isRisingEdge = current.clk === 0 && nextClk === 1;

        setInputs(nextInputs);
        updateSystemState(nextInputs, isRisingEdge);
      }, clockSpeed / 2); // divide by 2 so full period (high + low) equals clockSpeed
    } else {
      if (autoClockIntervalRef.current) {
        clearInterval(autoClockIntervalRef.current);
      }
    }

    return () => {
      if (autoClockIntervalRef.current) {
        clearInterval(autoClockIntervalRef.current);
      }
    };
  }, [isAutoClock, clockSpeed, updateSystemState]);

  // Handle user changing active Flip Flop types
  const handleSelectFlipFlopType = (type: FlipFlopType) => {
    setSelectedType(type);
    
    // Clear dynamic telemetry counters
    setTransitionCount(0);
    setToggledCount(0);
    setInvalidHit(false);

    // Force default reset inputs for the new type
    const resetInputs = {
      in1: 0,
      in2: 0,
      pr: 1,
      clr: 1,
      clk: 0,
    };
    setInputs(resetInputs);
    
    // Default starting state
    const defaultState = { q: 0 as SignalValue, qBar: 1 as SignalValue };
    setState(defaultState);
    
    // Reset waveform histories
    setHistory([
      {
        time: 0,
        clk: 0,
        in1: 0,
        in2: 0,
        q: 0,
        qBar: 1,
        pr: 1,
        clr: 1,
        isClockEdge: false,
      }
    ]);
  };

  // Reset current experiment variables
  const handleResetExperimentState = () => {
    setTransitionCount(0);
    setToggledCount(0);
    setInvalidHit(false);

    const activeExp = LAB_EXPERIMENTS.find((e) => e.id === activeExperimentId);
    if (activeExp) {
      handleSelectFlipFlopType(activeExp.targetFlipFlop);
    }
  };

  // Reset entire laboratory dashboard
  const handleResetEntireBench = () => {
    setIsAutoClock(false);
    setCompletedIds([]);
    handleSelectFlipFlopType('SR');
  };

  // Evaluate active lab experiment objectives in real-time
  useEffect(() => {
    const activeExp = LAB_EXPERIMENTS.find((e) => e.id === activeExperimentId);
    if (!activeExp) return;

    // Check if the current environment satisfies the experiment's verification logic
    const isMatchedFF = selectedType === activeExp.targetFlipFlop;
    if (isMatchedFF) {
      const isSuccess = activeExp.checkSuccess(
        inputs,
        state,
        transitionCount,
        toggledCount,
        invalidHit
      );

      if (isSuccess && !completedIds.includes(activeExp.id)) {
        setCompletedIds((prev) => [...prev, activeExp.id]);
      }
    }
  }, [inputs, state, transitionCount, toggledCount, invalidHit, activeExperimentId, selectedType, completedIds]);

  // Synchronize selector types automatically when the student switches active experiments
  const handleSelectExperiment = (id: number) => {
    setActiveExperimentId(id);
    const exp = LAB_EXPERIMENTS.find((e) => e.id === id);
    if (exp && exp.targetFlipFlop !== selectedType) {
      handleSelectFlipFlopType(exp.targetFlipFlop);
    }
  };

  // Render initial trace upon boot
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          time: 0,
          clk: 0,
          in1: 0,
          in2: 0,
          q: 0,
          qBar: 1,
          pr: 1,
          clr: 1,
          isClockEdge: false,
        }
      ]);
    }
  }, [history.length]);

  return (
    <div id="lab-simulator-workbench" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none selection:bg-blue-500/30 selection:text-slate-800">
      {/* Upper Status Bar / Power Indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-2.5 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse" />
            <span className="text-slate-600 font-mono text-[10px]">POWER ON • LINE AC 230V</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 font-mono hidden sm:inline">LAB WORKBENCH MODEL: TK-74LS74</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>COMPLETED:</span>
          <div className="bg-slate-100 border border-slate-200 rounded-full h-4 w-32 overflow-hidden flex items-center relative">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedIds.length / LAB_EXPERIMENTS.length) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-700 font-bold mix-blend-difference">
              {completedIds.length} / {LAB_EXPERIMENTS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Lab Header */}
      <header className="px-6 py-8 border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] uppercase font-bold tracking-widest rounded-full font-mono">
                Digital Logic Laboratory
              </span>
            </div>
            <h1 className="text-slate-900 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Flip-Flops Simulation Kit
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl mt-1.5 leading-relaxed font-sans">
              Analyze latching memory states, clock waveforms, and gate propagation paths in real-time. Toggle physical inputs, trigger clock transitions, and complete the curriculum-guided experiments.
            </p>
          </div>

          {/* Quick Action Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetEntireBench}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-slate-300 transition duration-150 active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Instruments
            </button>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* SECTION 1: Flip-Flop selector cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h2 className="text-slate-900 font-display text-xs font-bold uppercase tracking-wider">
              1. Select Flip-Flop Instrument
            </h2>
          </div>
          <FlipFlopSelector selectedType={selectedType} onSelectType={handleSelectFlipFlopType} />
        </div>

        {/* SECTION 2: Schematic & Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Schematic visualizer takes 7/12 width */}
          <div className="lg:col-span-7 flex flex-col">
            <GateLevelVisualizer
              type={selectedType}
              inputs={inputs}
              state={state}
              onToggleInput={handleToggleInput}
            />
          </div>

          {/* Truth / State Tables take 5/12 width */}
          <div className="lg:col-span-5 flex flex-col">
            <TruthTablePanel type={selectedType} inputs={inputs} state={state} />
          </div>
        </div>

        {/* SECTION 3: Timing Analyzer */}
        <div>
          <WaveformDiagram
            type={selectedType}
            history={history}
            onClearHistory={() => setHistory([])}
            isAutoClock={isAutoClock}
            onToggleAutoClock={() => setIsAutoClock(!isAutoClock)}
            clockSpeed={clockSpeed}
            onChangeClockSpeed={setClockSpeed}
            onTriggerClockPulse={handleTriggerClockPulse}
          />
        </div>

        {/* SECTION 4: Curriculum Experiments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <h2 className="text-slate-900 font-display text-xs font-bold uppercase tracking-wider">
              2. Course Experiments & Syllabus Verification
            </h2>
          </div>
          <LabExperiments
            activeExperimentId={activeExperimentId}
            onSelectExperiment={handleSelectExperiment}
            experiments={LAB_EXPERIMENTS}
            currentInputs={inputs}
            state={state}
            transitionCount={transitionCount}
            toggledCount={toggledCount}
            invalidHit={invalidHit}
            onResetExperimentState={handleResetExperimentState}
            completedIds={completedIds}
          />
        </div>
      </main>

      {/* Lab Footer / Accreditation */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500 font-mono mt-12 shrink-0">
        <p className="max-w-2xl mx-auto leading-relaxed text-slate-500">
          Accredited Digital Electronics Lab Simulator • Designed with real-time latch propagation, rising edge trigger simulation, and asynchronous state overrides. Meets international standards for undergraduate digital electronics curriculum.
        </p>
        <p className="text-[10px] text-slate-400 mt-2">
          © 2026 Digital Labs Inc. All rights reserved. No physical IC gates were damaged during the compilation of this laboratory equipment.
        </p>
      </footer>
    </div>
  );
}
