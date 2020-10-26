/*
 * Makes a relative date string from a date object.
 *
 * Source: https://github.com/github/time-elements/blob/4414cbacdb1e0cf95b7e99960897bb0c55736323/src/relative-time.ts#L57-L87
 */

export function relativeDate(ms: number): string {
  const sec = Math.round(ms / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(month / 12)

  const formatter = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})

  if (ms < 0) {
    return formatter.format(0, 'second')
  } else if (sec < 10) {
    return formatter.format(0, 'second')
  } else if (sec < 45) {
    return formatter.format(-sec, 'second')
  } else if (sec < 90) {
    return formatter.format(-min, 'minute')
  } else if (min < 45) {
    return formatter.format(-min, 'minute')
  } else if (min < 90) {
    return formatter.format(-hr, 'hour')
  } else if (hr < 24) {
    return formatter.format(-hr, 'hour')
  } else if (hr < 36) {
    return formatter.format(-day, 'day')
  } else if (day < 30) {
    return formatter.format(-day, 'day')
  } else if (month < 18) {
    return formatter.format(-month, 'month')
  } else {
    return formatter.format(-year, 'year')
  }
}
