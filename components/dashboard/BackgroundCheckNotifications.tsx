import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Check,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface Notification {
  id: string;
  type: string;
  candidateId: string;
  candidateName: string;
  previousStatus: string;
  newStatus: string;
  ibrId: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  priority: "normal" | "high";
}

export function BackgroundCheckNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Subscribe to notifications
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(showAll ? 50 : 20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = new Map<string, Notification>();
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data.type === "background_check_update") {
          const key = `${data.candidateId}-${data.newStatus}`;
          if (!map.has(key)) {
            map.set(key, { id: doc.id, ...data } as Notification);
          }
        }
      });
      const arr = Array.from(map.values());
      setNotifications(arr.slice(0, showAll ? 50 : 5));
      setUnreadCount(arr.length);
    });

    return () => unsubscribe();
  }, [showAll]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(
        (n) => !n.read && n.type === "background_check_update"
      );
      const promises = unreadNotifications.map((n) =>
        updateDoc(doc(db, "notifications", n.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Review":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Failed":
        return "destructive";
      case "Review":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Background Check Updates
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border transition-all ${
              notification.read
                ? "bg-gray-50 border-gray-200"
                : "bg-blue-50 border-blue-200"
            } ${notification.priority === "high" ? "border-red-300" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(notification.newStatus)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {notification.candidateName}
                    </h4>
                    <Badge
                      variant={getStatusColor(notification.newStatus) as any}
                      className="text-xs"
                    >
                      {notification.newStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.previousStatus} → {notification.newStatus} •{" "}
                    {formatDateTime(notification.createdAt.toDate())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Link href={`/candidates/${notification.candidateId}`}>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {!showAll && notifications.length >= 5 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-sm"
            >
              Show all notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
