import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Home,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Building,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  location: string;
  type: "residential" | "commercial" | "industrial";
  price: number;
  area: number;
  income: number;
  occupancy: number;
  status: "owned" | "available" | "rented";
  image: string;
  description: string;
}

const mockProperties: Property[] = [
  {
    id: "1",
    name: "豪华公寓",
    location: "商业广场附近",
    type: "residential",
    price: 5000,
    area: 120,
    income: 200,
    occupancy: 100,
    status: "owned",
    image: "🏢",
    description: "高档住宅，位置优越，交通便利",
  },
  {
    id: "2",
    name: "商业店铺",
    location: "中心街道",
    type: "commercial",
    price: 8000,
    area: 80,
    income: 400,
    occupancy: 85,
    status: "owned",
    image: "🏪",
    description: "繁华商业区店铺，客流量大",
  },
  {
    id: "3",
    name: "工业厂房",
    location: "工业区",
    type: "industrial",
    price: 12000,
    area: 500,
    income: 600,
    occupancy: 70,
    status: "available",
    image: "🏭",
    description: "大型工业厂房，生产能力强",
  },
  {
    id: "4",
    name: "办公楼",
    location: "金融区",
    type: "commercial",
    price: 10000,
    area: 200,
    income: 500,
    occupancy: 90,
    status: "available",
    image: "🏢",
    description: "现代化办公楼，设施完善",
  },
  {
    id: "5",
    name: "住宅小区",
    location: "郊区",
    type: "residential",
    price: 15000,
    area: 1000,
    income: 800,
    occupancy: 95,
    status: "available",
    image: "🏘️",
    description: "大型住宅社区，配套完整",
  },
];

export default function RealEstatePage() {
  const { lang } = useLanguage();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const filteredProperties = mockProperties.filter((prop) => {
    const matchesType = filterType === "all" || prop.type === filterType;
    const matchesStatus = filterStatus === "all" || prop.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const ownedProperties = mockProperties.filter((p) => p.status === "owned");
  const totalValue = ownedProperties.reduce((sum, p) => sum + p.price, 0);
  const totalIncome = ownedProperties.reduce((sum, p) => sum + p.income, 0);

  const getTypeLabel = (type: string) => {
    if (type === "residential") return lang === "zh" ? "住宅" : "Residential";
    if (type === "commercial") return lang === "zh" ? "商业" : "Commercial";
    return lang === "zh" ? "工业" : "Industrial";
  };

  const getTypeColor = (type: string) => {
    if (type === "residential") return "bg-blue-100 text-blue-800";
    if (type === "commercial") return "bg-green-100 text-green-800";
    return "bg-orange-100 text-orange-800";
  };

  const getStatusLabel = (status: string) => {
    if (status === "owned") return lang === "zh" ? "已拥有" : "Owned";
    if (status === "available") return lang === "zh" ? "可购买" : "Available";
    return lang === "zh" ? "已出租" : "Rented";
  };

  const getStatusColor = (status: string) => {
    if (status === "owned") return "bg-green-100 text-green-800";
    if (status === "available") return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "拥有房产数" : "Properties Owned"}</p>
              <p className="text-3xl font-bold">{ownedProperties.length}</p>
              <p className="text-xs text-muted-foreground">{lang === "zh" ? "总价值" : "Total Value"}: {totalValue} ISC</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "月度收入" : "Monthly Income"}</p>
              <p className="text-3xl font-bold text-green-600">{totalIncome}</p>
              <p className="text-xs text-muted-foreground">ISC/month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "平均占用率" : "Avg Occupancy"}</p>
              <p className="text-3xl font-bold">
                {ownedProperties.length > 0
                  ? Math.round(ownedProperties.reduce((sum, p) => sum + p.occupancy, 0) / ownedProperties.length)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{lang === "zh" ? "房产类型" : "Property Type"}</p>
            <div className="flex gap-2 flex-wrap">
              {["all", "residential", "commercial", "industrial"].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === "all"
                    ? lang === "zh"
                      ? "全部"
                      : "All"
                    : getTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{lang === "zh" ? "房产状态" : "Status"}</p>
            <div className="flex gap-2 flex-wrap">
              {["all", "owned", "available", "rented"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === "all"
                    ? lang === "zh"
                      ? "全部"
                      : "All"
                    : getStatusLabel(status)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{property.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getTypeColor(property.type)}>
                        {getTypeLabel(property.type)}
                      </Badge>
                      <Badge className={getStatusColor(property.status)}>
                        {getStatusLabel(property.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-3xl">{property.image}</div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{property.area} m²</span>
                  </div>
                </div>

                {/* Price and Income */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "价格" : "Price"}</p>
                    <p className="font-bold text-blue-600">{property.price} ISC</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "月收入" : "Monthly"}</p>
                    <p className="font-bold text-green-600">{property.income} ISC</p>
                  </div>
                </div>

                {/* Occupancy */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">{lang === "zh" ? "占用率" : "Occupancy"}</p>
                    <p className="text-xs font-bold">{property.occupancy}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: `${property.occupancy}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedProperty(property)}
                    >
                      {lang === "zh" ? "查看详情" : "View Details"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedProperty?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center text-6xl">{selectedProperty?.image}</div>

                      <div>
                        <p className="text-sm font-medium mb-2">{lang === "zh" ? "描述" : "Description"}</p>
                        <p className="text-sm text-muted-foreground">{selectedProperty?.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "面积" : "Area"}</p>
                          <p className="font-bold">{selectedProperty?.area} m²</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "类型" : "Type"}</p>
                          <p className="font-bold">{getTypeLabel(selectedProperty?.type || "residential")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "价格" : "Price"}</p>
                          <p className="font-bold text-blue-600">{selectedProperty?.price} ISC</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "月收入" : "Monthly Income"}</p>
                          <p className="font-bold text-green-600">{selectedProperty?.income} ISC</p>
                        </div>
                      </div>

                      {selectedProperty?.status === "available" && (
                        <Button className="w-full">{lang === "zh" ? "购买房产" : "Purchase Property"}</Button>
                      )}
                      {selectedProperty?.status === "owned" && (
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full">
                            {lang === "zh" ? "出租房产" : "Rent Property"}
                          </Button>
                          <Button variant="outline" className="w-full">
                            {lang === "zh" ? "升级房产" : "Upgrade Property"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {lang === "zh" ? "没有找到匹配的房产" : "No properties found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
