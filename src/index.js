#!/usr/bin/env node
import prompts from "prompts";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from "execa";
import chalk from "chalk";

const log = {
  success: (msg) => console.log(`${chalk.green("🎉")} ${msg}`),
  error: (msg) => console.log(`${chalk.red("❌")} ${msg}`),
};

async function main() {
  try {
    const { pkgManager } = await prompts({
      type: "select",
      name: "pkgManager",
      message: "Which package manager do you use?",
      choices: [
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
        { title: "pnpm", value: "pnpm" },
      ],
      initial: 0,
    });

    if (!pkgManager) {
      log.error("No package manager selected. Exiting.");
      process.exit(1);
    }

    const deps = [
      "stylelint",
      "@kaehehehe/stylelint-config",
      "stylelint-config-standard",
      "stylelint-config-prettier",
      "stylelint-order",
      "@stylelint/postcss-css-in-js",
      "postcss-scss",
    ];

    const args =
      pkgManager === "npm"
        ? ["install", "--save-dev", ...deps]
        : ["add", "-D", ...deps];

    log.success(`Installing dependencies using ${pkgManager}...`);
    await execa(pkgManager, args, { stdio: "inherit" });

    const stylelintConfigPath = path.resolve(".stylelintrc.js");
    if (await fs.pathExists(stylelintConfigPath)) {
      log.error(".stylelintrc.js already exists. Skipping creation.");
    } else {
      const configContent = `module.exports = {
  extends: ["@kaehehehe/stylelint-config"],
};
`;
      await fs.writeFile(stylelintConfigPath, configContent, "utf8");
      log.success("Created .stylelintrc.js");
    }

    const pkgJsonPath = path.resolve("package.json");
    if (!(await fs.pathExists(pkgJsonPath))) {
      log.error("package.json not found in the current directory.");
      process.exit(1);
    }

    const pkgJson = await fs.readJSON(pkgJsonPath);
    if (!pkgJson.scripts) pkgJson.scripts = {};

    if (pkgJson.scripts["lint:style"]) {
      log.error(
        "lint:style script already exists in package.json. Skipping script addition."
      );
    } else {
      pkgJson.scripts["lint:style"] =
        "stylelint '**/*.{css,scss,js,jsx,ts,tsx}'";
      await fs.writeJSON(pkgJsonPath, pkgJson, { spaces: 2 });
      log.success('Added "lint:style" script to package.json');
    }

    log.success("Done!");
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();
