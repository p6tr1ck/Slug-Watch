import React, { useEffect, useState, useContext } from "react";
import { supabase } from "../../supabaseClient";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AuthContext } from "../App";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectDashboardItem } = useContext(AuthContext);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from("police_logs").select("*");
      if (error) console.error(error);
      else setItems(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <p className="p-4 text-xl">Loading...</p>;

  return (
    <div className="p-1 mt-7 ml-2 w-52 bg-blue-50 border border-blue-200 rounded-lg shadow">
      <Accordion sx={{ borderRadius: "1rem", boxShadow: "none" }}>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon sx={{ color: "#2c3170" }} />}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={{
            backgroundColor: "#85c0ed",
            borderRadius: "1rem",
            padding: "8px 12px",
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#2c3170" }}>
            Police Logs
          </Typography>
        </AccordionSummary>

        {items.length === 0 && (
          <Typography sx={{ padding: "12px", color: "#666" }}>
            No items found.
          </Typography>
        )}

        {items.map((item) => (
          <AccordionDetails
            key={item.id}
            sx={{ backgroundColor: "white", borderRadius: "1rem", mb: 1 }}
            onClick={() => setSelectDashboardItem(item.id)}
          >
            <div className="p-2 rounded-lg border border-blue-200 shadow-sm bg-white">
              <h2 className="text-sm font-semibold text-blue-700">
                {item.crime || "Unknown Crime"}
              </h2>

              {/* Date / Time */}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.date).toLocaleDateString()} •{" "}
                {new Date(item.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Location */}
              <p className="text-xs text-blue-600 font-medium mt-2">
                📍 {item.lat}, {item.long}
              </p>
            </div>
          </AccordionDetails>
        ))}
      </Accordion>
    </div>
  );
}
