const { test, expect } = require('@playwright/test');

const studentUser = {
  id: 'u-student-1',
  name: 'Student Tester',
  email: 'it23214552@my.sliit.lk',
  role: 'student',
  roleRequest: 'none',
};

const pendingLeadUser = {
  id: 'u-pending-1',
  name: 'Pending Lead',
  email: 'it23214554@my.sliit.lk',
  role: 'student',
  roleRequest: 'pending_session_lead',
};

const sampleSession = {
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
};

async function mockModule3Apis(page) {
  await page.route('**/api/module3/bookings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ sessionId: sampleSession._id }]),
    });
  });

  await page.route('**/api/module3/sessions**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/module3/sessions') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([sampleSession]),
      });
      return;
    }
    await route.fallback();
  });
}

test('login as student routes to module3', async ({ page }) => {
  await mockModule3Apis(page);
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-token',
        user: studentUser,
      }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill('it23214552@my.sliit.lk');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in as Student' }).click();

  await expect(page).toHaveURL(/\/module3$/);
  await expect(page.getByText('Peer-to-Peer')).toBeVisible();
});

test('session lead tab blocks non-lead users', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-token',
        user: studentUser,
      }),
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Session Lead' }).click();
  await page.getByPlaceholder('Email address').fill('it23214552@my.sliit.lk');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in as Session Lead' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Access denied. You do not have Session Lead privileges.')).toBeVisible();
});

test('register validation blocks mismatched email and registration number', async ({ page }) => {
  await page.goto('/register');
  await page.getByPlaceholder('Full Name').fill('Student Tester');
  await page.getByPlaceholder('Email address').fill('it23214552@my.sliit.lk');
  await page.getByPlaceholder('Password (min 6 chars)').fill('password123');
  await page.getByPlaceholder('Registration Number (e.g. IT12345678)').fill('IT12345679');
  await page.getByPlaceholder('Phone number').fill('712345678');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('Email IT number must match your registration number.')).toBeVisible();
});

test('register with session lead token routes to pending approval', async ({ page }) => {
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-token',
        user: pendingLeadUser,
      }),
    });
  });

  await page.route('**/api/admin/check-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        canLogin: false,
        roleRequest: 'pending_session_lead',
      }),
    });
  });

  await page.goto('/register');
  await page.getByPlaceholder('Full Name').fill('Pending Lead');
  await page.getByPlaceholder('Email address').fill('it23214554@my.sliit.lk');
  await page.getByPlaceholder('Password (min 6 chars)').fill('password123');
  await page.getByPlaceholder('Registration Number (e.g. IT12345678)').fill('IT23214554');
  await page.getByPlaceholder('Phone number').fill('712345678');
  await page.getByPlaceholder('Session Lead Secret Token (Optional)').fill('learnloop-lead-2026');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/pending-approval$/);
  await expect(page.getByText('Request Pending Approval')).toBeVisible();
});
