import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { JOIN_URL, SERVER_ADDRESS_HTTP } from "../constants";
import "./JoinQRCode.css";
import { qr } from "../strings";

const isLoopback = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "[::1]";

/**
 * Resolves the address other phones should open. Prefers the page's own
 * origin, unless the page was opened via localhost on the host machine, in
 * which case it asks the server for the LAN address it was started with.
 */
function useJoinUrl(): string {
  const [url, setUrl] = useState(window.location.origin);
  useEffect(() => {
    if (!isLoopback(window.location.hostname)) {
      return;
    }
    let cancelled = false;
    fetch(SERVER_ADDRESS_HTTP + JOIN_URL)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        if (!cancelled && text.trim()) {
          setUrl(text.trim());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return url;
}

type JoinQRCodeProps = {
  caption?: string;
  /**
   * Small code with the caption beside it, for screens that are short on
   * space. Tapping it shows the code full screen; tapping again closes it.
   */
  compact?: boolean;
};

export default function JoinQRCode({
  caption = qr.defaultCaption,
  compact = false,
}: JoinQRCodeProps) {
  const url = useJoinUrl();
  const [enlarged, setEnlarged] = useState(false);
  const shortUrl = url.replace(/^https?:\/\//, "");
  const code = (
    <div className="join-qr-code">
      <QRCodeSVG value={url} size={512} level="M" includeMargin={true} />
    </div>
  );

  if (!compact) {
    return (
      <div className="join-qr">
        {code}
        <p className="join-qr-caption">{caption}</p>
        <p className="join-qr-url">{shortUrl}</p>
      </div>
    );
  }

  const toggle = () => setEnlarged(!enlarged);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" ||
      e.key === " " ||
      (enlarged && e.key === "Escape")
    ) {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <>
      <div
        className="join-qr join-qr-compact"
        role="button"
        tabIndex={0}
        aria-label={qr.enlargeLabel(caption)}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        {code}
        <div className="join-qr-text">
          <p className="join-qr-caption">{caption}</p>
          <p className="join-qr-url">{shortUrl}</p>
          <p className="join-qr-hint">{qr.tapToEnlarge}</p>
        </div>
      </div>
      {enlarged && (
        <div
          className="join-qr-overlay"
          role="dialog"
          aria-label={caption}
          tabIndex={-1}
          onClick={toggle}
          onKeyDown={onKeyDown}
          ref={(el) => el && el.focus()}
        >
          {code}
          <p className="join-qr-caption">{caption}</p>
          <p className="join-qr-url">{shortUrl}</p>
          <p className="join-qr-hint">{qr.tapToClose}</p>
        </div>
      )}
    </>
  );
}
