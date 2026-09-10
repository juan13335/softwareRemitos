import { supabase } from '../config/supabase.js'

//GET api/socios
export const getSocios = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('socios')
            .select('*');

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/socios - Crear un socio
export const createSocio = async (req, res) => {
    try {
        const { nombre, telefono } = req.body;

        // Validación simple
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del socio es obligatorio' });
        }

        const { data, error } = await supabase
            .from('socios')
            .insert([
                {
                    nombre: nombre.trim(),
                    telefono: telefono ? telefono.trim() : null
                }
            ])
            .select()
            .single(); // Devuelve el objeto recién creado en vez de un array

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// PUT /api/socios/:id - Editar un socio existente
export const updateSocio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'El ID del socio es obligatorio' });
        }

        const datosActualizar = {};
        if (nombre !== undefined) datosActualizar.nombre = nombre.trim();
        if (telefono !== undefined) datosActualizar.telefono = telefono ? telefono.trim() : null;

        const { data, error } = await supabase
            .from('socios')
            .update(datosActualizar)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Socio no encontrado' });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};