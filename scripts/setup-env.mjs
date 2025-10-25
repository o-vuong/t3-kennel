#!/usr/bin/env node
/**
 * Interactive environment bootstrapper for the Kennel Management System.
 *
 * This script walks through all required and optional environment variables,
 * collects input via a simple TUI, and writes `.env` (server) and `.env.local`
 * (Next.js client) files.
 *
 * Usage:
 *   node scripts/setup-env.mjs
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const rl = createInterface({ input, output });

const headline = (text) => {
	output.write(`\n\u001b[1m${text}\u001b[0m\n`);
};

const notice = (text) => output.write(`\u001b[36m${text}\u001b[0m\n`);
const warn = (text) => output.write(`\u001b[33m${text}\u001b[0m\n`);
const success = (text) => output.write(`\u001b[32m${text}\u001b[0m\n`);

const serverVars = [
	{
		key: "DATABASE_URL",
		description: "PostgreSQL connection string",
		defaultValue:
			"postgresql://postgres:postgres@localhost:5432/kennel_management",
		required: true,
	},
	{
		key: "NODE_ENV",
		description: "Runtime environment (development/test/production)",
		defaultValue: "development",
		required: true,
	},
	{
		key: "BETTER_AUTH_SECRET",
		description: "32+ character secret used by Better Auth",
		defaultValue: () => randomSecret(48),
		required: true,
	},
	{
		key: "BETTER_AUTH_URL",
		description: "Base URL for Better Auth API",
		defaultValue: "http://localhost:3000",
		required: true,
	},
	{
		key: "STRIPE_SECRET_KEY",
		description: "Stripe secret key (sk_live... / sk_test...)",
		required: true,
	},
	{
		key: "STRIPE_WEBHOOK_SECRET",
		description: "Stripe webhook signing secret",
		required: true,
	},
	{
		key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
		description: "Stripe publishable key exposed to client",
		required: true,
		target: "client",
	},
	{
		key: "ENCRYPTION_KEY",
		description: "32+ character symmetric key for PHI encryption",
		defaultValue: () => randomSecret(48),
		required: true,
	},
	{
		key: "OVERRIDE_HMAC_SECRET",
		description: "32+ character HMAC secret for override tokens",
		defaultValue: () => randomSecret(48),
		required: true,
	},
	{
		key: "RATE_LIMIT_LOGIN_PER_MIN",
		description: "Login attempts per minute before rate limiting",
		defaultValue: "10",
		required: false,
	},
	{
		key: "RATE_LIMIT_API_PER_MIN",
		description: "Authenticated API requests per minute",
		defaultValue: "120",
		required: false,
	},
	{
		key: "NEXT_PUBLIC_BETTER_AUTH_URL",
		description: "Client-facing Better Auth URL",
		defaultValue: "http://localhost:3000",
		required: true,
		target: "client",
	},
	{
		key: "NEXT_PUBLIC_APP_URL",
		description: "Public application URL",
		defaultValue: "http://localhost:3000",
		required: true,
		target: "client",
	},
	{
		key: "REDIS_URL",
		description: "Redis connection string (optional)",
		required: false,
	},
	{
		key: "SMTP_HOST",
		description: "SMTP host (optional)",
		required: false,
	},
	{
		key: "SMTP_PORT",
		description: "SMTP port (optional)",
		required: false,
	},
	{
		key: "SMTP_USER",
		description: "SMTP username (optional)",
		required: false,
	},
	{
		key: "SMTP_PASS",
		description: "SMTP password (optional)",
		required: false,
	},
	{
		key: "OAUTH_SMTP_FROM",
		description: "Default From email address for transactional mail (optional)",
		required: false,
	},
	{
		key: "VAPID_PUBLIC_KEY",
		description: "Web Push VAPID public key (optional)",
		required: false,
	},
	{
		key: "VAPID_PRIVATE_KEY",
		description: "Web Push VAPID private key (optional)",
		required: false,
	},
	{
		key: "VAPID_SUBJECT",
		description: "Web Push VAPID subject (mailto:... or URL, optional)",
		required: false,
	},
	{
		key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
		description: "Public VAPID key exposed to client (optional)",
		required: false,
		target: "client",
	},
	{
		key: "OTEL_SERVICE_NAME",
		description: "OpenTelemetry service name",
		defaultValue: "kennel-pwa",
		required: false,
	},
	{
		key: "OTEL_EXPORTER_OTLP_ENDPOINT",
		description: "OpenTelemetry collector endpoint (optional)",
		required: false,
	},
	{
		key: "WS_ALLOWED_ORIGINS",
		description: "Comma-separated allowed origins for WebSocket connections",
		defaultValue: "localhost:3000,localhost:3001",
		required: false,
	},
];

function randomSecret(length = 32) {
	return crypto.randomBytes(length).toString("base64url");
}

async function promptYesNo(question, defaultYes = true) {
	const suffix = defaultYes ? "Y/n" : "y/N";
	const answer = (await rl.question(`${question} [${suffix}]: `))
		.trim()
		.toLowerCase();
	if (!answer) return defaultYes;
	return ["y", "yes"].includes(answer);
}

async function promptValue({ key, description, defaultValue, required }) {
	const optionalText = required ? "" : " (optional)";
	const defaultHint =
		defaultValue !== undefined
			? typeof defaultValue === "function"
				? " [auto-generated]"
				: ` [default: ${defaultValue}]`
			: "";
	output.write(`\n\u001b[1m${key}\u001b[0m${optionalText}\n${description}\n`);

	while (true) {
		const answer = (await rl.question(`Enter value${defaultHint}: `)).trim();
		if (answer) {
			return answer;
		}

		if (typeof defaultValue === "function") {
			const generated = defaultValue();
			output.write(`→ Generated value for ${key}: ${generated}\n`);
			if (await promptYesNo("Use generated value?", true)) {
				return generated;
			}
			continue;
		}

		if (defaultValue !== undefined) {
			return defaultValue;
		}

		if (!required) {
			return "";
		}

		warn("This field is required. Please provide a value.");
	}
}

function buildEnvContent(pairs, heading) {
	const lines = [`# ${heading}`, `# Generated on ${new Date().toISOString()}`];

	for (const { key, value } of pairs) {
		if (value === "") continue;
		lines.push(`${key}=${value}`);
	}

	return `${lines.join("\n")}\n`;
}

async function writeEnvFile(filename, content) {
	const target = path.join(projectRoot, filename);
	if (fs.existsSync(target)) {
		const overwrite = await promptYesNo(
			`${filename} exists. Overwrite?`,
			false
		);
		if (!overwrite) {
			warn(`Skipping ${filename}`);
			return;
		}
	}
	fs.writeFileSync(target, content, "utf8");
	success(`Wrote ${filename}`);
}

async function main() {
	headline("Kennel Management System • Environment Bootstrap");
	notice(
		"This wizard will collect secrets and configuration for `.env` and `.env.local`.\nPress Enter to accept defaults. Optional values can be left blank."
	);

	const answers = {};
	for (const variable of serverVars) {
		const value = await promptValue(variable);
		if (value !== "") {
			answers[variable.key] = value;
		}
	}

	const serverPairs = serverVars
		.filter((item) => item.target !== "client")
		.map(({ key }) => ({ key, value: answers[key] ?? "" }));

	const clientPairs = serverVars
		.filter((item) => item.target === "client")
		.map(({ key }) => ({ key, value: answers[key] ?? "" }));

	if (serverPairs.some((entry) => entry.value !== "")) {
		await writeEnvFile(
			".env",
			buildEnvContent(serverPairs, "Server configuration")
		);
	}

	if (clientPairs.some((entry) => entry.value !== "")) {
		await writeEnvFile(
			".env.local",
			buildEnvContent(clientPairs, "Client configuration")
		);
	}

	headline("Next Steps");
	console.log(`1. Install dependencies:\n   pnpm install`);
	console.log(`2. Generate Prisma client:\n   pnpm exec prisma generate`);
	console.log(`3. Apply migrations:\n   pnpm exec prisma migrate dev`);
	console.log(`4. Seed demo data (optional):\n   pnpm exec prisma db seed`);
	console.log(`5. Start the dev server:\n   pnpm dev`);

	success("\nEnvironment bootstrap complete. Happy building! 🐕");
	await rl.close();
}

main().catch((error) => {
	console.error("\nUnexpected error:", error);
	rl.close();
	process.exit(1);
});
