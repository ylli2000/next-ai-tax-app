import dayjs from 'dayjs';
import { DateUtils, dateHelpers } from '../dateUtils';

describe('DateUtils', () => {
  const sampleDate = '2024-06-01T12:34:56.789Z';
  const sampleDate2 = '2024-06-05T15:00:00.000Z';

  it('now/nowUtc returns ISO string', () => {
    expect(typeof DateUtils.now()).toBe('string');
    expect(typeof DateUtils.nowUtc()).toBe('string');
    expect(DateUtils.nowUtc().endsWith('Z')).toBe(true);
  });

  it('formatDisplay/formatDisplayDateTime/formatISO', () => {
    const display = DateUtils.formatDisplay(sampleDate);
    const displayDate = dayjs(sampleDate).format('DD/MM/YYYY');
    expect(display).toBe(displayDate);
    const displayDateTime = DateUtils.formatDisplayDateTime(sampleDate);
    expect(displayDateTime).toBe(dayjs(sampleDate).format('DD/MM/YYYY [at] h:mm A'));
    expect(DateUtils.formatISO(sampleDate)).toContain('2024-06-01T');
  });

  it('parseCustomFormat', () => {
    const d = DateUtils.parseCustomFormat('01-06-2024', 'DD-MM-YYYY');
    expect(d.isValid()).toBe(true);
    expect(d.format('YYYY-MM-DD')).toBe('2024-06-01');
  });

  it('toTimezone/toUtc', () => {
    const utc = DateUtils.toUtc(sampleDate);
    expect(dayjs(utc).isValid()).toBe(true);
    const tz = DateUtils.toTimezone(sampleDate, 'Asia/Shanghai');
    expect(dayjs(tz).isValid()).toBe(true);
  });

  it('getRelativeTime', () => {
    expect(typeof DateUtils.getRelativeTime(sampleDate)).toBe('string');
  });

  it('isToday/isYesterday', () => {
    expect(DateUtils.isToday(new Date())).toBe(true);
    expect(DateUtils.isYesterday(dayjs().subtract(1, 'day').toISOString())).toBe(true);
  });

  it('isThisWeek/isThisMonth/isThisYear', () => {
    expect(DateUtils.isThisWeek(new Date())).toBe(true);
    expect(DateUtils.isThisMonth(new Date())).toBe(true);
    expect(DateUtils.isThisYear(new Date())).toBe(true);
  });

  it('startOfDay/endOfDay', () => {
    const start = DateUtils.startOfDay(sampleDate);
    const end = DateUtils.endOfDay(sampleDate);
    expect(dayjs(start).hour()).toBe(0);
    expect(dayjs(start).minute()).toBe(0);
    expect(dayjs(end).hour()).toBe(23);
    expect(dayjs(end).minute()).toBe(59);
  });

  it('startOfMonth/endOfMonth', () => {
    const start = DateUtils.startOfMonth(sampleDate);
    const end = DateUtils.endOfMonth(sampleDate);
    expect(dayjs(start).date()).toBe(1);
    expect(dayjs(start).hour()).toBe(0);
    expect(dayjs(end).hour()).toBe(23);
    expect(dayjs(end).minute()).toBe(59);
  });

  it('startOfYear/endOfYear', () => {
    const start = DateUtils.startOfYear(sampleDate);
    const end = DateUtils.endOfYear(sampleDate);
    expect(dayjs(start).month()).toBe(0);
    expect(dayjs(start).date()).toBe(1);
    expect(dayjs(end).month()).toBe(11);
    expect(dayjs(end).date()).toBe(31);
  });

  it('add/subtract', () => {
    expect(DateUtils.add(sampleDate, 1, 'day')).toBe(dayjs(sampleDate).add(1, 'day').toISOString());
    expect(DateUtils.subtract(sampleDate, 1, 'day')).toBe(dayjs(sampleDate).subtract(1, 'day').toISOString());
  });

  it('diff', () => {
    expect(DateUtils.diff(sampleDate2, sampleDate, 'day')).toBe(dayjs(sampleDate2).diff(dayjs(sampleDate), 'day'));
  });

  it('isValid', () => {
    expect(DateUtils.isValid(sampleDate)).toBe(true);
    expect(DateUtils.isValid('invalid-date')).toBe(false);
  });

  it('getDuration/formatDuration', () => {
    const dur = DateUtils.getDuration(sampleDate, sampleDate2);
    expect(typeof dur.asDays()).toBe('number');
    expect(DateUtils.formatDuration(dur)).toMatch(/\d+ (days|hours|minutes|seconds)/);
  });

  it('getDateRange', () => {
    const range = DateUtils.getDateRange('today');
    expect(range).toHaveProperty('start');
    expect(range).toHaveProperty('end');
  });

  it('parseInvoiceDate', () => {
    expect(DateUtils.parseInvoiceDate('2024-06-01')).toMatch(/T/);
    expect(DateUtils.parseInvoiceDate('01/06/2024')).toMatch(/T/);
    expect(DateUtils.parseInvoiceDate('invalid')).toBeNull();
  });

  it('getFiscalYear', () => {
    expect(DateUtils.getFiscalYear('2024-01-01')).toBe(2024);
    expect(DateUtils.getFiscalYear('2023-12-31', 4)).toBe(2023);
    expect(DateUtils.getFiscalYear('2023-05-01', 4)).toBe(2023);
    expect(DateUtils.getFiscalYear('2023-05-01', 1)).toBe(2023);
  });

  it('getQuarter', () => {
    expect(DateUtils.getQuarter('2024-01-01')).toBe(1);
    expect(DateUtils.getQuarter('2024-06-01')).toBe(2);
  });

  it('isWeekend', () => {
    expect(DateUtils.isWeekend('2024-06-01')).toBe(true); // Saturday
    expect(DateUtils.isWeekend('2024-06-03')).toBe(false); // Monday
  });

  it('getNextBusinessDay/getPreviousBusinessDay', () => {
    expect(dayjs(DateUtils.getNextBusinessDay('2024-06-01')).day()).not.toBe(0);
    expect(dayjs(DateUtils.getNextBusinessDay('2024-06-01')).day()).not.toBe(6);
    expect(dayjs(DateUtils.getPreviousBusinessDay('2024-06-02')).day()).not.toBe(0);
    expect(dayjs(DateUtils.getPreviousBusinessDay('2024-06-02')).day()).not.toBe(6);
  });

  it('formatFileISOString', () => {
    const fileStr = DateUtils.formatFileISOString(sampleDate);
    expect(fileStr).toMatch(/^2024-06-01_\d{2}-\d{2}-\d{2}-\d{3}$/);
  });

  it('getAustralianFinancialYear', () => {
    // Test dates in different financial years
    expect(DateUtils.getAustralianFinancialYear('2024-06-30')).toBe(2023); // End of FY 2023-24
    expect(DateUtils.getAustralianFinancialYear('2024-07-01')).toBe(2024); // Start of FY 2024-25
    expect(DateUtils.getAustralianFinancialYear('2024-12-31')).toBe(2024); // Middle of FY 2024-25
    expect(DateUtils.getAustralianFinancialYear('2025-01-01')).toBe(2024); // Still FY 2024-25
  });

  it('getAustralianFinancialYearString', () => {
    expect(DateUtils.getAustralianFinancialYearString('2024-06-30')).toBe('2023-2024');
    expect(DateUtils.getAustralianFinancialYearString('2024-07-01')).toBe('2024-2025');
    expect(DateUtils.getAustralianFinancialYearString('2024-12-31')).toBe('2024-2025');
  });

  it('getAustralianFinancialYearRange', () => {
    const range = DateUtils.getAustralianFinancialYearRange('2024-12-31');
    expect(dayjs(range.start).format('YYYY-MM-DD')).toBe('2024-07-01');
    expect(dayjs(range.end).format('YYYY-MM-DD')).toBe('2025-06-30');
    expect(dayjs(range.start).hour()).toBe(0);
    expect(dayjs(range.end).hour()).toBe(23);
  });

  it('isCurrentAustralianFinancialYear', () => {
    const currentFY = DateUtils.getAustralianFinancialYear();
    const currentFYDate = `${currentFY + 1}-01-01`; // Date in current FY
    const previousFYDate = `${currentFY - 1}-12-31`; // Date in previous FY
    
    expect(DateUtils.isCurrentAustralianFinancialYear(currentFYDate)).toBe(true);
    expect(DateUtils.isCurrentAustralianFinancialYear(previousFYDate)).toBe(false);
  });
});

describe('dateHelpers', () => {
  const date = '2024-06-01T12:34:56.789Z';
  it('forInput', () => {
    expect(dateHelpers.forInput(date)).toBe('2024-06-01');
  });
  it('forApi', () => {
    expect(dateHelpers.forApi(date)).toBe(dayjs(date).toISOString());
  });
  it('forTable', () => {
    expect(dateHelpers.forTable(date)).toBe(dayjs(date).format('DD/MM/YYYY'));
  });
  it('forFileName', () => {
    const fileName = dateHelpers.forFileName(date);
    expect(fileName.startsWith('2024-06-01_')).toBe(true);
  });
  it('smart', () => {
    expect(typeof dateHelpers.smart(date)).toBe('string');
  });
}); 