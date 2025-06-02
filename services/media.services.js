export const saveCommunityMediaFile = (file) => {
  // File is already saved by multer; just return path
  return `/uploads/community/${file.filename}`;
}