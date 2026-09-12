import { Router } from 'express';
import { getSocios, createSocio, updateSocio, getAnticipoSocio} from '../controllers/sociosController.js';

const router = Router();

// Ruta para obtener todos los socios
router.get('/', getSocios);
router.get('/anticipo/:socio_id', getAnticipoSocio);
router.post('/', createSocio);
router.put('/:id', updateSocio);


export default router;