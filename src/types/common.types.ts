export interface PagingRequest {
  PageNumber: number;
  RecordsPerPage: number;
}

export interface PagingResponse {
  TotalRecords: number;
  TotalPages: number;
  CurrentPage: number;
}

export interface ExecutionResult {
  IsSuccess: boolean;
  ErrorCode?: string;
  ErrorMessage?: string;
  Description?: string;
}

export interface BaseServiceResponse {
  Result?: ExecutionResult;
}
