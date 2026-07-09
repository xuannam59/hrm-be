export interface IPaginationResponse<T> {
  result: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum ESortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
