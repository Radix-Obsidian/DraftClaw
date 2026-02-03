import type { UsageRecord } from "../db/schema.js";
import { supabase, type DbUsageRecord } from "../db/supabase-client.js";

export type MetricType = "api_calls" | "messages_sent" | "messages_received" | "ai_tokens" | "media_uploads";

export interface UsageSummary {
  apiCalls: number;
  messagesSent: number;
  messagesReceived: number;
  aiTokens: number;
  mediaUploads: number;
  periodStart: string;
  periodEnd: string;
}

function getCurrentPeriodBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function dbUsageRecordToUsageRecord(dbRecord: DbUsageRecord): UsageRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    metricType: dbRecord.metric_type,
    metricValue: dbRecord.metric_value,
    periodStart: dbRecord.period_start,
    periodEnd: dbRecord.period_end,
    createdAt: dbRecord.created_at,
  };
}

export class UsageService {
  async recordUsage(params: {
    userId: string;
    metricType: MetricType;
    value: number;
  }): Promise<UsageRecord> {
    const { start, end } = getCurrentPeriodBounds();

    // Find existing record for this user/metric/period
    const { data: existingRecord } = await supabase
      .from("usage_records")
      .select("*")
      .eq("user_id", params.userId)
      .eq("metric_type", params.metricType)
      .gte("period_start", start.toISOString())
      .lte("period_end", end.toISOString())
      .single();

    if (existingRecord) {
      // Update existing record
      const { data: updatedRecord, error } = await supabase
        .from("usage_records")
        .update({ metric_value: (existingRecord as DbUsageRecord).metric_value + params.value })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error || !updatedRecord) {
        console.error("Failed to update usage record:", error);
        throw new Error("Failed to update usage record");
      }

      return dbUsageRecordToUsageRecord(updatedRecord as DbUsageRecord);
    }

    // Create new record
    const { data: newRecord, error } = await supabase
      .from("usage_records")
      .insert({
        user_id: params.userId,
        metric_type: params.metricType,
        metric_value: params.value,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
      })
      .select()
      .single();

    if (error || !newRecord) {
      console.error("Failed to create usage record:", error);
      throw new Error("Failed to create usage record");
    }

    return dbUsageRecordToUsageRecord(newRecord as DbUsageRecord);
  }

  async getCurrentPeriodUsage(userId: string): Promise<UsageSummary> {
    const { start, end } = getCurrentPeriodBounds();

    const summary: UsageSummary = {
      apiCalls: 0,
      messagesSent: 0,
      messagesReceived: 0,
      aiTokens: 0,
      mediaUploads: 0,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };

    // Get all usage records for this user in current period
    const { data: records, error } = await supabase
      .from("usage_records")
      .select("*")
      .eq("user_id", userId)
      .gte("period_start", start.toISOString())
      .lte("period_end", end.toISOString());

    if (error || !records) {
      return summary;
    }

    for (const record of records as DbUsageRecord[]) {
      switch (record.metric_type) {
        case "api_calls":
          summary.apiCalls += record.metric_value;
          break;
        case "messages_sent":
          summary.messagesSent += record.metric_value;
          break;
        case "messages_received":
          summary.messagesReceived += record.metric_value;
          break;
        case "ai_tokens":
          summary.aiTokens += record.metric_value;
          break;
        case "media_uploads":
          summary.mediaUploads += record.metric_value;
          break;
      }
    }

    return summary;
  }

  async getUsageHistory(params: {
    userId: string;
    startDate: Date;
    endDate: Date;
    metricType?: MetricType;
  }): Promise<UsageRecord[]> {
    let query = supabase
      .from("usage_records")
      .select("*")
      .eq("user_id", params.userId)
      .gte("period_start", params.startDate.toISOString())
      .lte("period_end", params.endDate.toISOString())
      .order("period_start", { ascending: true });

    if (params.metricType) {
      query = query.eq("metric_type", params.metricType);
    }

    const { data: records, error } = await query;

    if (error || !records) {
      return [];
    }

    return (records as DbUsageRecord[]).map(dbUsageRecordToUsageRecord);
  }

  async checkUsageLimit(params: {
    userId: string;
    metricType: MetricType;
    limit: number;
  }): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const usage = await this.getCurrentPeriodUsage(params.userId);
    
    let current = 0;
    switch (params.metricType) {
      case "api_calls":
        current = usage.apiCalls;
        break;
      case "messages_sent":
        current = usage.messagesSent;
        break;
      case "messages_received":
        current = usage.messagesReceived;
        break;
      case "ai_tokens":
        current = usage.aiTokens;
        break;
      case "media_uploads":
        current = usage.mediaUploads;
        break;
    }

    // -1 means unlimited
    const allowed = params.limit === -1 || current < params.limit;
    const remaining = params.limit === -1 ? -1 : Math.max(0, params.limit - current);

    return {
      allowed,
      current,
      limit: params.limit,
      remaining,
    };
  }

  async incrementApiCalls(userId: string, count = 1): Promise<void> {
    await this.recordUsage({ userId, metricType: "api_calls", value: count });
  }

  async incrementMessagesSent(userId: string, count = 1): Promise<void> {
    await this.recordUsage({ userId, metricType: "messages_sent", value: count });
  }

  async incrementMessagesReceived(userId: string, count = 1): Promise<void> {
    await this.recordUsage({ userId, metricType: "messages_received", value: count });
  }

  async incrementAiTokens(userId: string, tokens: number): Promise<void> {
    await this.recordUsage({ userId, metricType: "ai_tokens", value: tokens });
  }

  async incrementMediaUploads(userId: string, count = 1): Promise<void> {
    await this.recordUsage({ userId, metricType: "media_uploads", value: count });
  }
}

export const usageService = new UsageService();
