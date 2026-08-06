import client from "./client";

export async function generatePlan() {
    const response = await client.post("/plans/generate/");
    return response.data;
}

export async function getActivePlan() {
    const response = await client.get("/plans/active/");
    return response.data;
}

export async function getWorkoutDay(dayId) {
    const response = await client.get(`/plans/days/${dayId}/`);
    return response.data;
}

export async function getRecentAdjustments() {
    const response = await client.get("/plans/adjustments/recent");
    return response.data;
}