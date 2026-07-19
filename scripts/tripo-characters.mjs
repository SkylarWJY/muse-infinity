#!/usr/bin/env node
import process from "node:process";
import { resolve } from "node:path";
import { CHARACTERS, runCharacterBatchItem, selectCharacters } from "../lib/tripoCharacters.js";

try { process.loadEnvFile?.(resolve(".env")); } catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function parseArguments(argumentsList) {
  const options = { dryRun: false, submit: false, confirmUpload: false, retryFailed: false, all: false, character: null };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--submit") options.submit = true;
    else if (argument === "--confirm-upload") options.confirmUpload = true;
    else if (argument === "--retry-failed") options.retryFailed = true;
    else if (argument === "--all") options.all = true;
    else if (argument === "--character") options.character = argumentsList[++index];
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument '${argument}'.`);
  }
  if (!options.dryRun && !options.submit) options.dryRun = true;
  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run tripo:characters -- --dry-run --all
  npm run tripo:characters -- --dry-run --character "Claude Monet"
  npm run tripo:characters -- --submit --confirm-upload --character "Claude Monet"
  npm run tripo:characters -- --submit --confirm-upload --all

Characters:
${CHARACTERS.map(character => `  ${character.name} (${character.slug})`).join("\n")}`);
}

const options = parseArguments(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}
if (options.submit && options.dryRun) throw new Error("Choose either --dry-run or --submit, not both.");
if (options.submit && !options.confirmUpload) throw new Error("Paid execution requires --confirm-upload in addition to --submit.");
if (options.submit && !process.env.TRIPO_API_KEY) throw new Error("TRIPO_API_KEY is not configured; crop and preview with --dry-run instead.");

const selected = selectCharacters(options);
console.log(`Tripo API key detected: ${Boolean(process.env.TRIPO_API_KEY)}`);
console.log(`Mode: ${options.dryRun ? "dry-run (no upload)" : "approved upload and paid submission"}`);

for (let index = 0; index < selected.length; index += 1) {
  const character = selected[index];
  const manifest = await runCharacterBatchItem(character, {
    dryRun: options.dryRun,
    submit: options.submit,
    confirmUpload: options.confirmUpload,
    retryFailed: options.retryFailed,
    onProgress: message => console.log(message)
  });
  console.log(`${character.name}: ${manifest.status} -> outputs/tripo-characters/${character.slug}/manifest.json`);
  if (!options.dryRun && options.all && index === 0 && character.name === "Claude Monet") {
    const canaryValid = manifest.status === "success" && manifest.artifacts.some(artifact => artifact.glb?.meshes > 0);
    if (!canaryValid) throw new Error("Claude Monet canary did not produce a validated GLB; remaining characters were not submitted.");
    console.log("Claude Monet canary GLB validated; continuing serially.");
  }
}
