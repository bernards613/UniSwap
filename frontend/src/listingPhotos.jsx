export function listingPhotoUrls(item) {
  if (!item) return [];
  if (Array.isArray(item.photos) && item.photos.length > 0) {
    return item.photos.filter(Boolean).slice(0, 7);
  }
  if (item.photo) return [item.photo];
  return [];
}
