import { NextResponse } from 'next/server';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return success(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function error(
  message: string,
  code: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function validationError(message: string, details?: unknown) {
  return error(message, 'VALIDATION_ERROR', 400, details);
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 'UNAUTHORIZED', 401);
}

export function forbidden(message = 'Forbidden') {
  return error(message, 'FORBIDDEN', 403);
}

export function notFound(resource = 'Resource') {
  return error(`${resource} not found`, 'NOT_FOUND', 404);
}

export function conflict(message: string) {
  return error(message, 'CONFLICT', 409);
}

export function rateLimited(message = 'Too many requests') {
  return error(message, 'RATE_LIMITED', 429);
}

export function internalError(message = 'Internal server error') {
  return error(message, 'INTERNAL_ERROR', 500);
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}
