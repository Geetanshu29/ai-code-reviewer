import fs from "fs";
import path from "path";

export function getAllFiles(dir) {
  let results = [];

  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);

    if (filePath.includes("node_modules")) return;

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      if (
        file.endsWith(".js") ||
        file.endsWith(".ts") ||
        file.endsWith(".jsx")
      ) {
        results.push(filePath);
      }
    }
  });

  return results;
}