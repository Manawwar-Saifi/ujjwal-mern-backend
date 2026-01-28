/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates the need for try-catch blocks in every controller
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 *
 * @example
 * // Instead of:
 * export const getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 *
 * // Use:
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json(user);
 * });
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
