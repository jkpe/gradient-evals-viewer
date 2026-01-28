// DOM Elements
const fileInput = document.getElementById('jsonFile');
const metadataSection = document.getElementById('metadataSection');
const metadataContent = document.getElementById('metadataContent');
const promptsContainer = document.getElementById('promptsContainer');
const promptsList = document.getElementById('promptsList');
const emptyState = document.getElementById('emptyState');
const scoreFilterSection = document.getElementById('scoreFilterSection');
const scoreMatrix = document.getElementById('scoreMatrix');
const filterCheckboxes = document.getElementById('filterCheckboxes');
const scoreRangeFilters = document.getElementById('scoreRangeFilters');
const apiTokenInput = document.getElementById('apiToken');
const loadTestCasesButton = document.getElementById('loadTestCasesButton');
const testCaseSelect = document.getElementById('testCaseSelect');
const runSelect = document.getElementById('runSelect');
const apiErrorEl = document.getElementById('apiError');
const apiStatusEl = document.getElementById('apiStatus');

// State
let allPrompts = [];
let selectedMetricFilters = new Set();
let selectedScoreRanges = new Set(['poor', 'medium', 'good']);
let apiTestCases = [];
let apiEvaluationRuns = [];
let selectedTestCaseId = null;
let selectedRunId = null;

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
loadTestCasesButton.addEventListener('click', loadTestCases);
testCaseSelect.addEventListener('change', (e) => onTestCaseSelected(e.target.value || null));
runSelect.addEventListener('change', (e) => {
    selectedRunId = e.target.value || null;
    if (selectedRunId) {
        loadEvaluationResults(selectedRunId);
    }
});

// File Upload Handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            displayEvaluationData(data);
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// API Helper Functions
function setApiStatus(message) {
    if (!apiStatusEl) return;
    apiStatusEl.textContent = message || '';
    apiStatusEl.style.display = message ? 'block' : 'none';
}

function setApiError(message) {
    if (!apiErrorEl) return;
    if (!message) {
        apiErrorEl.style.display = 'none';
        apiErrorEl.textContent = '';
    } else {
        apiErrorEl.style.display = 'block';
        apiErrorEl.textContent = message;
    }
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    if (isLoading) {
        button.setAttribute('data-original-text', button.textContent);
        button.textContent = 'Loading...';
    } else {
        button.textContent = button.getAttribute('data-original-text') || 'Load';
    }
}

async function apiFetch(path, description) {
    const token = (apiTokenInput?.value || '').trim();
    setApiError('');
    setApiStatus('');

    if (!token) {
        setApiError('Please enter your DigitalOcean API token to continue.');
        throw new Error('Missing API token');
    }

    const url = `https://api.digitalocean.com${path}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            let errorDetail = '';
            try {
                const errorBody = await response.json();
                if (errorBody && (errorBody.message || errorBody.error)) {
                    errorDetail = ` - ${errorBody.message || errorBody.error}`;
                }
            } catch (_) {
                // Ignore JSON parse errors
            }
            throw new Error(`${description || 'Request'} failed with status ${response.status}${errorDetail}`);
        }

        return await response.json();
    } catch (error) {
        setApiError(error.message || String(error));
        throw error;
    }
}

function resetApiSelections() {
    apiTestCases = [];
    apiEvaluationRuns = [];
    selectedTestCaseId = null;
    selectedRunId = null;

    if (testCaseSelect) {
        testCaseSelect.innerHTML = '<option value="">Load test cases to select</option>';
        testCaseSelect.disabled = true;
    }

    if (runSelect) {
        runSelect.innerHTML = '<option value="">Load runs to select</option>';
        runSelect.disabled = true;
    }
}

async function loadTestCases() {
    if (!loadTestCasesButton) return;

    setApiError('');
    setApiStatus('Loading test cases...');
    resetApiSelections();

    setButtonLoading(loadTestCasesButton, true);
    try {
        const data = await apiFetch('/v2/gen-ai/evaluation_test_cases', 'Fetching test cases');

        const rawList = data && (
            data.evaluation_test_cases ||
            data.test_cases ||
            data.items ||
            data.results ||
            data
        );

        const list = Array.isArray(rawList) ? rawList : [];
        apiTestCases = list;

        if (!list.length) {
            setApiStatus('No evaluation test cases were found for this token.');
            return;
        }

        if (testCaseSelect) {
            testCaseSelect.innerHTML = '<option value="">Select a test case</option>';
            list.forEach((tc) => {
                const id = tc.test_case_uuid || tc.id || tc.test_case_id || tc.uuid || '';
                const name = tc.name || tc.test_case_name || tc.display_name || id || 'Unnamed test case';
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${name} (${id})`;
                testCaseSelect.appendChild(option);
            });
            testCaseSelect.disabled = false;
        }

        setApiStatus(`Loaded ${list.length} test case${list.length === 1 ? '' : 's'}. Select one to continue.`);
    } catch (error) {
        setApiStatus('');
    } finally {
        setButtonLoading(loadTestCasesButton, false);
    }
}

function onTestCaseSelected(testCaseId) {
    selectedTestCaseId = testCaseId || null;
    apiEvaluationRuns = [];
    selectedRunId = null;

    if (runSelect) {
        runSelect.innerHTML = '<option value="">Loading runs...</option>';
        runSelect.disabled = true;
    }

    if (!selectedTestCaseId) {
        setApiStatus('Select a test case to load its evaluation runs.');
    } else {
        loadEvaluationRuns(selectedTestCaseId);
    }
}

async function loadEvaluationRuns(testCaseId) {
    if (!testCaseId) return;

    setApiError('');
    setApiStatus('Loading evaluation runs...');

    apiEvaluationRuns = [];
    selectedRunId = null;

    if (runSelect) {
        runSelect.innerHTML = '<option value="">Loading runs...</option>';
        runSelect.disabled = true;
    }

    try {
        const path = `/v2/gen-ai/evaluation_test_cases/${encodeURIComponent(testCaseId)}/evaluation_runs`;
        const data = await apiFetch(path, 'Fetching evaluation runs');

        const rawList = data && (
            data.evaluation_runs ||
            data.runs ||
            data.items ||
            data.results ||
            data
        );

        const list = Array.isArray(rawList) ? rawList : [];
        apiEvaluationRuns = list;

        if (!list.length) {
            if (runSelect) {
                runSelect.innerHTML = '<option value="">No runs found for this test case</option>';
                runSelect.disabled = true;
            }
            setApiStatus('No evaluation runs were found for this test case.');
            return;
        }

        if (runSelect) {
            runSelect.innerHTML = '<option value="">Select an evaluation run</option>';
            list.forEach((run) => {
                const id = run.evaluation_run_uuid || run.id || run.run_id || run.uuid || '';
                const name = run.run_name || run.name || id || 'Unnamed run';
                const status = run.status || run.state || '';
                const started = run.started_at || run.created_at || '';
                const labelParts = [name];
                if (status) labelParts.push(`status: ${status}`);
                if (started) labelParts.push(`started: ${started}`);

                const option = document.createElement('option');
                option.value = id;
                option.textContent = labelParts.join(' • ');
                runSelect.appendChild(option);
            });
            runSelect.disabled = false;
        }

        setApiStatus(`Loaded ${list.length} evaluation run${list.length === 1 ? '' : 's'}. Select one to load results.`);
    } catch (error) {
        setApiStatus('');
        if (runSelect) {
            runSelect.innerHTML = '<option value="">Failed to load runs</option>';
            runSelect.disabled = true;
        }
    }
}

async function loadEvaluationResults(runId) {
    if (!runId) return;

    setApiError('');
    setApiStatus('Loading evaluation results...');

    try {
        const path = `/v2/gen-ai/evaluation_runs/${encodeURIComponent(runId)}/results`;
        const data = await apiFetch(path, 'Fetching evaluation results');

        displayEvaluationData(data);
        setApiStatus('Evaluation results loaded successfully.');
    } catch (error) {
        setApiStatus('');
    }
}

// Display Functions
function displayEvaluationData(data) {
    emptyState.style.display = 'none';

    if (data.evaluation_run) {
        displayMetadata(data.evaluation_run);
        metadataSection.classList.remove('hidden');
    }

    if (data.prompts && Array.isArray(data.prompts)) {
        allPrompts = data.prompts;
        buildScoreMatrix(data.prompts, data.prompts);
        buildFilterCheckboxes(data.prompts);
        setupScoreRangeFilters();
        scoreFilterSection.classList.remove('hidden');
        displayPrompts(data.prompts);
        promptsContainer.classList.remove('hidden');
    }
}

function displayMetadata(evalRun) {
    const metadata = [
        { label: 'Run Name', value: evalRun.run_name || 'N/A' },
        { label: 'Status', value: evalRun.status || 'N/A' },
        { label: 'Test Case', value: evalRun.test_case_name || 'N/A' },
        { label: 'Agent Name', value: evalRun.agent_name || 'N/A' },
        { label: 'Pass Status', value: evalRun.pass_status !== undefined ? String(evalRun.pass_status) : 'N/A', isStatus: true },
        { label: 'Started At', value: evalRun.started_at || 'N/A' },
        { label: 'Finished At', value: evalRun.finished_at || 'N/A' },
    ];

    if (evalRun.star_metric_result) {
        metadata.push({
            label: 'Star Metric',
            value: `${evalRun.star_metric_result.metric_name || 'N/A'}: ${formatMetricValue(evalRun.star_metric_result)}`
        });
    }

    metadataContent.innerHTML = metadata.map(item => {
        let valueHtml = item.value;
        if (item.isStatus) {
            const statusClass = item.value === 'true' ? 'true' : 'false';
            valueHtml = `<span class="pass-status ${statusClass}">${item.value}</span>`;
        }
        return `
            <div class="metadata-item">
                <div class="metadata-label">${item.label}</div>
                <div class="metadata-value">${valueHtml}</div>
            </div>
        `;
    }).join('');
}

function displayPrompts(prompts) {
    const filteredPrompts = filterPromptsByMetrics(prompts);
    
    promptsList.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('');
    
    document.querySelectorAll('.prompt-card').forEach((card, index) => {
        const promptId = filteredPrompts[index].prompt_id;
        card.setAttribute('id', `prompt-${promptId}`);
        card.setAttribute('data-prompt-id', promptId);
    });
    
    document.querySelectorAll('.metrics-header').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const toggle = this.querySelector('.metrics-toggle');
            content.classList.toggle('expanded');
            toggle.classList.toggle('expanded');
        });
    });
}

function buildScoreMatrix(prompts, allPromptsForHeaders) {
    const promptsForHeaders = allPromptsForHeaders || prompts;
    const metricNames = new Set();
    promptsForHeaders.forEach(prompt => {
        if (prompt.prompt_level_metric_results) {
            prompt.prompt_level_metric_results.forEach(metric => {
                if (metric.metric_name) {
                    metricNames.add(metric.metric_name);
                }
            });
        }
    });

    const sortedMetricNames = Array.from(metricNames).sort();

    let html = '<thead><tr><th>Prompt</th>';
    sortedMetricNames.forEach(metricName => {
        html += `<th>${escapeHtml(metricName)}</th>`;
    });
    html += '</tr></thead>';

    html += '<tbody>';
    prompts.forEach(prompt => {
        html += `<tr><td><a href="#prompt-${prompt.prompt_id}" class="prompt-link" data-prompt-id="${prompt.prompt_id}">Prompt #${prompt.prompt_id}</a></td>`;
        
        sortedMetricNames.forEach(metricName => {
            const metric = prompt.prompt_level_metric_results?.find(m => m.metric_name === metricName);
            if (metric && metric.number_value !== undefined && metric.number_value !== null) {
                const value = metric.metric_value_type === 'METRIC_VALUE_TYPE_PERCENTAGE'
                    ? `${metric.number_value.toFixed(0)}%`
                    : metric.number_value.toString();
                const color = getScoreColor(metric.number_value);
                html += `<td class="score-cell" style="background-color: ${color.bg}; color: ${color.text};">${value}</td>`;
            } else {
                html += '<td class="score-cell empty">—</td>';
            }
        });
        html += '</tr>';
    });
    html += '</tbody>';

    scoreMatrix.innerHTML = html;

    scoreMatrix.querySelectorAll('.prompt-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const promptId = this.getAttribute('data-prompt-id');
            scrollToPrompt(promptId);
        });
    });
}

function buildFilterCheckboxes(prompts) {
    const metricNames = new Set();
    prompts.forEach(prompt => {
        if (prompt.prompt_level_metric_results) {
            prompt.prompt_level_metric_results.forEach(metric => {
                if (metric.metric_name) {
                    metricNames.add(metric.metric_name);
                }
            });
        }
    });

    const sortedMetricNames = Array.from(metricNames).sort();

    filterCheckboxes.innerHTML = sortedMetricNames.map(metricName => {
        const checkboxId = `filter-${metricName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        selectedMetricFilters.add(metricName);
        return `
            <label class="pill-checkbox">
                <input type="checkbox" id="${checkboxId}" data-metric="${escapeHtml(metricName)}" checked>
                <span class="pill">${escapeHtml(metricName)}</span>
            </label>
        `;
    }).join('');

    filterCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const metricName = this.getAttribute('data-metric');
            if (this.checked) {
                selectedMetricFilters.add(metricName);
            } else {
                selectedMetricFilters.delete(metricName);
            }
            updateFilteredResults();
        });
    });
}

function setupScoreRangeFilters() {
    scoreRangeFilters.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const range = this.getAttribute('data-range');
            if (this.checked) {
                selectedScoreRanges.add(range);
            } else {
                selectedScoreRanges.delete(range);
            }
            updateFilteredResults();
        });
    });
}

function updateFilteredResults() {
    const filteredPrompts = filterPromptsByMetrics(allPrompts);
    buildScoreMatrix(filteredPrompts, allPrompts);
    displayPrompts(allPrompts);
}

function filterPromptsByMetrics(prompts) {
    const hasMetricFilter = selectedMetricFilters.size > 0;
    const hasScoreRangeFilter = selectedScoreRanges.size > 0;

    if (!hasMetricFilter && !hasScoreRangeFilter) {
        return prompts;
    }

    return prompts.filter(prompt => {
        if (!prompt.prompt_level_metric_results || prompt.prompt_level_metric_results.length === 0) {
            return false;
        }

        return prompt.prompt_level_metric_results.some(metric => {
            const metricNameMatches = !hasMetricFilter || 
                (metric.metric_name && selectedMetricFilters.has(metric.metric_name));
            
            let scoreRangeMatches = !hasScoreRangeFilter;
            if (hasScoreRangeFilter && metric.number_value !== undefined && metric.number_value !== null) {
                const range = getScoreRange(metric.number_value);
                scoreRangeMatches = selectedScoreRanges.has(range);
            }
            
            return metricNameMatches && scoreRangeMatches;
        });
    });
}

function scrollToPrompt(promptId) {
    let promptCard = document.getElementById(`prompt-${promptId}`);
    
    if (!promptCard) {
        const prompt = allPrompts.find(p => p.prompt_id === parseInt(promptId));
        if (prompt && prompt.prompt_level_metric_results) {
            prompt.prompt_level_metric_results.forEach(metric => {
                if (metric.metric_name) {
                    selectedMetricFilters.add(metric.metric_name);
                    filterCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                        if (checkbox.getAttribute('data-metric') === metric.metric_name) {
                            checkbox.checked = true;
                        }
                    });
                }
                
                if (metric.number_value !== undefined && metric.number_value !== null) {
                    const range = getScoreRange(metric.number_value);
                    selectedScoreRanges.add(range);
                    const rangeCheckbox = scoreRangeFilters.querySelector(`input[data-range="${range}"]`);
                    if (rangeCheckbox) {
                        rangeCheckbox.checked = true;
                    }
                }
            });
            
            displayPrompts(allPrompts);
            
            setTimeout(() => {
                promptCard = document.getElementById(`prompt-${promptId}`);
                if (promptCard) {
                    promptCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    highlightPromptCard(promptCard);
                }
            }, 100);
            return;
        }
    }
    
    if (promptCard) {
        promptCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightPromptCard(promptCard);
    }
}

function highlightPromptCard(card) {
    card.style.transition = 'box-shadow 0.3s ease';
    card.style.boxShadow = '0 0 0 3px var(--primary-light)';
    
    setTimeout(() => {
        card.style.boxShadow = '';
    }, 2000);
}

function getScoreRange(score) {
    if (score < 60) return 'poor';
    if (score < 90) return 'medium';
    return 'good';
}

function getScoreColor(score) {
    if (score < 60) {
        return { bg: '#FEF2F2', text: '#DC2626' };
    } else if (score < 90) {
        return { bg: '#FEFCE8', text: '#CA8A04' };
    } else {
        return { bg: '#F0FDF4', text: '#16A34A' };
    }
}

function createPromptCard(prompt) {
    const metricsHtml = prompt.prompt_level_metric_results && prompt.prompt_level_metric_results.length > 0
        ? `
            <div class="metrics-expander">
                <div class="metrics-header">
                    <span class="metrics-title">Metric Results (${prompt.prompt_level_metric_results.length})</span>
                    <span class="metrics-toggle">▼</span>
                </div>
                <div class="metrics-content">
                    <div class="metrics-list">
                        ${prompt.prompt_level_metric_results.map(metric => createMetricItem(metric)).join('')}
                    </div>
                </div>
            </div>
        `
        : '';

    const sortedMetrics = prompt.prompt_level_metric_results && prompt.prompt_level_metric_results.length > 0
        ? [...prompt.prompt_level_metric_results].sort((a, b) => {
            const nameA = (a.metric_name || '').toLowerCase();
            const nameB = (b.metric_name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        })
        : [];

    const badgesHtml = sortedMetrics.length > 0
        ? sortedMetrics.map(metric => createMetricBadge(metric)).join('')
        : '';

    return `
        <div class="prompt-card">
            <div class="prompt-header">
                <span class="prompt-header-title">Prompt #${prompt.prompt_id}</span>
                ${badgesHtml}
            </div>
            
            <div class="prompt-section">
                <div class="prompt-section-label">Input</div>
                <div class="prompt-content">${escapeHtml(prompt.input || 'N/A')}</div>
            </div>
            
            <div class="prompt-section">
                <div class="prompt-section-label">Output</div>
                <div class="prompt-content output-content markdown">${renderMarkdown(prompt.output || 'N/A')}</div>
            </div>
            
            ${metricsHtml}
        </div>
    `;
}

function createMetricItem(metric) {
    const valueHtml = formatMetricValue(metric);
    const reasoningHtml = metric.reasoning 
        ? `<div class="metric-reasoning">${escapeHtml(metric.reasoning)}</div>` 
        : '';
    const errorHtml = metric.error_description
        ? `<div class="metric-error">Error: ${escapeHtml(metric.error_description)}</div>`
        : '';

    let valueStyle = '';
    if (metric.number_value !== undefined && metric.number_value !== null) {
        const color = getScoreColor(metric.number_value);
        valueStyle = `style="color: ${color.text};"`;
    }

    return `
        <div class="metric-item">
            <div class="metric-name">${escapeHtml(metric.metric_name || 'N/A')}</div>
            <div class="metric-value" ${valueStyle}>${valueHtml}</div>
            <div class="metric-type">${escapeHtml(metric.metric_value_type || 'N/A')}</div>
            ${reasoningHtml}
            ${errorHtml}
        </div>
    `;
}

function createMetricBadge(metric) {
    if (metric.number_value === undefined || metric.number_value === null) {
        return '';
    }

    const value = metric.number_value;
    const valueDisplay = metric.metric_value_type === 'METRIC_VALUE_TYPE_PERCENTAGE' 
        ? `${value.toFixed(0)}%`
        : value.toString();
    
    const metricName = metric.metric_name || 'N/A';
    const color = getScoreColor(value);

    const shortName = metricName.length > 20 
        ? metricName.substring(0, 18) + '...'
        : metricName;

    return `<span class="metric-badge" style="background-color: ${color.bg}; border-color: ${color.text};">
        <span class="metric-badge-name" style="color: ${color.text};">${escapeHtml(shortName)}:</span>
        <span class="metric-badge-value" style="color: ${color.text};">${valueDisplay}</span>
    </span>`;
}

function formatMetricValue(metric) {
    if (metric.number_value !== undefined && metric.number_value !== null) {
        if (metric.metric_value_type === 'METRIC_VALUE_TYPE_PERCENTAGE') {
            return `${metric.number_value.toFixed(2)}%`;
        }
        return metric.number_value.toString();
    }
    return 'N/A';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderMarkdown(text) {
    if (!text || text === 'N/A') return 'N/A';
    try {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
        return marked.parse(text);
    } catch (error) {
        return escapeHtml(text);
    }
}
