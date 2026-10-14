"use client";

import { ReactNode, useCallback } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";

import { useAuth, useUser } from "@clerk/nextjs";

interface LiveblocksWrapperProps {
  children: ReactNode;
  roomId: string;
}

export function LiveblocksWrapper({ children, roomId }: LiveblocksWrapperProps) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userName = user?.fullName;
  const userAvatar = user?.imageUrl;
  const userId = user?.id;

  const authEndpoint = useCallback(
    async (room?: string) => {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        if (userEmail) headers["x-user-email"] = userEmail;
        if (userName) headers["x-user-name"] = userName;
        if (userAvatar) headers["x-user-avatar"] = userAvatar;
      } else {
        headers["x-dev-user-id"] = userId || "dev_editor";
        headers["x-dev-user-email"] = userEmail || "editor@hanoiai.app";
        headers["x-dev-user-name"] = userName || "Collaborator";
        if (userAvatar) headers["x-user-avatar"] = userAvatar;
      }

      const res = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers,
        body: JSON.stringify({ room }),
      });
      return await res.json();
    },
    [getToken, userEmail, userName, userAvatar, userId]
  );

  const resolveUsers = useCallback(
    async ({ userIds }: { userIds: string[] }) => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(
          `/api/liveblocks-auth/resolve-users?ids=${encodeURIComponent(userIds.join(","))}`,
          { headers }
        );
        if (res.ok) {
          const users = await res.json();
          return userIds.map((id, index) => {
            if (userId && (id === userId || id === "dev_editor")) {
              return {
                name: userName || userEmail || "You",
                avatar:
                  userAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || userId)}`,
              };
            }
            return (
              users[index] || {
                name: "Collaborator",
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(id)}`,
              }
            );
          });
        }
      } catch (err) {
        console.error("[Liveblocks] Error resolving users:", err);
      }

      return userIds.map((id) => {
        if (userId && (id === userId || id === "dev_editor")) {
          return {
            name: userName || userEmail || "You",
            avatar:
              userAvatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || userId)}`,
          };
        }
        return {
          name: "Collaborator",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(id)}`,
        };
      });
    },
    [getToken, userId, userName, userEmail, userAvatar]
  );

  const resolveMentionSuggestions = useCallback(
    async ({ text }: { text: string; roomId: string }) => {
      try {
        const res = await fetch(
          `/api/liveblocks-auth/mention-suggestions?text=${encodeURIComponent(text)}`
        );
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.error("[Liveblocks] Error resolving mentions:", err);
      }
      return [];
    },
    []
  );

  return (
    <LiveblocksProvider
      authEndpoint={authEndpoint}
      resolveUsers={resolveUsers}
      resolveMentionSuggestions={resolveMentionSuggestions}
    >
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={<div className="p-8 text-center text-slate-500">Connecting to collaborative room...</div>}>
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
