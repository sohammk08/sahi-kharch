const RISK_BARS = [
  ["Violation Severity", "violationSeverity"],
  ["Extraction Confidence", "extractionConfidence"],
  ["Anomaly Signals", "anomalySignalsScore"],
  ["LLM Confidence", "llmConfidence"],
];

function RiskBars({ risk }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <span className="caption text-black/50">Overall</span>
          <span className="body-sm font-[540]">{risk.overall}/100</span>
        </div>
        <div className="mt-1 h-2.5 rounded-full bg-[#f1f1f1]">
          <div
            className="h-2.5 rounded-full bg-[#1f1d3d]"
            style={{ width: `${risk.overall}%` }}
          />
        </div>
      </div>
      {RISK_BARS.map(([label, key]) => (
        <div key={key}>
          <div className="flex items-center justify-between">
            <span className="caption text-black/50">{label}</span>
            <span className="body-sm font-[540]">{risk[key]}/100</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#f1f1f1]">
            <div
              className="h-2 rounded-full bg-[#1f1d3d]/70"
              style={{ width: `${risk[key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default RiskBars;
