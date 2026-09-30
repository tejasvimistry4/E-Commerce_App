import fs from "fs";
import path from "path";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { prisma } from "../../config/prisma";

export interface VisualSearchFilterOptions {
  limit?: number;
  threshold?: number; // Minimum similarity score (0.0 to 1.0)
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export interface MatchedProductResult {
  product: any;
  similarity: number; // 0.0 to 1.0
  matchedImage: string;
}

export class VisualSearchService {
  private readonly EMBEDDING_DIMENSION = 512;
  private readonly MODEL_NAME = "clip-vit-base-patch32";

  // Singleton promise for lazy loading CLIP feature extractor and RawImage
  private static transformersPromise: Promise<{ pipeline: any; RawImage: any } | null> | null = null;
  private static extractorPromise: Promise<any> | null = null;

  private static async getTransformers(): Promise<{ pipeline: any; RawImage: any } | null> {
    if (!VisualSearchService.transformersPromise) {
      VisualSearchService.transformersPromise = (async () => {
        try {
          const mod = await (Function('return import("@xenova/transformers")')() as Promise<any>);
          return {
            pipeline: mod.pipeline,
            RawImage: mod.RawImage,
          };
        } catch (err) {
          console.warn("[VisualSearchService] Could not import @xenova/transformers:", err);
          return null;
        }
      })();
    }
    return VisualSearchService.transformersPromise;
  }

  /**
   * Lazy load the quantized CLIP Vision Transformer model
   */
  private static async getExtractor(): Promise<any> {
    if (!VisualSearchService.extractorPromise) {
      VisualSearchService.extractorPromise = (async () => {
        const tf = await VisualSearchService.getTransformers();
        if (!tf) return null;
        return tf.pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
          quantized: true,
        });
      })().catch((err) => {
        console.warn("[VisualSearchService] Failed to load CLIP model, will use fallback extractor:", err);
        VisualSearchService.extractorPromise = null;
        return null;
      });
    }
    return VisualSearchService.extractorPromise;
  }


  /**
   * Helper to resolve an image path or URL into a local Buffer
   */
  private async getImageBuffer(imageInput: Buffer | string): Promise<Buffer> {
    if (Buffer.isBuffer(imageInput)) {
      return imageInput;
    }

    if (typeof imageInput === "string") {
      // 1. Check if data URI
      if (imageInput.startsWith("data:")) {
        const base64Data = imageInput.split(",")[1];
        return Buffer.from(base64Data, "base64");
      }

      // 2. Check if local path (/uploads/...) or relative/absolute path
      const cleanedPath = imageInput.startsWith("/") ? imageInput.slice(1) : imageInput;
      const cwdUploadsPath = path.resolve(process.cwd(), cleanedPath);
      if (fs.existsSync(cwdUploadsPath)) {
        return fs.promises.readFile(cwdUploadsPath);
      }

      const directPath = path.resolve(cleanedPath);
      if (fs.existsSync(directPath)) {
        return fs.promises.readFile(directPath);
      }

      const uploadsSubpath = path.resolve(process.cwd(), "uploads", path.basename(imageInput));
      if (fs.existsSync(uploadsSubpath)) {
        return fs.promises.readFile(uploadsSubpath);
      }

      // 3. Check if HTTP / HTTPS URL
      if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
        const response = await fetch(imageInput);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    throw new Error("Invalid image input: unable to load image data.");
  }

  /**
   * Decodes image Buffer (JPEG, PNG, etc.) into raw RGBA pixel data for fallback
   */
  private decodeImage(buffer: Buffer): { data: Uint8Array | Buffer; width: number; height: number } {
    try {
      const decodedJpeg = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 128 });
      if (decodedJpeg && decodedJpeg.data && decodedJpeg.width > 0 && decodedJpeg.height > 0) {
        return {
          data: decodedJpeg.data,
          width: decodedJpeg.width,
          height: decodedJpeg.height,
        };
      }
    } catch {
      // Not a valid JPEG
    }

    try {
      const png = PNG.sync.read(buffer);
      if (png && png.data && png.width > 0 && png.height > 0) {
        return {
          data: png.data,
          width: png.width,
          height: png.height,
        };
      }
    } catch {
      // Not a valid PNG
    }

    const fallbackSize = Math.max(16, Math.floor(Math.sqrt(buffer.length / 4)));
    return {
      data: buffer,
      width: fallbackSize,
      height: fallbackSize,
    };
  }

  /**
   * Fallback visual feature descriptor (512 dimensions) if CLIP is loading
   */
  private extractFallbackEmbedding(buffer: Buffer): number[] {
    const { data, width, height } = this.decodeImage(buffer);
    const vector = new Array<number>(this.EMBEDDING_DIMENSION).fill(0);
    const GRID_SIZE = 4;
    const cellWidth = Math.max(1, Math.floor(width / GRID_SIZE));
    const cellHeight = Math.max(1, Math.floor(height / GRID_SIZE));
    const colorMomentsPerCell = 24;
    const edgeBinsPerCell = 8;

    const getPixel = (x: number, y: number): [number, number, number] => {
      const clX = Math.min(width - 1, Math.max(0, x));
      const clY = Math.min(height - 1, Math.max(0, y));
      const idx = (clY * width + clX) * 4;
      if (idx + 2 < data.length) {
        return [data[idx], data[idx + 1], data[idx + 2]];
      }
      return [128, 128, 128];
    };

    const getLuminance = (r: number, g: number, b: number): number => {
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const cellIndex = gy * GRID_SIZE + gx;
        const startX = gx * cellWidth;
        const startY = gy * cellHeight;
        const endX = Math.min(width, startX + cellWidth);
        const endY = Math.min(height, startY + cellHeight);

        let sumR = 0, sumG = 0, sumB = 0, sumH = 0, sumS = 0, sumV = 0, cellPixels = 0;
        const cellColorHist = new Array(18).fill(0);

        for (let y = startY; y < endY; y += 2) {
          for (let x = startX; x < endX; x += 2) {
            const [r, g, b] = getPixel(x, y);
            const rn = r / 255, gn = g / 255, bn = b / 255;
            sumR += rn; sumG += gn; sumB += bn;

            const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), delta = max - min;
            let h = 0;
            if (delta > 0) {
              if (max === rn) h = ((gn - bn) / delta) % 6;
              else if (max === gn) h = (bn - rn) / delta + 2;
              else h = (rn - gn) / delta + 4;
              h = Math.round(h * 60);
              if (h < 0) h += 360;
            }
            const s = max === 0 ? 0 : delta / max;
            const v = max;

            sumH += h / 360; sumS += s; sumV += v;
            const hBin = Math.min(7, Math.floor((h / 360) * 8));
            const sBin = Math.min(3, Math.floor(s * 4));
            const vBin = Math.min(3, Math.floor(v * 4));

            cellColorHist[hBin]++;
            cellColorHist[8 + sBin]++;
            cellColorHist[12 + vBin]++;
            if (rn > gn && rn > bn) cellColorHist[16]++;
            if (bn > rn && bn > gn) cellColorHist[17]++;
            cellPixels++;
          }
        }

        const safeCellPixels = Math.max(1, cellPixels);
        const cellOffset = cellIndex * colorMomentsPerCell;
        vector[cellOffset] = sumR / safeCellPixels;
        vector[cellOffset + 1] = sumG / safeCellPixels;
        vector[cellOffset + 2] = sumB / safeCellPixels;
        vector[cellOffset + 3] = sumH / safeCellPixels;
        vector[cellOffset + 4] = sumS / safeCellPixels;
        vector[cellOffset + 5] = sumV / safeCellPixels;
        for (let i = 0; i < 18; i++) {
          vector[cellOffset + 6 + i] = cellColorHist[i] / safeCellPixels;
        }
      }
    }

    const edgeOffset = 16 * colorMomentsPerCell;
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const cellIndex = gy * GRID_SIZE + gx;
        const startX = gx * cellWidth;
        const startY = gy * cellHeight;
        const endX = Math.min(width - 1, startX + cellWidth);
        const endY = Math.min(height - 1, startY + cellHeight);

        const edgeHistogram = new Array(edgeBinsPerCell).fill(0);
        let edgeSamples = 0;

        for (let y = startY + 1; y < endY; y += 2) {
          for (let x = startX + 1; x < endX; x += 2) {
            const [rL, gL, bL] = getPixel(x - 1, y);
            const [rR, gR, bR] = getPixel(x + 1, y);
            const [rT, gT, bT] = getPixel(x, y - 1);
            const [rB, gB, bB] = getPixel(x, y + 1);

            const dx = (getLuminance(rR, gR, bR) - getLuminance(rL, gL, bL)) / 255;
            const dy = (getLuminance(rB, gB, bB) - getLuminance(rT, gT, bT)) / 255;

            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude > 0.05) {
              let angle = Math.atan2(dy, dx);
              if (angle < 0) angle += Math.PI;
              const bin = Math.min(edgeBinsPerCell - 1, Math.floor((angle / Math.PI) * edgeBinsPerCell));
              edgeHistogram[bin] += magnitude;
            }
            edgeSamples++;
          }
        }

        const safeSamples = Math.max(1, edgeSamples);
        const cellEdgeOffset = edgeOffset + cellIndex * edgeBinsPerCell;
        for (let b = 0; b < edgeBinsPerCell; b++) {
          vector[cellEdgeOffset + b] = edgeHistogram[b] / safeSamples;
        }
      }
    }

    let sumSquares = 0;
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      sumSquares += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSquares);
    if (norm > 0) {
      for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
        vector[i] = vector[i] / norm;
      }
    }
    return vector;
  }

  /**
   * Extracts a 512-dimensional L2-normalized deep visual embedding vector from an image using CLIP
   */
  public async extractImageEmbedding(imageInput: Buffer | string): Promise<number[]> {
    const buffer = await this.getImageBuffer(imageInput);

    try {
      const tf = await VisualSearchService.getTransformers();
      const extractor = await VisualSearchService.getExtractor();

      if (tf && tf.RawImage && extractor) {
        // Load image into RawImage for transformers.js
        const uint8 = new Uint8Array(buffer);
        const blob = new Blob([uint8]);
        const rawImage = await tf.RawImage.fromBlob(blob);

        // Run CLIP feature extraction
        const output = await extractor(rawImage);
        if (output && output.data) {
          const rawVector = Array.from(output.data) as number[];

          // Normalize vector to unit sphere
          let sumSquares = 0;
          for (let i = 0; i < rawVector.length; i++) {
            sumSquares += rawVector[i] * rawVector[i];
          }
          const norm = Math.sqrt(sumSquares);
          if (norm > 0) {
            return rawVector.map((x) => x / norm);
          }
          return rawVector;
        }
      }
    } catch (clipErr) {
      console.warn("[VisualSearchService] CLIP feature extraction error, using fallback:", clipErr);
    }

    // Fallback to spatial feature extractor if CLIP model unavailable
    return this.extractFallbackEmbedding(buffer);
  }

  /**
   * Computes cosine similarity between two unit-normalized vectors (dot product)
   */
  public calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    // Return value in range 0.0 to 1.0
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }

  /**
   * Finds similar products from the database given a query image vector
   */
  public async findSimilarProducts(
    queryVector: number[],
    filters: VisualSearchFilterOptions = {}
  ): Promise<MatchedProductResult[]> {
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const minThreshold = filters.threshold !== undefined ? filters.threshold : 0.90;

    // 1. Fetch products with embeddings matching catalog filters
    const productWhere: any = {
      isActive: true,
    };

    if (filters.categoryId || filters.categorySlug) {
      const identifier = filters.categoryId || filters.categorySlug;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier!);

      const category = await prisma.category.findUnique({
        where: isUuid ? { id: identifier } : { slug: identifier },
        include: { children: { select: { id: true } } },
      });

      if (category) {
        const categoryIds = [category.id, ...category.children.map((c) => c.id)];
        productWhere.categoryId = { in: categoryIds };
      } else if (filters.categoryId) {
        productWhere.categoryId = filters.categoryId;
      }
    }

    if (filters.inStockOnly) {
      productWhere.stock = { gt: 0 };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      productWhere.price = {};
      if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice))) {
        productWhere.price.gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice))) {
        productWhere.price.lte = Number(filters.maxPrice);
      }
    }

    // Retrieve all embeddings for active products
    const embeddings = await (prisma as any).productEmbedding.findMany({
      where: {
        product: productWhere,
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // 2. Score and rank products
    const productScoreMap = new Map<string, { product: any; similarity: number; matchedImage: string }>();

    for (const emb of embeddings) {
      if (!emb.vector || emb.vector.length === 0) continue;

      const score = this.calculateCosineSimilarity(queryVector, emb.vector);

      const existing = productScoreMap.get(emb.productId);
      if (!existing || score > existing.similarity) {
        productScoreMap.set(emb.productId, {
          product: emb.product,
          similarity: score,
          matchedImage: emb.imageUrl,
        });
      }
    }

    // 3. Filter by threshold and sort by highest similarity
    const sortedResults = Array.from(productScoreMap.values())
      .filter((item) => item.similarity >= minThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return sortedResults;
  }

  /**
   * Generates and saves embeddings for all images of a product
   */
  public async indexProductEmbeddings(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        thumbnail: true,
        images: true,
      },
    });

    if (!product) return 0;

    let variants: Array<{ thumbnail?: string | null; images?: string[] }> = [];
    try {
      if ((prisma as any).productVariant) {
        variants = await (prisma as any).productVariant.findMany({
          where: { productId },
          select: { thumbnail: true, images: true },
        });
      }
    } catch {
      variants = [];
    }

    const allImages = new Set<string>();
    if (product.thumbnail) allImages.add(product.thumbnail);
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (img) allImages.add(img);
      });
    }

    if (Array.isArray(variants)) {
      variants.forEach((v) => {
        if (v.thumbnail) allImages.add(v.thumbnail);
        if (Array.isArray(v.images)) {
          v.images.forEach((img: string) => {
            if (img) allImages.add(img);
          });
        }
      });
    }

    let count = 0;
    for (const imageUrl of allImages) {
      try {
        const vector = await this.extractImageEmbedding(imageUrl);
        if (vector && vector.length === this.EMBEDDING_DIMENSION) {
          const existing = await (prisma as any).productEmbedding.findFirst({
            where: {
              productId: product.id,
              imageUrl,
            },
          });

          if (existing) {
            await (prisma as any).productEmbedding.update({
              where: { id: existing.id },
              data: {
                vector,
                modelName: this.MODEL_NAME,
                dimension: this.EMBEDDING_DIMENSION,
              },
            });
          } else {
            await (prisma as any).productEmbedding.create({
              data: {
                productId: product.id,
                imageUrl,
                vector,
                modelName: this.MODEL_NAME,
                dimension: this.EMBEDDING_DIMENSION,
              },
            });
          }
          count++;
        }
      } catch (err) {
        console.warn(`[VisualSearchService] Could not generate embedding for product ${product.id} image ${imageUrl}:`, err);
      }
    }

    return count;
  }

  /**
   * Sync embeddings for all products in catalog
   */
  public async syncAllProductEmbeddings(): Promise<{ indexedCount: number; totalProducts: number }> {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, thumbnail: true, images: true },
    });

    let totalIndexed = 0;
    for (const prod of products) {
      const indexedForProd = await this.indexProductEmbeddings(prod.id);
      totalIndexed += indexedForProd;
    }

    return {
      indexedCount: totalIndexed,
      totalProducts: products.length,
    };
  }
}

export default new VisualSearchService();
