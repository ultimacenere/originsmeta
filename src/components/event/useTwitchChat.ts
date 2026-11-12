"use client";

import { useEffect, useRef, useState } from "react";
import { TWITCH_IRC_URL, ircHandshake, isPing, parseChatLine, type ChatMessage } from "@/lib/event/chat";

/**
 * Lettura della chat di un canale Twitch dal browser (10/11/2026, pannello del mod di un evento): collegamento anonimo
 * in sola lettura alla chat IRC (nessun token, nessun account), con PONG ai PING e nuovo collegamento dopo 2, 5, 10 e
 * 20 secondi se cade. Il canale lo legge chi tiene aperta la pagina; nessun messaggio passa dal sito.
 */

export type ChatStatus = "off" | "connecting" | "joining" | "on" | "error";

export function useTwitchChat(channel: string | null, enabled: boolean, onMessage: (m: ChatMessage) => void): ChatStatus {
  const [status, setStatus] = useState<ChatStatus>("off");
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !channel) return;
    let ws: WebSocket | null = null;
    let alive = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      if (!alive) return;
      setStatus("connecting");
      ws = new WebSocket(TWITCH_IRC_URL);
      ws.onopen = () => {
        for (const line of ircHandshake(channel, Math.floor(Math.random() * 1_000_000))) ws?.send(line);
      };
      ws.onmessage = (ev) => {
        const text = typeof ev.data === "string" ? ev.data : "";
        for (const line of text.split("\r\n")) {
          if (!line) continue;
          if (isPing(line)) {
            ws?.send("PONG :tmi.twitch.tv");
            continue;
          }
          // benvenuto di Twitch (001): collegati, si aspetta di entrare nel canale (un canale che non esiste non risponde)
          if (/^:tmi\.twitch\.tv 001 /.test(line)) {
            setStatus("joining");
            continue;
          }
          // fine dell'elenco dei presenti (366) o JOIN confermato: si è dentro la chat
          if (/ 366 /.test(line) || new RegExp(`JOIN #${channel}$`).test(line)) {
            tries = 0;
            setStatus("on");
            continue;
          }
          const msg = parseChatLine(line);
          if (msg && msg.channel === channel) handler.current(msg);
        }
      };
      ws.onerror = () => setStatus("error");
      ws.onclose = () => {
        if (!alive) return;
        setStatus("connecting");
        const wait = [2000, 5000, 10_000, 20_000][Math.min(tries, 3)];
        tries += 1;
        timer = setTimeout(connect, wait);
      };
    };
    timer = setTimeout(connect, 0);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
    };
  }, [channel, enabled]);

  return enabled && channel ? status : "off";
}
