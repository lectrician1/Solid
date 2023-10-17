import {Box} from "@suid/material";
import DroneStatusCard from "~/components/cards/DroneStatusCard";

export default function DroneStatus() {
  return (
      <Box justifyContent="center" width="100%" sx={{display: "flex"}}>
        <DroneStatusCard droneId={0} />
      </Box>
  );
};
