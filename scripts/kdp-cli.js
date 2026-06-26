#!/usr/bin/env node

const [, , command = "help", ...args] = process.argv;
const apiBase = process.env.KRAVIA_API_BASE_URL || "http://localhost:4000/api/v1";
const apiKey = process.env.KRAVIA_API_KEY;

const commands = {
  help() {
    print({
      name: "KRAVIA Developer Platform CLI",
      commands: ["login", "init", "agent:run", "deploy", "logs", "status", "plugins:list", "plugins:publish"],
      environment: ["KRAVIA_API_BASE_URL", "KRAVIA_API_KEY"]
    });
  },
  login() {
    print({ nextAction: "Create an API key in /developers/api-keys, then export KRAVIA_API_KEY. OAuth device login is architecture-ready." });
  },
  init() {
    print({ file: "kravia.config.json", apiVersion: "v1", gateway: `${apiBase}/gateway/v1`, nextAction: "Store this config in your project and run status." });
  },
  async status() {
    await gateway("GET", "/catalog");
  },
  async "agent:run"() {
    await gateway("POST", "/events", { event: "agent.lifecycle", source: "kdp-cli", args });
  },
  async deploy() {
    await gateway("POST", "/events", { event: "deployment.completed", source: "kdp-cli", args });
  },
  async logs() {
    await gateway("GET", "/catalog");
  },
  async "plugins:list"() {
    await gateway("GET", "/catalog");
  },
  async "plugins:publish"() {
    await gateway("POST", "/events", { event: "workspace.event", source: "kdp-cli", args });
  }
};

async function gateway(method, path, body) {
  if (!apiKey) throw new Error("KRAVIA_API_KEY is required.");
  const response = await fetch(`${apiBase}/gateway/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-kdp-api-key": apiKey },
    body: body ? JSON.stringify(body) : undefined
  });
  print(await response.json());
  if (!response.ok) process.exitCode = 1;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

Promise.resolve(commands[command]?.() || commands.help()).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
