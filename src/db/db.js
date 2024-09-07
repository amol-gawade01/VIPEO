import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectToDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB host at : ${connectionInstance.connection.host} `)
    } catch (error) {
        console.log('Connection to Db Failed',error);
        process.exit(1);
    }
}

export default connectToDB; 