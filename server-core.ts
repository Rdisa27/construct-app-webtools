#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { chromium, Browser, Page, BrowserContext } from "playwright";

let browser: Browser | null = null, context: BrowserContext | null = null, page: Page | null = null;
let consoleLogs: any[] = [], networkRequests: any[] = [];

async function getPage(): Promise<Page> {
  if (!page) throw new Error("No page open. Call navigate first.");
  return page;
}

async function ensureBrowser(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" });
    page = await context.newPage();
    page.on("console", (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    page.on("request", (req) => networkRequests.push({ url: req.url(), method: req.method() }));
    page.on("response", (res) => { const last = networkRequests[networkRequests.length - 1]; if (last && last.url === res.url()) last.status = res.status(); });
  }
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) { await browser.close(); browser = null; context = null; page = null; consoleLogs = []; networkRequests = []; }
}

export { browser, context, page, consoleLogs, networkRequests, getPage, ensureBrowser };
