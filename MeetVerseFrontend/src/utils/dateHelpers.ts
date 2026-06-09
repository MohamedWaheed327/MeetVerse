export function getTimeUntilMeeting(isoDateString: string): string {
  const meetingTime = new Date(isoDateString).getTime();
  const now = Date.now();
  const diffMs = meetingTime - now;

  if (diffMs <= 0) {
    const passedMins = Math.abs(Math.floor(diffMs / 60000));
    if (passedMins < 1) return "Starting now";
    return `Started ${passedMins} ${passedMins === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `Starts in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
}
