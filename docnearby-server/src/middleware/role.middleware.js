import AppError from "../utils/AppError.js";

export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
    }
    return next();
  };
}
