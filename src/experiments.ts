import { LabExperiment } from './types';

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: 1,
    title: 'SR Latch Set & Reset',
    targetFlipFlop: 'SR',
    objective: 'Observe and verify the basic Set and Reset memory states of an SR flip-flop on the active rising edge of the clock.',
    instructions: [
      'Select the SR Flip-Flop in the dashboard selector.',
      'Ensure asynchronous pins are inactive (PR̅ = 1, CLR̅ = 1).',
      'Toggle the S (Set) input to 1, and make sure R (Reset) is 0.',
      'Click the "CLK Pulse" button on the Waveform Analyzer. Observe that the Q output transitions to 1 (glowing green).',
      'Now, set S to 0, and R to 1.',
      'Click "CLK Pulse" again. Observe that Q transitions to 0 (slate/dim) and Q̅ becomes 1.',
    ],
    hint: 'Toggle S to 1, and pulse the clock to observe the SET state. Then toggle R to 1, S to 0, and pulse the clock to observe the RESET state.',
    checkSuccess: (inputs, state, transitions, toggles) => {
      // Must have done a Set and a Reset sequence
      // Verified in active history or state checks
      return inputs.clk === 0 && state.q === 0 && state.qBar === 1 && transitions >= 2 && toggles >= 2;
    },
  },
  {
    id: 2,
    title: 'The Invalid State Hazard',
    targetFlipFlop: 'SR',
    objective: 'Analyze the forbidden state of the SR flip-flop and observe how the logical complement relation (Q ≠ Q̅) is violated.',
    instructions: [
      'Ensure the active selector is on SR Flip-Flop.',
      'Set both inputs: S = 1 and R = 1 simultaneously.',
      'Click "CLK Pulse" or toggle CLK to 1 manually.',
      'Observe the output Q and Q̅ wires in the schematic: they are both High (1) or Amber (\'X\'). This invalid state violates Boolean design principles and can cause oscillations in physical circuits!',
    ],
    hint: 'Set both S = 1 and R = 1, then trigger a clock pulse or turn the clock high to enter the unstable state.',
    checkSuccess: (inputs, state) => {
      return inputs.in1 === 1 && inputs.in2 === 1 && state.q === 1 && state.qBar === 1;
    },
  },
  {
    id: 3,
    title: 'JK Flip-Flop Edge Toggle',
    targetFlipFlop: 'JK',
    objective: 'Demonstrate how the JK flip-flop resolves the SR hazard to create a stable Toggle state, the foundation of binary counters.',
    instructions: [
      'Select the JK Flip-Flop.',
      'Make sure asynchronous override is off (PR̅ = 1, CLR̅ = 1).',
      'Set both J = 1 and K = 1.',
      'Click the "CLK Pulse" button multiple times.',
      'Observe the Q output: notice how the state toggles on every single active rising clock edge, creating a perfect square wave at exactly half the frequency of the clock.',
    ],
    hint: 'Set J and K to 1, then trigger "CLK Pulse" repeatedly. The system tracks your toggled counts.',
    checkSuccess: (inputs, state, transitions, toggles) => {
      return inputs.in1 === 1 && inputs.in2 === 1 && toggles >= 3;
    },
  },
  {
    id: 4,
    title: 'D Flip-Flop Register Store',
    targetFlipFlop: 'D',
    objective: 'Observe how the D Flip-Flop samples its input at the active edge and holds the data value as memory while the clock is low.',
    instructions: [
      'Select the D Flip-Flop.',
      'Toggle D = 1, then click "CLK Pulse" to store a High bit. Notice Q becomes 1.',
      'Now, toggle D = 0. Notice that Q remains 1 as long as the clock is not triggered! This demonstrates the latching/memory function.',
      'Click "CLK Pulse" once more to clear the register (Q becomes 0, matching D).',
    ],
    hint: 'Set D = 1 and trigger clock. Then toggle D = 0 and keep the clock low (0) to verify that the value remains stored.',
    checkSuccess: (inputs, state, transitions, toggles) => {
      // Must have loaded 1, then set input D=0 while CLK is 0, keeping Q=1
      return inputs.in1 === 0 && inputs.clk === 0 && state.q === 1 && toggles >= 1;
    },
  },
  {
    id: 5,
    title: 'T Flip-Flop Frequency Divider',
    targetFlipFlop: 'T',
    objective: 'Implement a basic frequency divider cell using a T Flip-Flop, a core building block for timers and ripple counters.',
    instructions: [
      'Select the T Flip-Flop.',
      'Set the T (Toggle) input to 1.',
      'Click the green "Run Gen" button to start the automatic clock generator.',
      'Open the Logic Analyzer tab and notice the waveforms: Q toggles exactly half as fast as CLK, dividing the input frequency by 2!',
    ],
    hint: 'Select T, set T to 1, and click "Run Gen" to let the clock cycle automatically. Let Q toggle at least 4 times.',
    checkSuccess: (inputs, state, transitions, toggles) => {
      return inputs.in1 === 1 && toggles >= 4;
    },
  },
];
