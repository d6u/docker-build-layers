# docker-build-layers

Command line helper to simplify building docker images that have multiple layers.

## Why

Sometimes you want to layer your docker images to speed up build process when you don't have to go through every step

## Install

```sh
npm install --save-dev docker-build-layers
```

## Usage

```sh
dbl -h
```

`dbl` relies on `docker` command being present in your PATH.

1. Create `docker-build-layers-config.json` file with content similar to:

    ```json
    {
      "prefix": "prefix-string/",
      "afterEach": "gcloud docker push <%= tag %>",
      "images": {
        "base-image": {
          "version": 5,
          "dockerfile": "./Dockerfile-base-image"
        },
        "server": {
          "version": 3,
          "dockerfile": "./Dockerfile-server",
          "isTemplate": true,
          "baseimage": "base-image"
        }
      }
    }
    ```

    - `prefix: string` (optional) A string to prepend to all image names and `baseimage` names
    - `afterEach: string` (optional) A command that will be executed after each image build. The command can be a [lodash template](https://lodash.com/docs#template). A locals of `{tag: number}` will be applied when compiling the template. `tag` is the tag of the image just built.
    - `images` A object of image names to their configurations
        - `version: number` The version portion of a image tag. The version number will be incremented every time the image it built. When generating an image tag, the version number will be prefixed with a `v` character. E.g. if image name is `demo-image`, version is `3`, the final tag will become `demo-image:v3`.
        - `dockerfile: string` The path to dockerfile of current image.
        - `baseimage: string` (optional) The baseimage name. Name must point to image configurations under `images`. This must be specified when `isTemplate` is `true`.
        - `isTemplate: boolean = false` (optional) If true, `dockerfile` will be treated as a [lodash template](https://lodash.com/docs#template). A locals of `{baseimage_version: number}` will be applied. You are responsible to use `<%= baseimage_version %>` in your dockerfile template. E.g.

            ```dockerfile
            FROM baseimage-name:v<%= baseimage_version %>

            ADD index.js /app/index.js
            CMD ["node", "/app/index.js"]
            ```

            docker-build-layers will find the `baseimage_version` according to provided `baseimage` and use that image configuration's version.

2. Run `dbl -l` to see a list of available images to build.
3. Run `dbl -b <image-name>` to build the specific image. Any image with `baseimage` configuration equals to the name of built image will also be built. The `baseimage_version` of child images will reflect the new parent image version.
4. At the end `docker-build-layers-config.json` will be updated with new versions. It is recommended to commit this file to source control.
