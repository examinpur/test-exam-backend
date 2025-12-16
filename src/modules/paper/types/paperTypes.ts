export type PaperData = {
  boardId: string;
  examId: string;
  name: string;
  slug: string;
  year: number;
  paperNumber?: number;
  shift?: string;
  isActive?: boolean;
  boardSlug: string;
  examSlug: string;
  pathSlugs: string[];
  pathKey: string;
  questionPathKeys?: string[];
  questionCount?: number;
};

export type PaperResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};

