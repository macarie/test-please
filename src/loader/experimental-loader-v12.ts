import { resolve as resolvePath, parse as parsePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promises } from 'node:fs'
import { TextDecoder } from 'node:util'

import { transform } from 'esbuild'

const { access } = promises

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

const transformableFileExtensions = <const>['ts', 'tsx', 'jsx']
const resolvableSpecifiers: RegExp[] = [/^file:/, /^\.{1,2}[/\\]/]
const resolvableExtensions: string[] = [...transformableFileExtensions, 'js']

export const resolve = async (
  specifier: ResolveSpecifier,
  context: ResolveContext,
  defaultResolve: DefaultResolve
): Promise<Resolve> => {
  const { parentURL = null } = context

  // Use the custom resolver when the specifier matches one of the accepted ones
  if (
    resolvableSpecifiers.some((resolvableSpecifier) =>
      resolvableSpecifier.test(specifier)
    ) &&
    resolvableExtensions.some((resolvableExtension) =>
      specifier.endsWith(resolvableExtension)
    )
  ) {
    // If parentURL is null it means that the file is the entry-point
    const resolvedFilePath =
      parentURL === null
        ? fileURLToPath(specifier)
        : resolvePath(parsePath(fileURLToPath(parentURL)).dir, specifier)

    // Save the path of the file to transpile, start with the imported file by default
    let fileToTranspile = resolvedFilePath

    // Try to find a file with a non-standard extension only if the imported
    //  script is not the entry-point (these already have the right file)
    if (parentURL !== null) {
      const fileExt = parsePath(resolvedFilePath).ext

      // Try to find a file with a different extension only if the imported one is
      //  a JS file. Using .js to import .ts files was a bright idea TypeScript
      //  team! So bright that I can't even see right now!
      if (fileExt === '.js') {
        const fileWithoutExtension = fileToTranspile.replace(/\.js$/, '')
        const sourceFilePath: string | undefined = (
          await Promise.all(
            transformableFileExtensions.map(async (extension) => {
              const fileToLookFor = `${fileWithoutExtension}.${extension}`

              try {
                await access(fileToLookFor)

                return fileToLookFor
              } catch {
                return null
              }
            })
          )
        ).find((fileWithExtension) => fileWithExtension !== null)!

        if (sourceFilePath) {
          fileToTranspile = sourceFilePath
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
  // Check if the file's extension is one of the recognized one
  const recognizedExtension = transformableFileExtensions.find((extension) =>
    url.endsWith(extension)
  )

  // If it is one of the known ones, assume the file is a module
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
  // Check if the file is not inside the node_modules folder and
  //  find if its extension is one of the recognized ones
  // The extensions array overlaps with esbuild's loader option,
  //  so that's what it'll be used for
  const loader = transformableFileExtensions.find(
    (extension) => !url.includes('node_modules') && url.endsWith(extension)
  )

  // If a file that matches the rules is found, transpile it on the
  //  fly using esbuild
  if (loader !== undefined) {
    const transformResult = await transform(
      ArrayBuffer.isView(source) || source instanceof SharedArrayBuffer
        ? textDecoder.decode(source)
        : source,
      {
        loader,
        format: 'esm',
        sourcefile: fileURLToPath(url),
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
