import { formatInTimeZone } from 'date-fns-tz';

export const TOURNAMENT_TIMEZONE = 'Asia/Kolkata';

export function formatTournamentTime(date: Date | string, formatStr: string = 'HH:mm', timezone: string = TOURNAMENT_TIMEZONE) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(d, timezone, formatStr);
}

export function formatTournamentDate(date: Date | string, formatStr: string = 'yyyy-MM-dd', timezone: string = TOURNAMENT_TIMEZONE) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(d, timezone, formatStr);
}

export function getAvailableTimezones() {
    return [
        { label: 'India (IST)', value: 'Asia/Kolkata' },
        { label: 'UK (GMT/BST)', value: 'Europe/London' },
        { label: 'USA (EST)', value: 'America/New_York' },
        { label: 'USA (PST)', value: 'America/Los_Angeles' },
        { label: 'UAE (GST)', value: 'Asia/Dubai' },
        { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
        { label: 'Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone }
    ];
}
