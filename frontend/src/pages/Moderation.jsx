import React, { useContext, useEffect, useState } from "react";
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
  }, [user?.id]);

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
        body="Checking permissions..."
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

  // placeholder data until wiring to real reports
  const pendingPins = [
    {
      id: "PIN-001",
      reportWeight: 12,
      name: "Dorm vandalism",
      description: "Multiple reports near Porter dorms.",
    },
    {
      id: "PIN-002",
      reportWeight: 9,
      name: "Bike theft spree",
      description: "Bikes targeted near Science Hill.",
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex justify-center bg-slate-50 px-6 py-8 overflow-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          Moderation Dashboard
        </h1>
        <p className="text-slate-600 mb-6">
          Pins that exceed the report threshold will populate the table below once the data feed is connected.
          Select the checkboxes to act on multiple pins at once.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-slate-800">
            <thead className="bg-slate-100">
              <tr>
                <th className="w-12 px-3 py-2">
                  <input type="checkbox" aria-label="Select all pins" />
                </th>
                <th className="px-3 py-2 text-left">Report Weight</th>
                <th className="px-3 py-2 text-left">Pin Name</th>
                <th className="px-3 py-2 text-left">Pin Description</th>
                <th className="px-3 py-2 text-left">Pin ID</th>
              </tr>
            </thead>
            <tbody>
              {pendingPins.map((pin) => (
                <tr key={pin.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select pin ${pin.id}`}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900">{pin.reportWeight}</td>
                  <td className="px-3 py-3">{pin.name}</td>
                  <td className="px-3 py-3 text-slate-600">{pin.description}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{pin.id}</td>
                </tr>
              ))}
              {!pendingPins.length && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                    No pins have crossed the report threshold yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
