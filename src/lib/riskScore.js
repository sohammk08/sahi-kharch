// Composite 0-100 risk score. All sub-scores are 0-100 where HIGHER = riskier.
// Weights: violation severity 40%, extraction confidence 30%, anomaly 20%, LLM 10%.
// Extraction and LLM "confidence" are inverted (low confidence = high risk).

const SEVERITY_RISK = { none: 0, minor: 40, major: 70, critical: 100 };

export function computeRiskScore({ rulesOutput, receipt, anomalySignals = 0, llm }) {
  const violationSeverity = SEVERITY_RISK[rulesOutput?.severity] ?? 0;

  const confs = Object.values(receipt?.confidence ?? {}).filter(
    (c) => typeof c === "number",
  );
  const avgConf = confs.length
    ? confs.reduce((a, b) => a + b, 0) / confs.length
    : 0;
  const extractionConfidence = Math.round((1 - avgConf) * 100);

  const anomalySignalsScore = Math.min(Math.max(anomalySignals, 0), 100);

  const llmConfidence = Math.round((1 - (llm?.confidence ?? 0)) * 100);

  const overall = Math.round(
    violationSeverity * 0.4 +
      extractionConfidence * 0.3 +
      anomalySignalsScore * 0.2 +
      llmConfidence * 0.1,
  );

  return {
    overall,
    violationSeverity,
    extractionConfidence,
    anomalySignalsScore,
    llmConfidence,
  };
}
