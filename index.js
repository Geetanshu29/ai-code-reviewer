import fs from "fs";
import path from "path";
import readline from "readline";
import { getAllFiles } from "./fileScanner.js";
import { callAI } from "./openrouter.js";

// ===== CLI OPTIONS PARSE =====
const args = process.argv.slice(2);

const options = {
  path: ".",
  fix: false,
  fixAll: false,
  dry: false,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--path") options.path = args[i + 1];
  if (args[i] === "--fix") options.fix = true;
  if (args[i] === "--fix-all") options.fixAll = true;
  if (args[i] === "--dry") options.dry = true;
}

// ===== CONFLICT CHECK =====
if (options.fix && options.fixAll) {
  console.log("❌ Cannot use --fix and --fix-all together");
  process.exit(1);
}

// ===== ASK USER =====
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// ===== STATS =====
let totalFiles = 0;
let totalIssues = 0;
let high = 0,
  medium = 0,
  low = 0;

let report = [];

// ===== MAIN =====
async function run() {
  console.log("🔍 Scanning files...\n");

  let files = [];

  if (!fs.existsSync(options.path)) {
    console.log("❌ Path does not exist");
    return;
  }

  const stat = fs.statSync(options.path);

  if (stat.isFile()) {
    files = [options.path];
  } else {
    files = getAllFiles(options.path);
  }

  for (const file of files) {
    try {
      const code = fs.readFileSync(file, "utf-8");

      console.log(`\n📄 File: ${file}`);

      const messages = [
        {
          role: "system",
          content: `You are a strict code reviewer. Return ONLY JSON in this format:
{
  "issues": [
    {
      "type": "bug",
      "severity": "high",
      "description": "...",
      "fix": "..."
    }
  ],
  "fixedCode": "..."
}`,
        },
        {
          role: "user",
          content: code,
        },
      ];

      const result = await callAI(messages);

      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch {
        console.log("❌ Invalid JSON from AI");
        continue;
      }

      const issues = parsed.issues || [];
      const fixedCode = parsed.fixedCode || code;

      totalFiles++;

      if (issues.length === 0) {
        console.log("✅ No issues found");
        continue;
      }

      console.log("⚠️ Issues:");

      issues.forEach((i) => {
        totalIssues++;
        if (i.severity === "high") high++;
        else if (i.severity === "medium") medium++;
        else low++;

        console.log(
          `- ${i.type || "unknown"} (${i.severity || "low"}): ${
            i.description
          }`
        );
      });

      report.push({
        file,
        issues,
      });

      // ===== DRY MODE =====
      if (options.dry) {
        console.log("🧪 Dry run - no changes applied");
        continue;
      }

      // ===== FIX ALL =====
      if (options.fixAll) {
        const backupPath = file + ".bak";
        fs.writeFileSync(backupPath, code, "utf-8");

        fs.writeFileSync(file, fixedCode, "utf-8");
        console.log("⚡ Auto-fixed (backup created)");
      }

      // ===== MANUAL FIX =====
      else if (options.fix) {
        const ans = await askUser("Apply fix? (y/n): ");

        if (ans.toLowerCase() === "y") {
          const backupPath = file + ".bak";
          fs.writeFileSync(backupPath, code, "utf-8");

          fs.writeFileSync(file, fixedCode, "utf-8");
          console.log("✅ Updated (backup created)");
        }
      }
    } catch (err) {
      console.log(`❌ Error in ${file}`);
      console.log(err.message);
    }
  }

  // ===== FINAL REPORT =====
  console.log("\n📊 FINAL REPORT");
  console.log(`Files: ${totalFiles}`);
  console.log(`Issues: ${totalIssues}`);
  console.log(`High: ${high} | Medium: ${medium} | Low: ${low}`);

  fs.writeFileSync("report.json", JSON.stringify(report, null, 2));
  console.log("📁 Report saved as report.json");
}

run();