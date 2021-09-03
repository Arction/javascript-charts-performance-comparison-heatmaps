import { SciChartSurface } from "scichart";
import { UniformHeatmapDataSeries } from "scichart/Charting/Model/UniformHeatmapDataSeries";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { HeatmapColorMap } from "scichart/Charting/Visuals/RenderableSeries/HeatmapColorMap";
import { UniformHeatmapRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/UniformHeatmapRenderableSeries";
import { TWebAssemblyChart } from "scichart/Charting/Visuals/SciChartSurface";

const RUNTIME_LICENSE_KEY = "";

SciChartSurface.setRuntimeLicenseKey(RUNTIME_LICENSE_KEY);

const div = document.createElement("div");
document.body.append(div);
div.id = `scichart-root`;
div.style.width = "100vw";
div.style.height = `100vh`;

const wait = document.createElement("span");
wait.id = "wait";
document.body.append(wait);

// NOTE: This measurement results in SciChart JS having an initial render speed advantage to other charts,
// because the div is attached, and the chart initialization is done asynchronously before the measurement is started.
const tStart = window.performance.now();
const sciChartPromise = new Promise<TWebAssemblyChart>(async (resolve) => {
  const result = await SciChartSurface.create(div.id);
  const initDelay = window.performance.now() - tStart;
  console.log(`SciChart init delay ${initDelay.toFixed(1)} ms`);
  resolve(result);
});

sciChartPromise.then((sciChart) => {
  const { sciChartSurface, wasmContext } = sciChart;

  fetch("http://localhost:8081/config.iife.js", { cache: "no-store" })
    .then((r) => r.text())
    .then(async (str) => {
      console.log(str);
      const columns = Number(str.match(/columns: ([1234567890]*)/)[1]);
      const rows = Number(str.match(/rows: ([1234567890]*)/)[1]);
      const refreshData = str.match(/refreshData: (false|true),/)[1] === "true";
      const scrollData = str.match(/scrollData: (false|true),/)[1] === "true";
      const BENCHMARK_CONFIG = {
        columns,
        rows,
        refreshData,
        scrollData,
      };

      // #region Scichart code

      const Test = (() => {
        let heatmapSeries;
        let heatmapDataSeries;
        let curDataUnformatted;

        const formatData = (data) => {
          curDataUnformatted = data;
          // data = number[][]
          return data;
        };

        const renderInitial = (data) => {
          sciChartSurface.xAxes.add(new NumericAxis(wasmContext));
          sciChartSurface.yAxes.add(new NumericAxis(wasmContext));
          heatmapDataSeries = new UniformHeatmapDataSeries(
            wasmContext,
            0,
            1,
            0,
            1,
            data
          );
          // Create a Heatmap RenderableSeries with the color map. ColorMap.minimum/maximum defines the values in
          // HeatmapDataSeries which correspond to gradient stops at 0..1
          heatmapSeries = new UniformHeatmapRenderableSeries(wasmContext, {
            dataSeries: heatmapDataSeries,
            colorMap: new HeatmapColorMap({
              minimum: 0,
              maximum: 1,
              gradientStops: [
                { offset: 0, color: "#3060cf" },
                { offset: 0.5, color: "#fffbbc" },
                { offset: 0.9, color: "#c4463a" },
                { offset: 1, color: "#c4463a" },
              ],
            }),
          });
          sciChartSurface.renderableSeries.add(heatmapSeries);
        };

        const setData = (data) => {
          heatmapDataSeries.setZValues(data);
        };

        const appendColumn = (column) => {
          curDataUnformatted.shift();
          curDataUnformatted.push(column);
          const dataFormatted = formatData(curDataUnformatted);
          setData(dataFormatted);
        };

        return {
          formatData,
          renderInitial,
          setData,
          appendColumn,
        };
      })();

      // #endregion

      // #region Same code for all chart libraries.
      console.log(BENCHMARK_CONFIG);
      const wait = document.getElementById("wait");

      (async () => {
        wait.textContent = "Generating test data ...";
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const data0 = new Array(BENCHMARK_CONFIG.columns)
          .fill(0)
          .map((_) =>
            new Array(BENCHMARK_CONFIG.rows).fill(0).map((_) => Math.random())
          );
        const data1 = BENCHMARK_CONFIG.refreshData || BENCHMARK_CONFIG.scrollData ?
          new Array(BENCHMARK_CONFIG.columns)
            .fill(0)
            .map((_) =>
              new Array(BENCHMARK_CONFIG.rows).fill(0).map((_) => Math.random())
            )
            : [[]]

        wait.textContent = "Waiting for chart ...";
        await new Promise((resolve) => requestAnimationFrame(resolve));
        console.log(Test);

        wait.textContent = "Parsing data for chart ...";
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const formattedData0 = Test.formatData(data0);
        const formattedData1 = Test.formatData(data1);

        wait.textContent = "Rendering initial data ...";
        await new Promise((resolve) => requestAnimationFrame(resolve));

        let tStart = Date.now();
        Test.renderInitial(formattedData0);
        wait.textContent = "";

        if (BENCHMARK_CONFIG.refreshData) {
          // Keep refreshing heat map data every frame.
          let iDataset = 0;
          const refresh = () => {
            iDataset = (iDataset + 1) % 2;
            Test.setData(iDataset === 0 ? formattedData0 : formattedData1);
            requestAnimationFrame(refresh);
          };
          requestAnimationFrame(refresh);
        }

        if (BENCHMARK_CONFIG.scrollData) {
          // Push +1 heat map column every frame.
          let iColumn = 0;
          const append = () => {
            iColumn = (iColumn + 1) % (BENCHMARK_CONFIG.columns * 2);
            const column =
              iColumn < BENCHMARK_CONFIG.columns
                ? data0[iColumn]
                : data1[iColumn - BENCHMARK_CONFIG.columns];
            Test.appendColumn(column);
            if (typeof BENCHMARK_CONFIG.scrollData === "boolean") {
              requestAnimationFrame(append);
            } else {
              setTimeout(append, BENCHMARK_CONFIG.scrollData);
            }
          };
          requestAnimationFrame(append);
        }

        requestAnimationFrame(() => {
          const tAfter = Date.now();
          console.log(`initial render`, (tAfter - tStart).toFixed(1), "ms");

          setTimeout(() => {
            tStart = Date.now();
            let frames = 0;
            let fps;
            const recordFrame = () => {
              frames++;
              const tNow = Date.now();
              fps = 1000 / ((tNow - tStart) / frames);
              requestAnimationFrame(recordFrame);
            };
            requestAnimationFrame(recordFrame);
            setInterval(() => console.log(`FPS: ${fps.toFixed(1)}`), 1000);
          }, 2000);
        });
      })();

      // #endregion
    });
});
