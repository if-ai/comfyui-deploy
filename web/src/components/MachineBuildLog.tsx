"use client";

import type { LogsType } from "@/components/LogsViewer";
import { LogsViewer } from "@/components/LogsViewer";
import { getConnectionStatus } from "@/components/getConnectionStatus";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export function MachineBuildLog({
  machine_id,
  endpoint,
  instance_id,
}: {
  machine_id: string;
  endpoint: string;
  instance_id: string;
}) {
  const [logs, setLogs] = useState<LogsType>([]);
  const [finished, setFinished] = useState(false);
  const [status, setStatus] = useState<"failed" | "succuss">();

  const wsEndpoint = endpoint.replace(/^http/, "ws");
  const query = { fly_instance_id: instance_id };
  const { lastMessage, readyState } = useWebSocket(
    `${wsEndpoint}/ws/${machine_id}`,
    {
      shouldReconnect: () => !finished,
      reconnectAttempts: 20,
      reconnectInterval: 1000,
      queryParams: query,
    },
  );

  const connectionStatus = getConnectionStatus(readyState);

  useEffect(() => {
    if (!lastMessage?.data) return;

    const message = JSON.parse(lastMessage.data);

    console.log(message);

    if (message?.event === "LOGS") {
      setLogs((logs) => [...(logs ?? []), message.data]);
    } else if (message?.event === "FINISHED") {
      setFinished(true);
      setStatus(message.data.status);
    }
  }, [lastMessage]);

  const router = useRouter();

  return (
    <div>
      {connectionStatus}
      <LogsViewer logs={logs} hideTimestamp />

      <AlertDialog open={finished}>
        <AlertDialogContent>
          {status == "succuss" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Machine Built</AlertDialogTitle>
                <AlertDialogDescription>
                  Your machine is built, you can now integrate your API, or
                  directly run to check this machines.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => {
                    router.push("/workflows");
                  }}
                >
                  See Workflows
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => {
                    router.push("/machines");
                  }}
                >
                  See All Machines
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Machine Failed</AlertDialogTitle>
                <AlertDialogDescription>
                  Something went wrong with the machine build, please check the
                  log. Possible cause could be conflits with custom nodes, build
                  got stuck, timeout, or too many custom nodes installed. Please
                  attempt a rebuild or remove some of the custom nodes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>See logs</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    router.push("/machines");
                  }}
                >
                  Back to machines
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
