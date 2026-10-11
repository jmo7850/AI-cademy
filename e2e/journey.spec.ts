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
  // The place is saved in an effect after render, so wait for the write before leaving
  // (3 lesson sections + 2 answered checks = section index 5).
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('ai-career-academy') ?? '{}') as {
          courses?: Record<string, { position?: { section: number } }>;
        };
        return Object.values(saved.courses ?? {}).map((c) => c.position?.section);
      }),
    )
    .toContain(5);
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Continue: AI, machine learning and generative AI/ })).toBeVisible();
  await expect(page.getByText(/^Step 6 of 7, about \d+ min left\./)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Or answer one question (about 1 min)' })).toBeVisible();
  await page.getByRole('button', { name: 'Start now' }).click();
  await expect(page.getByRole('heading', { name: 'Knowledge check 3 of 4' })).toBeVisible();

  // The smaller way back in is a single question.
  await page.goto('/#/review/study-ai-foundations/one');
  await expect(page.getByText(/^Review 1 of 1 · /)).toBeVisible();

  // Review the weak concept.
  await page.goto('/#/review/study-ai-foundations');
  await expect(page.getByText(/Weak concept: AI vs ML vs generative AI|Missed last time/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Check answer' }).isDisabled();

  // Take a practice exam in exam mode.
  await openSection(page, 'Practice Center');
  await page.getByLabel('Course').selectOption('study-aws-aif');
  await page.getByLabel(/^Questions \(max \d+\)/).fill('5');
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
  expect((await download).suggestedFilename()).toMatch(/^poqeni-backup-.*\.json$/);
});

test('navigation works on every section and pages have no serious accessibility violations', async ({ page }) => {
  await skipOnboarding(page);
  const home = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(home.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id), 'Home').toEqual([]);
  for (const [name, heading] of [
    ['Course Catalog', 'Course Catalog'], ['My Learning', 'My Learning'], ['Career Paths', 'Career Paths'], ['Quick Credentials', 'Quick Credentials'],
    ['Practice Center', 'Practice Center'], ['Arcade', 'Arcade'], ['Project Lab', 'Project Lab'], ['Progress', 'Progress'], ['Settings', 'Settings'],
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

test('new providers work with search, filters, course pages, enrolment, practice exams and persistence', async ({ page }) => {
  await skipOnboarding(page);
  await openSection(page, 'Course Catalog');
  await page.getByText(/^Filters/).click();
  await page.getByRole('button', { name: 'NVIDIA', exact: true }).click();
  await expect(page.getByRole('link', { name: 'NVIDIA-Certified Associate: Generative AI LLMs' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Claude 101/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'NVIDIA-Certified Associate: Generative AI LLMs' }).click();
  await expect(page.getByText('Official foundational certification').first()).toBeVisible();
  await expect(page.getByText(/\$125/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Start studying' }).click();
  await expect(page.getByRole('heading', { name: 'LLM essentials for the NVIDIA Associate exam' })).toBeVisible();

  // Distinct credential classes on the Google entries.
  await page.goto('/#/course/google-ai-professional-certificate');
  await expect(page.getByText(/Professional certificate program/).first()).toBeVisible();
  await page.goto('/#/course/openai-apply-ai-at-work');
  await expect(page.getByText(/Learning resource \(no credential stated\)/).first()).toBeVisible();

  await openSection(page, 'Practice Center');
  await page.getByLabel('Course').selectOption('study-nvidia-genl');
  await page.getByLabel(/Questions \(max \d+\)/).fill('5');
  await page.getByRole('button', { name: /Start (practice|exam) \(5 questions\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Question 1 of 5' })).toBeVisible();

  // Enrolment survives a reload.
  await page.reload();
  await openSection(page, 'My Learning');
  await expect(page.getByRole('link', { name: /NVIDIA-Certified Associate: Generative AI LLMs/ }).first()).toBeVisible();
});

test('dark theme keeps pages accessible', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await skipOnboarding(page);
  for (const path of ['/#/', '/#/catalog', '/#/course/nvidia-nca-genl', '/#/learn/nvidia-nca-genl/nvidia-genl-1', '/#/quick', '/#/paths', '/#/progress', '/#/settings']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached();
    const axe = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`), path).toEqual([]);
  }
});

test('arcade games with Poqeni record answers and results', async ({ page }) => {
  await skipOnboarding(page);
  await openSection(page, 'Arcade');
  await page.getByLabel('Course').selectOption('study-aws-aif');

  // Poqeni Run: answer five questions whichever way, then see results.
  await page.getByRole('link', { name: 'Play Poqeni Run' }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText(`Question ${i + 1} of 5`)).toBeVisible();
    // Answer any question format; correctness does not matter here.
    const choice = page.locator('main input[type=radio], main input[type=checkbox]');
    const selects = page.locator('main article select');
    const text = page.locator('main input[type=text]');
    const moves = page.locator('main button[aria-label^="Move"][aria-label$="down"]');
    if (await moves.count()) await moves.first().click();
    else if (await choice.count()) await choice.first().check();
    else if (await selects.count()) for (let k = 0; k < (await selects.count()); k++) await selects.nth(k).selectOption({ index: 1 });
    else if (await text.count()) await text.first().fill('x');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.getByRole('button', { name: i === 4 ? 'See results' : 'Next question' }).click();
  }
  await expect(page.getByRole('heading', { name: /Run complete: \d of 5/ })).toBeVisible();

  // Flash Match: pair every term with its meaning (meaning buttons share the card text order).
  await page.goto('/#/arcade');
  await page.getByLabel('Course').selectOption('study-ai-foundations');
  await page.getByRole('link', { name: 'Play Flash Match' }).click();
  const terms = page.locator('.match-board > div:first-child button');
  await expect(terms.first()).toBeVisible();
  const n = await terms.count();
  for (let i = 0; i < n; i++) {
    await terms.nth(i).click();
    const meanings = page.locator('.match-board > div:last-child button:not([disabled])');
    const m = await meanings.count();
    for (let j = 0; j < m; j++) {
      await meanings.nth(j).click();
      if ((await page.getByRole('heading', { name: 'Board cleared' }).count()) || (await terms.nth(i).isDisabled())) break;
      await terms.nth(i).click();
    }
  }
  await expect(page.getByRole('heading', { name: 'Board cleared' })).toBeVisible();

  // Results persist and show in Progress and Arcade badges.
  await page.reload();
  await openSection(page, 'Progress');
  await expect(page.getByRole('heading', { name: 'Win board' })).toBeVisible();
  await openSection(page, 'Arcade');
  await expect(page.locator('.badge-grid li.earned').first()).toBeVisible();

  // Boss battle loads for a blueprint domain.
  await page.getByLabel('Course').selectOption('study-aws-aif');
  await page.getByRole('link', { name: /^Fight:/ }).first().click();
  await expect(page.getByRole('meter', { name: 'Boss health' })).toBeVisible();
  const axe = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
});

async function answerAny(page: Page) {
  const choice = page.locator('main input[type=radio], main input[type=checkbox]');
  const selects = page.locator('main article select');
  const text = page.locator('main input[type=text]');
  const moves = page.locator('main button[aria-label^="Move"][aria-label$="down"]');
  if (await moves.count()) await moves.first().click();
  else if (await choice.count()) await choice.first().check();
  else if (await selects.count()) for (let k = 0; k < (await selects.count()); k++) await selects.nth(k).selectOption({ index: 1 });
  else if (await text.count()) await text.first().fill('x');
  await page.getByRole('button', { name: 'Check answer' }).click();
}

async function expectNoSeriousAxe(page: Page, label: string) {
  const axe = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes[0]?.target}`), label).toEqual([]);
}

test('outside course: finish, add a note, check what you learned, see an honest status', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/course/aws-cloud-practitioner-essentials');
  await page.getByRole('button', { name: 'Add to My Learning' }).click();
  await expect(page.getByRole('heading', { name: 'Study this outside Poqeni' })).toBeVisible();
  await expectNoSeriousAxe(page, 'outside module');

  await page.getByLabel('I finished this course').check();
  await expect(page.getByText('You said you finished this.')).toBeVisible();
  await page.getByLabel(/What you did or learned/).fill('Finished the cloud concepts modules.');
  await page.getByLabel(/Link to your work/).fill('http://insecure.example');
  await expect(page.getByText('This link needs to start with https://')).toBeVisible();
  await page.getByLabel(/Link to your work/).fill('https://example.com/my-work');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(/Poqeni keeps it but does not check it/)).toBeVisible();

  await page.getByRole('link', { name: 'Check what I learned' }).click();
  await expectNoSeriousAxe(page, 'return check');
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText(`Check ${i + 1} of 5`)).toBeVisible();
    await answerAny(page);
    await page.getByRole('button', { name: i === 4 ? 'See result' : 'Next' }).click();
  }
  await expect(page.getByRole('heading', { name: /You got \d of 5/ })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the course' }).click();
  await expect(page.getByText(/Poqeni's check on this topic \((best so far )?\d of 5\)/)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Where this stands' })).not.toContainText(/confirmed|certified|earned/i);
});

test('a recorded external credential says Poqeni has not verified it', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/course/nvidia-nca-genm');
  await page.getByRole('button', { name: 'Add to My Learning' }).click();
  await page.getByRole('button', { name: 'Record an earned credential' }).click();
  await page.getByLabel('Date earned').fill('2026-09-01');
  await page.getByRole('button', { name: 'Save record' }).click();
  await expect(page.getByText(/Poqeni has not verified it; only the provider can/)).toBeVisible();
});

test('project milestones keep optional evidence', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/project/api-client');
  await page.getByRole('button', { name: 'Start this project' }).click();
  await page.locator('main fieldset input[type=checkbox]').first().check();
  await page.getByRole('button', { name: /Add evidence for step 1/ }).click();
  await page.getByLabel(/Link to your work/).fill('https://example.com/commit/1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('link', { name: 'https://example.com/commit/1' })).toBeVisible();
  await expect(page.getByText(/It is not checked/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'https://example.com/commit/1' })).toBeVisible();
});

test('What Poqeni knows: see, add, delete and forget', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /^AI Application Developer/ }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Skip setup/ }).click();
  await page.goto('/#/know');
  await expect(page.getByRole('heading', { level: 1, name: 'What Poqeni knows about me' })).toBeVisible();
  await expect(page.getByText(/AI Application Developer/)).toBeVisible();
  await expectNoSeriousAxe(page, 'know page');

  await page.getByLabel('Add a note').fill('I study after 8pm only');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('I study after 8pm only')).toBeVisible();
  await page.reload();
  await expect(page.getByText('I study after 8pm only')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('I study after 8pm only')).toHaveCount(0);

  await page.getByLabel('Add a note').fill('prefers short lessons');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Forget everything' }).first().click();
  await page.getByRole('button', { name: 'Forget everything' }).last().click();
  await expect(page.getByText('prefers short lessons')).toHaveCount(0);
  await expect(page.getByText('No notes.')).toBeVisible();
});

test('Claude fast track shows an honest badge route, a pace estimate and can become a plan', async ({ page }) => {
  await skipOnboarding(page);
  await openSection(page, 'Career Paths');
  await page.getByRole('link', { name: /Fast tracks/ }).click();
  await page.getByRole('link', { name: 'Claude fast track' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Claude fast track' })).toBeVisible();
  await expect(page.getByText(/not a certification/).first()).toBeVisible();
  await expectNoSeriousAxe(page, 'fast track');
  await page.getByLabel('Hours a week').selectOption('5');
  await expect(page.getByRole('status')).toContainText('about 2 weeks');
  await page.getByRole('button', { name: 'Use as my plan' }).click();
  await expect(page.getByRole('button', { name: 'This is one of your plans' })).toBeDisabled();
  await page.getByRole('link', { name: 'Open my plans' }).click();
  await expect(page.getByRole('heading', { name: /Step 1: AI Fluency/ })).toBeVisible();
});

test('a missed question links back to the section that teaches it', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/course/aws-ai-practitioner');
  await page.getByRole('button', { name: 'Start studying' }).click();
  await page.goto('/#/learn/aws-ai-practitioner/aws-aif-d1');
  await expect(page.getByRole('heading', { name: 'AI, machine learning and deep learning' })).toBeVisible();
  await expect(page.getByText('Not the same thing.')).toBeVisible();
  await expect(page.getByText('Common mix-up.')).toBeVisible();
  await expect(page.getByRole('list', { name: /Each term sits inside the one before it/ })).toBeVisible();
  await expectNoSeriousAxe(page, 'lesson section');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: /Next section|Check what you learned/ }).click();
  // First check is the overfitting question: pick a wrong answer on purpose.
  await page.getByLabel('Underfitting').check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Not quite.')).toBeVisible();
  await page.getByRole('link', { name: /Review this section: Is the model any good\?/ }).click();
  await expect(page.getByRole('heading', { name: 'Is the model any good?' })).toBeVisible();
  await expect(page.getByText('Remember:')).toBeVisible();
});

test('every Practice flashcard category has 30 to 50 cards and a deck can be studied', async ({ page }) => {
  await skipOnboarding(page);
  await openSection(page, 'Practice Center');
  const counts = await page.locator('#fc-h ~ ul li').allTextContents();
  expect(counts.length).toBe(10);
  for (const t of counts) {
    const n = Number(/\((\d+) cards\)/.exec(t)?.[1]);
    expect(n, t).toBeGreaterThanOrEqual(30);
    expect(n, t).toBeLessThanOrEqual(50);
  }
  await page.goto('/#/flashcards/study-aws-clf');
  await expect(page.getByText(/card 1 of 40/)).toBeVisible();
  await expectNoSeriousAxe(page, 'flashcards');
  await page.getByRole('button', { name: 'Show answer' }).click();
  await page.getByRole('button', { name: 'Knew it easily' }).click();
  await page.getByRole('button', { name: 'Next card' }).click();
  await expect(page.getByText(/card 2 of 40/)).toBeVisible();
  // The answer joins the spaced-review schedule.
  const scheduled = await page.evaluate(() => Object.keys((JSON.parse(localStorage.getItem('ai-career-academy') ?? '{}') as { reviews?: Record<string, unknown> }).reviews ?? {}).length);
  expect(scheduled).toBe(1);
});

test('coverage view shows every exam domain with lessons and questions', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/#/course/aws-ai-practitioner');
  await page.getByRole('link', { name: /how much of the exam outline/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'What this course covers' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(6);
  await expect(page.getByText(/None yet/)).toHaveCount(0);
  await expect(page.getByText(/original practice questions/)).toBeVisible();
  await expectNoSeriousAxe(page, 'coverage');

  await page.goto('/#/course/ms-azure-ai-fundamentals');
  await page.getByRole('link', { name: /how much of the exam outline/ }).click();
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(page.getByText(/None yet/)).toHaveCount(0);
});
