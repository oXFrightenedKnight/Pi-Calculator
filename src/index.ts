import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { spawn } from "child_process";
import os from "os";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

let doomProcess: import("child_process").ChildProcess | null = null;
let doomRunning = false;
app.post("/api/doom", (c) => {
  if (os.platform() === "linux" && !doomRunning) {
    doomProcess = spawn("doom", ["-fullscreen", "-nomouse", "-warp", "1", "1"], {
      env: {
        ...process.env, // send all important variables to the process
        DISPLAY: ":0", // full screen
        XAUTHORITY: "/home/pi/.Xauthority", // tell x that this process is authorized to be drawn on the screen
      },
      detached: true, // doom will not be attached to node as its parent and become autonomus
      stdio: "ignore", // don't log and spam in stdout, stderr
    });

    doomProcess.on("exit", () => {
      ((doomRunning = false), (doomProcess = null), console.log("Exited Doom"));
    });
  }
  return new Response("ok");
});

app.post("/api/shutdown", (c) => {
  if (os.platform() === "linux") {
    spawn("shutdown", ["-h", "now"], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
  return new Response("ok");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
