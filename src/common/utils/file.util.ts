import * as XLSX from 'xlsx';

export const readExcelFile = (buffer: Buffer, sheetIndex: number = 0) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[sheetIndex];
  const sheet = workbook.Sheets[sheetName];
  const csvData = XLSX.utils
    .sheet_to_csv(sheet)
    .split('\n')
    .map((row) => row.split(','));
  const headers = csvData.shift();

  return {
    headers,
    csvData,
  };
};

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
