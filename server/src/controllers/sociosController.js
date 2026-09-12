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


export const getAnticipoSocio = async (req, res) => {
  const { socio_id } = req.params;

  if (!socio_id) {
    return res.status(400).json({ error: "El socio_id es obligatorio." });
  }

  try {
    const { data, error } = await supabase
      .from("v_socios_saldo_a_favor")
      .select("socio_id, total_pagado, total_imputado, saldo_a_favor")
      .eq("socio_id", socio_id)
      .maybeSingle();

    if (error) throw error;

    // Si el socio no tiene movimientos en la vista, su saldo es 0
    const saldo = Number(data?.saldo_a_favor || 0);

    return res.status(200).json({
      socio_id,
      saldo_a_favor: saldo,
      total_pagado: Number(data?.total_pagado || 0),
      total_imputado: Number(data?.total_imputado || 0),
    });
  } catch (error) {
    console.error("Error al obtener anticipo del socio:", error);
    return res.status(500).json({
      error: error.message || "Error interno al consultar el saldo a favor.",
    });
  }
};

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