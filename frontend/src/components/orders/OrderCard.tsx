import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, CheckCircle, XCircle, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { Order } from "@/api/client";

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfig: Record<string, StatusConfig> = {
  pending: { 
    label: "受付中", 
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: Clock 
  },
  preparing: { 
    label: "調理中", 
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: ChefHat 
  },
  completed: { 
    label: "完了", 
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle 
  },
  cancelled: { 
    label: "キャンセル", 
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: XCircle 
  }
};

interface OrderCardProps {
  order: Order;
  onStatusChange: (order: Order, newStatus: string) => void;
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const config = statusConfig[order.status || "pending"];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden border-2 hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-orange-600">
                  #{order.order_number}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {format(new Date(order.created_date), "HH:mm", { locale: ja })}
                </span>
              </div>
            </div>
            <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.product_name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.product_name}</p>
                  <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700">📝 {order.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            {order.status === "pending" && (
              <Button 
                onClick={() => onStatusChange(order, "preparing")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                調理開始
              </Button>
            )}
            {order.status === "preparing" && (
              <Button 
                onClick={() => onStatusChange(order, "completed")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                完了
              </Button>
            )}
            {(order.status === "pending" || order.status === "preparing") && (
              <Button 
                onClick={() => onStatusChange(order, "cancelled")}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
