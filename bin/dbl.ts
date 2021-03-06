#!/usr/bin/env node

import * as program from 'commander';
import {join, resolve, dirname} from 'path';
import {BuildConfig, BuildOptions} from '../src/interfaces';
import {writeFile} from 'mz/fs';
import {mkdir} from '../src/Util';
import build from '../src/build';

interface ProgramOptions {
  list?: boolean;
  build?: string;
  useCache?: boolean;
  skipAfterEach?: boolean;
  config?: string;
}

const opts: ProgramOptions = program
  .option('-l, --list', 'List all build target')
  .option('-b, --build <target-name>', 'Build target image and child images if any')
  .option('--use-cache', 'Disable --no-cache option when run "docker build"')
  .option('--skip-after-each', 'Skip "afterEach" hook defined in config file')
  .option('-c, --config <path>', 'Target a config file not in current directory')
  .parse(process.argv);

if (opts.list && opts.build) {
  console.error('Cannot specify both --list and --build');
  process.exit(1);
}

const configPath = opts.config ?
  resolve(opts.config) :
  resolve('docker-build-layers-config.json');

const config = require(configPath) as BuildConfig;
const configDir = dirname(configPath);

if (opts.list) {
  Object.keys(config.images).forEach((name) => console.log(`${name}`));
} else if (opts.build) {
  const buildDir = join(process.cwd(), '.tmp', `/docker-build-layers-${Date.now().toString()}`);
  mkdir(buildDir)
    .then(() => {
      return build(config, opts as BuildOptions, opts.build, buildDir, configDir);
    })
    .then((updatedConfig) => {
      return writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');
    })
    .catch((err) => {
      console.error(err.stack);
      throw err;
    });
}
