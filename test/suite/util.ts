function today(): Date {
  return new Date();
}

function yesterday(): Date {
  const date = today();
  const dayInMillis = 24 * 60 * 60 * 1000;
  date.setTime(date.getTime() - dayInMillis);
  return date;
}

export const TODAY = today();
export const YESTERDAY = yesterday();
