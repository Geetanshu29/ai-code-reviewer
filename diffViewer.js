export function showDiff(oldCode, newCode) {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  console.log("\n🔍 Changes:\n");

  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i]) console.log(`❌ - ${oldLines[i]}`);
      if (newLines[i]) console.log(`✅ + ${newLines[i]}`);
    }
  }
}