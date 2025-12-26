export class DateTransformer {
  to(value: Date | string): string {
    if (!value) return null;

    // Convert to UTC date string (YYYY-MM-DD)
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().split('T')[0]; // "2024-01-15"
  }

  from(value: string): Date {
    if (!value) return null;

    // Parse as UTC date (midnight UTC)
    return new Date(`${value}T00:00:00.000Z`);
  }
}
