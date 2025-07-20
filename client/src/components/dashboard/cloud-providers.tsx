import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const providers = [
  {
    name: "Amazon Web Services",
    short: "AWS",
    status: "Connected",
    active: true,
    bgColor: "bg-orange-500",
  },
  {
    name: "Google Cloud Platform",
    short: "GCP",
    status: "Connected",
    active: true,
    bgColor: "bg-blue-500",
  },
  {
    name: "Microsoft Azure",
    short: "AZ",
    status: "Connected",
    active: true,
    bgColor: "bg-blue-600",
  },
];

export default function CloudProviders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">Cloud Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-300">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${provider.bgColor} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">{provider.short}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.status}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${provider.active ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                <span className={`text-sm ${provider.active ? 'text-green-600' : 'text-gray-500'}`}>
                  {provider.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Cloud Provider
        </Button>
      </CardContent>
    </Card>
  );
}
