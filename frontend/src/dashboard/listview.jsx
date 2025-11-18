import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("police_logs")  // <-- change this
        .select("*");

      if (error) console.error(error);
      else setItems(data);

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <p className="p-4 text-xl">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Dashboard List View</h1>

      <div className="space-y-4">
        {items.length === 0 && <p>No items found.</p>}

        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl shadow bg-white border"
          >
            <h2 className="text-xl font-semibold">
              {item.title ?? "Untitled"}
            </h2>
            <p className="text-gray-600">
              {item.description ?? "No description available"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
