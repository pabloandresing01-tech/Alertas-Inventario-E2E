function main(workbook: ExcelScript.Workbook, comprasStr: string, seguimientoStr: string) {
  let dataCompras = JSON.parse(comprasStr);
  let dataSeguimiento = JSON.parse(seguimientoStr);

  let tablaC = workbook.getTable("Planilla_Compras");
  let tablaS = workbook.getTable("Planilla_Seguimiento");

  // --- 1. LIMPIEZA DE DATOS ---
  if (tablaC.getRowCount() > 0) {
    tablaC.deleteRowsAt(0, tablaC.getRowCount());
  }
  if (tablaS.getRowCount() > 0) {
    tablaS.deleteRowsAt(0, tablaS.getRowCount());
  }

  // --- 2. FUNCIONES DE APOYO ---
  function formatearFecha(fechaIso: string | number | null): string {
    if (!fechaIso) return "";
    let fechaStr = String(fechaIso).trim();
    if (fechaStr === "" || fechaStr.toLowerCase() === "null" || fechaStr.toLowerCase() === "undefined") return "";
    
    let soloFecha = fechaStr.split("T")[0];
    let partes = soloFecha.split("-");
    
    // TRUCO DE FORMATO: Invertimos el formato del servidor (MM/DD/YYYY) a formato local (DD/MM/YYYY)
    if (partes.length === 3) return `${partes[1]}/${partes[2]}/${partes[0]}`;
    
    return fechaStr;
  }

  function obtenerDato(row: Record<string, string | number | null>, clave: string): string {
    if (row[`[${clave}]`] !== undefined && row[`[${clave}]`] !== null) return String(row[`[${clave}]`]);
    if (row[clave] !== undefined && row[clave] !== null) return String(row[clave]);
    for (let k in row) {
      if (k.toLowerCase().endsWith(`[${clave.toLowerCase()}]`) && row[k] !== null) {
        return String(row[k]);
      }
    }
    return "";
  }

  // --- 3. INYECTAR BLOQUES NUEVOS ---
  if (dataCompras && dataCompras.length > 0) {
    let filasC = dataCompras.map(row => {
      let precioRaw = obtenerDato(row, "Ultimo_Precio");
      let precioNum = precioRaw ? Number(precioRaw.replace(/[^0-9.-]+/g, "")) : 0;
      if (isNaN(precioNum)) precioNum = 0;

      return [
        obtenerDato(row, "Alerta_Compra"),       
        obtenerDato(row, "Código_MP"),
        obtenerDato(row, "Descripción"),
        obtenerDato(row, "UM"),
        obtenerDato(row, "BMP"),
        obtenerDato(row, "StockCrit"),
        obtenerDato(row, "ROP"),
        obtenerDato(row, "Estado_Ultima_OC"),
        precioNum,                               
        obtenerDato(row, "Proveedor_Ultima_OC")
      ];
    });
    tablaC.addRows(-1, filasC);
  }

  if (dataSeguimiento && dataSeguimiento.length > 0) {
    let filasS = dataSeguimiento.map(row => [
      obtenerDato(row, "Código_MP"),
      obtenerDato(row, "Descripción"),
      obtenerDato(row, "UM"),
      obtenerDato(row, "BMP"),
      obtenerDato(row, "StockCrit"),
      obtenerDato(row, "Estado_Ultima_OC"),
      obtenerDato(row, "Num_Ultima_OC"),
      formatearFecha(obtenerDato(row, "Fecha_OC")),
      formatearFecha(obtenerDato(row, "Fecha_Estimada_Recepcion")), 
      obtenerDato(row, "Pend_Rec"),
      obtenerDato(row, "Proveedor_Ultima_OC")
    ]);
    tablaS.addRows(-1, filasS);
  }

  // --- 4. FORMATOS ESTÉTICOS ---
  let hojac = workbook.getWorksheet("Planilla_Compras");
  let hojas = workbook.getWorksheet("Planilla_Seguimiento");

  hojac.getUsedRange().getFormat().setHorizontalAlignment(ExcelScript.HorizontalAlignment.center);
  hojas.getUsedRange().getFormat().setHorizontalAlignment(ExcelScript.HorizontalAlignment.center);

  if (tablaC.getRowCount() > 0) {
    tablaC.getColumns()[8].getRangeBetweenHeaderAndTotal().setNumberFormat("[$$-40A]#,##0");
  }

  hojac.getUsedRange().getFormat().autofitColumns();
  hojas.getUsedRange().getFormat().autofitColumns();
}
