import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "ldapjs";
import type { 
  User, 
  InsertUser, 
  Session, 
  InsertSession, 
  LdapConfig, 
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
  authenticateLDAP(username: string, password: string, ldapConfigId?: number): Promise<User>;
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
    const existingUsers = await this.storage.getUsers();
    const userExists = existingUsers.some(
      u => u.email === userData.email || u.username === userData.username
    );

    if (userExists) {
      throw new Error("User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const insertUserData: InsertUser = {
      email: userData.email,
      username: userData.username,
      fullName: userData.fullName,
      password: hashedPassword,
    };

    const user = await this.storage.createUser(insertUserData);

    // Create session and token
    const { token, session } = await this.createUserSession(user);

    return { user, token, session };
  }

  async login(loginData: LoginRequest): Promise<{ user: User; token: string; session: Session }> {
    // For now, only support local authentication
    const user = await this.authenticateLocal(loginData.username, loginData.password);

    // Note: Last login tracking removed due to simplified schema

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

  private async authenticateLocal(username: string, password: string): Promise<User> {
    const users = await this.storage.getUsers();
    const user = users.find(u => 
      u.username === username || u.email === username
    );

    if (!user || !user.password) {
      throw new Error("Invalid username or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid username or password");
    }

    return user;
  }

  async authenticateLDAP(username: string, password: string, ldapConfigId?: number): Promise<User> {
    const ldapConfigs = await this.storage.getLdapConfigs();
    const activeConfigs = ldapConfigs.filter(config => config.isActive);
    
    if (activeConfigs.length === 0) {
      throw new Error("No LDAP configuration available");
    }

    // Use specific config if provided, otherwise try the first active one
    const ldapConfig = ldapConfigId 
      ? activeConfigs.find(c => c.id === ldapConfigId)
      : activeConfigs[0];

    if (!ldapConfig) {
      throw new Error("LDAP configuration not found");
    }

    const ldapUser = await this.performLdapAuthentication(username, password, ldapConfig);
    
    // Check if user exists in our database
    const users = await this.storage.getUsers();
    let user = users.find(u => u.username === username && u.authProvider === "ldap");

    if (!user) {
      // Create new user from LDAP data
      const insertUserData: InsertUser = {
        email: ldapUser.email,
        username: ldapUser.username,
        firstName: ldapUser.firstName,
        lastName: ldapUser.lastName,
        passwordHash: null, // No password hash for LDAP users
        authProvider: "ldap",
        isActive: true,
        isAdmin: false,
      };

      user = await this.storage.createUser(insertUserData);
    } else if (!user.isActive) {
      throw new Error("Account is disabled");
    }

    return user;
  }

  private async performLdapAuthentication(
    username: string, 
    password: string, 
    config: LdapConfig
  ): Promise<{ email: string; username: string; firstName: string; lastName: string }> {
    return new Promise((resolve, reject) => {
      const client = new Client({
        url: config.url,
        timeout: 5000,
        connectTimeout: 5000,
      });

      client.on('error', (err) => {
        reject(new Error(`LDAP connection error: ${err.message}`));
      });

      const userDN = config.userSearchFilter.replace('{{username}}', username);
      const fullUserDN = `${userDN},${config.userSearchBase}`;

      // Try to bind with user credentials
      client.bind(fullUserDN, password, (err) => {
        if (err) {
          client.unbind();
          reject(new Error("Invalid LDAP credentials"));
          return;
        }

        // Search for user attributes
        const searchOptions = {
          filter: config.userSearchFilter.replace('{{username}}', username),
          scope: 'sub' as const,
          attributes: [
            config.emailAttribute || 'mail',
            config.firstNameAttribute || 'givenName',
            config.lastNameAttribute || 'sn',
            'sAMAccountName'
          ]
        };

        client.search(config.userSearchBase, searchOptions, (err, res) => {
          if (err) {
            client.unbind();
            reject(new Error(`LDAP search error: ${err.message}`));
            return;
          }

          let userFound = false;

          res.on('searchEntry', (entry) => {
            userFound = true;
            const attributes = entry.pojo.attributes;
            
            const email = attributes.find(attr => attr.type === (config.emailAttribute || 'mail'))?.values[0] || '';
            const firstName = attributes.find(attr => attr.type === (config.firstNameAttribute || 'givenName'))?.values[0] || '';
            const lastName = attributes.find(attr => attr.type === (config.lastNameAttribute || 'sn'))?.values[0] || '';
            const ldapUsername = attributes.find(attr => attr.type === 'sAMAccountName')?.values[0] || username;

            client.unbind();
            resolve({
              email,
              username: ldapUsername,
              firstName,
              lastName,
            });
          });

          res.on('error', (err) => {
            client.unbind();
            reject(new Error(`LDAP search error: ${err.message}`));
          });

          res.on('end', () => {
            if (!userFound) {
              client.unbind();
              reject(new Error("User not found in LDAP"));
            }
          });
        });
      });
    });
  }

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