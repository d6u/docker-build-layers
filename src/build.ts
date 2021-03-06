import {EventEmitter} from 'events';
import {join, basename, resolve} from 'path';
import {wrap} from 'co';
import {assocPath} from 'ramda';
import {ImageConfig, BuildConfig, BuildOptions, ImagesConfigMap} from './interfaces';
import {getImageConfig, renderDockerfile, buildImage, findChildImages} from './Util';

/**
 * @param name - Image name
 * @param config - The build config
 * @param buildDir - A temporary directory to store files rendered from templates
 * @param configDir - Config file absolute path
 */
const build: (
  config: BuildConfig,
  opts: BuildOptions,
  name: string,
  buildDir: string,
  configDir: string
) => Promise<BuildConfig> =
wrap<BuildConfig>(function* (
  config: BuildConfig,
  opts: BuildOptions,
  name: string,
  buildDir: string,
  configDir: string
  ): IterableIterator<Promise<any>> {

  const imageName = config.prefix ? `${config.prefix}${name}` : name;
  console.log(`\n\n--> building ${imageName}\n`);

  const imageConfig = getImageConfig(config, name);
  const {version, dockerfile, isTemplate} = imageConfig;
  const newVersion = version + 1;
  const imageTag = `${imageName}:v${newVersion}`;

  let dockerfilePath: string;

  if (isTemplate) {
    dockerfilePath = yield renderDockerfile(imageConfig, config, buildDir, configDir);
  } else {
    dockerfilePath = resolve(configDir, dockerfile);
  }

  yield buildImage(dockerfilePath, imageTag, config, opts);

  let updatedConfig = assocPath(['images', name, 'version'], newVersion, config);

  const childImageNames = findChildImages(name, updatedConfig.images);
  for (const childImageName of childImageNames) {
    updatedConfig = yield build(updatedConfig, opts, childImageName, buildDir, configDir);
  }

  return updatedConfig;
});

export {
  build as default,
};
