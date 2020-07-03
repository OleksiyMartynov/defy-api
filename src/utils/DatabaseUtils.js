import mongoose from "mongoose";
import {
  expandMap,
  arrayOfNumbers,
  hoursSince,
  componentsToDate,
} from "./Common";

export const connectDb = (databaseUrl) => {
  return mongoose.connect(databaseUrl);
};

export const removeAllCollections = async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany();
  }
};

/**
 * Fills up missing hour time slots given the hourly history of a debate
 * @param debate Debate data model
 * @param history Array of hourly grouped activity
 */
export const expandDebateAggregates = (debate, history) => {
  // recalculate history as rolling sum
  const globalTotals = { totalCon: 0, totalPro: 0 };
  const historyTotals = history.map((item) => {
    globalTotals.totalPro += item.totalPro;
    globalTotals.totalCon += item.totalCon;
    return { ...globalTotals, ...item._id };
  });

  const hoursSinceEnd = hoursSince(
    new Date(debate.updated.getTime() + debate.duration)
  );
  const hoursSinceDebateCreated =
    hoursSince(debate.created.getTime()) - Math.max(hoursSinceEnd, 0) + 1; // todo: might not need + 1

  //array of hours since debate creation
  const timePeriod = arrayOfNumbers(hoursSinceDebateCreated + 1);

  //maps historical items to array of hours filling unmapped slots with previous slot's values
  const expandedHours = expandMap(
    //initial mapping value if no history available in first hours
    { totalPro: 0, totalCon: 0, date: debate.created },
    //reverse array of hours as we want to start with oldest items first
    timePeriod.reverse(),
    //convert history array to a map with hours-since-creation as key
    historyTotals.reduce(function (map, obj) {
      const date = componentsToDate(obj.year, obj.month - 1, obj.day, obj.hour);
      const key = hoursSince(date.getTime()) - Math.max(hoursSinceEnd, 0);
      map[key] = { date, ...obj };
      return map;
    }, {})
  );
  return expandedHours;
};
