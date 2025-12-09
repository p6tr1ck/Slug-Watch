import { serve } from "https://deno.land/std/http/server.ts";
import webpush from "npm:web-push";

webpush.setVapidDetails(
  "mailto:admin@slugwatch.com",
  Deno.env.get("PUBLIC_VAPID_KEY"),
  Deno.env.get("PRIVATE_VAPID_KEY")
);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { subscription, title, body } = await req.json();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body })
    );

    return new Response("Notification sent!", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(err.message, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
