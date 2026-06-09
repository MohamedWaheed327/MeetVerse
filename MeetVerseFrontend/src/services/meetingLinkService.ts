/**
 * Service for generating, copying, and sharing meeting invitation links.
 */
export const meetingLinkService = {
  /**
   * Generates a link to join a meeting.
   * Directs to the JoinMeetingPage where participants can customize their audio/video settings.
   */
  getJoinLink(meetingId: string): string {
    const origin = window.location.origin;
    return `${origin}/meetings/join?meetingId=${encodeURIComponent(meetingId)}`;
  },

  /**
   * Generates a formatted text invitation message for a meeting.
   */
  getInviteMessage(meetingId: string, title?: string): string {
    const link = this.getJoinLink(meetingId);
    const meetingTitle = title ? `"${title}"` : "a MeetVerse Session";
    return `You've been invited to join ${meetingTitle} on MeetVerse.\n\nMeeting ID: ${meetingId}\nJoin Link: ${link}`;
  },

  /**
   * Copies the join link directly to the clipboard.
   */
  async copyJoinLink(meetingId: string): Promise<boolean> {
    const link = this.getJoinLink(meetingId);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        return true;
      }
      // Fallback for older browsers or insecure contexts
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed"; // prevent scrolling
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Failed to copy link:", err);
      return false;
    }
  },

  /**
   * Copies the full formatted invitation text to the clipboard.
   */
  async copyInviteMessage(meetingId: string, title?: string): Promise<boolean> {
    const message = this.getInviteMessage(meetingId, title);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        return true;
      }
      const textArea = document.createElement("textarea");
      textArea.value = message;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Failed to copy invite message:", err);
      return false;
    }
  },

  /**
   * Shares the meeting invitation using the Web Share API (if supported).
   * Falls back to copying the link.
   * Returns sharing details.
   */
  async shareMeeting(meetingId: string, title?: string): Promise<{ shared: boolean; method: "share" | "copy" | "failed" }> {
    const link = this.getJoinLink(meetingId);
    const text = this.getInviteMessage(meetingId, title);
    const shareData = {
      title: title ? `MeetVerse: ${title}` : "Join MeetVerse Meeting",
      text: text,
      url: link,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { shared: true, method: "share" };
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { shared: false, method: "failed" };
      }
      console.warn("navigator.share failed, falling back to clipboard copy", err);
    }

    // Fallback to copying the link
    const copied = await this.copyJoinLink(meetingId);
    return copied 
      ? { shared: true, method: "copy" } 
      : { shared: false, method: "failed" };
  }
};
