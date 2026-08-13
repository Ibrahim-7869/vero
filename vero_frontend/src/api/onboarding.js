import client from "./client";

export const getOnboardingProfile = () => client.get("/onboarding/profile/");
export const createOnboardingProfile = (data) => client.post("/onboarding/profile/", data);
export const updateOnboardingProfile = (data) => client.patch("/onboarding/profile/", data);
export const submitOnboarding = (data) => client.post("/onboarding/profile/", data);
export const getBuildTemplates = () => client.get("/onboarding/templates/");

export const createPhysiqueFromTemplate = (buildTemplateId, autoGeneratePlan = true) =>
  client.post("/onboarding/physique/", {
    build_template_id: buildTemplateId,
    auto_generate_plan: autoGeneratePlan,
  });

export const getCurrentPhysique = () => client.get("/onboarding/physique/current/");