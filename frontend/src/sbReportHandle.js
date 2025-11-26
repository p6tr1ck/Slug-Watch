import { supabase } from "../supabaseClient";

export async function send_report_db(ticket){
    const supaRow = {post_id: ticket.post_id, reporter_id: ticket.reporter_id, desc: ticket.desc, category: ticket.category, weight:ticket.weight};
    const {data, error} = await supabase.from("reports").insert(supaRow).select("post_id, reporter_id, category, desc, weight").single();
    if (error) throw error;
    const { error: updErr } = await supabase
    .rpc("increment_pin_weight", { 
      p_post_id: ticket.post_id, 
      p_amount: ticket.weight 
    });

    if (updErr) throw updErr;
    return data;
}

export async function del_report({ruid}){
    const { data: report, error: grabErr } = await supabase
    .from("reports")
    .select("report_uid, post_id, weight")
    .eq("report_uid", ruid)
    .single();
    if (grabErr) throw grabErr;
    if (!report) throw new Error("report not found");

    const { error } = await supabase.from("reports").delete().eq("report_uid", ruid);
    if (error) throw error;

    const {error: updErr} = await supabase.rpc("increment_pin_weight", {
        p_post_id: report.post_id,
        p_amount: -report.weight
    });

    if (updErr) throw updErr;
    return {error};
}