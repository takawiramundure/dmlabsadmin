"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { ApexOptions } from "apexcharts";
import { useMemo } from "react";

interface TrafficChartProps {
  data?: any;
}

export default function TrafficChart({ data }: TrafficChartProps) {
  // Safe default if no data
  const chartData = useMemo(() => {
    if (!data?.rows) {
      return { categories: [], series: [] };
    }
    const categories = data.rows.map((row: any) => {
      // Format date YYYYMMDD to readable (e.g. "Jan 01")
      const dateStr = row.dimensionValues[0].value;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${month}/${day}`;
    });

    // index 1 is 'sessions' based on our API query
    const seriesData = data.rows.map((row: any) => parseInt(row.metricValues[1].value, 10));

    return { categories, series: seriesData };
  }, [data]);


  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 2,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false // Hide x-axis labels if too many, or maybe show every Nth
      },
      tooltip: {
        enabled: false
      }
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };

  const series = [
    {
      name: "Sessions",
      data: chartData.series,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Session Traffic (Last 30 Days)
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {chartData.series.length > 0 ? (
            <Chart options={options} series={series} type="bar" height={180} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
