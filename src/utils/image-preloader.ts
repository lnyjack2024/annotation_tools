import { preloadImage } from './index';

const IMAGE_CACHE_SIZE = 10;

export class ImagePreloader {
  /**
   * image list
   */
  images: string[];

  /**
   * currently preloaded image index start
   */
  preloadedImageIndex = -1;

  constructor(images: string[]) {
    this.images = images;
  }

  preload(index: number) {
    if (this.preloadedImageIndex < 0) {
      // never preload
      this.cacheImages(index);
    } else {
      const offset = index - this.preloadedImageIndex;
      if (Math.abs(offset) >= IMAGE_CACHE_SIZE) {
        // offset exceeds cache size, always load from start
        this.cacheImages(index);
      } else if (offset !== 0) {
        const startFrame = offset > 0 ? this.preloadedImageIndex + IMAGE_CACHE_SIZE : index;
        this.cacheImages(startFrame, Math.abs(offset));
      }
    }

    this.preloadedImageIndex = index;
  }

  cacheImages(startIndex: number, cacheSize: number = IMAGE_CACHE_SIZE) {
    Array.from({ length: cacheSize }).forEach((_, i) => {
      const index = startIndex + i;
      if (index >= 0 && index < this.images.length) {
        const image = this.images[index];
        if (image) {
          preloadImage(image, '');
        }
      }
    });
  }
}

export default (images: string[]) => new ImagePreloader(images);
