import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, test } from "bun:test";
import { getConfigPaths, getDefaultConfigDir, migrateLegacySecrets } from "./config.js";

const tempRoots: string[] = [];

afterEach(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe("getDefaultConfigDir", () => {
  test("uses APPDATA on Windows", () => {
    const dir = getDefaultConfigDir(
      { APPDATA: "C:\\Users\\Hakan\\AppData\\Roaming" } as NodeJS.ProcessEnv,
      "C:\\Users\\Hakan",
      "win32",
    );

    expect(dir).toBe(path.join("C:\\Users\\Hakan\\AppData\\Roaming", "gtasks-mcp"));
  });

  test("uses XDG config home on Unix-like systems", () => {
    const dir = getDefaultConfigDir(
      { XDG_CONFIG_HOME: "/tmp/config-home" } as NodeJS.ProcessEnv,
      "/tmp/test-home",
      "linux",
    );

    expect(dir).toBe(path.join("/tmp/config-home", "gtasks-mcp"));
  });

  test("honors GTASKS_MCP_CONFIG_DIR override", () => {
    const dir = getDefaultConfigDir(
      { GTASKS_MCP_CONFIG_DIR: "/secure/gtasks" } as NodeJS.ProcessEnv,
      "/tmp/test-home",
      "linux",
    );

    expect(dir).toBe(path.resolve("/secure/gtasks"));
  });
});

describe("getConfigPaths", () => {
  test("honors explicit file path overrides", () => {
    const paths = getConfigPaths({
      env: {
        GTASKS_MCP_OAUTH_KEYS_PATH: "/secrets/oauth.json",
        GTASKS_MCP_CREDENTIALS_PATH: "/secrets/credentials.json",
      } as NodeJS.ProcessEnv,
      homedir: "/tmp/test-home",
      platform: "linux",
      repoRoot: "/repo",
    });

    expect(paths.oauthKeysPath).toBe(path.resolve("/secrets/oauth.json"));
    expect(paths.credentialsPath).toBe(path.resolve("/secrets/credentials.json"));
    expect(paths.legacyOauthKeysPath).toBe(path.join("/repo", "gcp-oauth.keys.json"));
    expect(paths.legacyCredentialsPath).toBe(path.join("/repo", ".gtasks-server-credentials.json"));
  });
});

describe("migrateLegacySecrets", () => {
  test("moves legacy repo-root secret files into config storage", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gtasks-mcp-"));
    tempRoots.push(tempRoot);

    const repoRoot = path.join(tempRoot, "repo");
    const configDir = path.join(tempRoot, "config");
    fs.mkdirSync(repoRoot, { recursive: true });
    fs.writeFileSync(path.join(repoRoot, "gcp-oauth.keys.json"), '{"installed":{}}');
    fs.writeFileSync(path.join(repoRoot, ".gtasks-server-credentials.json"), '{"refresh_token":"x"}');

    const paths = getConfigPaths({
      env: { GTASKS_MCP_CONFIG_DIR: configDir } as NodeJS.ProcessEnv,
      homedir: tempRoot,
      platform: "linux",
      repoRoot,
    });

    const moved = migrateLegacySecrets(paths);

    expect(moved).toEqual(["gcp-oauth.keys.json", ".gtasks-server-credentials.json"]);
    expect(fs.existsSync(paths.oauthKeysPath)).toBe(true);
    expect(fs.existsSync(paths.credentialsPath)).toBe(true);
    expect(fs.existsSync(paths.legacyOauthKeysPath)).toBe(false);
    expect(fs.existsSync(paths.legacyCredentialsPath)).toBe(false);
  });
});
