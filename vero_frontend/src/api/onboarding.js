import client from "./client";

export async function submitOnboarding(data) {
    const response = await client.post("/onboarding/profile/", data);
    return response.data;
}

export async function getOnboardingProfile() {
  const response = await client.get("/onboarding/profile/");
  return response.data;
}