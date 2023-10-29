import {
  Battery0Bar,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  Battery4Bar,
  Battery5Bar,
  Battery6Bar,
  BatteryFull,
  ExploreOutlined as CompassIcon,
  PlaceOutlined as PlaceIcon,
  SpeedOutlined as SpeedIcon
} from '@suid/icons-material';
import {Dynamic, Match, Switch} from "solid-js/web";
import {Box, Button, Card, Grid, Stack, Typography} from "@suid/material";
import {useParams} from "@solidjs/router";
import {graphql} from "~/gql";
import {createSubscription} from "@merged/solid-apollo";
import {createEffect, Show} from "solid-js";

const batteryStatus = [Battery0Bar, Battery1Bar, Battery2Bar, Battery3Bar, Battery4Bar, Battery5Bar, Battery6Bar, BatteryFull];

const statusQuery = graphql(`
    subscription DroneInfo($droneId: bigint!) {
        me: drones_by_pk(drone_id: $droneId) {
            telemetry: drone_telemetries(limit: 1, order_by: {timestamp: desc}) {
                altitude
                battery
                heading
                has_package
                latitude
                longitude
                stage_of_flight
                timestamp
                velocity
            }
            flights(limit: 1, order_by: {flight_id: desc}) {
                status
                order {
                    placed_at
                    vendor {
                        name
                    }
                }
            }
        }
    }
`)
// TODO: placed_at is currently unused

const LoadingElem = () => <span>Drone has not produced enough data</span>;
const CONCERNING_LAG = 5000;  // in ms


export default function DroneStatusCard() {
  const params = useParams();
  const droneInfo = createSubscription(statusQuery, {variables: {droneId: params.id}});
  const telemetry = () => droneInfo()?.me?.telemetry[0];
  const flight = () => droneInfo()?.me?.flights[0];
  const timeSinceUpdate = () => new Date().getTime() - telemetry()?.timestamp ?? 0;
  createEffect(() => console.log(droneInfo()));

  return (
    <Card variant="outlined" sx={{display: "inline-block", padding: 2}}>
      {/* IDE shows errors, but trust, my type guards are foolproof */}
      {/* TODO: is there an async way of doing this?*/}
      <Show
        when={telemetry() && flight()}
        fallback={LoadingElem()}
      >
        <Grid container spacing={2}>
          <Grid item>
            <Box sx={{textAlign: "center"}}>
              <img src="/drone.jpg" width="150px" />
            </Box>
            <p>
              <PlaceIcon sx={{ marginRight: '0.5em' }} />
              ({telemetry()!.latitude}, {telemetry()!.longitude})
            </p>
            <p>
              <CompassIcon sx={{ marginRight: '0.5em' }} />
              {telemetry()!.heading}
            </p>
            <p>
              <SpeedIcon sx={{ marginRight: '0.5em' }} />
              {telemetry()!.velocity} mph
            </p>
            <p>
              <Dynamic component={batteryStatus[Math.round(telemetry()!.battery / 100 * (batteryStatus.length - 1))]} sx={{ marginRight: '0.5em' }} />
              {telemetry()!.battery}%
            </p>
          </Grid>
          <Grid item container direction="column" width={500}>
            <Grid item sx={{flexGrow: 99, textAlign: "center"}}>
              <Typography sx={{ fontSize: '2em', fontWeight: 'bold' }}>Drone {params.id}</Typography>
              <Switch fallback={<Typography>✅ Operational</Typography>}>
                <Match when={timeSinceUpdate() > CONCERNING_LAG}>
                  <Typography>🚨 {Math.floor(timeSinceUpdate() / 1000)} seconds since last update</Typography>
                </Match>
                <Match when={telemetry()!.battery < 20}>
                  <Typography>⚠️ Low battery</Typography>
                </Match>
                <Match when={telemetry()!.stage_of_flight !== "idle" && flight()!.status === "failed"}>
                  <Typography>🚨 Crashed</Typography>
                </Match>
              </Switch>
              {/* TODO: intelligently report states such as: Delivering to ___/picking up from _____/parking at */}
              <Show when={telemetry()!.stage_of_flight === "in_flight"} fallback={<Typography>{telemetry()!.stage_of_flight}</Typography>}>
                <Typography>{telemetry()!.has_package ? "Delivering" : "Picking up"} from {flight()!.order!.vendor!.name}</Typography>
              </Show>
            </Grid>
            <Grid item>
              <Stack spacing={2} direction="row" justifyContent="right">
                <Button variant="outlined">View Camera</Button>
                <Button variant="outlined">New Flight</Button>
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Show>
    </Card>
  );
};

