/**
 * MOCK Payment Service
 * This simulates external payment processing.
 * In production, this would call the real DOSWallet GraphQL endpoint.
 */

export const checkPaymentExternal = async (amount: number): Promise<boolean> => {
  // Mock delay to simulate network call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // For now, always return success (true means payment accepted)
  return true;
};

export default checkPaymentExternal;
