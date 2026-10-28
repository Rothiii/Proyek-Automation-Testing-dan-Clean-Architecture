import { describe, it, expect, vi } from 'vitest';

describe('config', () => {
  it('should load default dotenv when NODE_ENV is not test', async () => {
    // Arrange
    const originalNodeEnv = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = 'production';

    // Action
    const { default: config } = await import('../config.js');

    // Assert
    expect(config.app.host).toEqual('0.0.0.0');

    // Cleanup
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('should set debug config when NODE_ENV is development', async () => {
    // Arrange
    const originalNodeEnv = process.env.NODE_ENV;
    vi.resetModules();
    process.env.NODE_ENV = 'development';

    // Action
    const { default: config } = await import('../config.js');

    // Assert
    expect(config.app.debug).toEqual({ request: ['error'] });

    // Cleanup
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });
});
