import API from './api';

export async function getCurrentStudent() {
  const { data } = await API.get('/student/current');
  return data;
}

export async function getDashboardSummary() {
  const { data } = await API.get('/dashboard/summary');
  return data;
}

export async function getSubjects() {
  const { data } = await API.get('/subjects');
  return data;
}

export async function getQuizByCategory(categorySlug) {
  const { data } = await API.get(`/quiz/${categorySlug}`);
  return data;
}

export async function submitQuiz(categorySlug, answers, timeTaken = 0) {
  const { data } = await API.post(`/quiz/${categorySlug}/submit`, { answers, timeTaken });
  return data;
}

export async function getPortfolio() {
  const { data } = await API.get('/portfolio');
  return data;
}

export async function getPerformanceAnalytics() {
  const { data } = await API.get('/performance-analytics');
  return data;
}

export async function getStudyTime() {
  const { data } = await API.get('/study-time');
  return data;
}

export async function getPeerSessions() {
  const { data } = await API.get('/peer-sessions');
  return data;
}
