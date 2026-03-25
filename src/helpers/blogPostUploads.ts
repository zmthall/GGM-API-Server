import fs from 'node:fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import sizeOf from 'image-size'

import type { ISizeCalculationResult } from 'image-size/dist/types/interface'
import { BlogImageUploadResult } from '../types/blogPosts'

const ALLOWED_BLOG_IMAGE_EXTENSIONS = new Set(['.png', '.webp'])

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function getValidatedExtension(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!ALLOWED_BLOG_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error('Invalid image type. Only .png and .webp files are allowed.')
  }

  return ext
}

function getImageDimensions(buffer: Buffer): { width: number | null; height: number | null } {
  const dimensions: ISizeCalculationResult = sizeOf(buffer)

  return {
    width: dimensions.width ?? null,
    height: dimensions.height ?? null
  }
}

export function saveBlogImage(
  file: Express.Multer.File,
  destinationDir: string,
  publicBasePath: string
): BlogImageUploadResult {
  if (!file) {
    throw new Error('No file provided.')
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new Error('Uploaded file buffer is empty.')
  }

  ensureDir(destinationDir)

  const ext = getValidatedExtension(file)
  const filename = `${uuidv4()}${ext}`
  const absoluteFilePath = path.join(destinationDir, filename)

  fs.writeFileSync(absoluteFilePath, file.buffer)

  const { width, height } = getImageDimensions(file.buffer)

  return {
    path: `${publicBasePath}/${filename}`,
    width,
    height
  }
}

export function deleteBlogImage(
  imagePath: string,
  destinationDir: string,
  publicBasePath: string
): void {
  if (!imagePath) return

  const normalizedPublicBasePath = publicBasePath.replace(/\/+$/, '')
  const normalizedImagePath = imagePath.replace(/\\/g, '/')

  const expectedPrefix = `${normalizedPublicBasePath}/`

  if (!normalizedImagePath.startsWith(expectedPrefix)) {
    console.warn('deleteBlogImage skipped: image path does not match expected public base path.', {
      imagePath: normalizedImagePath,
      expectedPublicBasePath: normalizedPublicBasePath
    })
    return
  }

  const filename = normalizedImagePath.slice(expectedPrefix.length)

  if (!filename) {
    console.warn('deleteBlogImage skipped: could not determine filename.', {
      imagePath: normalizedImagePath
    })
    return
  }

  const absoluteFilePath = path.join(destinationDir, filename)

  if (!fs.existsSync(absoluteFilePath)) {
    console.warn('deleteBlogImage skipped: file does not exist.', {
      absoluteFilePath
    })
    return
  }

  fs.unlinkSync(absoluteFilePath)
}