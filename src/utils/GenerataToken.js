import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();
// // it tooks the id { id: user._id }

// export const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });
// };

export const generateAdminToken = () => {
  return jwt.sign(
    {
      role: "admin",
      type: "system",
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );
};
