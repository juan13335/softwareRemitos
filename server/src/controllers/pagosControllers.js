import { supabase } from "../config/supabase.js";

export const registrarPago = async (req, res) => {
  const { socio_id, fecha_pago, monto_total, nro_comprobante, notas, lineas } = req.body;

  if (!socio_id) {
    return res.status(400).json({ error: "El socio es obligatorio." });
  }

  if (!Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: "Debés incluir al menos un remito a imputar." });
  }

  let pagoCreadoId = null;

  try {
    // 1. Insertar el comprobante general de pago
    const { data: pago, error: errPago } = await supabase
      .from("pagos_socio")
      .insert([
        {
          socio_id,
          fecha_pago: fecha_pago || new Date().toISOString().slice(0, 10),
          monto_total: Number(monto_total) || 0,
          nro_comprobante: nro_comprobante || null,
          notas: notas || null,
        },
      ])
      .select()
      .single();

    if (errPago) throw errPago;
    pagoCreadoId = pago.id;

    // 2. Insertar los detalles imputados
    // Al insertarse aquí, el trigger de la base calcula la suma y actualiza remitos_socio
    const lineasAInsertar = lineas.map((l) => ({
      pago_id: pagoCreadoId,
      remito_id: l.remito_id,
      monto_imputado: Number(l.monto_imputado),
      forma_pago: l.forma_pago ? l.forma_pago.toLowerCase() : null,
    }));

    const { error: errLineas } = await supabase
      .from("pago_remitos")
      .insert(lineasAInsertar);

    if (errLineas) throw errLineas;

    return res.status(201).json({
      mensaje: "Pago registrado con éxito",
      pago,
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);

    // Rollback si falló la inserción de líneas
    if (pagoCreadoId) {
      await supabase.from("pagos_socio").delete().eq("id", pagoCreadoId);
    }

    return res.status(500).json({
      error: error.message || "Error interno al procesar el pago.",
    });
  }
};