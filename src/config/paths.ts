import path from 'node:path'

const runtimeDir = __dirname
const projectRoot = path.resolve(runtimeDir, '../..')

function resolveUploadsRoot(rawUploadsRoot?: string): string {
  if (!rawUploadsRoot) {
    return path.join(projectRoot, 'uploads')
  }

  if (path.isAbsolute(rawUploadsRoot)) {
    return rawUploadsRoot
  }

  return path.resolve(projectRoot, rawUploadsRoot)
}

export const PROJECT_ROOT = projectRoot
export const UPLOADS_ROOT = resolveUploadsRoot(process.env.UPLOADS_ROOT)

export const COMMUNITY_SHOWN_DIR = path.join(UPLOADS_ROOT, 'community', 'shown')
export const BLOG_DIR = path.join(UPLOADS_ROOT, 'blog')
export const BLOG_THUMBNAILS_DIR = path.join(BLOG_DIR, 'thumbnails')
export const BLOG_SEO_DIR = path.join(BLOG_DIR, 'seo')
export const BLOG_INLINE_DIR = path.join(BLOG_DIR, 'inline')