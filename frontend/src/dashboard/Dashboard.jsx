import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from("police_logs").select("*");

      if (error) console.error(error);
      else setItems(data);
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    console.log(items);
  }, [items]);

  if (loading) return <p className="p-4 text-xl">Loading...</p>;

  return (
    <div className="p-6 absolute top-28 -left-3 z-1000">
      <h1 className="text-3xl font-bold mb-4"></h1>
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography component="span">Dashboard List View</Typography>
        </AccordionSummary>
        {items.length === 0 && <p>No items found.</p>}
        {items.map((item) => (
          <AccordionDetails>
            <div
              key={item.id}
              className="p-4 rounded-2xl shadow bg-white border"
            >
              {item.crime ?? (
                <h2 className="text-xl font-semibold">{item.crime}</h2>
              )}
            </div>
          </AccordionDetails>
        ))}
      </Accordion>
    </div>
  );
}
