import client from "./client";

export async function login(email, password) {
  const response = await client.post("/auth/login/", { email, password });
  const { access, refresh } = response.data;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  return response.data;
}

export async function signup(username, firstName, email, password) {
  const response = await client.post("/auth/signup/", {
    username,
    first_name: firstName,
    email,
    password,
  });
  return response.data;
}

export async function getCurrentUser() {
  const response = await client.get("/auth/me/");
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await clinet.post("/auth/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
}