import { Router } from 'express';
import { getRemitos, getRemitoByNroRemito, createRemito } from '../controllers/remitoController.js';

const router = Router();

// Ruta para obtener todos los remitos
router.get('/', getRemitos);
router.post('/', createRemito);
router.get('/:nro_remito', getRemitoByNroRemito);

export default router;  