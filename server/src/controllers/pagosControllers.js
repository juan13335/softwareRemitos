import { supabase } from "../config/supabase.js";

export const createPago = async (req, res) => {
  const {
    socio_id,
    fecha_pago,
    monto,
    nro_comprobante,
    notas,
    formas_pago,
    lineas,
  } = req.body;

  if (!socio_id) {
    return res.status(400).json({ error: "El socio es obligatorio." });
  }

  if (!Array.isArray(formas_pago) || formas_pago.length === 0) {
    return res.status(400).json({ error: "Debés ingresar al menos una forma de pago." });
  }

  if (!Array.isArray(lineas) || lineas.length === 0) {
    return res.status(400).json({ error: "Debés incluir al menos un remito a imputar." });
  }

  let pagoCreadoId = null;

  try {
    // 1. Insertar la cabecera del pago
    const { data: pago, error: errPago } = await supabase
      .from("pagos_socio")
      .insert([
        {
          socio_id,
          fecha_pago: fecha_pago || new Date().toISOString().slice(0, 10),
          monto: Number(monto) || 0,
          nro_comprobante: nro_comprobante || null,
          notas: notas || null,
        },
      ])
      .select()
      .single();

    if (errPago) throw errPago;
    pagoCreadoId = pago.id;

    // 2. Insertar cómo ingresó el dinero (efectivo, transferencia, etc.)
    const metodosAInsertar = formas_pago.map((f) => ({
      pago_id: pagoCreadoId,
      forma_pago: (f.forma || f.forma_pago).toLowerCase(),
      monto: Number(f.monto),
    }));

    const { error: errMetodos } = await supabase
      .from("pago_metodos")
      .insert(metodosAInsertar);

    if (errMetodos) throw errMetodos;

    // 3. Insertar las imputaciones a remitos (dispara el trigger que actualiza el estado)
    const lineasAInsertar = lineas.map((l) => ({
      pago_id: pagoCreadoId,
      remito_id: l.remito_id,
      monto_imputado: Number(l.monto_imputado),
    }));

    const { error: errLineas } = await supabase
      .from("pago_remitos")
      .insert(lineasAInsertar);

    if (errLineas) throw errLineas;

    return res.status(201).json({
      mensaje: "Pago registrado y remitos actualizados con éxito",
      pago,
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);

    // Rollback manual: al borrar pagos_socio, el ON DELETE CASCADE limpia pago_metodos y pago_remitos
    if (pagoCreadoId) {
      await supabase.from("pagos_socio").delete().eq("id", pagoCreadoId);
    }

    return res.status(500).json({
      error: error.message || "Error interno al procesar el pago.",
    });
  }
};