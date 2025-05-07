export class ErrorResponse {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  stack?: string;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      errors?: Record<string, string[]>;
      includeStack?: boolean;
    }
  ) {
    this.message = message;
    this.status = status;

    if (options?.code) {
      this.code = options.code;
    }

    if (options?.errors) {
      this.errors = options.errors;
    }

    if (options?.includeStack) {
      const error = new Error(message);
      try {
        // @ts-ignore - captureStackTrace exists in V8 environments
        Error.captureStackTrace?.(error, this.constructor);
      } catch (err) {
        // Log the error or handle it more explicitly if needed
        console.debug(
          "Error capturing stack trace, falling back to default",
          err
        );
        error.stack = new Error().stack;
      }
      this.stack = error.stack;
    }
  }

  generate() {
    const response: {
      data: {
        message: string;
        code?: string;
        errors?: Record<string, string[]>;
        stack?: string;
      };
      status: number;
    } = {
      data: {
        message: this.message,
      },
      status: this.status,
    };

    if (this.code) {
      response.data.code = this.code;
    }

    if (this.errors) {
      response.data.errors = this.errors;
    }

    if (this.stack) {
      response.data.stack = this.stack;
    }

    return response;
  }
}

type ErrorMessage = Error | string;
type ErrorOptions = {
  code?: string;
  errors?: Record<string, string[]>;
  includeStack?: boolean;
};

export class NotFoundResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Resource not found",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Resource not found", 404, options);
  }
}

export class InternalServerErrorResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Internal Server Error",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Internal Server Error", 500, options);
  }
}

export class UnauthenticatedResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Unauthenticated",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Unauthenticated", 401, options);
  }
}

export class UnauthorizedResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Unauthorized", options?: ErrorOptions) {
    super(message?.toString() ?? "Unauthorized", 403, options);
  }
}

export class BadRequestResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Bad Request", options?: ErrorOptions) {
    super(message?.toString() ?? "Bad Request", 400, options);
  }
}

export class ConflictResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Conflict", options?: ErrorOptions) {
    super(message?.toString() ?? "Conflict", 409, options);
  }
}

export class UnprocessableEntityResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Unprocessable Entity",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Unprocessable Entity", 422, options);
  }
}

export class TooManyRequestsResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Too Many Requests",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Too Many Requests", 429, options);
  }
}

export class ServiceUnavailableResponse extends ErrorResponse {
  constructor(
    message: ErrorMessage = "Service Unavailable",
    options?: ErrorOptions
  ) {
    super(message?.toString() ?? "Service Unavailable", 503, options);
  }
}
