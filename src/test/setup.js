/**
 * 测试环境设置
 */

// 全局测试工具
global.expect = expect;

// 测试超时设置
vi.setConfig({
  testTimeout: 10000
});

// Mock console 以避免测试输出干扰
const originalConsole = { ...console };

beforeEach(() => {
  // 在测试中静默 console.log，但保留 error 和 warn
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});