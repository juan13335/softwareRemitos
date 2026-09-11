import { Router } from "express";
import { getProductos, createProducto } from "../controllers/productosControllers.js";


const router = Router();

// Ruta para obtener todos los productos
router.get("/", getProductos);
router.post("/", createProducto);
export default router;