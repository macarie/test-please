import { resolve as resolvePath, parse as parsePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { access } from 'node:fs/promises'
import { TextDecoder } from 'node:util'

import { transform } from 'esbuild'

type ResolveSpecifier = string

type ResolveContext = {
  conditions: string[]
  parentURL?: string
}

type Resolve = {
  url: string
}

type DefaultResolve = (
  specifier: ResolveSpecifier,
  context: ResolveContext,
  defaultResolve: DefaultResolve
) => Resolve

const allowedSpecifiers: RegExp[] = [/^file:/, /^\.{1,2}[/\\]/]
const extensionsToLookFor = <const>['ts', 'tsx', 'jsx']

export const resolve = async (
  specifier: ResolveSpecifier,
  context: ResolveContext,
  defaultResolve: DefaultResolve
): Promise<Resolve> => {
  const { parentURL = null } = context

  if (
    allowedSpecifiers.some((allowedSpecifier) =>
      allowedSpecifier.test(specifier)
    )
  ) {
    const filePath =
      parentURL === null
        ? fileURLToPath(specifier)
        : resolvePath(parsePath(fileURLToPath(parentURL)).dir, specifier)
    let fileToTranspile = filePath

    if (parentURL !== null) {
      const fileExt = parsePath(filePath).ext

      if (fileExt === '.js' || fileExt === '') {
        const fileWithoutExtension =
          fileExt === '.js'
            ? fileToTranspile.replace(/\.js$/, '')
            : fileToTranspile
        const fileAndLoader: string | undefined = (
          await Promise.all(
            extensionsToLookFor.map(async (extension) => {
              const fileToLookFor = `${fileWithoutExtension}.${extension}`

              try {
                await access(fileToLookFor)

                return fileToLookFor
              } catch {
                return null
              }
            })
          )
        ).find((n) => n !== null)!

        if (fileAndLoader) {
          fileToTranspile = fileAndLoader
        }
      }
    }

    return {
      url: pathToFileURL(fileToTranspile).toString(),
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}

type FormatURL = string

type FormatContext = Record<string, unknown>

type Format = {
  format: string
}

type DefaultGetFormat = (
  url: FormatURL,
  context: FormatContext,
  defaultGetFormat: DefaultGetFormat
) => Promise<Format>

export const getFormat = async (
  url: FormatURL,
  context: FormatContext,
  defaultGetFormat: DefaultGetFormat
): Promise<Format> => {
  const recognizedExtension = extensionsToLookFor.find((extension) =>
    url.endsWith(extension)
  )

  if (recognizedExtension) {
    return {
      format: 'module',
    }
  }

  return defaultGetFormat(url, context, defaultGetFormat)
}

type TransformSource = string | Uint8Array | SharedArrayBuffer

type TransformContext = {
  format: string
  url: string
}

type Transform = {
  source: TransformSource
}

type DefaultTransformSource = (
  source: TransformSource,
  context: TransformContext,
  defaultGetFormat: DefaultTransformSource
) => Promise<Transform>

const textDecoder = new TextDecoder()

export const transformSource = async (
  source: TransformSource,
  context: TransformContext,
  defaultTransformSource: DefaultTransformSource
): Promise<Transform> => {
  const { url } = context
  const loader = extensionsToLookFor.find(
    (extension) => !url.includes('node_modules') && url.endsWith(extension)
  )

  if (loader) {
    const transformResult = await transform(
      ArrayBuffer.isView(source) || source instanceof SharedArrayBuffer
        ? textDecoder.decode(source)
        : source,
      {
        loader,
        format: 'esm',
        sourcemap: 'inline',
        target: 'es2019',
      }
    )

    return {
      source: transformResult.code,
    }
  }

  return defaultTransformSource(source, context, defaultTransformSource)
}
