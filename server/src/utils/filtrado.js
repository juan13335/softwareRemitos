// src/utils/filtrosRemitos.js

export const aplicarFiltrosRemitos = (query, filtros = {}) => {
  const { socio_id, estado, desde, hasta } = filtros;
  let q = query;

  // Filtro por socio
  if (socio_id && socio_id !== "todos") {
    q = q.eq("socio_id", socio_id);
  }
  // Rango de fechas
  if (desde) {
    q = q.gte("fecha", desde);
  }
  if (hasta) {
    q = q.lte("fecha", hasta);
  }
  // Estado de cobro
  if (estado === "cobrado") {
    q = q.lte("saldo_pendiente", 0);
  } else if (estado === "parcial") {
    q = q.gt("total_imputado", 0).gt("saldo_pendiente", 0);
  } else if (estado === "pendiente") {
    q = q.gt("saldo_pendiente", 0).eq("total_imputado", 0);
  }

  return q;
};