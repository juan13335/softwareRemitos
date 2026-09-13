import { supabase } from "../config/supabase.js";


export const getPagos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pagos_socio")
      .select(`
        id,
        fecha_pago,
        monto,
        nro_comprobante,
        notas,
        created_at,
        socio:socios ( id, nombre ),
        metodos:pago_metodos ( id, forma_pago, monto ),
        remitos:pago_remitos (
          remito_id,
          monto_imputado,
          remito:remitos_socio ( id, nro_remito )
        )
      `)
      .order("fecha_pago", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Formateamos para que coincida exactamente con lo que espera tu frontend
    const pagosFormateados = data.map((p) => {
      const metodos = (p.metodos || []).map((m) => ({
        forma: m.forma_pago,
        monto: Number(m.monto),
      }));

      // El total de la operación es la suma de lo aplicado en formas de pago
      const totalOperacion = metodos.reduce((acc, m) => acc + m.monto, 0);

      return {
        id: p.id,
        socioId: p.socio?.id || null,
        socio: p.socio?.nombre || "Sin socio asignado",
        fecha_pago: p.fecha_pago,
        monto_real_caja: Number(p.monto), 
        monto: totalOperacion > 0 ? totalOperacion : Number(p.monto), // Total cancelado en la operación
        nro_comprobante: p.nro_comprobante,
        notas: p.notas,
        metodos,
        remitos: (p.remitos || []).map((r) => ({
          remito_id: r.remito_id,
          nro_remito: r.remito?.nro_remito || "S/N",
          monto_imputado: Number(r.monto_imputado),
        })),
      };
    });

    return res.status(200).json(pagosFormateados);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return res.status(500).json({ error: error.message || "Error al obtener pagos" });
  }
};


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
    // 1. plata REAL (excluyendo el saldo a favor)
    const dineroRealTransferido = formas_pago
      .filter((f) => (f.forma || f.forma_pago).toLowerCase() !== "saldo a favor")
      .reduce((acc, f) => acc + (Number(f.monto) || 0), 0);

    // 2. Insertamos la cabecera con el dinero REAL
    const { data: pago, error: errPago } = await supabase
      .from("pagos_socio")
      .insert([
        {
          socio_id,
          fecha_pago: fecha_pago || new Date().toISOString().slice(0, 10),
          monto: dineroRealTransferido, 
          nro_comprobante: nro_comprobante || null,
          notas: notas || null,
        },
      ])
      .select()
      .single();

    if (errPago) throw errPago;
    pagoCreadoId = pago.id;

    // 3. En pago_metodos SÍ guardamos todo (incluyendo "Saldo a favor")
    // para que quede constancia de cómo se canceló la operación
    const metodosAInsertar = formas_pago.map((f) => ({
      pago_id: pagoCreadoId,
      forma_pago: (f.forma || f.forma_pago).toLowerCase(),
      monto: Number(f.monto),
    }));

    await supabase.from("pago_metodos").insert(metodosAInsertar);

    // 4. Imputaciones a remitos (las líneas)
    const lineasAInsertar = lineas.map((l) => ({
      pago_id: pagoCreadoId,
      remito_id: l.remito_id,
      monto_imputado: Number(l.monto_imputado),
    }));

    await supabase.from("pago_remitos").insert(lineasAInsertar);

    return res.status(201).json({ mensaje: "Pago registrado con éxito", pago });
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