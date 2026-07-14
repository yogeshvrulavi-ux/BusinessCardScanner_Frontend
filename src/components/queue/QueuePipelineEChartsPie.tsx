import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import type { QueuePipelineSlice } from "@/lib/queueAnalytics";
import { resolveQueuePieColors } from "@/lib/queueChartColors";

echarts.use([PieChart, TooltipComponent, CanvasRenderer]);

function buildPieOption(slices: QueuePipelineSlice[]): EChartsOption {
  const palette = resolveQueuePieColors();
  const seriesColors = [
    palette.inQueue,
    palette.saved,
    palette.failed,
    palette.empty,
  ];

  return {
    color: seriesColors,
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { fontSize: 12, color: "#0f172a" },
    },
    series: [
      {
        name: "Pipeline",
        type: "pie",
        radius: ["48%", "78%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        padAngle: 3,
        color: seriesColors,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 12,
            shadowColor: "rgba(15, 23, 42, 0.15)",
          },
          label: {
            show: true,
            fontSize: 13,
            fontWeight: "bold",
            formatter: "{b}\n{d}%",
            color: "#0f172a",
          },
        },
        data: slices.map((s) => ({
          name: s.name,
          value: s.value,
          itemStyle: {
            color: s.fill,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        })),
      },
    ],
  };
}

export function QueuePipelineEChartsPie({ slices }: { slices: QueuePipelineSlice[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.setOption(buildPieOption(slices));

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(buildPieOption(slices), { notMerge: true });
  }, [slices]);

  return (
    <div
      ref={containerRef}
      className="h-40 w-full sm:h-44"
      role="img"
      aria-label="Pipeline breakdown chart"
    />
  );
}
