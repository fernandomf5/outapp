export interface PageEmbedSettings {
  /** HTML/JS inserido no <head> da página pública */
  headScripts?: string;
  /** HTML/JS inserido antes do fechamento do <body> (rodapé) */
  bodyScripts?: string;
  /** Botão flutuante criado na Out App */
  floatingButtonId?: string;
  floatingButtonCode?: string;
  /** Pop-up criado na Out App */
  popupId?: string;
  popupConfig?: PopupSnapshot | null;
}

export interface PopupSnapshot {
  id: string;
  name?: string;
  title?: string;
  content?: string;
  image_url?: string | null;
  image_fit?: string | null;
  video_url?: string | null;
  background_color?: string | null;
  background_image?: string | null;
  text_color?: string | null;
  text_align?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
  position?: string | null;
  trigger_type?: string | null;
  delay_seconds?: number | null;
  scroll_percentage?: number | null;
  countdown_enabled?: boolean | null;
  countdown_ends_at?: string | null;
  countdown_label?: string | null;
  countdown_bg_color?: string | null;
  countdown_text_color?: string | null;
  is_active?: boolean | null;
}

export const DEFAULT_EMBEDS: PageEmbedSettings = {
  headScripts: "",
  bodyScripts: "",
  floatingButtonId: "",
  floatingButtonCode: "",
  popupId: "",
  popupConfig: null,
};

export const POPUP_SNAPSHOT_COLUMNS =
  "id,name,title,content,image_url,image_fit,video_url,background_color,background_image,text_color,text_align,button_text,button_link,button_color,button_text_color,position,trigger_type,delay_seconds,scroll_percentage,countdown_enabled,countdown_ends_at,countdown_label,countdown_bg_color,countdown_text_color,is_active";
