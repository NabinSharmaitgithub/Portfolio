const ALLOWED_ORIGIN = "https://nabinsharma329.com.np";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const apiKey = env.RESEND_API_KEY;

    try {
      const { from_name, from_email, message } = await request.json();

      if (!from_name || !from_email || !message) {
        return json({ error: "All fields are required" }, 400);
      }

      const name = String(from_name).trim();
      const email = String(from_email).trim();
      const msg = String(message).trim();

      if (name.length > 100) {
        return json({ error: "Name too long" }, 400);
      }
      if (msg.length > 5000) {
        return json({ error: "Message too long" }, 400);
      }
      if (email.length > 320) {
        return json({ error: "Invalid email" }, 400);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "Invalid email format" }, 400);
      }

      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeMsg = escapeHtml(msg);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "Portfolio Contact <onboarding@resend.dev>",
          reply_to: email,
          to: "nabinsharma816@gmail.com",
          subject: `New message from ${safeName}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${safeMsg}</p>
          `,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Resend API error:", res.status, errBody);
        return json({ error: "Failed to send email" }, 500);
      }

      return json({ success: true });
    } catch {
      return json({ error: "Invalid request" }, 400);
    }
  },
};
