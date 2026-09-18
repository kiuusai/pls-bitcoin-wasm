import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

const envFiles = [
  ".env.test",
  ".env",
];

const envs = Object.assign({}, process.env, ...envFiles.map((envFile) => (dotenv.parse(envFile))));

export default defineConfig({
  test: {
    env: envs,
  }
});
