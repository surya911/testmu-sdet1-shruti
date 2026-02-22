import { test as base } from '@playwright/test';
import { explainFailure, saveAnalysis } from '../llm/failureExplainer';
import { llmConfig } from '../config/llm.config';

let failureExplainerCallCount = 0;
const maxCalls = parseInt(process.env.MAX_FAILURE_EXPLAINER_CALLS || '1', 10);

export const test = base.extend({
  // Custom fixtures
});

test.afterEach(async ({}, testInfo) => {
  const shouldRun =
    testInfo.status !== 'passed' &&
    testInfo.status !== 'skipped' &&
    llmConfig.enableFailureExplainer &&
    llmConfig.apiKey &&
    failureExplainerCallCount < maxCalls;

  if (shouldRun) {
    failureExplainerCallCount++;
    try {
      const analysis = await explainFailure({
        testTitle: testInfo.title,
        errorMessage: testInfo.error?.message ?? 'Unknown error',
        stackTrace: testInfo.error?.stack,
        tracePath: testInfo.outputPath('trace.zip'),
        screenshotPath: testInfo.attachments.find(a => a.name === 'screenshot')?.path,
      });
      const reportPath = await saveAnalysis(testInfo.title, analysis);
      console.log(`LLM failure analysis saved to: ${reportPath}`);
    } catch (err) {
      const fallback = `## LLM Failure Explainer — API Error\n\nTest: ${testInfo.title}\n\n**Could not get LLM analysis:** ${err instanceof Error ? err.message : String(err)}\n\nThis usually means:\n- **429**: OpenAI quota exceeded — add billing at https://platform.openai.com/account/billing\n- **401**: Invalid API key — check OPENAI_API_KEY in .env\n- **Network**: Connection or timeout issue`;
      const reportPath = await saveAnalysis(testInfo.title, fallback);
      console.log(`LLM fallback report saved to: ${reportPath}`);
    }
  }
});

export { expect } from '@playwright/test';
