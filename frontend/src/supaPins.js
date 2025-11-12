import {supabase} from "../supabaseClient.js"

function normDateTime(raw) {
  if (!raw) return null;

  const first = String(raw).split(" - ")[0].trim();

  if (/unknown time/i.test(first)) return null;

  //datetime-local (YYYY-MM-DDTHH:MM[:SS])
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(first)) {
    const d = new Date(first);
    if (!isNaN(d.getTime())) return d.toISOString();
    return null;
  }

  // "MM/DD/YYYY hh:mm AM/PM"
  const m = first.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i
  );
  if (m) {
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    const yyyy = Number(m[3]);
    let hour = 0;
    let minute = 0;

    if (m[4] && m[5] && m[6]) {
      hour = Number(m[4]);
      minute = Number(m[5]);
      const ampm = m[6];
      if (/AM/i.test(ampm)) { //first 12 hrs
        if (hour === 12) hour = 0;
      } else { //pm hrs
        if (hour !== 12) hour += 12;
      }
    }

    const d = new Date(yyyy, mm - 1, dd, hour, minute, 0, 0);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

export async function getUserID(){
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user?.id || null;
}

export async function insToSupa({form, m}){
    const uid = await getUserID();
    if (!uid){
        const err = new Error("Sign in or register order to create a pin!");
        err.code = "AUTH_REQUIRED";
        throw err;
    }
    const [lat, lng] = m.position;
    const supaRow = {title: form.title, category: form.category, lat: lat, long: lng,
                     user_id: uid, description: form.description, created_at: normDateTime(form.datetime)};
    const {data, error} = await supabase.from("example_pins").insert(supaRow).select("id, title, category, description, lat, long, created_at, user_id").single();
    if (error) throw error;
    return data
}

export async function delInSupa({id}){
    const {error} = await supabase.from("example_pins").delete().eq("id", id);
    if (error) throw error;
}

export async function editToSupa({id, form, m}){
    const [lat, lng] = m.position;
    const edit = {title: form.title, category: form.category, description: form.description, lat: lat, long: lng,};
    const {data, error} = await supabase.from("example_pins").update(edit).eq("id",id).select("id, title, category, description, lat, long, created_at, user_id").single();
    if (error) throw error;
    return data;
}