export type ExamSchedule = {
  date?: string;     
  timing?: string;   
  duration?: string; 
};

export type PaperData = {
  boardId: string;
  examId: string;
  name: string;
  slug: string;
  year: number;
  shift?: string;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  pathSlugs: string[];
  pathKey: string;
  questionCount?: number;
  examSchedule?: ExamSchedule | null;
};

export type PaperResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};


export type BulkPaperUploadItem = {
  name: string;
  date?: string;      // "dd/mm/yyyy"
  time?: string;      // e.g. "16:00 P.M."
  duration?: string;  // e.g. "2 hours"
  exam: string;       // exam name or slug
  shift?: string;
  questions?: any[];
};

export type BulkPaperUploadResult = {
  success: boolean;
  statusCode: number;
  message: string;

  papers: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    faulty: Array<{
      name?: string;
      exam?: string;
      reason: string;
    }>;
  };

  questions: any;
};