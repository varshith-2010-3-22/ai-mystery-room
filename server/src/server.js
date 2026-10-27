import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

for (const key of ['MONGODB_URI', 'GEMINI_API_KEY']) {
  if (!process.env[key]) { console.error(`Missing required environment variable: ${key}`); process.exit(1); }
}
const port = Number(process.env.PORT || 5000);
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  createApp().listen(port, '0.0.0.0', () => console.log(`Mystery Room API listening on ${port}`));
} catch (error) {
  console.error('Unable to connect to MongoDB:', error.message);
  process.exit(1);
}
