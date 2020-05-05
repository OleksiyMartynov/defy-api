
import mongoose from "mongoose";
export const connectDb = (databaseUrl) => {
    return mongoose.connect(databaseUrl);
};

export const removeAllCollections = async () => {
  const collections = Object.keys(mongoose.connection.collections)
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName]
    await collection.deleteMany()
  }
}