// Lokasi: [NAMA_LAYANAN]/src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware penanganan error global.
 * Ini akan menangkap error yang dilempar dari controller Anda
 * dan mengirimkan respons JSON yang terstandardisasi.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error ke konsol untuk debugging
  console.error('❌ An unexpected error occurred:');
  console.error(err.stack);

  // Kirim respons error ke klien
  // '500' adalah 'Internal Server Error'
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    // Anda bisa memilih untuk tidak mengirimkan err.message di production
    error: err.message || 'Something went wrong',
  });
};