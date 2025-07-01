export const formatDateTime = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  
  const months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const day: number = date.getDate();
  const month: string = months[date.getMonth()];
  const year: number = date.getFullYear();
  
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
  
  // Format time to 12-hour format
  const timeString = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Denver' // Match your timezone
  }).format(date);
  
  return `${month} ${day}${getOrdinalSuffix(day)}, ${year} at ${timeString}`;
}