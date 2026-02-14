import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { spawn } from "child_process";
import os from "os";

type RedditPost = {
  id: string;
  title: string;
  author: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  thumbnail: string;
  is_self: boolean;
  over_18: boolean;
};

type RedditListingChild = {
  kind: "t3";
  data: RedditPost;
};

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));
app.use("/reddit", serveStatic({ path: "./public/reddit/index.html" }));
app.use("/reddit/:subname", serveStatic({ path: "./public/reddit/subreddit/index.html" }));

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

app.get("/api/reddit/:subname", async (c) => {
  const subname = c.req.param("subname");
  const after = c.req.query("after");

  const url = new URL(`https://www.reddit.com/r/${subname}/hot.json`);
  url.searchParams.set("limit", "5");
  if (after) url.searchParams.set("after", after);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "pi-reddit/1.0",
      },
    });
    console.log("res", res);
    if (!res.ok) {
      return c.json({ posts: [], after: null });
    }

    const data = await res.json();

    return c.json({
      posts: data.data.children.map((c: RedditListingChild) => c.data),
      after: data.data.after,
    });
  } catch {
    return c.json({ posts: [], after: null });
  }
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
