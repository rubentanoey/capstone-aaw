import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import cors from "cors";

import productRoutes from "@src/product/product.routes";
import productRoutesV2 from "@src/product/product.routes.v2";
import categoryRoutesV2 from "@src/product/category.routes.v2";

import express_prom_bundle from "express-prom-bundle";

const app: Express = express();

// Prometheus metrics middleware
const metricsMiddleware = express_prom_bundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: "marketplace-products" },
  promClient: {
    collectDefaultMetrics: {},
  },
});

// Middleware
app.use(metricsMiddleware);
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/product", productRoutes);
app.use("/api/v2/products", productRoutesV2);
app.use("/api/v2/categories", categoryRoutesV2);

// Health check endpoint
app.get("/health", (_, res) => {
  res.status(200).json({ status: "healthy" });
});

// Root endpoint
app.get("/", (_, res) => {
  res.status(200).json({
    message: "Marketplace Products API",
    version: "1.0.0",
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Not Found",
    path: req.path,
  });
});

const PORT = process.env.PORT ?? 8002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
