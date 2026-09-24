
export function getPaginacion(query, limitePorDefecto = 10) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || limitePorDefecto);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

export function respuestaPaginada(datos, totalRegistros, page, limit) {
  const totalPaginas = Math.ceil((totalRegistros || 0) / limit);

  return {
    datos: datos || [],
    paginacion: {
      totalRegistros: totalRegistros || 0,
      totalPaginas: totalPaginas || 1,
      paginaActual: page,
      limite: limit,
      tieneSiguiente: page < totalPaginas,
      tieneAnterior: page > 1,
    },
  };
}