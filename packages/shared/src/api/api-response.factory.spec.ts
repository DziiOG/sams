import { ApiResponseFactory } from './api-response.factory';
import { Result } from './result';

describe('ApiResponseFactory', () => {
  it('maps accepted results to a 202 response envelope', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
    };

    const envelope = ApiResponseFactory.create(
      Result.accepted({ status: 'accepted', correlationId: 'corr-123' }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(202);
    expect(envelope).toEqual({
      message: 'Accepted',
      code: 202,
      data: {
        status: 'accepted',
        correlationId: 'corr-123',
      },
    });
  });

  it('maps forbidden failures to a 403 response envelope', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
    };

    const envelope = ApiResponseFactory.create(
      Result.forbidden('Sender is not allowed'),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(envelope).toEqual({
      message: 'Sender is not allowed',
      code: 403,
    });
  });
});
