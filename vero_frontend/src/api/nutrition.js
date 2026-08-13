import client from "./client";

export const generateMealPlan = (data = {}) => client.post("/nutrition/plan/generate/", data);
export const getActiveMealPlan = () => client.get("/nutrition/plan/active/");
export const getDailyTotals = (date) => client.get("/nutrition/totals/", { params: date ? { date } : {} });
export const completeMeal = (data) => client.post("/nutrition/complete/", data);