// import TrainIcon from '@mui/icons-material/Train';
// import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
// import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

// type RideOptionsProps = {
//   distanceText: string; // optional, could be distance from directions
//   durationText: string; // optional, duration from directions
// };

// export default function RideOptions({ distanceText, durationText }: RideOptionsProps) {
//   const rides = [
//     { name: "Train", icon: <TrainIcon style={{ color: "#1976D2" }} />, details: `${distanceText} • ${durationText}` },
//     { name: "E-hailing", icon: <DirectionsCarIcon style={{ color: "#388E3C" }} />, details: `${distanceText} • ${durationText}` },
//     { name: "MyCiti Bus", icon: <DirectionsBusIcon style={{ color: "#FBC02D" }} />, details: `${distanceText} • ${durationText}` },
//   ];

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
//       {rides.map((ride) => (
//         <div key={ride.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", border: "1px solid #ccc", borderRadius: "8px" }}>
//           {ride.icon}
//           <div>
//             <strong>{ride.name}</strong>
//             <div style={{ fontSize: "0.85rem", color: "#555" }}>{ride.details}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
