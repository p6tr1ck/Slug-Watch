import { supabase } from "./supabaseClient";

export async function send_report_db({post_id, reporter, form, weight}){
    //form should contain a title, brief description of what it is offending
    //the weight of the report (derive later), id of reporter and reported post
    //finish front end popup first
    const supaRow = {post_id: post_id, reporter_id: reporter, desc: form.desc, category: form.reason, weight:weight};

    const {data, error} = await supabase.from("reports").insert(supaRow).select("post_id, report_id, category, desc, weight").single();
    if (error) throw error;
    return data;
}

export async function del_report({ruid}){
    const { error } = await supabase.from("reports").delete().eq("report_uid", ruid);
    if (error) throw error;
    return {error};
}