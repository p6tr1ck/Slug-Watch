import { supabase } from "../supabaseClient.js";
import isInBounds from "./map/boundsCheck.js";

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
      if (/AM/i.test(ampm)) {
        //first 12 hrs
        if (hour === 12) hour = 0;
      } else {
        //pm hrs
        if (hour !== 12) hour += 12;
      }
    }

    const d = new Date(yyyy, mm - 1, dd, hour, minute, 0, 0);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

export async function getUserID() {
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
  // Only include created_at when we can parse a valid datetime; otherwise let DB apply its default
  const created = normDateTime(form.datetime);
  const supaRow = {
    title: form.title,
    category: form.category,
    lat: lat,
    long: lng,
    user_id: uid,
    description: form.description,
    location: form.address || null,
    ...(created ? { created_at: created } : {}),
  };
    const {data, error} = await supabase.from("example_pins").insert(supaRow).select("id, title, category, description, lat, long, created_at, user_id").single();
    if (error) throw error;
    return data
}

export async function delInSupa({id}){
    // Attempt to delete the pin directly.
    // If your DB has ON DELETE CASCADE on FK constraints, dependent rows are removed automatically.
    // If not, you'll get a foreign key constraint error (see migration file for fix).
    const del = await supabase.from("example_pins").delete().eq("id", id);
    if (del.error) {
      // If it's a foreign key constraint, try to gather more info for actionable error message.
      const err = del.error;
      if (err.code === "23503" || /foreign key|violat/i.test(err.message || "")) {
        // try to fetch notifications referencing this pin (may succeed even if delete is blocked)
        let noteCount = null;
        try {
          const notes = await supabase.from("notifications").select("id").eq("pin_id", id).limit(100);
          if (!notes.error && Array.isArray(notes.data)) noteCount = notes.data.length;
        } catch (e) {
          // ignore
        }

        const message = `Unable to delete pin ${id} because dependent rows exist (foreign key constraint). ` +
          (noteCount == null ? "There may be related notifications or other dependent rows." : `Found ${noteCount} notification(s) referencing this pin.`) +
          " To fix: run the SQL migration in migrations/add_cascade_delete.sql to add ON DELETE CASCADE.";

        const out = new Error(message);
        out.code = err.code || "FK_CONSTRAINT";
        throw out;
      }

      throw del.error;
    }
}

export async function editToSupa({id, form, m}){
    const [lat, lng] = m.position;
    const edit = {
      title: form.title, 
      category: form.category, 
      description: form.description, 
      lat: lat, 
      long: lng,
      location: form.address || m.address || null,
    };
    
    console.log("editToSupa called with:", { id, form, edit, m });
    
    if (!id) {
        const err = new Error("Missing pin id for update");
        err.code = "MISSING_ID";
        throw err;
    }

    // fetch existing row to give clearer errors and check ownership
    const { data: existing, error: fetchErr } = await supabase
      .from("example_pins")
      .select("id, user_id, created_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      const err = new Error("Pin not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    // ensure the current user is the owner
    const uid = await getUserID();
    if (!uid) {
      const err = new Error("Not authenticated");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    if (existing.user_id !== uid) {
      const err = new Error(`You are not authorized to edit this pin (owner=${existing.user_id} current=${uid})`);
      err.code = "AUTH_DENIED";
      throw err;
    }

    // Perform the update - if no error, assume success (RLS blocks count/select)
    console.log("Sending update to Supabase:", { id, edit });
    
    const { error: updateErr } = await supabase
      .from("example_pins")
      .update(edit)
      .eq("id", id);

    if (updateErr) {
      console.error("Update failed with error:", updateErr);
      const err = new Error(`Failed updating pin id=${id}: ${updateErr.message || updateErr}`);
      err.code = updateErr.code || "UPDATE_ERROR";
      throw err;
    }

    console.log(`Update sent for pin ${id} - no errors returned`);
    
    // Verify the update by fetching the row again
    const { data: verifyData, error: verifyErr } = await supabase
      .from("example_pins")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!verifyErr && verifyData) {
      console.log("Verified data after update:", verifyData);
    } else {
      console.warn("Could not verify update:", verifyErr);
    }

    // Return the updated data (we already verified ownership and have the values)
    return {
      id,
      user_id: existing.user_id,
      created_at: existing.created_at || new Date().toISOString(),
      ...edit,
    };
}
