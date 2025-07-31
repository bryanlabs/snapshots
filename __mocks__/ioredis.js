// Mock for ioredis
const Redis = jest.fn().mockImplementation(() => {
  const eventListeners = {};
  
  const instance = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrange: jest.fn(),
    zrangebyscore: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    
    // Event emitter methods
    on: jest.fn((event, handler) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler);
      
      // Auto-trigger connect event
      if (event === 'connect') {
        setTimeout(() => handler(), 0);
      }
      
      return instance; // Return instance for chaining
    }),
    
    off: jest.fn((event, handler) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    }),
    
    emit: jest.fn((event, ...args) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach(handler => handler(...args));
      }
    }),
  };
  
  return instance;
});

module.exports = Redis;
module.exports.default = Redis;