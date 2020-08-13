export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const expandMap = (initial, keys, itemsMap) => {
  let lastKnown = initial;
  return keys.map((key) => {
    const out = key in itemsMap ? itemsMap[key] : lastKnown;
    lastKnown = out;
    return out;
  });
};

export const arrayOfNumbers = (N) =>
  Array.apply(null, { length: N }).map(Number.call, Number);

export const nowSeconds = () => new Date().getTime() / 1000;

export const hoursSince = (unixTimestampSeconds) =>
  Math.floor((nowSeconds() - unixTimestampSeconds / 1000) / (60 * 60));

export const componentsToDate = (year, mon, day, hours) => {
  const d = new Date();
  d.setUTCFullYear(year);
  d.setUTCMonth(mon);
  d.setUTCDate(day);
  d.setUTCHours(hours);
  return d;
};

export const dateToComponents = (date) => ({
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
  hour: date.getHours(),
});

export const trimStringToLength = (string, length) => {
  return string.length > length
    ? string.substring(0, length - 3) + "..."
    : string;
};

export const createRandomString = (length = 360, prefix = "lnbc") => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return `${prefix}${result}`;
};
