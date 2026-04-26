# Playwright Testing For Module 3 (Peer-to-Peer Sessions)

This setup creates reusable screenshots for your project documentation.

## What is covered

- Student view of Module 3 session browser
- Session Lead view of Module 3 session browser
- Session details page with AI Study Buddy Prep generated

## Output screenshots

The tests save screenshots to:

- `docs/testing-screenshots/module3-student-view.png`
- `docs/testing-screenshots/module3-session-lead-view.png`
- `docs/testing-screenshots/module3-study-buddy-prep-view.png`
- `docs/testing-screenshots/module3-student-details-view.png`
- `docs/testing-screenshots/module3-session-lead-details-view.png`
- `docs/testing-screenshots/module3-save-prep-history-view.png`

## Run steps

1. Install frontend dependencies:
   - `cd frontend`
   - `npm install`
2. Install Playwright browser:
   - `npx playwright install chromium`
3. Run the tests:
   - `npm run test:e2e`

## Notes

- API calls are mocked in the test file, so screenshots stay consistent.
- Tests target only your part: peer-to-peer sessions and AI Study Buddy Prep.
