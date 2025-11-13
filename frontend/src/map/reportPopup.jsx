import { useEffect, useState } from "react";


export function ReportPost({pID,uID, onSub, onCancel}) {
    const reasons= ["Spam", "Misinformation", "Personal Info/DOXX", "Duplicate", "Other"];
    
    /* 
    2 personal info reports should trigger a review
    4 spam reports on the same id should trigger at least 1 of their posts to mod team
    3 misinformation on one should also sent to mod team
    4 duplicate reports should also
    2 other reports should trigger a manual review
    */


    const [form, setForm] = useState({ reason: reasons[0], details: "" });

    useEffect(() => {
        return () => setForm ({reason:reasons[0], details:""});

    }, [pID]);

    function submit(){
        const ticket = {pid:pID, reporter:uID, reason:form.reason, details:form.details.trim()};
        onSub?.(ticket);
        //send ticket to data base
    }

    function stop(e){
        e.stopPropagation();
    }

    return (
    <div className="w-72" onClick={stop} onMouseDown={stop}>
      <div className="mb-2">
        <h2 className="text-lg font-semibold">Report this pin</h2>
        <p className="text-xs text-gray-500">
          Choose a reason and add optional context.
        </p>
      </div>

      <label className="block text-sm font-medium">Reason</label>
      <select
        className="w-full border p-1 rounded mb-2"
        value={form.reason}
        onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
      >
        {reasons.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium">Details (optional)</label>
      <textarea
        className="w-full border p-1 rounded mb-3"
        rows={3}
        placeholder="Add context or links…"
        value={form.details}
        onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
      />

      <div className="flex items-center justify-between">
        <button className="px-2 py-1 rounded border" onClick={onCancel}>
          Back
        </button>
        <button
          className="px-2 py-1 rounded bg-rose-600 text-white"
          onClick={submit}
        >
          Submit report
        </button>
      </div>
    </div>
  );

}

