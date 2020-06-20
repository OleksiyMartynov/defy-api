export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const expandMap = (initial, keys, itemsMap) => {
    let lastKnown = initial; 
    return keys.map(key=>{
        console.log(itemsMap[key])
        const out = key in itemsMap ? itemsMap[key] : lastKnown;
        
        lastKnown = out;
        console.log(key+" Last known:")
        console.log(lastKnown.date);
        return out;
    });
};

export const arrayOfNumbers = (N, offset) => Array.apply(null, {length: N}).map(Number.call, Number);

export const nowSeconds = () => (new Date()).getTime()/1000;

export const hoursSince = (unixTimestampSeconds) => Math.floor((nowSeconds()-(unixTimestampSeconds/1000))/(60*60));

export const componentsToDate = (year, mon, day, hours) => {
    const d = new Date();
    d.setUTCFullYear(year);
    d.setUTCMonth(mon);
    d.setUTCDate(day);
    d.setUTCHours(hours);
    return d;
};

export const dateToComponents = (date) => ({ year:date.getFullYear(), month:date.getMonth(), day:date.getDate(), hour:date.getHours() })