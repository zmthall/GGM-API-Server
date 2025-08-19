export interface Lead {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    creation_date: string;
    status: LeadStatus;
    tag?: string[];
    last_updated?: string;
    source?: string; // Where lead came from
    notes?: string;
}

export interface LeadFilter {
    status?: string[];
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    source?: string[];
}

export type LeadStatus = 
  | 'New'           // Just received
  | 'Reviewed'      // Someone looked at it
  | 'Contacted'     // Reached out to them
  | 'Qualified'     // They're a real prospect
  | 'Converted'     // They became a customer/sale
  | 'Lost'          // Didn't work out
  | 'Spam';         // Junk/fake leads

export interface LeadStats {
  totalLeads: number;
  statusBreakdown: Record<LeadStatus, number>;
  conversionRate: number;
  recentActivity: {
    leadsThisWeek: number;
    leadsThisMonth: number;
    leadsLastMonth: number;
    monthlyGrowthRate: number;
  };
  sourceBreakdown: Record<string, number>;
  lastUpdated: string;
}