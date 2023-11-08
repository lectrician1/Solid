import {Typography} from "@suid/material";
import {Match, Switch} from "solid-js/web";
import {graphql} from "~/gql";
import {createSubscription} from "@merged/solid-apollo";
import {createEffect, ErrorBoundary, type JSX, Show, Suspense} from "solid-js";

const warningsQuery = graphql(`
    subscription DroneWarnings($droneId: bigint!) {
        me: drones_by_pk(drone_id: $droneId) {
            telemetry: drone_telemetries(limit: 1, order_by: {timestamp: desc}) {
                battery
                stage_of_flight
                timestamp
            }
            flights(limit: 1, order_by: {flight_id: desc}) {
                status
            }
        }
    }
`)

const CONCERNING_LAG = 5000;  // in ms

export default function DroneWarnings(props: {id: number | string, ok?: JSX.Element}) {
  const droneWarnings = createSubscription(warningsQuery, {variables: {droneId: props.id}});
  const telemetry = () => droneWarnings()?.me?.telemetry[0];
  const flight = () => droneWarnings()?.me?.flights[0];
  const timeSinceUpdate = () => new Date().getTime() - telemetry()?.timestamp ?? 0;

  createEffect(() => {
    console.log("warnings", droneWarnings());
  })

  return (
    <ErrorBoundary fallback={<p>There's been an error :C</p>}>
    <Suspense fallback={<p>Suspense waiting</p>}>
      <Show
        when={telemetry() && flight()}
        fallback={<p>Show waiting...</p>}
      >
        <Switch fallback={props.ok}>
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
      </Show>
    </Suspense>
    </ErrorBoundary>
  );
}
