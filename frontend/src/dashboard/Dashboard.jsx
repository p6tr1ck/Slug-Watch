import React, { useEffect, useState, useContext } from "react";
import { supabase } from "../../supabaseClient";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AuthContext, DarkModeSwitch } from "../App";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectDashboardItem, setSelectDashboardItem } =
    useContext(AuthContext);
  const { theme } = useContext(DarkModeSwitch);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("police_logs")
        .select("*")
        .limit(25);
      if (error) {
        console.error(error);
      } else {
        // Sort by most recent date (descending)
        const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setItems(sorted);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <p className="p-4 text-xl">Loading...</p>;

  const handleClick = (id) => {
    if (selectDashboardItem) {
      setSelectDashboardItem(null);
      return;
    }
    setSelectDashboardItem(id);
  };

  return (
    <div
      className={`p-1 ml-2 w-54 ${
        theme === "light" ? "bg-blue-50" : "bg-blue-950"
      }
      border border-blue-200 rounded-xl shadow z-[1000] max-h-[87vh] overflow-y-auto absolute top-3 left-12`}
    >
      <Accordion
        sx={{
          borderRadius: "1rem",
          boxShadow: "none",
          bgcolor: theme === "light" ? "white" : "black",
        }}
      >
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon sx={{ color: "#2c3170" }} />}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={{
            backgroundColor: "#85c0ed",
            borderRadius: "1rem",
            padding: "0 8px",
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
              sx={{
                backgroundColor: isSelected ? "#1e40af" : "white",
                borderRadius: "1rem",
                mb: 1,
                cursor: "pointer",
                border: isSelected ? "2px solid #1e40af" : "1px solid #bfdbfe",
                transition: "0.2s ease",
              }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(item.id);
                  // setSelectDashboardItem(item.id);
                }}
                className="p-2 rounded-lg"
              >
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
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs font-medium mt-2 ${
                    isSelected ? "text-blue-200" : "text-blue-600"
                  }  cursor-pointer`}
                >
                  📍 Directions
                </a>
              </div>
            </AccordionDetails>
          );
        })}
      </Accordion>
    </div>
  );
}
