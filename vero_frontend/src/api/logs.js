import client from "./client";

export async function getUserStats() {
  const response = await client.get("/logs/stats/");
  return response.data;
}

export async function startSession(workoutDayId, date) {
  const response = await client.post("/logs/sessions/start/", {
    workout_day: workoutDayId,
    date,
  });
  return response.data;
}

export async function logExercise(sessionId, payload) {
  const response = await client.post(`/logs/sessions/${sessionId}/log-exercise/`, payload);
  return response.data;
}

export async function completeSession(sessionId, payload) {
  const response = await client.post(`/logs/sessions/${sessionId}/complete/`, payload);
  return response.data;
}

export async function getSession(sessionId) {
  const response = await client.get(`/logs/sessions/${sessionId}/`);
  return response.data;
}

export async function getHistory(sessionId) {
    const response  = await client.get("/logs/sessions/history/");
    return response.data;
}