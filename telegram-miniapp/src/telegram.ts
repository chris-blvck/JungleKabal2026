export type TelegramUser = {
  id?: number;
  username?: string;
  first_name?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          start_param?: string;
        };
        openTelegramLink?: (url: string) => void;
      };
    };
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function getStartParam() {
  return getTelegramWebApp()?.initDataUnsafe?.start_param ?? null;
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

export function initTelegramMiniApp() {
  const tg = getTelegramWebApp();
  tg?.ready();
  tg?.expand();
}


export function getTelegramInitData() {
  return getTelegramWebApp()?.initData || "";
}
