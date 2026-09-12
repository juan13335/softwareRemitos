import { Router } from "express";
import { createPago } from "../controllers/pagosControllers.js";


const router = Router();

// Ruta para obtener todos los pagos
//router.get("/", getPagos);
router.post("/", createPago);
export default router;