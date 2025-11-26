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
  const { selectDashboardItem, setSelectDashboardItem } =
    useContext(AuthContext);

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
    <div className="p-1 mt-8 ml-2 w-52 bg-blue-50 border border-blue-200 rounded-lg shadow">
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

        {items.map((item) => {
          // Check if this is the selected dashboard item
          const isSelected = selectDashboardItem === item.id;

          return (
            <AccordionDetails
              key={item.id}
              onClick={() => setSelectDashboardItem(item.id)}
              sx={{
                backgroundColor: isSelected ? "#1e40af" : "white",
                borderRadius: "1rem",
                mb: 1,
                cursor: "pointer",
                border: isSelected ? "2px solid #1e40af" : "1px solid #bfdbfe",
                transition: "0.2s ease",
              }}
            >
              <div className="p-2 rounded-lg">
                <h2
                  className={`text-sm font-semibold ${
                    isSelected ? "text-white" : "text-blue-700"
                  }`}
                >
                  {item.crime || "Unknown Crime"}
                </h2>

                {/* Date / Time */}
                <p
                  className={`text-xs mt-1 ${
                    isSelected ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(item.date).toLocaleDateString()} •{" "}
                  {new Date(item.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Location */}
                <a
                  href={`https://www.google.com/maps?q=${item.lat},${item.long}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()} // prevent accordion selection
                  className={`text-xs font-medium mt-2 ${
                    isSelected ? "text-blue-200" : "text-blue-600"
                  } underline cursor-pointer`}
                >
                  📍 Google Maps
                </a>
              </div>
            </AccordionDetails>
          );
        })}
      </Accordion>
    </div>
  );
}
