import { Router } from 'express';
import { getRemitos, getRemitoById, createRemito, deleteRemito, getRemitosBySocio } from '../controllers/remitoController.js';

const router = Router();

// Ruta para obtener todos los remitos
router.get('/', getRemitos);
router.get('/:socio_id', getRemitosBySocio);
router.post('/', createRemito);
router.get('/detalle/:id', getRemitoById);
router.delete('/:id', deleteRemito);
export default router;  