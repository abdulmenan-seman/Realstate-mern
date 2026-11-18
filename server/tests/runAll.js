import { execSync } from "child_process";

console.log("==================================================");
console.log("       RUNNING ALL REALESTATEHUB TEST SUITES      ");
console.log("==================================================\n");

const suites = [
    { name: "Phase 1: Auth & User Management", path: "tests/phase1.test.js" },
    { name: "Phase 2: Property CRUD & Moderation", path: "tests/phase2.test.js" },
    { name: "Phase 3: Public Marketplace & Favorites", path: "tests/phase3.test.js" },
];

let failed = false;

for (const suite of suites) {
    console.log(`\n>>> Executing ${suite.name}...`);
    try {
        execSync(`node ${suite.path}`, { stdio: "inherit" });
    } catch (err) {
        console.error(`\n❌ ${suite.name} FAILED.`);
        failed = true;
        break;
    }
}

if (failed) {
    console.error("\n❌ Test run failed.");
    process.exit(1);
} else {
    console.log("\n==================================================");
    console.log("       ALL 3 SUITES (68 TESTS) PASSED! 🎉        ");
    console.log("==================================================\n");
    process.exit(0);
}
