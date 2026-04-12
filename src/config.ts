import fs from "fs";
import os from "os";
import path from "path";

type ConfigEnv = NodeJS.ProcessEnv;

export interface ConfigPaths {
  configDir: string;
  oauthKeysPath: string;
  credentialsPath: string;
  legacyOauthKeysPath: string;
  legacyCredentialsPath: string;
}

interface ConfigOptions {
  env?: ConfigEnv;
  homedir?: string;
  platform?: NodeJS.Platform;
  repoRoot: string;
}

const OAUTH_KEYS_FILENAME = "gcp-oauth.keys.json";
const CREDENTIALS_FILENAME = ".gtasks-server-credentials.json";

export function getDefaultConfigDir(
  env: ConfigEnv = process.env,
  homedir: string = os.homedir(),
  platform: NodeJS.Platform = process.platform,
): string {
  if (env.GTASKS_MCP_CONFIG_DIR) {
    return path.resolve(env.GTASKS_MCP_CONFIG_DIR);
  }

  if (platform === "win32") {
    const baseDir = env.APPDATA || path.join(homedir, "AppData", "Roaming");
    return path.join(baseDir, "gtasks-mcp");
  }

  const baseDir = env.XDG_CONFIG_HOME || path.join(homedir, ".config");
  return path.join(baseDir, "gtasks-mcp");
}

export function getConfigPaths({
  env = process.env,
  homedir = os.homedir(),
  platform = process.platform,
  repoRoot,
}: ConfigOptions): ConfigPaths {
  const configDir = getDefaultConfigDir(env, homedir, platform);

  return {
    configDir,
    oauthKeysPath: env.GTASKS_MCP_OAUTH_KEYS_PATH
      ? path.resolve(env.GTASKS_MCP_OAUTH_KEYS_PATH)
      : path.join(configDir, OAUTH_KEYS_FILENAME),
    credentialsPath: env.GTASKS_MCP_CREDENTIALS_PATH
      ? path.resolve(env.GTASKS_MCP_CREDENTIALS_PATH)
      : path.join(configDir, CREDENTIALS_FILENAME),
    legacyOauthKeysPath: path.join(repoRoot, OAUTH_KEYS_FILENAME),
    legacyCredentialsPath: path.join(repoRoot, CREDENTIALS_FILENAME),
  };
}

export function ensureConfigDir(configDir: string): void {
  fs.mkdirSync(configDir, { recursive: true });
}

export function migrateLegacySecrets(paths: ConfigPaths): string[] {
  const moved: string[] = [];
  ensureConfigDir(paths.configDir);

  const migrations: Array<[string, string]> = [
    [paths.legacyOauthKeysPath, paths.oauthKeysPath],
    [paths.legacyCredentialsPath, paths.credentialsPath],
  ];

  for (const [legacyPath, targetPath] of migrations) {
    if (!fs.existsSync(legacyPath) || fs.existsSync(targetPath)) {
      continue;
    }

    fs.renameSync(legacyPath, targetPath);
    moved.push(path.basename(legacyPath));
  }

  return moved;
}
