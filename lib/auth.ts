// lib/auth.ts
import jwt from 'jsonwebtoken';

// Define the interface for decoded token
export interface DecodedToken {
  id: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

// Define the interface for verification result
export interface VerifyTokenResult {
  success: boolean;
  decoded?: DecodedToken;
  error?: string;
}

/**
 * Verifies a JWT token
 * @param token - The JWT token to verify
 * @returns Object with success status and decoded data or error
 */
export function verifyToken(token: string): VerifyTokenResult {
  try {
    // Make sure you have JWT_SECRET in your environment variables
    const jwtSecret = process.env.secret!;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    
    return {
      success: true,
      decoded
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Token verification failed'
    };
  }
}

/**
 * Creates a JWT token
 * @param payload - The payload to encode in the token
 * @param expiresIn - Token expiration time (default: '24h')
 * @returns The signed JWT token
 */
export function createToken(payload: object, expiresIn: string = '24h'): string {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: 24 * 60 * 60 });
}

/**
 * Extracts token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The token or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return null;
}

/**
 * Validates if a token is expired
 * @param decoded - The decoded token payload
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}