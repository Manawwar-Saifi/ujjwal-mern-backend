import dotenv from "dotenv";
import { generateAdminToken } from "../utils/GenerataToken.js";

dotenv.config();

console.log("ADMIN TOKEN:\n");
console.log(generateAdminToken());
