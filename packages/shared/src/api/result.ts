import { ResultStatus } from './result-status';

export interface ResultErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value: T | undefined,
    public readonly error: string | undefined,
    public readonly status: ResultStatus,
    public readonly errors?: ResultErrorDetail[],
  ) {}

  public get isFailure(): boolean {
    return !this.isSuccess;
  }

  public static success<T>(value: T, status: ResultStatus = ResultStatus.Ok): Result<T> {
    return new Result<T>(true, value, undefined, status);
  }

  public static created<T>(value: T): Result<T> {
    return Result.success(value, ResultStatus.Created);
  }

  public static accepted<T>(value: T): Result<T> {
    return Result.success(value, ResultStatus.Accepted);
  }

  public static noContent(): Result<void> {
    return Result.success(undefined, ResultStatus.NoContent);
  }

  public static failure<T = never>(
    error: string,
    status: ResultStatus = ResultStatus.BadRequest,
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return new Result<T>(false, undefined, error, status, errors);
  }

  public static notFound<T = never>(error: string, errors?: ResultErrorDetail[]): Result<T> {
    return Result.failure(error, ResultStatus.NotFound, errors);
  }

  public static conflict<T = never>(error: string, errors?: ResultErrorDetail[]): Result<T> {
    return Result.failure(error, ResultStatus.Conflict, errors);
  }

  public static unauthorized<T = never>(error: string, errors?: ResultErrorDetail[]): Result<T> {
    return Result.failure(error, ResultStatus.Unauthorized, errors);
  }

  public static forbidden<T = never>(error: string, errors?: ResultErrorDetail[]): Result<T> {
    return Result.failure(error, ResultStatus.Forbidden, errors);
  }

  public static validationError<T = never>(
    error: string,
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return Result.failure(error, ResultStatus.BadRequest, errors);
  }

  public static paymentRequired<T = never>(
    error: string,
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return Result.failure(error, ResultStatus.PaymentRequired, errors);
  }

  public static failedDependency<T = never>(
    error: string,
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return Result.failure(error, ResultStatus.FailedDependency, errors);
  }

  public static cancelled<T = never>(error: string, errors?: ResultErrorDetail[]): Result<T> {
    return Result.failure(error, ResultStatus.Cancelled, errors);
  }

  public static tooManyRequests<T = never>(
    error: string,
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return Result.failure(error, ResultStatus.TooManyRequests, errors);
  }

  public static serverError<T = never>(
    error = 'An unexpected server error occurred',
    errors?: ResultErrorDetail[],
  ): Result<T> {
    return Result.failure(error, ResultStatus.InternalError, errors);
  }
}
