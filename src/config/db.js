import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interview-ai-pro');
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection; 
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error; 
  }
};

export default connectDB;