import fs from "fs";
import path from "path";

const ignoreDirs = ["node_modules", ".git", "dist", "build"];

export function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);

    // ignore folders
    if (ignoreDirs.some((d) => fullPath.includes(d))) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });

  return results;
}