# 🧠 AI Code Reviewer CLI (Auto Fix + Multi-file Support)

AI-powered CLI tool that scans, reviews, and fixes code using LLMs.

---

## 🚀 Features

* 🔍 AI code analysis
* ⚡ Auto-fix mode
* 📁 Multi-file scanning
* 📊 Summary report
* 🛡️ Backup system

---

## 📦 Installation

npm install

---

## 🔑 Setup

Create `.env`:

OPENROUTER_API_KEY=your_key_here

---

## ▶️ Usage

Dry run:
node index.js --path ./test --dry

Fix manually:
node index.js --path ./test --fix

Auto fix:
node index.js --path ./test --fix-all

---

## 🧪 Example

Input:
function test() {
console.log(user.name)
}

Output:

* ❌ user undefined
* ✅ fix applied

---

## 📊 Output

* CLI summary
* report.json

---

Built by Geetanshu 🚀
