// Lokasi: [NAMA_LAYANAN]/src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware penanganan error global.
 * Ini akan menangkap error yang dilempar dari controller Anda
 * dan mengirimkan respons JSON yang terstandardisasi.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ignore request aborted errors (client disconnected)
  if (err.message && err.message.includes('request aborted')) {
    return; // Don't send response if request was aborted
  }

  // Ignore ECONNRESET errors (connection reset by client)
  if ((err as any).code === 'ECONNRESET') {
    return; // Don't send response if connection was reset
  }

  // Check if response was already sent
  if (res.headersSent) {
    return next(err);
  }

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