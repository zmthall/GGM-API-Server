// Add ordinal suffix (st, nd, rd, th)
  function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

export const formatDateTime = (
  dateInput: string | Date,
  timeZone = 'America/Denver'
): string => {
  const date = new Date(dateInput)

  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone
  }).formatToParts(date)

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''

  const month = getPart('month')
  const day = Number(getPart('day'))
  const year = getPart('year')
  const hour = getPart('hour')
  const minute = getPart('minute')
  const dayPeriod = getPart('dayPeriod')

  return `${month} ${day}${getOrdinalSuffix(day)}, ${year} at ${hour}:${minute} ${dayPeriod}`
}

export const formatSubmissionDate = (date: Date = new Date()): string => {
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    if (hours === 0) hours = 12; // 0 should be 12
    
    // Pad minutes and seconds with leading zeros
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    return `${month}/${day}/${year}, ${hours}:${minutesStr}:${secondsStr} ${ampm}`;
};

export const convertISOToMMDDYYYY = (isoString: string): string => {
  const date = new Date(isoString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};