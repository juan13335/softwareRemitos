import { supabase } from '../config/supabase.js';
import { getPaginacion, respuestaPaginada } from '../utils/paginacion.js'
import { aplicarFiltrosRemitos } from '../utils/filtrado.js';


// GET /api/remitos - Lista todos los remitos con su socio y productos
export const getRemitos = async (req, res) => {
  try {
    const { page, limit, from, to } = getPaginacion(req.query, 10);
    const queryBase = supabase
      .from('v_remitos_con_totales')
      .select(`
    id,
    nro_remito,
    nro_factura,
    fecha,
    created_at,
    estado_cobro_cliente,
    total,
    total_imputado,
    saldo_pendiente,
    socio:socios (
      id,
      nombre,
      telefono
    ),
    items:remito_items_socio (
      id,
      producto_id,
      cantidad,
      precio_unitario,
      subtotal,
      producto:productos (
        nombre
      )
    )
  `, { count: "exact" });

    // 2. Le inyectamos los filtros SQL (WHERE)
    const queryFiltrada = aplicarFiltrosRemitos(queryBase, req.query);

    // 3. Ordenamos, paginamos y RECIÉN ACÁ disparamos a la base de datos con await
    const { data, count, error } = await queryFiltrada
      .order('fecha', { ascending: false })
      .range(from, to);

    const { data: totales, error: errTotales } = await supabase
      .from("v_metricas_dashboard")
      .select("*")
      .maybeSingle();

    if (errTotales) throw errTotales;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ ...respuestaPaginada(data, count, page, limit), totales });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getRemitosBySocio = async (req, res) => {
  const { socio_id } = req.params;

  if (!socio_id) {
    return res.status(400).json({ error: "El socio_id es obligatorio." });
  }

  try {
    const { data, error } = await supabase
      .from("v_remitos_con_totales")
      .select("*")
      .eq("socio_id", socio_id)
      .order("fecha", { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener remitos por socio:", error);
    return res.status(500).json({
      error: error.message || "Error interno al consultar los remitos.",
    });
  }
};

// GET /api/remitos/:id - Trae un solo remito por su UUID
export const getRemitoById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('v_remitos_con_totales')
      .select(`
        id,
        nro_remito,
        nro_factura,
        fecha,
        created_at,
        estado_cobro_cliente,
        total,
        total_imputado,
        saldo_pendiente,
        socio:socios (
          id,
          nombre,
          telefono
        ),
        items:remito_items_socio (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          producto:productos (
            nombre
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 es el código de PostgREST cuando .single() no encuentra filas
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Remito no encontrado' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/remitos - Crear remito con sus ítems
export const createRemito = async (req, res) => {
  try {
    const { socio_id, nro_remito, nro_factura, fecha, items } = req.body;

    if (!socio_id || !nro_remito) {
      return res.status(400).json({ error: 'socio_id y nro_remito son obligatorios' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El remito debe incluir al menos un ítem' });
    }

    // 1. Insertar la cabecera del remito
    const { data: remito, error: remitoError } = await supabase
      .from('remitos_socio')
      .insert([
        {
          socio_id,
          nro_remito: nro_remito.trim(),
          nro_factura: nro_factura ? nro_factura.trim() : null,
          fecha: fecha || new Date().toISOString().split('T')[0]
        }
      ])
      .select()
      .single();

    if (remitoError) {
      return res.status(500).json({ error: remitoError.message });
    }

    // 2. Preparar los ítems con el id del remito generado
    const itemsFormateados = items.map((item) => ({
      remito_id: remito.id,
      producto_id: item.producto_id,
      cantidad: Number(item.cantidad) || 0
    }));

    // 3. Insertar los ítems
    const { error: itemsError } = await supabase
      .from('remito_items_socio')
      .insert(itemsFormateados)
      .select(
        `id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal,
        producto:productos (
          nombre
        )`
      );

    if (itemsError) {
      return res.status(500).json({
        error: `Remito creado pero falló la carga de ítems: ${itemsError.message}`,
        remito_id: remito.id
      });
    }

    const { data: remitoConTotal, error: vistaError } = await supabase
      .from('v_remitos_con_totales') // El nombre exacto que le diste a tu vista
      .select('*')
      .eq('id', remito.id)
      .single();

    if (vistaError) {
      return res.status(500).json({ error: vistaError.message });
    }

    // 5. Devolver la respuesta con el total ya calculado
    return res.status(201).json({
      ...remitoConTotal,
      item: itemsFormateados
    })

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/remitos/:nro_remito
export const updateRemito = async (req, res) => {
  try {
    const { id } = req.params;
    const { socio_id, nro_remito, nro_factura, fecha, items } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Falta el ID del remito en la URL." });
    }

    // 1. Buscar remito directamente por UUID y chequear estado
    const { data: remitoExistente, error: busquedaError } = await supabase
      .from("remitos_socio")
      .select("id, socio_id, estado_cobro_cliente")
      .eq("id", id)
      .maybeSingle();

    if (busquedaError) return res.status(500).json({ error: busquedaError.message });

    if (!remitoExistente) {
      return res.status(404).json({ error: `No se encontró el remito con ID: ${id}` });
    }

    // REGLA: Solo se puede editar si sigue pendiente
    if (remitoExistente.estado_cobro_cliente !== "pendiente") {
      return res.status(400).json({
        error: "Solo podés editar remitos en estado 'pendiente'. Si ya tiene cobros imputados, primero anular el pago.",
      });
    }

    // 2. Actualizar cabecera si vinieron datos
    const datosCabecera = {};
    if (socio_id !== undefined) datosCabecera.socio_id = socio_id;
    if (nro_remito !== undefined) datosCabecera.nro_remito = nro_remito ? nro_remito.trim() : null;
    if (nro_factura !== undefined) datosCabecera.nro_factura = nro_factura ? nro_factura.trim() : null;
    if (fecha !== undefined) datosCabecera.fecha = fecha;

    if (Object.keys(datosCabecera).length > 0) {
      const { error: updateError } = await supabase
        .from("remitos_socio")
        .update(datosCabecera)
        .eq("id", id);

      if (updateError) return res.status(500).json({ error: updateError.message });
    }

    // 3. Manejo de ítems
    let itemsActualizados = null;
    if (items && Array.isArray(items)) {
      // Eliminar los ítems anteriores
      const { error: deleteError } = await supabase
        .from("remito_items_socio")
        .delete()
        .eq("remito_id", id);

      if (deleteError) return res.status(500).json({ error: deleteError.message });

      // Insertar los nuevos
      if (items.length > 0) {
        const itemsFormateados = items.map((item) => {
          const fila = {
            remito_id: id,
            producto_id: item.producto_id,
            cantidad: Number(item.cantidad) || 0,
          };
          if (item.precio_unitario !== undefined && item.precio_unitario !== null) {
            fila.precio_unitario = Number(item.precio_unitario);
          }
          return fila;
        });

        const { data: inserted, error: insertError } = await supabase
          .from("remito_items_socio")
          .insert(itemsFormateados)
          .select(`
            id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            producto:productos ( nombre )
          `);

        if (insertError) return res.status(500).json({ error: insertError.message });
        itemsActualizados = inserted;
      }
    } else {
      // Traer ítems existentes si no se modificaron
      const { data: itemsExistentes } = await supabase
        .from("remito_items_socio")
        .select(`
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          producto:productos ( nombre )
        `)
        .eq("remito_id", id);

      itemsActualizados = itemsExistentes;
    }

    // 4. Retornar remito completo con totales calculados
    const { data: remitoConTotal, error: vistaError } = await supabase
      .from("v_remitos_con_totales")
      .select("*")
      .eq("id", id)
      .single();

    if (vistaError) return res.status(500).json({ error: vistaError.message });

    return res.status(200).json({
      ...remitoConTotal,
      items: itemsActualizados,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// DELETE /api/remitos/:id - Elimina un remito y sus ítems asociados
export const deleteRemito = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Borramos los ítems vinculados primero (para evitar bloqueos por FK)
    const { error: errorItems } = await supabase
      .from("remito_items_socio")
      .delete()
      .eq("remito_id", id);

    if (errorItems) {
      return res.status(500).json({ error: errorItems.message });
    }

    // 2. Borramos la cabecera del remito
    const { data, error: errorRemito } = await supabase
      .from("remitos_socio")
      .delete()
      .eq("id", id)
      .select(); // .select() devuelve la fila que se acaba de eliminar

    if (errorRemito) {
      return res.status(500).json({ error: errorRemito.message });
    }

    // Si data viene vacío, significa que el UUID no existía en la base
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "El remito no existe o ya fue eliminado." });
    }

    return res.status(200).json({
      message: "Remito e ítems eliminados correctamente.",
      remitoEliminado: data[0],
    });
  } catch (error) {
    console.error("Error en deleteRemito:", error);
    return res.status(500).json({ error: error.message });
  }
};
