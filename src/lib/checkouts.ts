export const checkouts: Record<number, string[]> = {
  170: ['T20-T20-Bull'],
  167: ['T20-T19-Bull'],
  164: ['T20-T18-Bull'],
  161: ['T20-T17-Bull'],
  160: ['T20-T20-D20'],
  157: ['T20-T19-D20'],
  156: ['T20-T20-D18'],
  154: ['T20-T18-D20'],
  153: ['T20-T19-D18'],
  152: ['T20-T20-D16'],
  151: ['T20-T17-D20'],
  150: ['T20-T18-D18'],
  148: ['T20-T20-D14'],
  147: ['T20-T17-D18'],
  146: ['T20-T18-D16'],
  145: ['T20-T19-D14'],
  144: ['T20-T20-D12'],
  141: ['T20-T19-D12'],
  140: ['T20-T20-D10'],
  139: ['T20-T13-D20'],
  138: ['T20-T18-D12'],
  137: ['T20-T19-D10'],
  136: ['T20-T20-D8'],
  134: ['T20-T14-D16'],
  132: ['T20-T16-D12'],
  130: ['T20-T20-D5'],
  128: ['T18-T14-D16'],
  127: ['T20-T17-D8'],
  126: ['T19-T19-D6'],
  124: ['T20-T14-D11'],
  121: ['T20-T11-D14'],
  120: ['T20-20-D20'],
  118: ['T20-18-D20'],
  117: ['T20-17-D20'],
  116: ['T20-16-D20'],
  115: ['T20-15-D20'],
  114: ['T20-14-D20'],
  113: ['T20-13-D20'],
  112: ['T20-12-D20'],
  111: ['T20-11-D20'],
  110: ['T20-10-D20'],
  109: ['T20-9-D20'],
  108: ['T20-8-D20'],
  107: ['T19-10-D20'],
  106: ['T20-6-D20'],
  105: ['T20-5-D20'],
  104: ['T18-10-D20'],
  103: ['T19-6-D20'],
  102: ['T20-10-D16'],
  101: ['T17-10-D20'],
  100: ['T20-D20'],
  98: ['T20-D19'],
  96: ['T20-D18'],
  94: ['T18-D20'],
  92: ['T20-D16'],
  90: ['T18-D18'],
  88: ['T16-D20'],
  86: ['T18-D16'],
  84: ['T20-D12'],
  82: ['Bull-D16'],
  80: ['T20-D10'],
  78: ['T18-D12'],
  76: ['T20-D8'],
  74: ['T14-D16'],
  72: ['T16-D12'],
  70: ['T18-D8'],
  68: ['T20-D4'],
  66: ['T10-D18'],
  64: ['T16-D8'],
  62: ['T10-D16'],
  60: ['20-D20'],
  58: ['18-D20'],
  56: ['T16-D4'],
  54: ['14-D20'],
  52: ['12-D20'],
  50: ['10-D20'],
  48: ['16-D16'],
  46: ['6-D20'],
  44: ['12-D16'],
  42: ['10-D16'],
  40: ['D20'],
  38: ['D19'],
  36: ['D18'],
  34: ['D17'],
  32: ['D16'],
  30: ['D15'],
  28: ['D14'],
  26: ['D13'],
  24: ['D12'],
  22: ['D11'],
  20: ['D10'],
  18: ['D9'],
  16: ['D8'],
  14: ['D7'],
  12: ['D6'],
  10: ['D5'],
  8: ['D4'],
  6: ['D3'],
  4: ['D2'],
  2: ['D1'],
};

export function getCheckoutSuggestions(score: number): string[] {
  if (score <= 0 || score > 180) return [];
  if (checkouts[score]?.length) return checkouts[score];
  const auto = autoCheckout(score);
  return auto ? [auto] : [];
}

export function hasCheckout(score: number): boolean {
  if (score <= 0 || score > 180) return false;
  return true;
}

type Dart = {
  label: string;
  value: number;
};

const darts: Dart[] = (() => {
  const all: Dart[] = [];
  for (let n = 1; n <= 20; n += 1) {
    all.push({ label: `S${n}`, value: n });
    all.push({ label: `D${n}`, value: n * 2 });
    all.push({ label: `T${n}`, value: n * 3 });
  }
  all.push({ label: "OUTER", value: 25 });
  all.push({ label: "BULL", value: 50 });
  return all;
})();

function autoCheckout(score: number): string | null {
  if (score <= 0 || score > 180) return null;

  for (const d1 of darts) {
    for (const d2 of darts) {
      for (const d3 of darts) {
        if (d1.value + d2.value + d3.value === score) {
          return `${d1.label}-${d2.label}-${d3.label}`;
        }
      }
    }
  }

  for (const d1 of darts) {
    for (const d2 of darts) {
      if (d1.value + d2.value === score) {
        return `${d1.label}-${d2.label}`;
      }
    }
  }

  const d1 = darts.find((d) => d.value === score);
  if (d1) return d1.label;

  // Fallback: show a simple single to keep UX consistent.
  return `S${score}`;
}
