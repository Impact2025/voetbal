#!/usr/bin/env node
import readline from "node:readline";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "PLAATS_HIER_JE_KEY";
if (!API_KEY || API_KEY.includes("PLAATS_HIER")) {
  console.error("? Zet eerst GEMINI_API_KEY als environment variable.");
  process.exit(1);
}

const MODELS = { fast: "gemini-1.5-flash-latest", pro: "gemini-1.5-pro-latest" };
let currentModel = MODELS.fast;

const genAI = new GoogleGenerativeAI(API_KEY);
let chat = genAI.getGenerativeModel({ model: currentModel }).startChat({ history: [], generationConfig: { temperature: 0.7 } });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
const helpText = 
Commands:
/help               Toon dit overzicht
/model fast|pro     Wissel model (flash snel, pro zorgvuldiger)
/reset              Nieuwe lege chat (context weg)
/save <file>        Sla transcript op als .txt
/exit               Afsluiten
;

let transcript = [];
console.log(Gemini CLI — Model: \nTyp /help voor opties.\n);
rl.prompt();

async function handlePrompt(text) {
  if (!text.trim()) return;
  if (text.startsWith("/")) {
    const [cmd, arg] = text.split(" ");
    switch (cmd) {
      case "/help":  console.log(helpText); break;
      case "/model":
        if (arg === "fast" || arg === "pro") {
          currentModel = MODELS[arg];
          chat = genAI.getGenerativeModel({ model: currentModel }).startChat({ history: [] });
          transcript.push(\n[system] model -> );
          console.log(? Model gewijzigd naar: );
        } else { console.log("Gebruik: /model fast | /model pro"); }
        break;
      case "/reset":
        chat = genAI.getGenerativeModel({ model: currentModel }).startChat({ history: [] });
        transcript.push("\n[system] reset context");
        console.log("? Nieuwe lege chat gestart.");
        break;
      case "/save": {
        const fs = await import("node:fs");
        const file = arg || gemini-transcript-\.txt;
        fs.writeFileSync(file, transcript.join("\n"), "utf8");
        console.log(?? Transcript opgeslagen: \);
        break;
      }
      case "/exit": rl.close(); return;
      default: console.log("Onbekend commando. Typ /help.");
    }
    return;
  }
  try {
    transcript.push(\n[user] );
    const res = await chat.sendMessage(text);
    const out = res.response.text();
    transcript.push([gemini] );
    console.log(out);
  } catch (err) {
    console.error("?? Fout:", err?.status, err?.statusText, err?.message || err);
  }
}

rl.on("line", async (line) => { await handlePrompt(line); rl.prompt(); })
  .on("close", () => { console.log("?? Tot later!"); process.exit(0); });
