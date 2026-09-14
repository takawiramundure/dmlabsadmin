"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { ApexOptions } from "apexcharts";
import { useMemo } from "react";

interface DeviceStatsProps {
    data?: any;
}

export default function DeviceStats({ data }: DeviceStatsProps) {
    const chartData = useMemo(() => {
        if (!data?.rows) return { labels: [], series: [] };

        const labels = data.rows.map((row: any) => row.dimensionValues[0].value);
        const series = data.rows.map((row: any) => parseInt(row.metricValues[0].value, 10));

        return { labels, series };
    }, [data]);

    const options: ApexOptions = {
        chart: {
            type: "donut",
        },
        labels: chartData.labels,
        colors: ["#3C50E0", "#80CAEE", "#0FADCF"],
        legend: {
            show: true,
            position: "bottom",
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    background: "transparent",
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        responsive: [
            {
                breakpoint: 2600,
                options: {
                    chart: {
                        width: 380,
                    },
                },
            },
            {
                breakpoint: 640,
                options: {
                    chart: {
                        width: 250,
                    },
                },
            },
        ],
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-7 pb-5 shadow-default dark:border-gray-800 dark:bg-white/[0.03] sm:px-7 sm:pb-8">
            <div className="mb-6 flex justify-between gap-4">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Device Analytics
                    </h4>
                </div>
            </div>

            <div className="mb-2">
                <div id="uChart" className="mx-auto flex justify-center">
                    {chartData.series.length > 0 ? (
                        <Chart options={options} series={chartData.series} type="donut" />
                    ) : (
                        <div className="py-8 text-gray-500">No device data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
