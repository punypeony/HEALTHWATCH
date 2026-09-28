# Defects

Found while running the backend failure-path tests and the full pytest suite.

| ID | Description | Severity | Corrective Action | Status |
| --- | --- | --- | --- | --- |
| D1 | `test_training_artifacts_and_accuracy_are_reproducible` failed because `evaluation.json` stores the interpreter that wrote it (`3.14.7`). This environment is Python 3.11.9. Accuracy, the confusion matrix, library versions, and the tree were the same. | Low | The reproducibility check still requires identical metrics and artifacts. It no longer treats the recorded Python version string as part of that comparison. | Fixed |
| D2 | `test_condition_limits_and_missing_values` compares the unrounded carbohydrate formula with the daily-intake limit. The API returns that limit rounded half-up to two decimal places. | Low | Not changed. The intake amount is still quantized to 0.01. The assertion needs a wider tolerance or a rounded expected value. | Open |
