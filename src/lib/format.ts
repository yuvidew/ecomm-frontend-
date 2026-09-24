// store currency used for every displayed price -- change here to switch app-wide
const CURRENCY = 'INR'

const priceFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY })

/**
 * formatPrice — formats a price for display. The backend returns DECIMAL
 * columns as strings, so both strings and numbers are accepted.
 * @param price - raw price value
 */
export const formatPrice = (price: string | number) => priceFormatter.format(Number(price))

/**
 * formatDate — formats an ISO date string from the backend for display.
 * @param value - ISO date string
 */
export const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
