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
    <div className="p-4 mt-10 ml-4 w-72 bg-blue-50 border border-blue-200 rounded-2xl shadow-md">
      <Accordion sx={{ borderRadius: "1rem", boxShadow: "none" }}>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon sx={{ color: "#2c3170" }} />}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={{
            backgroundColor: "#85c0ed",
            borderRadius: "1rem",
            padding: "12px 16px",
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
            <div className="p-3 rounded-xl border border-blue-200 shadow-sm bg-white">
              <h2 className="text-lg font-semibold text-blue-700">
                {item.crime || "Unknown Crime"}
              </h2>
            </div>
          </AccordionDetails>
        ))}
      </Accordion>
    </div>
  );
}
