export interface PaginationMeta{
  total:number,
  page:number,
  limit:number;
  totalPages:number;
  hasMore:boolean;
}

export interface PaginationResult<T>{
  data:T[];
  meta:PaginationMeta;
}