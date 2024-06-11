import { Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { FC, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { utils } from '@ckb-lumos/base'
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { Link } from '../../components/Link'
import { CsvExport } from '../../components/CsvExport'
import TransactionItem from '../../components/TransactionItem/index'
import { UDTTransactionsPagination, UDTTransactionsPanel, TypeScriptController, UDTNoResultPanel } from './styled'
import { parseUDTAmount } from '../../utils/number'
import { ReactComponent as OpenInNew } from '../../assets/open_in_new.svg'
import { deprecatedAddrToNewAddr, getBtcUtxo } from '../../utils/util'
import styles from './styles.module.scss'
import AddressText from '../../components/AddressText'
import PaginationWithRear from '../../components/PaginationWithRear'
import { Transaction } from '../../models/Transaction'
import { Card, CardCellInfo, CardCellsLayout, HashCardHeader } from '../../components/Card'
import { useIsMobile } from '../../hooks'
import Script from '../../components/Script'
import { RawBtcRPC } from '../../services/ExplorerService'
import { XUDT } from '../../models/Xudt'
import { getBtcTxList } from '../../services/ExplorerService/fetcher'
import XUDTTag from '../../components/XUDTTag'

const IssuerContent: FC<{ address: string }> = ({ address }) => {
  const { t } = useTranslation()
  if (!address) {
    return t('address.unable_decode_address')
  }
  const newAddress = deprecatedAddrToNewAddr(address)

  return (
    <>
      <AddressText
        linkProps={{
          to: `/address/${newAddress}`,
        }}
      >
        {newAddress}
      </AddressText>

      {newAddress !== address && (
        <Tooltip placement="top" title={t(`udt.view-deprecated-address`)}>
          <Link to={`/address/${address}`} className={styles.openInNew} target="_blank">
            <OpenInNew />
          </Link>
        </Tooltip>
      )}
    </>
  )
}

export const UDTOverviewCard = ({ typeHash, xudt }: { typeHash: string; xudt: XUDT | undefined }) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [isScriptDisplayed, setIsScriptDisplayed] = useState(false)

  const issuer = xudt?.issuerAddress
  const script = xudt?.typeScript ?? null

  const hash = script
    ? utils.computeScriptHash({
        codeHash: script.codeHash,
        hashType: script.hashType as any,
        args: script.args,
      })
    : null

  const toggleScriptDisplay = () => {
    if (!script) {
      return
    }
    setIsScriptDisplayed(is => !is)
  }

  const { data: issuerOnBtc } = useQuery(
    ['btc-addr', issuer],
    async () => {
      if (!issuer) return null
      const btcUtxo = getBtcUtxo(addressToScript(issuer))
      if (!btcUtxo?.txid || btcUtxo?.index === undefined) return null

      const { txid, index } = btcUtxo
      const btcTx = await getBtcTxList([txid]).then(res => res[txid])
      return btcTx?.vout[parseInt(index, 16)]?.scriptPubKey?.address ?? null
    },
    {
      initialData: null,
      enabled: !!issuer,
    },
  )

  const items: CardCellInfo<'left' | 'right'>[] = [
    {
      title: t('xudt.name'),
      content: xudt?.fullName ?? '-',
    },
    {
      title: issuerOnBtc ? t('xudt.issuer') : t('xudt.owner'),
      contentWrapperClass: styles.addressWidthModify,
      content: issuer ? <IssuerContent address={issuerOnBtc ?? issuer} /> : '-',
    },
    {
      title: t('xudt.holder_addresses'),
      content: xudt?.addressesCount ?? '-',
    },
    {
      title: t('xudt.symbol'),
      content: xudt?.symbol ?? '-',
    },
    {
      title: t('xudt.decimal'),
      content: xudt?.decimal ?? '-',
    },
    {
      title: t('xudt.total_amount'),
      content: xudt?.totalAmount && xudt?.decimal ? parseUDTAmount(xudt.totalAmount, xudt.decimal) : '-',
    },
  ]

  const cardTitle = <div className={styles.cardTitle}>{xudt?.symbol ?? t('xudt.xudt')}</div>

  return (
    <>
      <Card className={styles.udtOverviewCard} style={{ marginBottom: 16 }}>
        {/* When encountering more complex requirements, consider extracting the components within HashCardHeader
      into smaller components. Then, implement a completely new variant or freely assemble them externally. */}
        {isMobile && cardTitle}
        <HashCardHeader className={styles.cardHeader} title={!isMobile && cardTitle} hash={typeHash} />

        <div className={styles.tags}>
          {xudt?.xudtTags?.map(tag => (
            <XUDTTag tagName={tag} />
          ))}
        </div>

        <CardCellsLayout type="left-right" cells={items} borderTop />

        <TypeScriptController onClick={toggleScriptDisplay}>
          {isScriptDisplayed ? (
            <div className={styles.scriptToggle}>
              <EyeOpenIcon />
              <div>{t('xudt.type_script')}</div>
            </div>
          ) : (
            <div className={styles.scriptToggle}>
              <EyeClosedIcon />
              <div>{t('xudt.type_script_hash')}</div>
            </div>
          )}
        </TypeScriptController>

        {isScriptDisplayed ? (
          script && <Script script={script} />
        ) : (
          <div className={`monospace ${styles.scriptHash}`}>{hash}</div>
        )}
      </Card>
    </>
  )
}

export const UDTComp = ({
  currentPage,
  pageSize,
  transactions,
  total,
  onPageChange,
  xudt,
  filterNoResult,
}: {
  currentPage: number
  pageSize: number
  transactions: (Transaction & { btcTx: RawBtcRPC.BtcTx | null })[]
  total: number
  onPageChange: (page: number) => void
  xudt?: XUDT
  filterNoResult?: boolean
}) => {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / pageSize)

  if (filterNoResult) {
    return (
      <UDTNoResultPanel>
        <span>{t('search.udt_filter_no_result')}</span>
      </UDTNoResultPanel>
    )
  }
  return (
    <>
      <UDTTransactionsPanel>
        {transactions.map(
          (transaction, index) =>
            transaction && (
              <TransactionItem
                transaction={transaction}
                key={transaction.transactionHash}
                circleCorner={{
                  bottom: index === transactions.length - 1 && totalPages === 1,
                }}
              />
            ),
        )}
      </UDTTransactionsPanel>
      <UDTTransactionsPagination>
        <PaginationWithRear
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={onPageChange}
          rear={xudt ? <CsvExport link={`/export-xudt-holders?id=${xudt.typeHash}`} /> : null}
        />
      </UDTTransactionsPagination>
    </>
  )
}

export default UDTComp
