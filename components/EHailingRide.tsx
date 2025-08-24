import React from "react";
import RideIcon from "@mui/icons-material/LocalTaxi"; // E-hailing / taxi icon

type RideProps = {
  name?: string;
  duration?: string;
  cost?: string;
};

export default function EHailingRide({ name = "E-Hailing", duration, cost }: RideProps) {
  return (
    <div style={cardStyle}>
      <RideIcon style={{ fontSize: 40, color: "#FF9800" }} />
      <h3>{name}</h3>
      {duration && <p>Duration: {duration}</p>}
      {cost && <p>Cost: {cost}</p>}
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
//   width: "120px",
  margin: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};
