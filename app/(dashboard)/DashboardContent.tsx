"use client";

import EcommerceMetrics from "@/components/ecommerce/EcommerceMetrics";
import TrafficChart from "@/components/ecommerce/TrafficChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import DeviceStats from "@/components/ecommerce/DeviceStats";
import TopPagesTable from "@/components/ecommerce/TopPagesTable";
import PageMeta from "@/components/common/PageMeta";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/common/SortableItem";
import { useDialog } from "@/context/DialogContext";

export default function Home() {
  const { isConnected, connect, propertyId, fetchData, analyticsData, demographicsData, topPagesData, deviceData, engagementData, loadingData, error } = useAnalytics();
  const { confirm, alert: dialogAlert } = useDialog();

  // Widget IDs
  const defaultWidgets = ['traffic', 'devices', 'pages', 'demographics'];
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem('dashboard_widget_order');
    return savedOrder ? JSON.parse(savedOrder) : defaultWidgets;
  });

  useEffect(() => {
    if (isConnected && propertyId) {
      if (!analyticsData) fetchData();
    }
  }, [isConnected, propertyId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        localStorage.setItem('dashboard_widget_order', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }

  const renderWidget = (id: string) => {
    switch (id) {
      case 'traffic': return <TrafficChart data={analyticsData} />;
      case 'devices': return <DeviceStats data={deviceData} />;
      case 'pages': return <TopPagesTable data={topPagesData} />;
      case 'demographics': return <DemographicCard data={demographicsData} />;
      default: return null;
    }
  };

  const getWidgetClass = (id: string) => {
    // Traffic and Pages take up 8 columns (2/3 width)
    if (id === 'traffic' || id === 'pages') return "col-span-12 lg:col-span-8";
    // Devices and Demographics take up 4 columns (1/3 width)
    return "col-span-12 lg:col-span-4";
  };



  return (
    <>
      <PageMeta
        title="Dashboard | NSPC Admin"
        description="NSPC Admin Dashboard"
      />

      <div className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Google Analytics Integration</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        {!isConnected ? (
          <div className="flex items-center gap-4">
            <button
              onClick={connect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Connect Google Analytics
            </button>
            <a
              href="https://analytics.google.com/analytics/web/#/a341839307p509768055/reports/dashboard?r=reporting-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Visit Online View
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-green-500 font-medium">✓ Connected to Google</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Property ID: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{propertyId}</span>
              </div>
              <button
                onClick={fetchData}
                disabled={loadingData || !propertyId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        )}
      </div>



      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6">
            <EcommerceMetrics data={analyticsData} engagement={engagementData} />
          </div>

          <SortableContext
            items={widgetOrder}
            strategy={verticalListSortingStrategy}
          >
            {widgetOrder.map((id) => (
              <SortableItem key={id} id={id} className={getWidgetClass(id)}>
                {renderWidget(id)}
              </SortableItem>
            ))}
          </SortableContext>

        </div>
      </DndContext>
    </>
  );
}
