<img width="1285" height="833" alt="DigitalOcean Gradient™ AI Platform Evaluation Viewer" src="https://github.com/user-attachments/assets/c1682bf0-978e-4dc4-9ac7-589d593f2fe1" />


A simple tool to make viewing eval results from the [DigitalOcean Gradient AI platform](https://docs.digitalocean.com/products/gradient-ai-platform/) quicker.

## Getting Results from the API

To get JSON evaluation results from the DigitalOcean Gradient AI API, follow these steps:

1. **List your test cases:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases
```

2. **Get evaluation runs by test case:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases/<test-case-id>/evaluation_runs
```

3. **Get results for a specific evaluation run:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_runs/<run-id>/results
```

For detailed API documentation, see the [DigitalOcean API Reference](https://docs.digitalocean.com/reference/api/digitalocean/).

## Usage

1. Open `index.html` in your web browser
2. Upload a JSON evaluation file (downloaded from the API endpoint above)
3. View your evaluation results with:
   - Evaluation metadata (run name, status, test case, etc.)
   - Score matrix showing all prompts and their metric scores
   - Detailed prompt cards with input, output, and metric results
   - Filtering by metric type and score ranges

## Features

- Upload and view JSON evaluation files
- Interactive score matrix with color-coded results
- Filter prompts by metric type and score range
- Markdown rendering for output content
- Expandable metric results with detailed reasoning
