import { describe, it, expect } from 'vitest';
import { echoTool } from '../echo';

describe('echoTool', () => {
  it('should have correct metadata', () => {
    expect(echoTool.name).toBe('echo');
    expect(echoTool.description).toBeTruthy();
    expect(echoTool.schema).toBeDefined();
  });

  it('should echo back the provided message', async () => {
    const message = 'Hello, World!';
    const result = await echoTool.handler({ message });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(`Echo: ${message}`);
  });

  it('should handle empty message', async () => {
    const message = '';
    const result = await echoTool.handler({ message });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Echo: ');
  });

  it('should handle special characters', async () => {
    const message = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const result = await echoTool.handler({ message });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(`Echo: ${message}`);
  });

  it('should handle multiline message', async () => {
    const message = 'Line 1\nLine 2\nLine 3';
    const result = await echoTool.handler({ message });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(`Echo: ${message}`);
  });
});
