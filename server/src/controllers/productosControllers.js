import { supabase } from "../config/supabase.js";

// GET /api/productos - Listado de productos activos
export const getProductos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio_referencia")
      .order("nombre", { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/productos 
export const createProducto = async (req, res) => {
  try {
    const { socio_id, nombre, codigo, precio_referencia, activo } = req.body;

    const { data, error } = await supabase
      .from("productos")
      .insert([
        {
          socio_id,
          nombre,
          codigo,
          precio_referencia,
          activo: activo ?? true,
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error en createProducto:", error);
    return res.status(500).json({ error: error.message });
  }
};