import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;

async function start() {
  await connectDatabase();
  app.listen(port, () => console.log(`ProdPilot API is running on port ${port}`));
}

start().catch((error) => {
  console.error(`Unable to start the server: ${error.message}`);
  process.exit(1);
});
