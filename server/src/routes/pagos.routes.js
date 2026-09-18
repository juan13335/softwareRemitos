import { Router } from "express";
import { createPago, getPagos, anularPago } from "../controllers/pagosControllers.js";


const router = Router();

// Ruta para obtener todos los pagos
router.get("/", getPagos);
router.post("/", createPago);
router.patch("/anular/:id", anularPago); // modifica unicamente los campos especificados en el controller
export default router;