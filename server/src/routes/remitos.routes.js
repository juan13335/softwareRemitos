import { Router } from 'express';
import { getRemitos, getRemitoById, createRemito, deleteRemito } from '../controllers/remitoController.js';

const router = Router();

// Ruta para obtener todos los remitos
router.get('/', getRemitos);
router.post('/', createRemito);
router.get('/:id', getRemitoById);
router.delete('/:id', deleteRemito);
export default router;  