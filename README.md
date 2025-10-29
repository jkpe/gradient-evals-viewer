# DigitalOcean Gradient™ AI Platform Evaluation Viewer

A simple tool to make viewing eval results from the [DigitalOcean Gradient AI platform](https://docs.digitalocean.com/products/gradient-ai-platform/) quicker.

## Getting Results from the API

To get JSON evaluation results from the DigitalOcean Gradient AI API:

**Get results for a specific evaluation run:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_runs/<run-id>/results
```

**List your test cases:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases
```

**Get evaluation runs by test case:**

```text
https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases/<test-case-id>/evaluation_runs
```

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
