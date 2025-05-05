export class ErrorResponse {
  message: string;
  status: number;

  constructor(message: string, status: number) {
    this.message = message;
    this.status = status;
  }

  generate() {
    return {
      data: {
        message: this.message,
      },
      status: this.status,
    };
  }
}

type ErrorMessage = Error | string;

export class NotFoundResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Resource not found") {
    super(message?.toString() ?? "Resource not found", 404);
  }
}

export class InternalServerErrorResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Internal Server Error") {
    super(message?.toString() ?? "Internal Server Error", 500);
  }
}

export class UnauthenticatedResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Unauthenticated") {
    super(message?.toString() ?? "Unauthenticated", 401);
  }
}

export class UnauthorizedResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Unauthorized") {
    super(message?.toString() ?? "Unauthorized", 403);
  }
}

export class BadRequestResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Bad Request") {
    super(message?.toString() ?? "Bad Request", 400);
  }
}

export class ConflictResponse extends ErrorResponse {
  constructor(message: ErrorMessage = "Conflict") {
    super(message?.toString() ?? "Conflict", 409);
  }
}
