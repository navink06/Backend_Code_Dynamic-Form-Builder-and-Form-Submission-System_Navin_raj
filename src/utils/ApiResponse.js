class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (meta) {
      this.meta = meta;
    }
  }

  static success(data, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, data, message, meta);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(201, data, message);
  }

  static paginated(data, page, limit, totalCount, message = 'Fetched successfully') {
    const totalPages = Math.ceil(totalCount / limit);
    return new ApiResponse(200, data, message, {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  }
}

module.exports = ApiResponse;
