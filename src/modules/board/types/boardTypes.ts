export type I18nString = {
  en: string;
  hi?: string;
};

export type BoardData = {
  name: I18nString;
  slug: string;
  order?: number;
  isActive?: boolean;
  image?: any | null;
};

export type BoardResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  error?: any;
};
