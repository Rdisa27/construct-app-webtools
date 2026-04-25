#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { HANDLERS } from "./handlers.js";
import { closeBrowser } from "./server-core.js";

const TOOLS: Tool[] = [
  { name: "navigate", description: "Navigate to a URL", inputSchema: { type: "object", properties: { url: { type: "string" }, waitUntil: { type: "string", enum: ["load","domcontentloaded","networkidle"] } }, required: ["url"] } },
  { name: "click", description: "Click an element", inputSchema: { type: "object", properties: { selector: { type: "string" }, waitForNavigation: { type: "boolean" } }, required: ["selector"] } },
  { name: "type", description: "Type text into input", inputSchema: { type: "object", properties: { selector: { type: "string" }, text: { type: "string" }, submit: { type: "boolean" } }, required: ["selector","text"] } },
  { name: "screenshot", description: "Take screenshot", inputSchema: { type: "object", properties: { fullPage: { type: "boolean" }, selector: { type: "string" } } } },
  { name: "extract_text", description: "Extract text", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "scroll", description: "Scroll page", inputSchema: { type: "object", properties: { direction: { type: "string", enum: ["up","down","left","right"] }, amount: { type: "number" } } } },
  { name: "wait", description: "Wait", inputSchema: { type: "object", properties: { ms: { type: "number" } } } },
  { name: "evaluate", description: "Run JS", inputSchema: { type: "object", properties: { script: { type: "string" } }, required: ["script"] } },
  { name: "get_title", description: "Get page title", inputSchema: { type: "object", properties: {} } },
  { name: "get_url", description: "Get current URL", inputSchema: { type: "object", properties: {} } },
  { name: "go_back", description: "Go back", inputSchema: { type: "object", properties: {} } },
  { name: "go_forward", description: "Go forward", inputSchema: { type: "object", properties: {} } },
  { name: "reload", description: "Reload page", inputSchema: { type: "object", properties: { waitUntil: { type: "string", enum: ["load","domcontentloaded","networkidle"] } } } },
  { name: "hover", description: "Hover element", inputSchema: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } },
  { name: "select", description: "Select dropdown option", inputSchema: { type: "object", properties: { selector: { type: "string" }, value: { type: "string" } }, required: ["selector","value"] } },
  { name: "press_key", description: "Press key", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "get_cookies", description: "Get cookies", inputSchema: { type: "object", properties: {} } },
  { name: "set_cookie", description: "Set cookie", inputSchema: { type: "object", properties: { name: { type: "string" }, value: { type: "string" }, domain: { type: "string" }, path: { type: "string" } }, required: ["name","value"] } },
  { name: "clear_cookies", description: "Clear cookies", inputSchema: { type: "object", properties: {} } },
  { name: "get_console_logs", description: "Get console logs", inputSchema: { type: "object", properties: { clear: { type: "boolean" } } } },
  { name: "get_network_requests", description: "Get network requests", inputSchema: { type: "object", properties: { clear: { type: "boolean" } } } },
  { name: "close_browser", description: "Close browser", inputSchema: { type: "object", properties: {} } },
  { name: "get_html", description: "Get HTML", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "get_links", description: "Get links", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "get_images", description: "Get images", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "get_forms", description: "Get forms", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "get_tables", description: "Get tables", inputSchema: { type: "object", properties: { selector: { type: "string" } } } },
  { name: "get_metadata", description: "Get metadata", inputSchema: { type: "object", properties: {} } },
];

async function main() {
  const server = new Server({ name: "webtools-browser", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = HANDLERS[name];
    if (!handler) throw new Error(`Unknown tool: ${name}`);
    return handler(args ?? {});
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.on("SIGINT", async () => { await closeBrowser(); await server.close(); process.exit(0); });
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
