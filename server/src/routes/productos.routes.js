import { Router } from "express";
import { getProductos, createProducto, desactivarProducto } from "../controllers/productosControllers.js";


const router = Router();

// Ruta para obtener todos los productos
router.get("/", getProductos);
router.post("/", createProducto);
router.put("/:id/desactivar", desactivarProducto);
export default router;