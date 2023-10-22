import BigNumber from 'bignumber.js'
import { useTranslation } from 'react-i18next'
import { DATA_ZOOM_CONFIG, handleAxis } from '../../../utils/chart'
import { parseDateNoTime } from '../../../utils/date'
import { tooltipColor, tooltipWidth, SmartChartPage } from '../common'
import { ChartCachedKeys } from '../../../constants/cache'
import { explorerService } from '../../../services/ExplorerService'
import { useCurrentLanguage } from '../../../utils/i18n'

const useOption = (
  statisticTransactionCounts: State.StatisticTransactionCount[],
  chartColor: State.ChartColor,
  isMobile: boolean,

  isThumbnail = false,
): echarts.EChartOption => {
  const { t } = useTranslation()
  const currentLanguage = useCurrentLanguage()

  const gridThumbnail = {
    left: '4%',
    right: '10%',
    top: '8%',
    bottom: '6%',
    containLabel: true,
  }
  const grid = {
    left: '3%',
    right: '3%',
    top: isMobile ? '3%' : '8%',
    bottom: '5%',
    containLabel: true,
  }
  return {
    color: chartColor.colors,
    tooltip: !isThumbnail
      ? {
          trigger: 'axis',
          formatter: (dataList: any) => {
            const widthSpan = (value: string) => tooltipWidth(value, currentLanguage === 'en' ? 120 : 65)
            let result = `<div>${tooltipColor('#333333')}${widthSpan(t('statistic.date'))} ${dataList[0].data[0]}</div>`
            result += `<div>${tooltipColor(chartColor.colors[0])}${widthSpan(
              t('statistic.transaction_count'),
            )} ${handleAxis(dataList[0].data[1])}</div>`
            return result
          },
        }
      : undefined,
    grid: isThumbnail ? gridThumbnail : grid,
    dataZoom: isThumbnail ? [] : DATA_ZOOM_CONFIG,
    xAxis: [
      {
        name: isMobile || isThumbnail ? '' : t('statistic.date'),
        nameLocation: 'middle',
        nameGap: 30,
        type: 'category',
        boundaryGap: false,
      },
    ],
    yAxis: [
      {
        position: 'left',
        name: isMobile || isThumbnail ? '' : t('statistic.transaction_count'),
        type: 'value',
        scale: true,
        axisLine: {
          lineStyle: {
            color: chartColor.colors[0],
          },
        },
        axisLabel: {
          formatter: (value: string) => handleAxis(new BigNumber(value)),
        },
      },
    ],
    series: [
      {
        name: t('statistic.transaction_count'),
        type: 'line',
        yAxisIndex: 0,
        symbol: isThumbnail ? 'none' : 'circle',
        symbolSize: 3,
      },
    ],
    dataset: {
      source: statisticTransactionCounts.map(data => [
        parseDateNoTime(data.createdAtUnixtimestamp),
        new BigNumber(data.transactionsCount).toNumber(),
      ]),
    },
  }
}

const toCSV = (statisticTransactionCounts: State.StatisticTransactionCount[]) =>
  statisticTransactionCounts
    ? statisticTransactionCounts.map(data => [data.createdAtUnixtimestamp, data.transactionsCount])
    : []

export const TransactionCountChart = ({ isThumbnail = false }: { isThumbnail?: boolean }) => {
  const [t] = useTranslation()
  return (
    <SmartChartPage
      title={t('statistic.transaction_count')}
      isThumbnail={isThumbnail}
      fetchData={explorerService.api.fetchStatisticTransactionCount}
      getEChartOption={useOption}
      toCSV={toCSV}
      cacheKey={ChartCachedKeys.TransactionCount}
      cacheMode="date"
    />
  )
}

export default TransactionCountChart
