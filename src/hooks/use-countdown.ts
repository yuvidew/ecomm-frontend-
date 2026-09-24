import { useEffect, useState } from 'react'

type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// derives the { days, hours, minutes, seconds } breakdown from a raw millisecond count
const toCountdown = (ms: number): Countdown => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

/**
 * useCountdown — ticks down from a fixed duration to zero, once per second.
 * @param durationMs - starting duration in milliseconds; the countdown begins from this value
 * the moment the calling component mounts and does not persist across reloads.
 * @returns remaining time as `{ days, hours, minutes, seconds }`, clamped at 0.
 */
export const useCountdown = (durationMs: number): Countdown => {
  const [remainingMs, setRemainingMs] = useState(durationMs)

  useEffect(() => {
    const endAt = Date.now() + durationMs

    // derive remaining time from wall-clock time rather than decrementing by 1000ms each
    // tick, so the countdown doesn't drift when the tab is backgrounded/throttled
    const tick = () => setRemainingMs(Math.max(0, endAt - Date.now()))
    tick()

    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [durationMs])

  return toCountdown(remainingMs)
}
