import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export interface HolidayCalendarYear {
    id: number;
    calendarYear: number;
    regionCode: string;
    timeZone: string;
    yearStatus: string;
    totalDays: number;
    confirmedBy?: string | null;
    confirmedTime?: string | null;
    createBy: string;
    createTime: string;
    updateBy: string;
    updateTime: string;
}

export interface HolidayCalendarDay {
    id: number;
    calendarDate: string;
    dayOfWeek: number;
    dayType: 'WORKDAY' | 'HOLIDAY';
    holidayName?: string | null;
    statutoryHoliday: boolean;
    adjustedWorkday: boolean;
    dataSource: string;
    remark?: string | null;
    updateBy: string;
    updateTime: string;
}

export interface HolidayCalendarMonth {
    year?: HolidayCalendarYear | null;
    days: HolidayCalendarDay[];
}

export interface HolidayCalendarDaySaveRequest {
    calendarDate: string;
    dayType: 'WORKDAY' | 'HOLIDAY';
    holidayName?: string;
    statutoryHoliday: boolean;
    adjustedWorkday: boolean;
    remark?: string;
}

/** Query a China mainland settlement calendar month. */
export async function getHolidayCalendarMonth(year: number, month: number) {
    const result = await http.get<CommonResult<HolidayCalendarMonth>>('/admin/system/holiday-calendar', {
        params: { year, month },
    });
    return unwrapResult(result.data);
}

/** Initialize the default weekday/weekend calendar for a natural year. */
export async function initializeHolidayCalendarYear(year: number) {
    const result = await http.post<CommonResult<HolidayCalendarYear>>('/admin/system/holiday-calendar/years', { year });
    return unwrapResult(result.data);
}

/** Save one or more manually maintained dates. */
export async function saveHolidayCalendarDays(days: HolidayCalendarDaySaveRequest[]) {
    const result = await http.put<CommonResult<HolidayCalendarMonth>>('/admin/system/holiday-calendar/days', { days });
    return unwrapResult(result.data);
}

/** Confirm a complete year before it can support T+N calculation. */
export async function confirmHolidayCalendarYear(year: number) {
    const result = await http.put<CommonResult<HolidayCalendarYear>>('/admin/system/holiday-calendar/years/confirm', undefined, {
        params: { year },
    });
    return unwrapResult(result.data);
}

/** Export all dates of a natural year. */
export async function exportHolidayCalendarYear(year: number) {
    await downloadExcel('/admin/system/holiday-calendar/export', {
        params: { year },
    });
}
