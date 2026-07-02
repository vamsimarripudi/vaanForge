# ML Intelligence Layer

VaanForge uses ML-ready interfaces with deterministic heuristic engines until trained models are available.

## Engines

- RequirementQualityEngine
- ProjectComplexityEngine
- TimelineEstimationEngine
- CostEstimationEngine
- ArchitectureRecommendationEngine
- TemplateRecommendationEngine
- RiskScoringEngine
- AnomalyDetectionEngine
- ErrorClassificationEngine
- ChurnPredictionEngine
- UpgradeLikelihoodEngine
- PromptRiskScanner

## Response Contract

Every result includes:

- `score`
- `confidence`
- `explanation`
- `evidence`
- `engineType`
- `ruleVersion` or `modelVersion`
- `recommendedAction`
- persisted input hash

## Production Honesty

Heuristic results must never be described as trained ML. When a trained model is introduced, it must implement the same engine interface and include model version, evaluation evidence, and rollback plan.
