import React from "react";
import BusIcon from "@mui/icons-material/DirectionsBus"; // Bus icon

type RideProps = {
  name?: string;
  duration?: string;
  cost?: string;
};

export default function MyCitiBusRide({ name = "MyCiTi Bus", duration, cost }: RideProps) {
  return (
    <div style={cardStyle}>
      <BusIcon style={{ fontSize: 40, color: "#4CAF50" }} />
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
