const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOTS_DIR = path.resolve(__dirname, '..', '..', 'docs', 'testing-screenshots');

const studentUser = {
  id: 'u-student-1',
  name: 'Student Tester',
  email: 'it23214552@my.sliit.lk',
  role: 'student',
  roleRequest: 'none',
};

const sessionLeadUser = {
  id: 'u-lead-1',
  name: 'Lead Tester',
  email: 'it23214553@my.sliit.lk',
  role: 'session_lead',
  roleRequest: 'none',
};

const sampleSessions = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'Pointers Deep Dive',
    moduleCode: 'IT2010',
    moduleName: 'Data Structures',
    description: 'Understand pointers with practical problem solving.',
    hostName: 'Lead Tester',
    hostEmail: 'it23214553@my.sliit.lk',
    meetingLink: 'https://meet.google.com/aaa-bbbb-ccc',
    materialsLink: 'https://example.com/materials',
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 90,
    maxParticipants: 30,
    bookingCount: 12,
    averageRating: 4.6,
    ratingCount: 18,
    difficulty: 'Intermediate',
    status: 'upcoming',
    tags: ['pointers'],
  },
];

const sampleDetails = {
  ...sampleSessions[0],
  bookings: [
    {
      _id: 'bk1',
      sessionId: sampleSessions[0]._id,
      studentName: 'Student Tester',
      studentEmail: 'it23214552@my.sliit.lk',
      studentMobile: '+94712345678',
    },
  ],
  ratings: [
    {
      _id: 'rt1',
      studentName: 'Student One',
      studentEmail: 'it23210001@my.sliit.lk',
      rating: 5,
      comment: 'Great explanations.',
      createdAt: new Date().toISOString(),
    },
  ],
};

async function setUser(page, user) {
  await page.addInitScript((payload) => {
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem('user', JSON.stringify(payload));
  }, user);
}

async function mockModule3Apis(page) {
  const savedPreps = [];

  await page.route('**/api/module3/bookings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ sessionId: sampleSessions[0]._id }]),
    });
  });

  await page.route('**/api/module3/sessions**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/module3/sessions') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleSessions),
      });
      return;
    }

    if (url.pathname.startsWith('/api/module3/sessions/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleDetails),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/module3/study-buddy/prep/history/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(savedPreps),
    });
  });

  await page.route('**/api/module3/study-buddy/prep', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'ai',
        title: 'Study Buddy Prep: Pointers Deep Dive',
        overview: 'Focus on pointer basics, memory access, and common bugs.',
        revisionGoals: [
          'Explain pointers in your own words.',
          'Solve two pointer tracing questions.',
          'Identify common segmentation fault causes.',
        ],
        likelyQuestions: [
          {
            question: 'How is pointer arithmetic related to array indexing?',
            whyItMatters: 'This appears frequently in exams and coding tasks.',
          },
          {
            question: 'When do dangling pointers occur?',
            whyItMatters: 'Helps avoid runtime crashes and undefined behavior.',
          },
          {
            question: 'How do you safely pass pointers to functions?',
            whyItMatters: 'Important for clean modular solutions.',
          },
        ],
        studyPlan: [
          { step: 'Review notes', durationMinutes: 20 },
          { step: 'Practice coding', durationMinutes: 30 },
          { step: 'Prepare discussion questions', durationMinutes: 15 },
        ],
        quickTips: [
          'Draw memory diagrams.',
          'Use active recall after each topic.',
          'Revise mistakes before the session.',
        ],
      }),
    });
  });

  await page.route('**/api/module3/study-buddy/prep/save', async (route) => {
    const payload = route.request().postDataJSON() || {};
    savedPreps.unshift({
      _id: `prep-${Date.now()}`,
      source: payload.source || 'ai',
      prep: payload.prep || {},
      createdAt: new Date().toISOString(),
    });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Prep saved successfully',
      }),
    });
  });
}

test.beforeAll(async () => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
});

test('captures student peer-session browser screenshot', async ({ page }) => {
  await setUser(page, studentUser);
  await mockModule3Apis(page);

  await page.goto('/module3');
  await expect(page.getByText('Peer-to-Peer')).toBeVisible();
  await expect(page.getByText('Pointers Deep Dive')).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-student-view.png'),
    fullPage: true,
  });
});

test('captures session-lead peer-session browser screenshot', async ({ page }) => {
  await setUser(page, sessionLeadUser);
  await mockModule3Apis(page);

  await page.goto('/module3');
  await expect(page.getByText('Create New Session')).toBeVisible();
  await expect(page.locator('span', { hasText: 'Your session' }).first()).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-session-lead-view.png'),
    fullPage: true,
  });
});

test('captures study buddy prep screenshot from session details', async ({ page }) => {
  await setUser(page, studentUser);
  await mockModule3Apis(page);

  await page.goto(`/module3/session/${sampleSessions[0]._id}`);
  await expect(page.getByText('AI Study Buddy Prep')).toBeVisible();

  await page.getByPlaceholder('Example: pointers, recursion, memory allocation').fill('pointers, recursion');
  await page.getByRole('button', { name: 'Generate Study Buddy Prep' }).click();
  await expect(page.getByText('Study Buddy Prep: Pointers Deep Dive')).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-study-buddy-prep-view.png'),
    fullPage: true,
  });
});

test('captures student session details screenshot', async ({ page }) => {
  await setUser(page, studentUser);
  await mockModule3Apis(page);

  await page.goto(`/module3/session/${sampleSessions[0]._id}`);
  await expect(page.getByText('Session description')).toBeVisible();
  await expect(page.getByText('Book this session')).toBeVisible();
  await expect(page.getByText('Write a review')).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-student-details-view.png'),
    fullPage: true,
  });
});

test('captures session-lead session details screenshot', async ({ page }) => {
  await setUser(page, sessionLeadUser);
  await mockModule3Apis(page);

  await page.goto(`/module3/session/${sampleSessions[0]._id}`);
  await expect(page.getByText('You are the host')).toBeVisible();
  await expect(page.getByText('Participant roster')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit session' })).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-session-lead-details-view.png'),
    fullPage: true,
  });
});

test('captures save prep and history screenshot', async ({ page }) => {
  await setUser(page, studentUser);
  await mockModule3Apis(page);

  await page.goto(`/module3/session/${sampleSessions[0]._id}`);
  await expect(page.getByText('AI Study Buddy Prep')).toBeVisible();

  await page.getByPlaceholder('Example: pointers, recursion, memory allocation').fill('pointers, recursion');
  await page.getByRole('button', { name: 'Generate Study Buddy Prep' }).click();
  await expect(page.getByText('Study Buddy Prep: Pointers Deep Dive')).toBeVisible();

  await page.getByRole('button', { name: 'Save Prep' }).click();
  await expect(page.getByRole('heading', { name: 'Saved Preps' })).toBeVisible();
  await expect(page.getByText('AI-generated').first()).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'Study Buddy Prep: Pointers Deep Dive' }).first()).toBeVisible();

  await page.screenshot({
    path: path.join(SHOTS_DIR, 'module3-save-prep-history-view.png'),
    fullPage: true,
  });
});
