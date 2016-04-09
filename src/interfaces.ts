export interface ImageConfig {
  version: number;
  dockerfile: string;
  isTemplate?: boolean;
  baseimage?: string;
}

export interface ImagesConfigMap {
  [key: string]: ImageConfig;
}

export interface BuildConfig {
  prefix?: string;
  afterEachCommand?: string;
  images: ImagesConfigMap;
}

export interface BuildOptions {
  useCache: boolean;
  skipAfterEach: boolean;
}
