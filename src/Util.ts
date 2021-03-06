import {join, basename, resolve, dirname, relative} from 'path';
import {wrap} from 'co';
import * as template from 'lodash.template';
import {mkdir as _mkdir, readFile, writeFile} from 'mz/fs';
import {toPairs, pipe, map, filter, pathEq} from 'ramda';
import {ImageConfig, BuildConfig, BuildOptions, ImagesConfigMap} from './interfaces';
import {exec} from './ShellUtil';

export const renderDockerfile: (
  imageConfig: ImageConfig,
  buildConfig: BuildConfig,
  dpath: string,
  cpath: string
) => Promise<string> =
wrap<string>(function* (
  imageConfig: ImageConfig,
  buildConfig: BuildConfig,
  dpath: string,
  cpath: string) {

  const {version, dockerfile, baseimage} = imageConfig;
  const baseimageConf = getImageConfig(buildConfig, baseimage);
  const renderedDockerfilePath = join(dpath, `${basename(dockerfile)}-${Date.now()}`);
  const locals = {
    baseimage_version: baseimageConf.version
  };
  yield renderTmplToFile(resolve(cpath, dockerfile), locals, renderedDockerfilePath);
  return renderedDockerfilePath;
});

export const buildImage: (
  dfpath: string,
  tag: string,
  config: BuildConfig,
  opts: BuildOptions
) => Promise < void> =
wrap<void>(function* (
  dfpath: string,
  tag: string,
  config: BuildConfig,
  opts: BuildOptions) {

  const cmd = opts.useCache ?
    `docker build -f ${relative(process.cwd(), dfpath)} -t ${tag} .` :
    `docker build -f ${relative(process.cwd(), dfpath)} -t ${tag} --no-cache .`;
  yield exec(cmd);
  if (config.afterEach && !opts.skipAfterEach) {
    yield exec(template(config.afterEach)({ tag }));
  }
});

export const mkdir: (dpath: string) => Promise<void> =
wrap<void>(function* (dpath: string): IterableIterator<Promise<void>> {
  try {
    yield _mkdir(dpath);
  } catch (err) {
    if (err.code === 'EEXIST') {
      return;
    }
    if (err.code === 'ENOENT') {
      yield mkdir(dirname(dpath));
      yield _mkdir(dpath);
    }
  }
});

export function getImageConfig(config: BuildConfig, name: string): ImageConfig {
  const imageConfig = config.images[name];
  if (!imageConfig) {
    throw new Error(`Could not find configuration for "${name}"`);
  }
  return imageConfig;
}

export function renderTmplToFile(tpath: string, locals: Object, dpath: string) {
  return readFile(tpath, 'utf8')
    .then((fcontent) => writeFile(dpath, template(fcontent)(locals), 'utf8'));
}

export function findChildImages(parentName: string, imagesConfigMap: ImagesConfigMap): string[] {
  const confPairs = toPairs(imagesConfigMap) as [string, ImageConfig][];
  return pipe(
    filter<[string, ImageConfig]>(pathEq(['1', 'baseimage'], parentName)),
    map((arr: [string, ImageConfig]) => arr[0])
  )(confPairs);
}
