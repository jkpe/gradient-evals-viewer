# Evaluation Viewer

A modern evaluation results viewer for the [DigitalOcean Gradient™ AI Platform](https://docs.digitalocean.com/products/gradient-ai-platform/)

### API Token

Generate a DigitalOcean personal access token at [https://cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens) with the `genai:read` permission.

## Usage

1. **Via API**: Enter your DigitalOcean API token, select a test case and evaluation run
2. **Via File**: Upload a JSON evaluation file downloaded from the API

The viewer will display:
- Evaluation run metadata
- Filterable score matrix
- Detailed prompt cards with metrics

## Manually Getting Results from the API

To get JSON evaluation results from the DigitalOcean Gradient AI API:

1. **List your test cases:**
   ```
   https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases
   ```

2. **Get evaluation runs by test case:**
   ```
   https://api.digitalocean.com/v2/gen-ai/evaluation_test_cases/<test-case-id>/evaluation_runs
   ```

3. **Get results for a specific evaluation run:**
   ```
   https://api.digitalocean.com/v2/gen-ai/evaluation_runs/<run-id>/results
   ```

For detailed API documentation, see the [DigitalOcean API Reference](https://docs.digitalocean.com/reference/api/digitalocean/).