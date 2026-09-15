// Prisma returns `price` as a Decimal object and dates as Date instances.
// Express's res.json() would otherwise serialize Decimal as a nested object
// like { s, e, d } instead of a plain number, which is confusing for any
// frontend developer consuming the API. This normalizes a Phone record
// (or an array of them) into plain JSON-friendly values.

function serializePhone(phone) {
  if (!phone) return phone;
  return {
    ...phone,
    price: phone.price !== null && phone.price !== undefined ? Number(phone.price) : null,
  };
}

function serializePhones(phones) {
  return phones.map(serializePhone);
}

module.exports = { serializePhone, serializePhones };
