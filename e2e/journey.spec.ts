import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openSection(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name }).click();
}

async function skipOnboarding(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Skip setup/ }).click();
  await expect(page.getByRole('heading', { name: /Start:/ })).toBeVisible();
}

test('primary learner journey: study, feedback, resume, review, practice exam', async ({ page }) => {
  await page.goto('/');
  // Onboarding: answer the first question, then skip the rest.
  await expect(page.getByRole('heading', { name: 'What career goal are you working toward?' })).toBeVisible();
  await page.getByRole('radio', { name: /^AI Application Developer/ }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Skip setup/ }).click();

  // Choose a course from the catalog.
  await openSection(page, 'Course Catalog');
  await page.getByLabel('Search').fill('LLM foundations');
  await page.getByRole('link', { name: 'AI, ML and LLM foundations' }).click();
  await expect(page.getByRole('heading', { name: 'What it proves' })).toBeVisible();
  await page.getByRole('button', { name: 'Start studying' }).click();

  // Start a lesson and move through its sections.
  await expect(page.getByRole('heading', { level: 1, name: 'AI, machine learning and generative AI' })).toBeVisible();
  await page.getByRole('button', { name: 'Next section' }).click();
  await page.getByRole('button', { name: 'Next section' }).click();
  await page.getByRole('button', { name: 'Check what you learned' }).click();

  // Answer a question and receive an explanation.
  await page.getByLabel('Generative AI is a subset of machine learning, which is a subset of AI.').check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
  await expect(page.getByText(/AI is the goal; ML learns from data/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Miss the next one on purpose so it becomes a weak concept.
  await page.getByLabel('Classification').check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Not quite.')).toBeVisible();
  await expect(page.getByText(/Classification outputs a category/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Knowledge check 3 of 4' })).toBeVisible();

  // Leave the app and return: progress persists and resumes at the same step.
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Continue: AI, machine learning and generative AI/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start now' }).click();
  await expect(page.getByRole('heading', { name: 'Knowledge check 3 of 4' })).toBeVisible();

  // Review the weak concept.
  await page.goto('/#/review/study-ai-foundations');
  await expect(page.getByText(/Weak concept: AI vs ML vs generative AI|Missed last time/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Check answer' }).isDisabled();

  // Take a practice exam in exam mode.
  await openSection(page, 'Practice Center');
  await page.getByLabel('Course').selectOption('study-aws-aif');
  await page.getByLabel('Questions (max 20)').fill('5');
  await page.getByLabel(/Exam: explanations after you submit/).check();
  await page.getByRole('button', { name: /Start exam \(5 questions\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Question 1 of 5' })).toBeVisible();
  await expect(page.getByText(/Original practice questions/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Submit exam' }).click();
  await page.getByRole('button', { name: 'Submit anyway' }).click();
  await expect(page.getByRole('heading', { name: 'By domain' })).toBeVisible();
  await expect(page.getByText(/not the official cut score/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Practise weak domains' })).toBeVisible();
});

test('quick credentials filters and explains trade-offs', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/quick');
  await page.getByRole('button', { name: 'Under 2 hours' }).click();
  await expect(page.getByRole('link', { name: 'Introduction to Generative AI (Google Skills)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'AWS Certified AI Practitioner' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Under 2 hours' }).click();
  await page.getByRole('button', { name: 'Formal certification' }).click();
  await expect(page.getByRole('link', { name: 'AWS Certified AI Practitioner' })).toBeVisible();
  await expect(page.getByText(/costs \$100, but a proctored, employer-recognised certification/).first()).toBeVisible();
});

test('career path can be customised and explains recommendations', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/paths');
  await expect(page.getByRole('heading', { name: /Step 1: AI fluency/ })).toBeVisible();
  const row = page.locator('li:not(.card)', { has: page.getByRole('link', { name: 'AWS Certified AI Practitioner', exact: true }) });
  await expect(row.getByText('Recommended')).toBeVisible();
  await row.getByRole('button', { name: 'Skip this' }).click();
  await expect(row.getByText('Optional')).toBeVisible();
  await page.getByRole('button', { name: 'Move step 2 up' }).click();
  await expect(page.getByRole('heading', { name: /Step 1: AI and LLM fundamentals/ })).toBeVisible();
});

test('export backup downloads JSON', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup (JSON)' }).click();
  expect((await download).suggestedFilename()).toMatch(/^ai-career-academy-backup-.*\.json$/);
});

test('navigation works on every section and pages have no serious accessibility violations', async ({ page }) => {
  await skipOnboarding(page);
  for (const [name, heading] of [
    ['Course Catalog', 'Course Catalog'], ['My Learning', 'My Learning'], ['Career Paths', 'Career Paths'], ['Quick Credentials', 'Quick Credentials'],
    ['Practice Center', 'Practice Center'], ['Project Lab', 'Project Lab'], ['Progress', 'Progress'], ['Settings', 'Settings'],
  ]) {
    await openSection(page, name!);
    await expect(page.getByRole('heading', { level: 1, name: heading! })).toBeVisible();
    // @axe-core/playwright is typed against its own playwright-core copy.
    const axe = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`), name).toEqual([]);
    // On mobile, content wider than the screen silently widens the layout viewport, so compare with the device width.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, `${name} horizontal overflow`).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});
