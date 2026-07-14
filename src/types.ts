export type FlipFlopType = 'SR' | 'JK' | 'D' | 'T';

export type LatchType = 'NOR' | 'NAND';

export type SignalValue = 0 | 1 | 'X'; // 'X' represents forbidden/invalid state or undetermined

export interface HistorySample {
  time: number; // relative step or timestamp
  clk: SignalValue;
  in1: SignalValue; // S or J or D or T
  in2: SignalValue; // R or K or null
  q: SignalValue;
  qBar: SignalValue;
  pr: SignalValue;
  clr: SignalValue;
  isClockEdge: boolean; // flag for drawing vertical clock trigger indicator
}

export interface LabExperiment {
  id: number;
  title: string;
  objective: string;
  instructions: string[];
  targetFlipFlop: FlipFlopType;
  hint: string;
  checkSuccess: (
    currentInputs: {
      in1: number; // S, J, D, T
      in2: number; // R, K (or 0)
      pr: number;  // Preset (active low, 1 is inactive, 0 is active)
      clr: number; // Clear (active low, 1 is inactive, 0 is active)
      clk: number;
    },
    state: {
      q: SignalValue;
      qBar: SignalValue;
    },
    transitionCount: number,
    toggledCount: number,
    invalidHit: boolean
  ) => boolean;
}
