#!/usr/bin/env node

import * as program from 'commander';
import {join, resolve} from 'path';
import {tmpdir} from 'os';
import {mkdir} from 'mz/fs';
import {BuildConfig, BuildOptions} from '../src/interfaces';
import build from '../src/build';

interface ProgramOptions {
  list?: boolean;
  build?: string;
  useCache?: boolean;
  skipAfterEach?: boolean;
}

const opts: ProgramOptions = program
  .option('-l, --list', 'List all build target')
  .option('-b, --build <target-name>', 'Build target image and child images if any')
  .option('--use-cache', 'Disable --no-cache option when run "docker build"')
  .option('--skip-after-each', 'Skip "afterEach" hook defined in config file')
  .parse(process.argv);

if (opts.list && opts.build) {
  throw new Error('Cannot specify both --list and --build');
}

const configPath = resolve('docker-build-layers-config.json');
const config = require(configPath) as BuildConfig;

if (opts.list) {
  Object.keys(config.images).forEach((name) => console.log(`${name}`));
} else if (opts.build) {
  const buildDir = join(tmpdir(), `docker-build-layers-${Date.now().toString()}`);
  mkdir(buildDir)
    .then(() => {
      build(config, opts as BuildOptions, opts.build, buildDir, configPath);
    })
    .catch((err) => {
      throw err;
    });
}
