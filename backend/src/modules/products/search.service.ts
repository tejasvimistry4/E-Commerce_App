import { prisma } from "../../config/prisma";
import cacheService from "../../services/cache.service";
import {
  ProductQueryFilters,
  SearchFacetsResponse,
  SearchSuggestionsResponse,
  SuggestionProductItem,
} from "./product.types";

/**
 * Levenshtein distance calculation for typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          Math.min(
            matrix[j][i - 1] + 1, // insertion
            matrix[j - 1][i] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[bn][an];
}

export class SearchService {
  private dynamicVocabulary: Set<string> = new Set();
  private lastVocabFetch = 0;

  /**
   * Dynamically extracts and caches all unique catalog vocabulary tokens directly from
   * active Products, Categories, Brands, and Variant Attributes in PostgreSQL & Redis.
   */
  async getCatalogVocabulary(): Promise<string[]> {
    const cacheKey = "search:catalog_vocabulary";

    // 1. Return in-memory cached Set if fresh (< 5 minutes)
    if (this.dynamicVocabulary.size > 0 && Date.now() - this.lastVocabFetch < 5 * 60 * 1000) {
      return Array.from(this.dynamicVocabulary);
    }

    // 2. Check Redis cache
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached && cached.length > 0) {
      this.dynamicVocabulary = new Set(cached);
      this.lastVocabFetch = Date.now();
      return cached;
    }

    // 3. Extract dynamically from PostgreSQL database
    try {
      const [products, categories] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: {
            name: true,
            description: true,
            sku: true,
            variants: {
              where: { isActive: true },
              select: { attributes: true },
            },
          },
        }),
        prisma.category.findMany({
          where: { isActive: true },
          select: { name: true, slug: true },
        }),
      ]);

      const vocabSet = new Set<string>();

      const addTokens = (text?: string | null) => {
        if (!text) return;
        const cleaned = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
        const words = cleaned.split(/[\s-]+/).map((w) => w.trim()).filter((w) => w.length >= 3);

        words.forEach((w) => {
          vocabSet.add(w);
          // Add de-pluralized version if applicable (e.g. sneakers -> sneaker, watches -> watch)
          if (w.endsWith("es") && w.length > 4) {
            vocabSet.add(w.slice(0, -2));
          } else if (w.endsWith("s") && w.length > 3) {
            vocabSet.add(w.slice(0, -1));
          }
        });

        // Add hyphenated phrases like "t-shirt"
        const hyphenMatches = text.toLowerCase().match(/[a-z0-9]+-[a-z0-9]+/g);
        if (hyphenMatches) {
          hyphenMatches.forEach((h) => vocabSet.add(h));
        }
      };

      categories.forEach((cat) => {
        addTokens(cat.name);
        addTokens(cat.slug);
      });

      products.forEach((prod) => {
        addTokens(prod.name);
        addTokens(prod.sku);
        const brand = this.extractBrand(prod);
        if (brand && brand !== "Generic") {
          addTokens(brand);
        }
        prod.variants?.forEach((v) => {
          if (v.attributes && typeof v.attributes === "object") {
            Object.values(v.attributes).forEach((val) => {
              if (typeof val === "string") addTokens(val);
            });
          }
        });
      });

      const vocabArray = Array.from(vocabSet);
      this.dynamicVocabulary = vocabSet;
      this.lastVocabFetch = Date.now();

      // Cache dynamic vocabulary in Redis / Memory for 5 minutes (300s)
      await cacheService.set(cacheKey, vocabArray, 300);

      return vocabArray;
    } catch (err: any) {
      console.warn("Failed to generate dynamic catalog vocabulary from DB:", err.message);
      return Array.from(this.dynamicVocabulary);
    }
  }

  /**
   * Find closest catalog keyword for typo tolerance using dynamic DB & Redis vocabulary
   */
  async findTypoCorrection(query: string): Promise<string | null> {
    const term = query.trim().toLowerCase();
    if (!term || term.length < 3) return null;

    const vocabulary = await this.getCatalogVocabulary();
    if (!vocabulary || vocabulary.length === 0) return null;

    let bestMatch: string | null = null;
    let lowestDist = Infinity;

    for (const kw of vocabulary) {
      if (kw === term) return null; // Exact match, no typo

      // Direct consonant/vowel abbreviation check (e.g. "snkr" -> "sneaker", "iphne" -> "iphone", "tshrt" -> "t-shirt")
      const termWithoutVowels = term.replace(/[^a-z0-9]/g, "").replace(/[aeiou]/g, "");
      const kwWithoutVowels = kw.replace(/[^a-z0-9]/g, "").replace(/[aeiou]/g, "");
      if (termWithoutVowels.length >= 3 && termWithoutVowels === kwWithoutVowels) {
        return kw;
      }

      if (kw.includes(term) || term.includes(kw)) continue; // Substring match

      const dist = levenshteinDistance(term, kw);
      // Allow 1 edit for words <= 4 chars, 2 edits for longer words
      const maxAllowed = term.length <= 4 ? 1 : 2;

      if (dist <= maxAllowed && dist < lowestDist) {
        lowestDist = dist;
        bestMatch = kw;
      }
    }

    return bestMatch;
  }

  /**
   * Extract Brand from product name or variant attributes
   */
  extractBrand(product: { name: string; variants?: Array<{ attributes: any }> }): string {
    // 1. Check variant attributes for Brand / brand
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        if (v.attributes && typeof v.attributes === "object") {
          const brandKey = Object.keys(v.attributes).find(
            (k) => k.toLowerCase() === "brand"
          );
          if (brandKey && v.attributes[brandKey]) {
            return String(v.attributes[brandKey]).trim();
          }
        }
      }
    }

    // 2. Common brand keywords matching title
    const commonBrands = [
      "Apple", "Samsung", "Sony", "Dell", "HP", "Lenovo", "Asus",
      "Nike", "Adidas", "Puma", "Artisan", "UltraBook", "Classic", "Modern",
    ];

    for (const b of commonBrands) {
      if (new RegExp(`\\b${b}\\b`, "i").test(product.name)) {
        return b;
      }
    }

    // 3. Default first capitalized word if length > 2
    const firstWord = product.name.split(" ")[0];
    if (firstWord && firstWord.length > 2 && /^[A-Z]/.test(firstWord)) {
      return firstWord;
    }

    return "Generic";
  }

  /**
   * Main Advanced Multi-Field Search and Filter
   */
  async searchProducts(filters: ProductQueryFilters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

    // Build Cache Key for fast Redis lookup
    const cacheKey = `search:products:${JSON.stringify(filters)}:p${page}:l${limit}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Track search query if present
    if (filters.search && filters.search.trim()) {
      cacheService.trackSearchQuery(filters.search.trim()).catch(() => { });
    }

    // Build Prisma `where` clause
    const where: any = {
      isActive: filters.isActive !== undefined ? Boolean(filters.isActive) : true,
    };

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = Boolean(filters.isFeatured);
    }

    // Category filter with hierarchy support
    if (filters.categoryId || filters.categorySlug) {
      const identifier = filters.categoryId || filters.categorySlug;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier!);

      const category = await prisma.category.findUnique({
        where: isUuid ? { id: identifier } : { slug: identifier },
        include: { children: { select: { id: true } } },
      });

      if (category) {
        const categoryIds = [category.id, ...category.children.map((c) => c.id)];
        where.categoryId = { in: categoryIds };
      } else if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
    }

    // Stock Filter
    if (filters.inStockOnly) {
      where.stock = { gt: 0 };
    }

    // Price Filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice))) {
        where.price.gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice))) {
        where.price.lte = Number(filters.maxPrice);
      }
    }

    // Search query: Text search across fields & tokenized keywords
    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      const tokens = search.split(/\s+/).filter((t) => t.length > 0);

      const searchConditions: any[] = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        { vendor: { businessName: { contains: search, mode: "insensitive" } } },
        { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      ];

      // Add token conditions for multi-word queries
      if (tokens.length > 1) {
        const tokenAnds = tokens.map((token) => ({
          OR: [
            { name: { contains: token, mode: "insensitive" } },
            { description: { contains: token, mode: "insensitive" } },
            { category: { name: { contains: token, mode: "insensitive" } } },
          ],
        }));
        searchConditions.push({ AND: tokenAnds });
      }

      where.OR = searchConditions;
    }

    // Fetch products matching base filters
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute average ratings, discount percentage, and brand
    let enriched = products.map((p) => {
      const reviewCount = p.reviews.length;
      const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

      const discountPercent =
        p.comparePrice && p.comparePrice > p.price
          ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
          : 0;

      const brand = this.extractBrand(p);

      return {
        ...p,
        averageRating,
        reviewCount,
        discountPercent,
        brand,
      };
    });

    // In-memory filters for dynamic attributes, rating, discount, brand

    // 1. Brand Filter
    if (filters.brand && filters.brand.trim()) {
      const targetBrand = filters.brand.trim().toLowerCase();
      enriched = enriched.filter(
        (p) =>
          p.brand.toLowerCase() === targetBrand ||
          p.name.toLowerCase().includes(targetBrand) ||
          p.variants.some((v) =>
            Object.values(v.attributes as Record<string, any>).some((val) =>
              String(val).toLowerCase() === targetBrand
            )
          )
      );
    }

    // 2. Minimum Rating Filter
    if (filters.minRating !== undefined && !isNaN(Number(filters.minRating))) {
      const targetRating = Number(filters.minRating);
      enriched = enriched.filter((p) => p.averageRating >= targetRating);
    }

    // 3. Minimum Discount Filter
    if (filters.minDiscount !== undefined && !isNaN(Number(filters.minDiscount))) {
      const targetDiscount = Number(filters.minDiscount);
      enriched = enriched.filter((p) => p.discountPercent >= targetDiscount);
    }

    // 4. Color, Size, Material shorthand filters
    if (filters.color && filters.color.trim()) {
      const targetColor = filters.color.trim().toLowerCase();
      enriched = enriched.filter((p) =>
        p.variants.some((v) => {
          const attrs = (v.attributes || {}) as Record<string, any>;
          const colorVal = attrs.Color || attrs.color || attrs.Colour || attrs.colour;
          return colorVal && String(colorVal).toLowerCase() === targetColor;
        })
      );
    }

    if (filters.size && filters.size.trim()) {
      const targetSize = filters.size.trim().toLowerCase();
      enriched = enriched.filter((p) =>
        p.variants.some((v) => {
          const attrs = (v.attributes || {}) as Record<string, any>;
          const sizeVal = attrs.Size || attrs.size;
          return sizeVal && String(sizeVal).toLowerCase() === targetSize;
        })
      );
    }

    if (filters.material && filters.material.trim()) {
      const targetMaterial = filters.material.trim().toLowerCase();
      enriched = enriched.filter((p) =>
        p.variants.some((v) => {
          const attrs = (v.attributes || {}) as Record<string, any>;
          const matVal = attrs.Material || attrs.material;
          return matVal && String(matVal).toLowerCase().includes(targetMaterial);
        })
      );
    }

    // 5. Universal Dynamic Attributes Filter
    if (filters.attributes && typeof filters.attributes === "object") {
      const attrFilters = Object.entries(filters.attributes);
      for (const [key, value] of attrFilters) {
        if (!value) continue;
        const normalizedKey = key.trim().toLowerCase();
        const targetValues = Array.isArray(value)
          ? value.map((v) => String(v).trim().toLowerCase())
          : [String(value).trim().toLowerCase()];

        enriched = enriched.filter((p) => {
          const matchesDescOrName = targetValues.some(
            (tv) =>
              p.description?.toLowerCase().includes(tv) ||
              p.name.toLowerCase().includes(tv)
          );

          const matchesVariants = p.variants.some((v) => {
            const attrs = (v.attributes || {}) as Record<string, any>;
            const matchingAttrKey = Object.keys(attrs).find(
              (k) => k.toLowerCase() === normalizedKey
            );
            if (!matchingAttrKey) return false;
            const attrVal = String(attrs[matchingAttrKey]).toLowerCase();
            return targetValues.some(
              (tv) => attrVal === tv || attrVal.includes(tv) || tv.includes(attrVal)
            );
          });

          return matchesVariants || matchesDescOrName;
        });
      }
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

    enriched.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "rating") {
        comparison = (a.averageRating || 0) - (b.averageRating || 0);
      } else if (sortBy === "discount") {
        comparison = (a.discountPercent || 0) - (b.discountPercent || 0);
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "stock") {
        comparison = a.stock - b.stock;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = enriched.length;
    const paginatedProducts = enriched.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    // Did you mean typo check
    let didYouMean: string | null = null;
    if (filters.search && total === 0) {
      didYouMean = await this.findTypoCorrection(filters.search);
    }

    const response = {
      products: paginatedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      didYouMean,
    };

    // Cache search response for 60 seconds
    await cacheService.set(cacheKey, response, 60);

    return response;
  }

  /**
   * Compute dynamic search facets for sidebar filters
   */
  async getSearchFacets(filters: ProductQueryFilters = {}): Promise<SearchFacetsResponse> {
    const cacheKey = `search:facets:${JSON.stringify(filters)}`;
    const cached = await cacheService.get<SearchFacetsResponse>(cacheKey);
    if (cached) return cached;

    // Base query for facet calculation
    const where: any = {
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
        where.categoryId = { in: categoryIds };
      }
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const allProducts = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    let minPrice = Infinity;
    let maxPrice = 0;

    const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    const brandMap = new Map<string, number>();
    const attributeMap = new Map<string, Map<string, number>>();

    const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const discountCounts = { tenOrMore: 0, twentyOrMore: 0, thirtyOrMore: 0, fiftyOrMore: 0 };

    for (const p of allProducts) {
      if (p.price < minPrice) minPrice = p.price;
      if (p.price > maxPrice) maxPrice = p.price;

      // Category counts
      if (p.category) {
        const cat = categoryMap.get(p.category.id) || {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          count: 0,
        };
        cat.count++;
        categoryMap.set(p.category.id, cat);
      }

      // Brand counts
      const brand = this.extractBrand(p);
      brandMap.set(brand, (brandMap.get(brand) || 0) + 1);

      // Discount counts
      if (p.comparePrice && p.comparePrice > p.price) {
        const discount = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
        if (discount >= 10) discountCounts.tenOrMore++;
        if (discount >= 20) discountCounts.twentyOrMore++;
        if (discount >= 30) discountCounts.thirtyOrMore++;
        if (discount >= 50) discountCounts.fiftyOrMore++;
      }

      // Rating counts
      if (p.reviews.length > 0) {
        const avg = Math.round(
          p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        ) as 1 | 2 | 3 | 4 | 5;
        if (ratingCounts[avg] !== undefined) {
          ratingCounts[avg]++;
        }
      }

      // Variant Attributes extraction
      for (const v of p.variants) {
        if (v.attributes && typeof v.attributes === "object") {
          for (const [key, val] of Object.entries(v.attributes)) {
            if (!val || typeof val !== "string") continue;
            const trimmedKey = key.trim();
            const trimmedVal = val.trim();
            if (!trimmedVal || trimmedKey.toLowerCase() === "brand") continue;

            if (!attributeMap.has(trimmedKey)) {
              attributeMap.set(trimmedKey, new Map<string, number>());
            }
            const valMap = attributeMap.get(trimmedKey)!;
            valMap.set(trimmedVal, (valMap.get(trimmedVal) || 0) + 1);
          }
        }
      }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
    const brands = Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const attributes = Array.from(attributeMap.entries()).map(([name, valMap]) => ({
      name,
      values: Array.from(valMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
    }));

    const result: SearchFacetsResponse = {
      total: allProducts.length,
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === 0 ? 100000 : Math.ceil(maxPrice),
      },
      categories,
      brands,
      attributes,
      ratingCounts,
      discountCounts,
    };

    // Cache facets for 120 seconds
    await cacheService.set(cacheKey, result, 120);
    return result;
  }

  /**
   * Get search history for an authenticated user
   */
  async getUserSearchHistory(userId: string): Promise<string[]> {
    if (!userId) return [];
    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { query: true },
    });
    return history
      .map((h: { query: string }) => {
        const q = (h.query || "").trim();
        return q ? q.charAt(0).toUpperCase() + q.slice(1) : "";
      })
      .filter(Boolean);
  }

  /**
   * Save or update search query in authenticated user's search history
   */
  async addUserSearchHistory(userId: string, query: string): Promise<string[]> {
    const trimmed = (query || "").trim();
    if (!userId || !trimmed || trimmed.length < 2) {
      return this.getUserSearchHistory(userId);
    }

    try {
      const normalized = trimmed.toLowerCase();

      await prisma.searchHistory.upsert({
        where: {
          userId_query: {
            userId,
            query: normalized,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          userId,
          query: normalized,
        },
      });

      await cacheService.delByPattern("search:popular:*");
      await cacheService.delByPattern("search:suggestions:*");

      // Prune user history beyond 15 items to keep data tidy
      const allUserHistories = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });

      if (allUserHistories.length > 15) {
        const idsToDelete = allUserHistories.slice(15).map((h: { id: string }) => h.id);
        await prisma.searchHistory.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    } catch (err: any) {
      console.warn("Failed to add user search history:", err.message);
    }

    return this.getUserSearchHistory(userId);
  }

  /**
   * Remove a specific search term from authenticated user's history
   */
  async removeUserSearchHistory(userId: string, query: string): Promise<string[]> {
    const trimmed = (query || "").trim();
    if (!userId || !trimmed) {
      return this.getUserSearchHistory(userId);
    }

    try {
      await prisma.searchHistory.deleteMany({
        where: {
          userId,
          query: { equals: trimmed.toLowerCase(), mode: "insensitive" },
        },
      });
    } catch (err: any) {
      console.warn("Failed to remove user search history:", err.message);
    }

    return this.getUserSearchHistory(userId);
  }

  /**
   * Clear all search history for an authenticated user
   */
  async clearUserSearchHistory(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      await prisma.searchHistory.deleteMany({
        where: { userId },
      });
    } catch (err: any) {
      console.warn("Failed to clear user search history:", err.message);
    }
    return [];
  }

  /**
   * Checks if a search term is a valid, complete product name, category name, brand, or whole vocabulary word in the catalog.
   * Partial/incomplete fragments (e.g. 'wa', 'wat', 'watc', 'iph', 'snk') return false.
   */
  async isCompleteCatalogTerm(term: string): Promise<boolean> {
    const trimmed = (term || "").trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) return false;

    // 1. Check against dynamic catalog vocabulary extracted from DB & Redis
    const vocabulary = await this.getCatalogVocabulary();
    if (vocabulary.includes(trimmed)) {
      return true;
    }

    // 2. Check if it matches an exact category name or slug (case-insensitive)
    const matchingCategory = await prisma.category.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { equals: trimmed, mode: "insensitive" } },
          { slug: { equals: trimmed, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (matchingCategory) return true;

    // 3. Check if it matches an exact complete product name, slug, or SKU
    const matchingProduct = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { equals: trimmed, mode: "insensitive" } },
          { slug: { equals: trimmed, mode: "insensitive" } },
          { sku: { equals: trimmed, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (matchingProduct) return true;

    // 4. Check if the term exists as a complete standalone word inside any active product title
    const productsWithWord = await prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: trimmed, mode: "insensitive" },
      },
      take: 8,
      select: { name: true },
    });

    const wordRegex = new RegExp(`\\b${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    for (const p of productsWithWord) {
      if (wordRegex.test(p.name)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Dynamically fetch popular / trending search terms from real user search activity in Database
   * Only returns terms that have been searched by at least minThreshold (default 3) DIFFERENT users
   * and represent COMPLETE words or verified catalog product/category names.
   */
  async getDynamicPopularSearches(
    limit: number = 8,
    minThreshold: number = 3
  ): Promise<Array<{ query: string; count: number }>> {
    const cacheKey = `search:popular:dynamic:${limit}:${minThreshold}`;
    const cached = await cacheService.get<Array<{ query: string; count: number }>>(cacheKey);
    if (cached && cached.length > 0) return cached;

    const activityMap = new Map<string, number>();

    try {
      const dbSearchActivity = await prisma.searchHistory.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: {
          _count: {
            query: "desc",
          },
        },
        take: limit * 4,
      });

      for (const item of dbSearchActivity) {
        const q = item.query.trim().toLowerCase();
        const userCount = item._count.query;
        if (userCount >= minThreshold && (await this.isCompleteCatalogTerm(q))) {
          activityMap.set(q, userCount);
        }
      }
    } catch (err: any) {
      console.warn("Could not aggregate DB search activity:", err.message);
    }

    // Filter strictly for unique-user count >= minThreshold and sort descending
    const results: Array<{ query: string; count: number }> = Array.from(activityMap.entries())
      .filter(([_, count]) => count >= minThreshold)
      .map(([query, count]) => {
        const formatted = query.charAt(0).toUpperCase() + query.slice(1);
        return { query: formatted, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Cache dynamic popular searches for 60 seconds
    await cacheService.set(cacheKey, results, 60);
    return results;
  }

  /**
   * Fast Autocomplete & Live Search Suggestions
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
    const trimmed = (query || "").trim();
    const cacheKey = `search:suggestions:${trimmed.toLowerCase()}`;
    const cached = await cacheService.get<SearchSuggestionsResponse>(cacheKey);
    if (cached) return cached;

    const popular = await this.getDynamicPopularSearches(6, 3);
    const popularSearches = popular.map((p) => p.query);

    if (!trimmed) {
      return {
        query: "",
        products: [],
        categories: [],
        brands: [],
        popularSearches,
      };
    }

    // 1. Check Typo
    const didYouMean = await this.findTypoCorrection(trimmed);
    const effectiveQuery = trimmed;

    // 2. Query products (top 6 matches)
    const matchedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: effectiveQuery, mode: "insensitive" } },
          { description: { contains: effectiveQuery, mode: "insensitive" } },
          { category: { name: { contains: effectiveQuery, mode: "insensitive" } } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    const products: SuggestionProductItem[] = matchedProducts.map((p) => {
      const totalRating = p.reviews.reduce((s, r) => s + r.rating, 0);
      const averageRating = p.reviews.length > 0 ? Math.round((totalRating / p.reviews.length) * 10) / 10 : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        comparePrice: p.comparePrice,
        thumbnail: p.thumbnail || p.images[0] || null,
        categoryName: p.category?.name,
        averageRating,
        stock: p.stock,
      };
    });

    // 3. Query matching categories
    const matchedCategories = await prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: effectiveQuery, mode: "insensitive" },
      },
      take: 4,
      select: { id: true, name: true, slug: true },
    });

    // 4. Dynamic brand matching from matching products
    const brandProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: effectiveQuery, mode: "insensitive" } },
          { description: { contains: effectiveQuery, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: {
        name: true,
        variants: {
          select: { attributes: true },
        },
      },
    });

    const brandsSet = new Set<string>();
    for (const p of brandProducts) {
      const brand = this.extractBrand(p);
      if (brand && brand !== "Generic" && brand.toLowerCase().includes(effectiveQuery.toLowerCase())) {
        brandsSet.add(brand);
      }
    }
    const brands = Array.from(brandsSet);

    const response: SearchSuggestionsResponse = {
      query: trimmed,
      didYouMean,
      products,
      categories: matchedCategories,
      brands,
      popularSearches,
    };

    // Cache for 90 seconds
    await cacheService.set(cacheKey, response, 90);

    return response;
  }
}

export const searchService = new SearchService();
export default searchService;
