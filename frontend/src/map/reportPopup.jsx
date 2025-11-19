import { useEffect, useState } from "react";


function parseThruDesc(w,details){
    //pick up key words in description, add point values based on input\
    let ne_w = w;
    const deets = details.toLowerCase();
    const rules = [
        {keyword: ["last name", "address", "phone number", "photos", "name"], weight:3},//doxx,
        {keyword: ["stalking", "stalk", "threat", "threats", "violence", "hurt", "death", "damage"], weight:5},//harrasment
        {keyword: ["link to", "link", "links", "giveaway", "plug", "plugging", "ad", "advertisement", "promo"], weight:3},//spam
        {keyword: ["no report", "fake", "false", "misleading", "mislead", "misinterpret", "wording"], weight:4}, //misinfo
        {keyword: ["copy", "imitate","imitation", "verified"], weight:2}//duplicate
    ];

    for (const rule of rules){
        for (const key of rule.keyword){
            if (deets.includes(key)) {
                ne_w += rule.weight;
                break; //one per rule
                }
            }
        }
        return ne_w;
}

export function ReportPost({pID,uID, onSub, onCancel}) {
    const reasons= ["Spam", "Misinformation", "Personal Info/DOXX", "Duplicate", "Other"];
    
    /* 
    30 points to trigger review (appending to mod report list for review): 
    2 personal info reports should trigger a review (a= 15)
    4 spam reports on the same id should trigger (b=9)
    3 misinformation on one should also sent to mod team(c=10)
    4 duplicate reports should also(d=9)
    5 (at least) other reports should trigger a manual review(e=8)
    if one of each, still exceeds report thresh (49), at least 4 should make it appear
    */


    const [form, setForm] = useState({ reason: reasons[0], details: "" });
    useEffect(() => {
        return () => setForm ({reason:reasons[0], details:""});
    }, [pID]);


    function submit(){
        let w = 0;
        switch (form.reason){
            case "Spam":
                w=9; //baselines
                break;
            case "Misinformation":
                w=10;
                break;
            case "Personal Info/DOXX":
                w=15
                break;
            case "Duplicate":
                w=10;
                break;
            case "Other":
                w=8; //should increase on parse of details
                break;
        }

        w = parseThruDesc(w, form.details.trim());

        const ticket = {post_id:pID, reporter_id:uID, category:form.reason, desc:form.details.trim(), weight: w};
        onSub?.(ticket);
    }

    function stop(e){
        e.stopPropagation();
    }

    return (
    <div
      className="min-w-[240px] max-w-[320px] bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden" onClick={stop} onMouseDown={stop}
    >
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-base font-semibold text-slate-900 leading-tight">
          Report this pin
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Choose a reason and add optional context.
        </p>
      </div>
      <div className="h-px bg-slate-200" />
      <div className="px-3 py-3 space-y-3 text-[15px] text-slate-700">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-900">
            Reason
          </label>
          <select
            className="w-full border rounded px-2 py-1.5 text-sm"
            value={form.reason}
            onChange={(e) =>
              setForm((s) => ({ ...s, reason: e.target.value }))
            }
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-900">
            Details (optional)
          </label>
          <textarea
            className="w-full border rounded px-2 py-1.5 text-sm"
            rows={3}
            placeholder="Add context or links…"
            value={form.details}
            onChange={(e) =>
              setForm((s) => ({ ...s, details: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Footer actions (copied spacing from MakeMarker footer) */}
      <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
        <button
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
          onClick={onCancel}
        >
          Back
        </button>
        <button
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700"
          onClick={submit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

