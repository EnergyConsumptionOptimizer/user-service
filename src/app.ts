import "dotenv/config";
import express from "express";
import router from "./interfaces/api/routes/Routes";

const app = express();
app.use(express.json());
app.use(router);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
