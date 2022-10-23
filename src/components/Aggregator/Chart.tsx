import React, { useEffect, useRef, useState } from "react";
import { Heading3 } from "components";
import { createChart } from "lightweight-charts";

const Chart: React.FC<any> = ({ data, handleCrossHairData }) => {
  const chartRef = useRef(undefined);
  const [chart, setChart] = useState(null);
  const [series, setSeries] = useState(null);
  const handleCrossHair = (point: any) => {
    const seriesPrice = [...point.seriesPrices.entries()];
    const price =
      seriesPrice.length && seriesPrice[0].length && seriesPrice[0][1];
    handleCrossHairData([point.time, price || undefined]);
  };

  React.useEffect(() => {
    if (chartRef.current) {
      setChart(
        createChart(chartRef.current, {
          width: 700,
          height: 300,
          layout: {
            backgroundColor: "transparent",
            textColor: "#67748B",
          },
          grid: {
            vertLines: {
              visible: false,
            },
            horzLines: {
              visible: false,
            },
          },
          rightPriceScale: {
            borderVisible: false,
          },
          timeScale: {
            borderVisible: false,
            timeVisible: true,
          },
          crosshair: {
            horzLine: {
              visible: true,
            },
          },
          handleScale: false,
          handleScroll: false,
        })
      );
    }
  }, []);

  useEffect(() => {
    if (chart && series) {
      try {
        chart.removeSeries(series);
      } catch (err) {
        // ignore error
        // console.info(err);
      }
    }
    if (chart && data) {
      const newSeries = chart.addAreaSeries();
      newSeries.setData(data);

      setSeries(newSeries);
      chart.timeScale().fitContent();
      chart.subscribeCrosshairMove(handleCrossHair);
      return;
    }
  }, [chart, data]);

  return (
    <>
      <div ref={chartRef} />
      {chart && !data && (
        <Heading3 style={{ textAlign: "center", marginTop: "-180px" }}>
          No data available!
        </Heading3>
      )}
    </>
  );
};

export default Chart;