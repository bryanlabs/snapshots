import { logger, logApiCall } from "../logger";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleDebug = console.debug;

  let mockLog: jest.Mock;
  let mockWarn: jest.Mock;
  let mockError: jest.Mock;
  let mockDebug: jest.Mock;

  beforeEach(() => {
    mockLog = jest.fn();
    mockWarn = jest.fn();
    mockError = jest.fn();
    mockDebug = jest.fn();

    console.log = mockLog;
    console.warn = mockWarn;
    console.error = mockError;
    console.debug = mockDebug;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should log info messages", () => {
      logger.info("Test info message", { data: "test" });
      expect(mockLog).toHaveBeenCalledWith("[INFO] Test info message", { data: "test" });
    });

    it("should log warning messages", () => {
      logger.warn("Test warning message", { warning: true });
      expect(mockWarn).toHaveBeenCalledWith("[WARN] Test warning message", { warning: true });
    });

    it("should log error messages", () => {
      logger.error("Test error message", new Error("test error"));
      expect(mockError).toHaveBeenCalledWith("[ERROR] Test error message", new Error("test error"));
    });

    it("should log debug messages", () => {
      logger.debug("Test debug message", { debug: "data" });
      expect(mockDebug).toHaveBeenCalledWith("[DEBUG] Test debug message", { debug: "data" });
    });

    it("should handle multiple arguments", () => {
      logger.info("Multiple args", "arg1", "arg2", { obj: true });
      expect(mockLog).toHaveBeenCalledWith("[INFO] Multiple args", "arg1", "arg2", { obj: true });
    });

    it("should handle no additional arguments", () => {
      logger.info("Simple message");
      expect(mockLog).toHaveBeenCalledWith("[INFO] Simple message");
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should not log info messages", () => {
      logger.info("Test info message", { data: "test" });
      expect(mockLog).not.toHaveBeenCalled();
    });

    it("should not log warning messages", () => {
      logger.warn("Test warning message");
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it("should always log error messages", () => {
      logger.error("Test error message", new Error("production error"));
      expect(mockError).toHaveBeenCalledWith("[ERROR] Test error message", new Error("production error"));
    });

    it("should not log debug messages", () => {
      logger.debug("Test debug message");
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe("in undefined NODE_ENV", () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it("should not log info messages", () => {
      logger.info("Test info message");
      expect(mockLog).not.toHaveBeenCalled();
    });

    it("should not log warning messages", () => {
      logger.warn("Test warning message");
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it("should always log error messages", () => {
      logger.error("Test error message");
      expect(mockError).toHaveBeenCalledWith("[ERROR] Test error message");
    });

    it("should not log debug messages", () => {
      logger.debug("Test debug message");
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });
});

describe("logApiCall", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  let mockLog: jest.Mock;
  let mockError: jest.Mock;

  beforeEach(() => {
    mockLog = jest.fn();
    mockError = jest.fn();
    console.log = mockLog;
    console.error = mockError;
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe("in development mode", () => {
    it("should log API call start", () => {
      logApiCall("/api/test", "start");
      expect(mockLog).toHaveBeenCalledWith("[INFO] API Call: /api/test");
    });

    it("should log API call success", () => {
      const details = { responseTime: 100, status: 200 };
      logApiCall("/api/test", "success", details);
      expect(mockLog).toHaveBeenCalledWith("[INFO] API Success: /api/test", details);
    });

    it("should log API call error", () => {
      const error = new Error("API failed");
      logApiCall("/api/test", "error", error);
      expect(mockError).toHaveBeenCalledWith("[ERROR] API Error: /api/test", error);
    });

    it("should handle success without details", () => {
      logApiCall("/api/test", "success");
      expect(mockLog).toHaveBeenCalledWith("[INFO] API Success: /api/test", undefined);
    });

    it("should handle start with details (ignored)", () => {
      logApiCall("/api/test", "start", { ignored: true });
      expect(mockLog).toHaveBeenCalledWith("[INFO] API Call: /api/test");
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should not log API call start", () => {
      logApiCall("/api/test", "start");
      expect(mockLog).not.toHaveBeenCalled();
    });

    it("should not log API call success", () => {
      logApiCall("/api/test", "success", { status: 200 });
      expect(mockLog).not.toHaveBeenCalled();
    });

    it("should always log API call error", () => {
      const error = { message: "API Error", code: 500 };
      logApiCall("/api/test", "error", error);
      expect(mockError).toHaveBeenCalledWith("[ERROR] API Error: /api/test", error);
    });
  });

  it("should handle different endpoint formats", () => {
    const endpoints = [
      "/api/v1/users",
      "https://api.example.com/data",
      "POST /api/auth/login",
      "users/123",
    ];

    endpoints.forEach((endpoint) => {
      logApiCall(endpoint, "start");
      expect(mockLog).toHaveBeenLastCalledWith(`[INFO] API Call: ${endpoint}`);
    });
  });

  it("should handle various detail types", () => {
    const testCases = [
      { details: null, desc: "null details" },
      { details: undefined, desc: "undefined details" },
      { details: "string error", desc: "string details" },
      { details: 404, desc: "number details" },
      { details: [1, 2, 3], desc: "array details" },
      { details: { nested: { data: true } }, desc: "nested object details" },
    ];

    testCases.forEach(({ details, desc }) => {
      logApiCall("/api/test", "success", details);
      expect(mockLog).toHaveBeenCalledWith("[INFO] API Success: /api/test", details);
      mockLog.mockClear();
    });
  });
});