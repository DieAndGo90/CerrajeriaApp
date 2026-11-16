import ExcelJS from "exceljs";

// Crear una hoja con formato común
export const crearHoja = (workbook, nombre, columnas, filas) => {
  const hoja = workbook.addWorksheet(nombre);

  hoja.columns = columnas;
  hoja.addRows(filas);

  // Estilo de los encabezados
  const encabezado = hoja.getRow(1);

  encabezado.height = 28;
  encabezado.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  encabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  encabezado.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  // Mantener visible la primera fila
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  // Habilitar filtros
  hoja.autoFilter = {
    from: { row: 1, column: 1 },
    to: {
      row: hoja.rowCount,
      column: columnas.length,
    },
  };

  return hoja;
};

// Descargar el archivo Excel
export const descargarExcel = async (workbook, nombreArchivo) => {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo}.xlsx`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

// Crear un libro Excel
export const crearLibro = () => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "CerrajeriaApp";
  workbook.created = new Date();

  return workbook;
};
