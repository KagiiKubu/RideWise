import { useEffect, useState } from "react";
import TrainIcon from "@mui/icons-material/Train";

type RideProps = {
  startAddress: string | null;
  endAddress: string | null;
};

export default function TrainRide({ startAddress, endAddress }: RideProps) {
  const [duration, setDuration] = useState<string | null>(null);
  const [cost, setCost] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startAddress || !endAddress) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {

        const truncateAddress = (addr: string) => {
  const parts = addr.split(",").map(p => p.trim());
  if (parts.length > 2) return parts.slice(0, 2).join(", "); // only first two segments
  return addr;
};

const startAddr = truncateAddress(startAddress);
const endAddr = truncateAddress(endAddress);

        const res = await fetch(
          `http://localhost:8000/nearest-stops/?start=${encodeURIComponent(startAddr)}&end=${encodeURIComponent(endAddr)}`
        );
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const data = await res.json();

        setDuration(data.duration || "N/A");
        setCost(data.cost || "N/A");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startAddress, endAddress]);

  return (
    <div style={cardStyle}>
      <TrainIcon style={{ fontSize: 40, color: "#1976D2" }} />
      <h3>Train</h3>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && (
        <>
          <p>Duration: {duration}</p>
          <p>Cost: {cost}</p>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  margin: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};
