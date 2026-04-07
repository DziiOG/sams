import type { Result, ResultErrorDetail } from './result';
import { ResultStatus } from './result-status';

export interface ApiResponseEnvelope<T> {
  message: string;
  code: number;
  data?: T;
  errors?: ResultErrorDetail[];
}

interface StatusWritable {
  status: (code: number) => unknown;
}

export class ApiResponseFactory {
  public static create<T>(
    result: Result<T>,
    response?: StatusWritable,
  ): ApiResponseEnvelope<T> {
    const code = this.toHttpStatus(result.status);
    response?.status(code);

    const envelope: ApiResponseEnvelope<T> = {
      message: result.error ?? this.defaultMessage(result.status),
      code,
    };

    if (result.isSuccess && result.value !== undefined && result.status !== ResultStatus.NoContent) {
      envelope.data = result.value;
    }

    if (result.errors && result.errors.length > 0) {
      envelope.errors = result.errors;
    }

    return envelope;
  }

  private static toHttpStatus(status: ResultStatus): number {
    switch (status) {
      case ResultStatus.Ok:
        return 200;
      case ResultStatus.Created:
        return 201;
      case ResultStatus.Accepted:
        return 202;
      case ResultStatus.NoContent:
        return 204;
      case ResultStatus.BadRequest:
        return 400;
      case ResultStatus.Unauthorized:
        return 401;
      case ResultStatus.PaymentRequired:
        return 402;
      case ResultStatus.Forbidden:
        return 403;
      case ResultStatus.NotFound:
        return 404;
      case ResultStatus.Conflict:
        return 409;
      case ResultStatus.Cancelled:
        return 409;
      case ResultStatus.TooManyRequests:
        return 429;
      case ResultStatus.FailedDependency:
        return 424;
      case ResultStatus.InternalError:
      default:
        return 500;
    }
  }

  private static defaultMessage(status: ResultStatus): string {
    switch (status) {
      case ResultStatus.Ok:
        return 'OK';
      case ResultStatus.Created:
        return 'Created';
      case ResultStatus.Accepted:
        return 'Accepted';
      case ResultStatus.NoContent:
        return 'No content';
      case ResultStatus.BadRequest:
        return 'Bad request';
      case ResultStatus.Unauthorized:
        return 'Unauthorized';
      case ResultStatus.PaymentRequired:
        return 'Payment required';
      case ResultStatus.Forbidden:
        return 'Forbidden';
      case ResultStatus.NotFound:
        return 'Not found';
      case ResultStatus.Conflict:
        return 'Conflict';
      case ResultStatus.Cancelled:
        return 'Cancelled';
      case ResultStatus.TooManyRequests:
        return 'Too many requests';
      case ResultStatus.FailedDependency:
        return 'Failed dependency';
      case ResultStatus.InternalError:
      default:
        return 'Internal server error';
    }
  }
}
