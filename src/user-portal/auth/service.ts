import type { User, Session } from "../db/schema.js";
import { supabase, type DbUser, type DbSession } from "../db/supabase-client.js";
import { hashPassword, verifyPassword, generateSecureToken, isStrongPassword } from "./password.js";
import { createTokenPair, verifyAccessToken, extractBearerToken, type TokenPair, type JWTPayload } from "./jwt.js";

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  error?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface WhatsAppLinkData {
  userId: string;
  whatsappJid: string;
}

function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    phone: dbUser.phone || undefined,
    passwordHash: dbUser.password_hash || undefined,
    whatsappJid: dbUser.whatsapp_jid || undefined,
    whatsappLinked: dbUser.whatsapp_linked,
    subscriptionTier: dbUser.subscription_tier,
    stripeCustomerId: dbUser.stripe_customer_id || undefined,
    emailVerified: dbUser.email_verified,
    emailVerificationToken: dbUser.email_verification_token || undefined,
    passwordResetToken: dbUser.password_reset_token || undefined,
    passwordResetExpires: dbUser.password_reset_expires || undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

export class AuthService {
  async register(data: RegistrationData): Promise<AuthResult> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(data.password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.errors.join(", ") };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user in database
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        password_hash: passwordHash,
        whatsapp_linked: false,
        subscription_tier: "free",
        email_verified: false,
        email_verification_token: generateSecureToken(),
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error("Failed to create user:", insertError);
      return { success: false, error: "Failed to create account" };
    }

    const user = dbUserToUser(newUser as DbUser);

    // Create tokens
    const tokens = createTokenPair(user);

    // Create session in database
    const { error: sessionError } = await supabase.from("sessions").insert({
      user_id: user.id,
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
    }

    // Return user without sensitive data
    const safeUser = this.sanitizeUser(user);

    return { success: true, user: safeUser, tokens };
  }

  async login(data: LoginData): Promise<AuthResult> {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Find user by email
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !dbUser) {
      return { success: false, error: "Invalid email or password" };
    }

    const user = dbUserToUser(dbUser as DbUser);

    if (!user.passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Create tokens
    const tokens = createTokenPair(user);

    // Create session in database
    await supabase.from("sessions").insert({
      user_id: user.id,
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.toISOString(),
    });

    const safeUser = this.sanitizeUser(user);

    return { success: true, user: safeUser, tokens };
  }

  async logout(refreshToken: string): Promise<boolean> {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("refresh_token", refreshToken);

    return !error;
  }

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    // Find session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("refresh_token", refreshToken)
      .single();

    if (sessionError || !session) {
      return { success: false, error: "Invalid refresh token" };
    }

    const dbSession = session as DbSession;

    // Check if session is expired
    if (new Date(dbSession.expires_at) < new Date()) {
      await supabase.from("sessions").delete().eq("refresh_token", refreshToken);
      return { success: false, error: "Refresh token expired" };
    }

    // Find user
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", dbSession.user_id)
      .single();

    if (userError || !dbUser) {
      await supabase.from("sessions").delete().eq("refresh_token", refreshToken);
      return { success: false, error: "User not found" };
    }

    const user = dbUserToUser(dbUser as DbUser);

    // Delete old session
    await supabase.from("sessions").delete().eq("refresh_token", refreshToken);

    // Create new tokens
    const tokens = createTokenPair(user);

    // Create new session
    await supabase.from("sessions").insert({
      user_id: user.id,
      token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.toISOString(),
    });

    const safeUser = this.sanitizeUser(user);

    return { success: true, user: safeUser, tokens };
  }

  async validateToken(authHeader: string | undefined): Promise<{ valid: boolean; payload?: JWTPayload; user?: User }> {
    const token = extractBearerToken(authHeader);
    if (!token) {
      return { valid: false };
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return { valid: false };
    }

    // Find user
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.sub)
      .single();

    if (error || !dbUser) {
      return { valid: false };
    }

    const user = dbUserToUser(dbUser as DbUser);

    return { valid: true, payload, user: this.sanitizeUser(user) };
  }

  async linkWhatsApp(data: WhatsAppLinkData): Promise<AuthResult> {
    // Check if WhatsApp is already linked to another user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("whatsapp_jid", data.whatsappJid)
      .neq("id", data.userId)
      .single();

    if (existingUser) {
      return { success: false, error: "WhatsApp account already linked to another user" };
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        whatsapp_jid: data.whatsappJid,
        whatsapp_linked: true,
      })
      .eq("id", data.userId)
      .select()
      .single();

    if (error || !updatedUser) {
      return { success: false, error: "User not found" };
    }

    const user = dbUserToUser(updatedUser as DbUser);

    return { success: true, user: this.sanitizeUser(user) };
  }

  async unlinkWhatsApp(userId: string): Promise<AuthResult> {
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        whatsapp_jid: null,
        whatsapp_linked: false,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !updatedUser) {
      return { success: false, error: "User not found" };
    }

    const user = dbUserToUser(updatedUser as DbUser);

    return { success: true, user: this.sanitizeUser(user) };
  }

  async getUserByWhatsApp(whatsappJid: string): Promise<User | null> {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_jid", whatsappJid)
      .single();

    if (error || !dbUser) {
      return null;
    }

    const user = dbUserToUser(dbUser as DbUser);
    return this.sanitizeUser(user);
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !dbUser) {
      return null;
    }

    const user = dbUserToUser(dbUser as DbUser);
    return this.sanitizeUser(user);
  }

  async updateUser(userId: string, updates: Partial<Pick<User, "email" | "phone">>): Promise<AuthResult> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.email) {
      const normalizedEmail = updates.email.toLowerCase().trim();

      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .neq("id", userId)
        .single();

      if (existingUser) {
        return { success: false, error: "Email already in use" };
      }

      dbUpdates.email = normalizedEmail;
      dbUpdates.email_verified = false;
      dbUpdates.email_verification_token = generateSecureToken();
    }

    if (updates.phone !== undefined) {
      dbUpdates.phone = updates.phone?.trim() || null;
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(dbUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error || !updatedUser) {
      return { success: false, error: "User not found" };
    }

    const user = dbUserToUser(updatedUser as DbUser);

    return { success: true, user: this.sanitizeUser(user) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    // Find user
    const { data: dbUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !dbUser) {
      return { success: false, error: "User not found" };
    }

    const user = dbUserToUser(dbUser as DbUser);

    if (!user.passwordHash) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.errors.join(", ") };
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return { success: false, error: "Failed to update password" };
    }

    const updated = dbUserToUser(updatedUser as DbUser);

    return { success: true, user: this.sanitizeUser(updated) };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; token?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (!dbUser) {
      // Don't reveal if email exists
      return { success: true };
    }

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await supabase
      .from("users")
      .update({
        password_reset_token: token,
        password_reset_expires: expires.toISOString(),
      })
      .eq("id", dbUser.id);

    // Send reset link via email — never expose token in response body
    const portalUrl = process.env.DRAFTCLAW_PORTAL_URL || "https://draftclaw.ai";
    const resetUrl = `${portalUrl}/reset-password?token=${token}`;
    console.info(`[PasswordReset] Reset link for ${normalizedEmail}: ${resetUrl}`);
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    // Find user with this reset token
    const { data: dbUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("password_reset_token", token)
      .single();

    if (fetchError || !dbUser) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    const user = dbUserToUser(dbUser as DbUser);

    // Check if token is expired
    if (!user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
      return { success: false, error: "Reset token has expired" };
    }

    // Validate new password
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.errors.join(", ") };
    }

    // Update password
    const newPasswordHash = await hashPassword(newPassword);

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: newPasswordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return { success: false, error: "Failed to reset password" };
    }

    const updated = dbUserToUser(updatedUser as DbUser);

    return { success: true, user: this.sanitizeUser(updated) };
  }

  private sanitizeUser(user: User): User {
    const { passwordHash, emailVerificationToken, passwordResetToken, passwordResetExpires, ...safeUser } = user;
    return safeUser as User;
  }
}

export const authService = new AuthService();
