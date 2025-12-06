import React, { useContext, useEffect, useState } from "react";
import { AuthContext, DarkModeSwitch } from "../App";
import { supabase } from "../../supabaseClient";
import { del_report } from "../sbReportHandle";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

function AccessPanel({ heading, body }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-50 px-6 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          {heading}
        </h1>
        <p className="text-slate-600">{body}</p>
      </div>
    </div>
  );
}

function coerceBooleanFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "y" ||
      normalized === "t"
    );
  }
  return false;
}

export default function Moderation() {
  const { session } = useContext(AuthContext);
  const { theme } = useContext(DarkModeSwitch);
  const user = session?.user ?? null;

  const [permissionState, setPermissionState] = useState({
    checking: Boolean(user),
    allowed: false,
    error: null,
  });

  const [pinsState, setPinsState] = useState({
    loading: true,
    error: null,
    items: [],
  });

  const [deleteState, setDeleteState] = useState({
    inFlight: false,
    error: null,
  });

  const [pendingDel, setPendingDel] = useState(null);

  const [activeTab, setActiveTab] = useState("pins");

  const [reportState, setReportState] = useState({
    loading: true,
    error: null,
    items: [],
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modReason, setModReason] = useState("");

  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setPermissionState({ checking: false, allowed: false, error: null });
      return undefined;
    }

    const verifyAdmin = async () => {
      setPermissionState((prev) => ({ ...prev, checking: true, error: null }));

      const { data, error } = await supabase
        .from("users")
        .select("admin")
        .eq("email", user.email)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Failed to verify admin status", error);
        setPermissionState({ checking: false, allowed: false, error });
        return;
      }

      setPermissionState({
        checking: false,
        allowed: coerceBooleanFlag(data?.admin),
        error: null,
      });
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  useEffect(() => {
    let isMounted = true;

    if (!permissionState.allowed) {
      setPinsState({ loading: false, error: null, items: [] });
      return undefined;
    }

    const fetchPins = async () => {
      setPinsState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from("example_pins")
        .select("id, title, description, report_weight, user_id")
        .gte("report_weight", 30)
        .order("report_weight", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load reported pins", error);
        setPinsState({ loading: false, error, items: [] });
        return;
      }

      setPinsState({
        loading: false,
        error: null,
        items: data ?? [],
      });
    };

    fetchPins();

    return () => {
      isMounted = false;
    };
  }, [permissionState.allowed]);

  useEffect(() => {
    let isMounted = true;

    if (!permissionState.allowed) {
      setReportState({ loading: false, error: null, items: [] });
      return undefined;
    }

    const fetchReport = async () => {
      setReportState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase
          .from("reports")
          .select("report_uid, post_id, reporter_id, category, desc, weight")
          .order("weight", { ascending: false });

        if (!isMounted) return;

        if (error) {
          setReportState({ loading: false, error, items: [] });
          return;
        }

        setReportState({
          loading: false,
          error: null,
          items: data ?? [],
        });
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error fetching reports", err);
        setReportState({ loading: false, error: err, items: [] });
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [permissionState.allowed]);

  useEffect(() => {
    let isMounted = true;

    if (!permissionState.allowed) {
      setVoteCounts({});
      return undefined;
    }

    const pinIds = pinsState.items.map((p) => p.id);
    if (pinIds.length === 0) {
      setVoteCounts({});
      return undefined;
    }

    const fetchVotes = async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("pin_id, value")
        .in("pin_id", pinIds);

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load vote counts", error);
        setVoteCounts({});
        return;
      }

      const counts = {};
      for (const row of data || []) {
        if (!counts[row.pin_id]) counts[row.pin_id] = { up: 0, down: 0 };
        if (row.value === 1) counts[row.pin_id].up += 1;
        else if (row.value === -1) counts[row.pin_id].down += 1;
      }
      setVoteCounts(counts);
    };

    fetchVotes();

    return () => {
      isMounted = false;
    };
  }, [permissionState.allowed, pinsState.items]);

  const handleConfirmDel = async () => {
    if (!pendingDel || deleteState.inFlight) return;

    setDeleteState({ inFlight: true, error: null });
    console.log("Moderator reason for deletion:", modReason);

    try {
      const pin = pendingDel;

      if (modReason.trim() && pin.user_id) {
        const { error: msgErr } = await supabase.from("AdminMsg").insert({
          user_id: pin.user_id,
          pin_id: pin.id,
          description: modReason.trim(),
          is_read: false,
        });

        if (msgErr) {
          console.error("Failed to insert AdminMsg:", msgErr);
        }
      }

      const { error: reportsErr } = await supabase
        .from("reports")
        .delete()
        .eq("post_id", pin.id);

      if (reportsErr) {
        console.error("Failed to delete related reports", reportsErr);
        setDeleteState({ inFlight: false, error: reportsErr });
        return;
      }

      const { error: pinsErr } = await supabase
        .from("example_pins")
        .delete()
        .eq("id", pin.id);

      if (pinsErr) {
        console.error("Failed to delete pins", pinsErr);
        setDeleteState({ inFlight: false, error: pinsErr });
        return;
      }

      setPinsState((prev) => ({
        ...prev,
        items: prev.items.filter((p) => p.id !== pin.id),
      }));

      setReportState((prev) => ({
        ...prev,
        items: prev.items.filter((r) => r.post_id !== pin.id),
      }));

      setPendingDel(null);
      setModReason("");
      setConfirmOpen(false);
      setDeleteState({ inFlight: false, error: null });
    } catch (err) {
      console.error("Unexpected error deleting pins + reports", err);
      setDeleteState({ inFlight: false, error: err });
    }
  };

  const openDelDia = (pin) => {
    if (deleteState.inFlight) return;
    setPendingDel(pin);
    setModReason("");
    setConfirmOpen(true);
  };

  if (!user) {
    return (
      <AccessPanel
        heading="Sign in required"
        body="You must be signed in to review reported pins."
      />
    );
  }

  if (permissionState.checking) {
    return (
      <AccessPanel
        heading="Checking permissions"
        body="Hang tight while we confirm your admin access."
      />
    );
  }

  if (permissionState.error) {
    return (
      <AccessPanel
        heading="Permission check failed"
        body={
          permissionState.error.message ??
          "We couldn't confirm your admin status. Please retry or contact an administrator."
        }
      />
    );
  }

  if (!permissionState.allowed) {
    return (
      <AccessPanel
        heading="Insufficient permissions"
        body="Only admins (users.admin = true) can access moderation tools."
      />
    );
  }

  const pins = pinsState.items;
  const pinsLoading = pinsState.loading;
  const pinsError = pinsState.error;

  const reports = reportState.items;
  const reportLoading = reportState.loading;
  const reportErr = reportState.error;

  async function handleDelReport(report_uid) {
    try {
      await del_report({ ruid: report_uid });
      setReportState((prev) => ({
        ...prev,
        items: prev.items.filter((r) => r.report_uid !== report_uid),
      }));
    } catch (err) {
      console.log("error deleting report: ", err);
    }
  }

  return (
    <div
      className={`flex-1 min-h-0 flex justify-center px-6 py-8 overflow-auto ${
        theme === "light" ? "bg-white" : "bg-zinc-800"
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg ${
          theme === "light" ? "text-gray-900" : "text-gray-200"
        } ${theme === "light" ? "bg-white" : "bg-zinc-900"} ${
          theme === "light" ? "border-white" : "border-zinc-800"
        }`}
      >
        <h1
          className={`text-2xl font-semibold mb-3 ${
            theme === "light" ? "text-gray-900" : "text-gray-200"
          }`}
        >
          Moderation Dashboard
        </h1>
        <p
          className={`mb-6${
            theme === "light" ? "text-gray-900" : "text-gray-200"
          }`}
        >
          Pins that exceed the report threshold stream in from Supabase. Select
          any that require escalation or deletion.
        </p>

        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("pins")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "pins"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Reported Pins
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "reports"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            } ${theme === "light" ? "border-slate-200" : "border-zinc-800"}`}
          >
            Report Log
          </button>
        </div>

        {activeTab === "pins" && (
          <>
            <div
              className={`overflow-x-auto rounded-xl border ${
                theme === "light" ? "border-slate-200" : "border-zinc-800"
              }`}
            >
              <table className="min-w-full text-sm">
                <thead
                  className={`${
                    theme === "light" ? "bg-slate-100" : "bg-neutral-800"
                  }`}
                >
                  <tr>
                    <th className="px-3 py-2 text-left">Report weight</th>
                    <th className="px-3 py-2 text-left">Likes</th>
                    <th className="px-3 py-2 text-left">Dislikes</th>
                    <th className="px-3 py-2 text-left">Pin name</th>
                    <th className="px-3 py-2 text-left">Pin description</th>
                    <th className="px-3 py-2 text-left">Pin ID</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pinsLoading && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Loading reported pins...
                      </td>
                    </tr>
                  )}
                  {!pinsLoading && pinsError && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-3 py-6 text-center text-red-500"
                      >
                        Unable to load pins. Please refresh and try again.
                      </td>
                    </tr>
                  )}
                  {!pinsLoading && !pinsError && pins.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className={`px-3 py-6 text-center ${
                          theme === "light" ? "text-slate-500" : "text-white"
                        }`}
                      >
                        No pins have crossed the report threshold yet.
                      </td>
                    </tr>
                  )}
                  {!pinsLoading &&
                    !pinsError &&
                    pins.map((pin) => {
                      const vc = voteCounts[pin.id] || { up: 0, down: 0 };
                      return (
                        <tr key={pin.id} className="border-t border-slate-100">
                          <td
                            className={`px-3 py-3 font-semibold ${
                              theme === "light"
                                ? "text-slate-900"
                                : "text-slate-200"
                            }`}
                          >
                            {pin.report_weight ?? pin.reportWeight ?? 0}
                          </td>
                          <td className="px-3 py-3">{vc.up}</td>
                          <td className="px-3 py-3">{vc.down}</td>
                          <td className="px-3 py-3">
                            {pin.title ?? pin.name ?? "Untitled pin"}
                          </td>
                          <td
                            className={`px-3 py-3 ${
                              theme === "light"
                                ? "text-slate-600"
                                : "text-slate-200"
                            }`}
                          >
                            {pin.description || "No description"}
                          </td>
                          <td
                            className={`px-3 py-3 font-mono text-xs ${
                              theme === "light"
                                ? "text-slate-500"
                                : "text-slate-200"
                            }`}
                          >
                            {pin.id}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openDelDia(pin)}
                              className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition font-semibold text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right">
                {deleteState.error && (
                  <div className="text-red-500 text-sm mb-2">
                    Failed to delete pins. Please try again.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "reports" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[450px] overflow-auto">
            <table className="min-w-full text-sm text-slate-800">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Pin ID</th>
                  <th className="px-3 py-2 text-left">Reporter</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Weight</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportLoading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Loading log...
                    </td>
                  </tr>
                )}
                {!reportLoading && reportErr && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-6 text-center text-red-500"
                    >
                      Unable to load reports. Please refresh and try again.
                    </td>
                  </tr>
                )}
                {!reportLoading && !reportErr && reports.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className={`px-3 py-6 text-center text-slate-500 ${
                        theme === "light" ? "text-slate-500" : "text-white"
                      }`}
                    >
                      No reports have been submitted yet.
                    </td>
                  </tr>
                )}
                {!reportLoading &&
                  !reportErr &&
                  reports.map((r) => (
                    <tr
                      key={
                        r.report_uid ??
                        `${r.post_id}-${r.reporter_id}-${r.weight}`
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {r.post_id ?? 0}
                      </td>
                      <td className="px-3 py-3">{r.reporter_id}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">
                        {r.category}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">
                        {r.weight}
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-xs">
                        {r.desc || "No details"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleDelReport(r.report_uid)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition font-semibold text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!deleteState.inFlight) setConfirmOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete This Pin?</DialogTitle>
        <DialogContent dividers>
          <p className="mb-3 text sm text-slate-600">
            This pin and its related reports will be removed permanently. Please
            provide a reason for the user.
          </p>
          <TextField
            label="Reason For Removal"
            placeholder="Explain briefly why..."
            value={modReason}
            onChange={(e) => setModReason(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            disabled={deleteState.inFlight}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={deleteState.inFlight}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDel}
            disabled={deleteState.inFlight}
          >
            {deleteState.inFlight ? "Deleting…" : "Delete Pin"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
