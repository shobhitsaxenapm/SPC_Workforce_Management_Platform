export type DatePreset = 'All Time' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Quarter' | 'Custom';

export function parsePeriod(periodStr: string | undefined | null): Date | null {
  if (!periodStr) return null;
  const cleaned = periodStr.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function isDateInPreset(
  dateStr: string | undefined | null,
  preset: DatePreset,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date('2026-07-13T12:00:00') // local prototype reference date
): boolean {
  if (!dateStr) return false;
  
  let dateVal: Date;
  if (dateStr.includes('-') || dateStr.includes('/') || dateStr.includes('T')) {
    dateVal = new Date(dateStr);
  } else {
    // Try to parse as period string like "July 2026"
    const parsed = parsePeriod(dateStr);
    if (!parsed) return false;
    dateVal = parsed;
  }

  if (isNaN(dateVal.getTime())) return false;

  // Normalize reference date to midnight
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const target = new Date(dateVal);
  target.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'All Time':
      return true;
    case 'Last 7 Days': {
      const start = new Date(ref);
      start.setDate(ref.getDate() - 7);
      return target >= start && target <= ref;
    }
    case 'Last 30 Days': {
      const start = new Date(ref);
      start.setDate(ref.getDate() - 30);
      return target >= start && target <= ref;
    }
    case 'This Month': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      // Ensure it is within the month boundary
      return target >= start && target <= end;
    }
    case 'Last Quarter': {
      const currentQuarter = Math.floor(ref.getMonth() / 3);
      let targetQuarter = currentQuarter - 1;
      let targetYear = ref.getFullYear();
      if (targetQuarter < 0) {
        targetQuarter = 3;
        targetYear -= 1;
      }
      const startMonth = targetQuarter * 3;
      const start = new Date(targetYear, startMonth, 1);
      const end = new Date(targetYear, startMonth + 3, 0);
      return target >= start && target <= end;
    }
    case 'Custom': {
      if (customStart) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        if (target < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (target > end) return false;
      }
      return true;
    }
    default:
      return true;
  }
}
