import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../App";
import { supabase } from "../../supabaseClient";

function AccessPanel({ heading, body }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-50 px-6 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">{heading}</h1>
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
  const [selectedPins, setSelectedPins] = useState([]);
  const [deleteState, setDeleteState] = useState({
    inFlight: false,
    error: null,
  });
  const selectAllRef = useRef(null);

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
      setSelectedPins([]);
      return undefined;
    }

    const fetchPins = async () => {
      setPinsState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from("example_pins")
        .select("id, title, description, report_weight")
        .gte("report_weight", 10)
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
    const pins = pinsState.items;
    setSelectedPins((prev) =>
      prev.filter((id) => pins.some((pin) => pin.id === id))
    );
  }, [pinsState.items]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const pins = pinsState.items;
    selectAllRef.current.indeterminate =
      selectedPins.length > 0 && selectedPins.length < pins.length;
  }, [selectedPins, pinsState.items]);

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

  const togglePinSelection = (id) => {
    setSelectedPins((prev) =>
      prev.includes(id) ? prev.filter((pinId) => pinId !== id) : [...prev, id]
    );
  };

  const toggleAllPins = (checked) => {
    if (!checked) {
      setSelectedPins([]);
      return;
    }
    setSelectedPins(pins.map((pin) => pin.id));
  };

  const onDeleteSelected = () => {
    if (!selectedPins.length || deleteState.inFlight) return;
    (async () => {
      setDeleteState({ inFlight: true, error: null });
      const { error } = await supabase
        .from("example_pins")
        .delete()
        .in("id", selectedPins);

      if (error) {
        console.error("Failed to delete pins", error);
        setDeleteState({ inFlight: false, error });
        return;
      }

      setPinsState((prev) => ({
        ...prev,
        items: prev.items.filter((pin) => !selectedPins.includes(pin.id)),
      }));
      setSelectedPins([]);
      setDeleteState({ inFlight: false, error: null });
    })();
  };

  return (
    <div className="flex-1 min-h-0 flex justify-center bg-slate-50 px-6 py-8 overflow-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          Moderation Dashboard
        </h1>
        <p className="text-slate-600 mb-6">
          Pins that exceed the report threshold stream in from Supabase. Select any that require escalation or deletion.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-slate-800">
            <thead className="bg-slate-100">
              <tr>
                <th className="w-12 px-3 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all pins"
                    disabled={pinsLoading || pins.length === 0}
                    checked={
                      pins.length > 0 && selectedPins.length === pins.length
                    }
                    onChange={(e) => toggleAllPins(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                </th>
                <th className="px-3 py-2 text-left">Report Weight</th>
                <th className="px-3 py-2 text-left">Pin Name</th>
                <th className="px-3 py-2 text-left">Pin Description</th>
                <th className="px-3 py-2 text-left">Pin ID</th>
              </tr>
            </thead>
            <tbody>
              {pinsLoading && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                    Loading reported pins...
                  </td>
                </tr>
              )}
              {!pinsLoading && pinsError && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-red-500">
                    Unable to load pins. Please refresh and try again.
                  </td>
                </tr>
              )}
              {!pinsLoading && !pinsError && pins.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                    No pins have crossed the report threshold yet.
                  </td>
                </tr>
              )}
              {!pinsLoading &&
                !pinsError &&
                pins.map((pin) => (
                  <tr key={pin.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select pin ${pin.id}`}
                        checked={selectedPins.includes(pin.id)}
                        onChange={() => togglePinSelection(pin.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {pin.report_weight ?? pin.reportWeight ?? 0}
                    </td>
                    <td className="px-3 py-3">
                      {pin.title ?? pin.name ?? "Untitled pin"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {pin.description || "No description"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">
                      {pin.id}
                    </td>
                  </tr>
                ))}
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
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={!selectedPins.length || deleteState.inFlight}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 transition"
            >
              {deleteState.inFlight ? "Deleting…" : "Delete selected"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
