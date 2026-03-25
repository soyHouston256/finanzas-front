import { C } from "../../utils/colors.js";

export default function ProgressRing({ pct, size = 52, stroke = 4, color }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (<svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || C.accent} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} /></svg>);
}
