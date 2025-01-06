import jwt from "jsonwebtoken";
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({
        massage: "User not Authenticated",
        status: false,
      });
    }
    const decode = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decode) {
      return res.status(400).json({
        message: "Invalid user",
        status: false,
      });
    }
    req.id = decode.userId;
    next();
  } catch (err) {
    console.log(err);
  }
};
export default isAuth;
