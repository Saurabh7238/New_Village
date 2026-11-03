export function canRetryEmailDelivery(status) {
  return status === 'failed' || status === 'skipped';
}
