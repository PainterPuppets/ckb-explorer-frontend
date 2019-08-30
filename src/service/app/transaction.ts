import { fetchTransactionsByAddress, fetchTransactionByHash } from '../http/fetcher'
import { PageActions, AppActions, AppDispatch } from '../../contexts/providers/reducer'

export const getTransactionsByAddress = (hash: string, page: number, size: number, dispatch: any) => {
  fetchTransactionsByAddress(hash, page, size)
    .then(response => {
      const { data, meta } = response as Response.Response<Response.Wrapper<State.Transaction>[]>
      dispatch({
        type: PageActions.UpdateAddressTransactions,
        payload: {
          transactions:
            data.map((wrapper: Response.Wrapper<State.Transaction>) => {
              return wrapper.attributes
            }) || [],
        },
      })
      dispatch({
        type: PageActions.UpdateAddressTotal,
        payload: {
          total: meta ? meta.total : 0,
        },
      })
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateAddressTransactions,
        payload: {
          transactions: [],
        },
      })
      dispatch({
        type: PageActions.UpdateAddressTotal,
        payload: {
          total: 0,
        },
      })
    })
}

export const getTransactionByHash = (hash: string, dispatch: AppDispatch) => {
  fetchTransactionByHash(hash)
    .then((wrapper: Response.Wrapper<State.Transaction> | null) => {
      if (wrapper) {
        const transactionValue = wrapper.attributes
        if (transactionValue.displayOutputs && transactionValue.displayOutputs.length > 0) {
          transactionValue.displayOutputs[0].isGenesisOutput = transactionValue.blockNumber === 0
        }
        dispatch({
          type: PageActions.UpdateTransaction,
          payload: {
            transaction: transactionValue,
          },
        })
        dispatch({
          type: PageActions.UpdateTransactionStatus,
          payload: {
            status: 'OK',
          },
        })
        dispatch({
          type: AppActions.UpdateLoading,
          payload: {
            loading: false,
          },
        })
      } else {
        dispatch({
          type: PageActions.UpdateTransactionStatus,
          payload: {
            status: 'Error',
          },
        })
        dispatch({
          type: AppActions.UpdateLoading,
          payload: {
            loading: false,
          },
        })
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateTransactionStatus,
        payload: {
          status: 'Error',
        },
      })
    })
}