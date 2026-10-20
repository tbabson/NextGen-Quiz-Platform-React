import { useQuery } from '@tanstack/react-query';
import { api } from './client.js';

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard });
export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: api.profile });
export const useQuizzes = () => useQuery({ queryKey: ['quizzes'], queryFn: api.quizzes });
export const useAttempts = () => useQuery({ queryKey: ['attempts'], queryFn: () => api.attempts({ limit: 100 }) });
export const useLeaderboard = (limit = 20) =>
  useQuery({ queryKey: ['leaderboard', limit], queryFn: () => api.leaderboard(limit) });
export const useAttempt = (id) => useQuery({ queryKey: ['attempt', id], queryFn: () => api.attempt(id) });

/** Everything that changes when a quiz is submitted. */
export const AFTER_SUBMIT_KEYS = [['dashboard'], ['quizzes'], ['attempts'], ['leaderboard']];
