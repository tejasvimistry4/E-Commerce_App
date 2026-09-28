import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import visualSearchService from "./modules/products/visualSearch.service";

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    // Check and sync product embeddings in background if needed
    visualSearchService
      .syncAllProductEmbeddings()
      .then((res) => {
        if (res.indexedCount > 0) {
          // console.log(
          //   `[VisualSearch] Initial sync completed: indexed ${res.indexedCount} images across ${res.totalProducts} products.`
          // );
        }
      })
      .catch((err) => {
        console.warn("[VisualSearch] Initial embedding sync error:", err);
      });

    app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `Server running at http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
