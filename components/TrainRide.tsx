import React from "react";
import TrainIcon from "@mui/icons-material/Train"; // Material UI icon

type RideProps = {
  name?: string;
  duration?: string;
  cost?: string;
};

export default function TrainRide({ name = "Train", duration, cost }: RideProps) {
  return (
    <div style={cardStyle}>
      <TrainIcon style={{ fontSize: 40, color: "#1976D2" }} />
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
