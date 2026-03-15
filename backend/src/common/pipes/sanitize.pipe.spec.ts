import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => {
    pipe = new SanitizePipe();
  });

  it('should strip HTML tags from string values', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = pipe.transform(input);
    expect(result).toBe('Hello');
  });

  it('should strip nested HTML tags', () => {
    const input = '<div><b>Bold</b> and <i>italic</i></div>';
    const result = pipe.transform(input);
    expect(result).toBe('Bold and italic');
  });

  it('should trim whitespace from strings', () => {
    const input = '  hello world  ';
    const result = pipe.transform(input);
    expect(result).toBe('hello world');
  });

  it('should sanitize strings in objects recursively', () => {
    const input = {
      name: '<b>Test</b>',
      description: '<script>alert(1)</script>Safe text',
      nested: {
        value: '<img src=x onerror=alert(1)>clean',
      },
    };
    const result = pipe.transform(input) as Record<string, unknown>;
    expect(result.name).toBe('Test');
    expect(result.description).toBe('Safe text');
    expect((result.nested as Record<string, unknown>).value).toBe('clean');
  });

  it('should sanitize strings in arrays', () => {
    const input = ['<b>bold</b>', '<script>xss</script>ok'];
    const result = pipe.transform(input);
    expect(result).toEqual(['bold', 'ok']);
  });

  it('should pass through numbers unchanged', () => {
    expect(pipe.transform(42)).toBe(42);
  });

  it('should pass through booleans unchanged', () => {
    expect(pipe.transform(true)).toBe(true);
  });

  it('should pass through null unchanged', () => {
    expect(pipe.transform(null)).toBeNull();
  });

  it('should pass through undefined unchanged', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('should handle objects with mixed value types', () => {
    const input = {
      name: '<em>Test</em>',
      count: 5,
      active: true,
      tags: ['<b>tag1</b>', 'tag2'],
    };
    const result = pipe.transform(input) as Record<string, unknown>;
    expect(result.name).toBe('Test');
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle SQL injection attempts in string values (no HTML to strip)', () => {
    const input = "Robert'; DROP TABLE users;--";
    const result = pipe.transform(input);
    // SQL injection is handled by Prisma parameterized queries, not sanitization
    // The pipe only strips HTML, so this should pass through (trimmed)
    expect(result).toBe("Robert'; DROP TABLE users;--");
  });
});
