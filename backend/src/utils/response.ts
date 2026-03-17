import { Response } from "express";

export const success = <T>(
  res: Response,
  data: T,
  message = "Success",
  code = 200,
) => {
  return res.status(code).json({ success: true, message, data });
};

export const error = (
  res: Response,
  message: string,
  code = 400,
  errors: unknown = null,
) => {
  return res.status(code).json({ success: false, message, errors });
};

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
) => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data,
    pagination: { total, page, limit, totalPages },
  });
};
