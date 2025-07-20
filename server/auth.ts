import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { 
  User, 
  InsertUser, 
  Session, 
  InsertSession, 
  LoginRequest, 
  SignupRequest 
} from "@shared/schema";
import { IStorage } from "./storage";

export interface AuthService {
  signup(userData: SignupRequest): Promise<{ user: User; token: string; session: Session }>;
  login(loginData: LoginRequest): Promise<{ user: User; token: string; session: Session }>;
  logout(sessionId: string): Promise<void>;
  validateSession(sessionId: string): Promise<User | null>;
  verifyToken(token: string): Promise<{ userId: number } | null>;

}

export class AuthenticationService implements AuthService {
  private storage: IStorage;
  private jwtSecret: string;

  constructor(storage: IStorage, jwtSecret: string = process.env.JWT_SECRET || "your-secret-key") {
    this.storage = storage;
    this.jwtSecret = jwtSecret;
  }

  async signup(userData: SignupRequest): Promise<{ user: User; token: string; session: Session }> {
    // Check if user already exists
    const existingUser = await this.storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate username from email (for backward compatibility)
    const username = userData.email.split('@')[0];

    // Create user
    const insertUserData: InsertUser = {
      email: userData.email,
      username: username,
      fullName: userData.fullName,
      password: hashedPassword,
    };

    const user = await this.storage.createUser(insertUserData);

    // Create session and token
    const { token, session } = await this.createUserSession(user);

    return { user, token, session };
  }

  async login(loginData: LoginRequest): Promise<{ user: User; token: string; session: Session }> {
    // Only support email-based authentication
    const user = await this.authenticateLocal(loginData.email, loginData.password);

    // Create session and token
    const { token, session } = await this.createUserSession(user);

    return { user, token, session };
  }

  async logout(sessionId: string): Promise<void> {
    await this.storage.deleteSession(sessionId);
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.storage.getSessionById(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.storage.deleteSession(sessionId);
      }
      return null;
    }

    const user = await this.storage.getUserById(session.userId);
    return user || null;
  }

  async verifyToken(token: string): Promise<{ userId: number } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: number };
      return decoded;
    } catch {
      return null;
    }
  }

  private async authenticateLocal(email: string, password: string): Promise<User> {
    const user = await this.storage.getUserByEmail(email);

    if (!user || !user.password) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    return user;
  }

  // LDAP authentication removed - email-only authentication

  private async createUserSession(user: User): Promise<{ token: string; session: Session }> {
    // Generate session ID and JWT token
    const sessionId = this.generateSessionId();
    const token = jwt.sign({ userId: user.id, sessionId }, this.jwtSecret, { expiresIn: '7d' });
    
    // Create session in database
    const sessionData: InsertSession = {
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const session = await this.storage.createSession(sessionData);
    return { token, session };
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
}