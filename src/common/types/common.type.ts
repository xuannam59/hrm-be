export interface IPaginationResponse<T> {
  result: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IErrorRow {
  rowIndex: number;
  errors: string[];
}
