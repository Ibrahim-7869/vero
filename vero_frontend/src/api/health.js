import client from "./client";


export const getInjuries = () => client.get("/health/injuries/");
export const reportInjury = (data) => client.post("/health/injuries/", data);
export const respondToCheckIn = (id, data) => client.post(`/health/checkins/${id}/respond/`, data);