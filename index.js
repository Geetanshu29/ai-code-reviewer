import fs from "fs";
import readline from "readline";
import { program } from "commander";
import { callAI } from "./openrouter.js";
import { getAllFiles } from "./fileScanner.js";
import { showDiff } from "./diffViewer.js";

// ================= CLI =================
program
  .option("--path <path>", "file or folder path", "./test") // default test folder
  .option("--fix", "apply fixes")
  .option("--dry", "dry run");

program.parse();
const options = program.opts();

// ================= INPUT =================
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// ================= SAFE JSON =================
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
  }
  return null;
}

// ================= SAFE FORMAT =================
function formatIssues(issues) {
  if (!issues || issues.length === 0) {
    console.log("✅ No major issues found");
    return;
  }

  for (const issue of issues) {
    const type = issue.type || "unknown";
    const severity = issue.severity || "low";
    const description = issue.description || "No description";
    const fix = issue.fix || "No fix provided";

    let icon = "🟡";

    if (severity === "high") icon = "🔴";
    else if (severity === "medium") icon = "🟠";

    console.log(`\n${icon} ${type.toUpperCase()} (${severity.toUpperCase()})`);
    console.log(`- ${description}`);
    console.log(`✔ Fix: ${fix}`);
  }
}

// ================= PARALLEL =================
async function processWithLimit(items, limit, handler) {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      await handler(items[i]);
    }
  }

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);
}

// ================= MAIN =================
async function run() {
  console.log("🔍 Scanning...\n");

  if (options.fix && options.dry) {
    console.log("❌ Cannot use --fix and --dry together");
    return;
  }

  let files = [];

  if (fs.existsSync(options.path)) {
    const stat = fs.statSync(options.path);

    if (stat.isFile()) {
      files = [options.path];
    } else {
      files = getAllFiles(options.path);
    }
  } else {
    console.log("❌ Path does not exist");
    return;
  }

  if (files.length === 0) {
    console.log("⚠️ No files found");
    return;
  }

  await processWithLimit(files, 3, async (file) => {
    try {
      const code = fs.readFileSync(file, "utf-8");

      console.log("\n=================================");
      console.log(`📄 File: ${file}`);
      console.log("=================================");

      const messages = [
        {
          role: "system",
          content: `
You are a strict senior code reviewer.

Return ONLY JSON:
{
  "issues": [...],
  "fixed_code": "..."
}
`
        },
        {
          role: "user",
          content: `Review and fix this file:\n\n${code}`
        }
      ];

      let parsed = null;

      for (let i = 1; i <= 3; i++) {
        console.log(`🤖 Attempt ${i}...`);
        const res = await callAI(messages);
        parsed = safeParseJSON(res);
        if (parsed) break;
      }

      if (!parsed) {
        console.log("❌ Failed to parse AI response");
        return;
      }

      console.log("\n📊 Issues:");
      formatIssues(parsed.issues);

      const fixedCode = parsed.fixed_code;

      if (!fixedCode || fixedCode.length < code.length * 0.5) {
        console.log("⚠️ Bad fix, skipping...");
        return;
      }

      showDiff(code, fixedCode);

      if (options.dry) {
        console.log("🧪 Dry run");
        return;
      }

      if (options.fix) {
        const ans = await askUser("\nApply fix? (y/n): ");

        if (ans.toLowerCase() === "y") {
          fs.writeFileSync(file, fixedCode, "utf-8");
          console.log("✅ Updated");
        }
      }

    } catch (err) {
      console.log(`❌ Error in ${file}`);
      console.log(err.message);
    }
  });
}

run();