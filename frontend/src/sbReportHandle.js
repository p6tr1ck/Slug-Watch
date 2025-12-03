import { supabase } from "../supabaseClient";

export async function send_report_db(ticket) {
  const supaRow = {
    post_id: ticket.post_id,
    reporter_id: ticket.reporter_id,
    desc: ticket.desc,
    category: ticket.category,
    weight: ticket.weight,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(supaRow)
    .select("post_id, reporter_id, category, desc, weight")
    .single();

  if (error) {
    console.error("insert report error:", error);
    throw error;
  }

  const { error: updErr } = await supabase.rpc("increment_pin_weight", {
    p_post_id: ticket.post_id,
    p_amount: ticket.weight,
  });

  if (updErr) {
    console.error("increment_pin_weight error:", updErr);
    throw updErr;
  }

  return data;
}

export async function del_report({ ruid }) {
  const { data: report, error: grabErr } = await supabase.from("reports").select("report_uid, post_id, weight").eq("report_uid", ruid).single();

  if (grabErr) {
    console.error("grab report error:", grabErr);
    throw grabErr;
  }
  if (!report) throw new Error("report not found");

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("report_uid", ruid);

  if (error) {
    console.error("delete report error:", error);
    throw error;
  }

  const { error: updErr } = await supabase.rpc("increment_pin_weight", {
    p_post_id: report.post_id,
    p_amount: -report.weight,
  });

  if (updErr) {
    console.error("increment_pin_weight (decr) error:", updErr);
    throw updErr;
  }

  return { ok: true };
}

export async function sendAdminMsg({ user_id, pin_id, description }) {
  const row = {
    user_id,
    pin_id,
    description,
    is_read: false,
  };

  const { data, error } = await supabase.from("AdminMsg").insert(row).select("*").single();

  if (error) {
    console.error("insert AdminMsg error:", error);
    throw error;
  }

  return data;
}
