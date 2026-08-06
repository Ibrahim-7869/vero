import client from "./client";

export async function getChatHistory() {
    const response = await client.get("/chat/history/");
    return response.data;
}

export async function sendMessage(text) {
    const today_date = new Date().toLocaleDateString( 'en-CA' )
    const response = await client.post("/chat/send/", { message: text, today_date:today_date });
    return response.data
}