import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as yaml from 'js-yaml';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';

import { logger } from './get-logger';

class ConfigException extends Error {}

function loadFromEnv(env: Record<string, string | undefined>, { delimiter = '__' } = {}): Record<string, string> {
  return Object.entries(process.env).reduce((acc, [key, value]) => {
    set(acc, key.toLowerCase().replace(delimiter, '.'), value);
    return acc;
  }, {});
}

function loadFromYaml(env = 'development'): Record<string, unknown> {
  const configFile = `env.${env}.yaml`;
  const configPath = resolve(process.cwd(), configFile);

  logger?.info(`loading configuration from: ${configPath}`, 'ConfigService');

  return yaml.load(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
}

function loadConfiguration(): Record<string, unknown> {
  const fromYaml = loadFromYaml(process.env.NODE_ENV);
  const fromProcess = loadFromEnv(process.env);

  return merge(fromYaml, fromProcess);
}

let CONFIG_DATA: Record<string, unknown> | undefined;

export function setupConfiguration(): void {
  if (!CONFIG_DATA) {
    CONFIG_DATA = loadConfiguration();
  }
}

export function getConfig<T>(key: string, fallback?: T): T {
  return get(CONFIG_DATA, key, fallback) as T;
}

export function getOrThrow<T>(key: string): T {
  const result = get(CONFIG_DATA, key);
  if (result === undefined) {
    throw new ConfigException(`Invalid ${key} config`);
  }

  return result as T;
}
